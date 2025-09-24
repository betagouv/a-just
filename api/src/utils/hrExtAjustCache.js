// hrExtAjustCache.js
// Stockage A-JUST séparé, 1 clé par (backupId, période), format compact "schéma":
//   Clé : hrExtAjust:{backupId}:{periodHash}  (String)
//   Valeur : base64(gzip(JSON.stringify({ cols, rows, idCol: 'Réf.' })))
//
// - cols : string[] noms de colonnes (une seule fois)
// - rows : any[][]   chaque agent est un array ordonné aligné sur cols
// - idCol: 'Réf.'    (identifiant agent en BDD)
//
// Opérations fournies :
// - saveJurisdictionArray(backupId, start, end, agentsArray[, cols])
// - readJurisdictionSchema(backupId, start, end) -> { cols, rows, idCol }
// - readJurisdictionAsArray(backupId, start, end) -> agentObj[]
// - getAgentFromSchema(schema, agentId) -> agentObj|null
// - invalidateAjustBackup(backupId) -> supprime hrExtAjust:{backupId}:*
//

import { getRedisClient } from './redis.js'
import zlib from 'zlib'
import { promisify } from 'util'
import { createHash } from 'crypto'

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)

const PREFIX = 'hrExtAjust'
const ID_COL = 'Réf.' // identifiant agent dans le payloads

// ---------- Dates & clé ----------

const toYmd = (iso) => {
  if (iso instanceof Date) return iso.toISOString().slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  return new Date(iso).toISOString().slice(0, 10)
}

const normalizePeriod = (start, end) => {
  const s = toYmd(start),
    e = toYmd(end)
  return s <= e ? [s, e] : [e, s]
}

export const periodHash = (start, end) => {
  const [s, e] = normalizePeriod(start, end)
  return createHash('sha1').update(`${s}|${e}`).digest('hex').slice(0, 20)
}

export const ajustKey = (backupId, start, end) => `${PREFIX}:${backupId}:${periodHash(start, end)}`

// ---------- Encodage ----------

const encode = async (obj) => (await gzip(JSON.stringify(obj))).toString('base64')
const decode = async (b64) => JSON.parse((await gunzip(Buffer.from(b64, 'base64'))).toString())

// ---------- Schéma compact ----------

/**
 * Construit { cols, rows, idCol } à partir d'un array d'agents (objets).
 * - Si `cols` est fourni, respecte l'ordre
 * - Sinon, dérive des clés du 1er agent (insertion order JS).
 */
const buildSchemaFromAgents = (agentsArray, cols) => {
  const colsFinal = cols && cols.length ? cols.slice() : agentsArray?.length ? Object.keys(agentsArray[0]) : []

  // sécurise présence de la colonne ID_COL (Réf.)
  if (!colsFinal.includes(ID_COL)) colsFinal.unshift(ID_COL)

  const rows = agentsArray.map((a) => colsFinal.map((c) => a?.[c] ?? null))
  return { cols: colsFinal, rows, idCol: ID_COL }
}

/** Remappe une ligne (row array) vers un objet aligné sur schema.cols */
export const rowToObject = (schema, row) => {
  const obj = {}
  const { cols } = schema
  for (let i = 0; i < cols.length; i++) obj[cols[i]] = row[i]
  return obj
}

/** Construit un index Map(id -> rowIndex) pour des lookups O(1) */
export const buildRowIndex = (schema) => {
  const { cols, rows, idCol } = schema
  const idIdx = cols.indexOf(idCol)
  if (idIdx === -1) throw new Error(`Colonne id "${idCol}" absente du schéma`)
  const idx = new Map()
  for (let i = 0; i < rows.length; i++) idx.set(String(rows[i][idIdx]), i)
  return { index: idx, idIdx }
}

// ---------- ÉCRITURE ----------

/**
 * Écrit toute la juridiction (array d'objets agents) dans UNE clé.
 * - backupId : id de juridiction
 * - start/end : dates période (acceptent Date ou string)
 * - agentsArray : [{agent1}, {agent2}, ...]
 * - cols (optionnel) : string[] d'ordre de colonnes à figer
 */
export const saveJurisdictionArray = async (backupId, start, end, agentsArray, cols) => {
  const c = getRedisClient()
  if (!c) return
  const key = ajustKey(backupId, start, end)
  const schema = buildSchemaFromAgents(agentsArray, cols)
  const b64 = await encode(schema)
  await c.set(key, b64) // pas de TTL
}

// ---------- LECTURE ----------

/** Lit la juridiction (schéma compact) telle quelle. */
export const readJurisdictionSchema = async (backupId, start, end) => {
  const c = getRedisClient()
  if (!c) return null
  const key = ajustKey(backupId, start, end)
  const b64 = await c.get(key)
  if (!b64) return null
  return await decode(b64) // { cols, rows, idCol }
}

/** Lit et remappe en array d'objets (gourmand en RAM). */
export const readJurisdictionAsArray = async (backupId, start, end) => {
  const schema = await readJurisdictionSchema(backupId, start, end)
  if (!schema) return []
  return schema.rows.map((row) => rowToObject(schema, row))
}

/** Récupère l'agent par id (Réf.) sans remapper toute la table. */
export const getAgentFromSchema = (schema, agentId) => {
  if (!schema) return null
  const { index } = buildRowIndex(schema)
  const rowIdx = index.get(String(agentId))
  if (rowIdx === undefined) return null
  return rowToObject(schema, schema.rows[rowIdx])
}

// ---------- INVALIDATION (clean juridiction entière) ----------

/** Supprime toutes les périodes A-JUST d'une juridiction : hrExtAjust:{backupId}:* */
export const invalidateAjustBackup = async (backupId, scanCount = 1000) => {
  const c = getRedisClient()
  if (!c) return
  const pattern = `${PREFIX}:${backupId}:*`

  // scanIterator gère le curseur, évite les pièges 0 vs '0'
  const batch = []
  const batchSize = 1000
  for await (const key of c.scanIterator({ MATCH: pattern, COUNT: scanCount })) {
    batch.push(key)
    if (batch.length >= batchSize) {
      const p = c.multi()
      batch.forEach((k) => p.unlink(k)) // suppression non bloquante
      await p.exec()
      batch.length = 0
    }
  }
  if (batch.length) {
    const p = c.multi()
    batch.forEach((k) => p.unlink(k))
    await p.exec()
  }
}

/** Test d'existence d'une période */
export const periodExistsAjust = async (backupId, start, end) => {
  const c = getRedisClient()
  if (!c) return false
  return Boolean(await c.exists(ajustKey(backupId, start, end)))
}
