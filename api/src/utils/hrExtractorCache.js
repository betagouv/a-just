// hrExtractorCache.js
// Cache d'extractions par juridiction/période :
//   - Clé : hrExt:{backupId}:{start}:{end} (HASH)
//   - Champ : agentId
//   - Valeur : payload compressé (gzip -> base64)

import { getRedisClient } from './redis.js'
import zlib from 'zlib'
import { promisify } from 'util'
import { invalidateAjustBackup } from './hrExtAjustCache.js'

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)

const PREFIX = 'hrExt'

/** Normalise une date en YYYY-MM-DD */
const d = (iso) => {
  // Accepte Date, string ISO, etc. — on force YYYY-MM-DD
  if (iso instanceof Date) return iso.toISOString().slice(0, 10)
  // si déjà au bon format ?
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  // fallback : new Date(string)
  return new Date(iso).toISOString().slice(0, 10)
}

/** Force start <= end et renvoie [start,end] en YYYY-MM-DD */
export const normalizePeriod = (start, end) => {
  const s = d(start)
  const e = d(end)
  return s <= e ? [s, e] : [e, s]
}

/** Construit la clé HASH de période */
export const periodKey = (backupId, start, end) => {
  const [s, e] = normalizePeriod(start, end)
  return `${PREFIX}:${backupId}:${s}:${e}`
}

/** Encode JSON -> gzip -> base64 */
const encode = async (obj) => {
  const json = JSON.stringify(obj)
  const gz = await gzip(json)
  return gz.toString('base64')
}

/** Decode base64 -> gunzip -> JSON */
const decode = async (b64) => {
  const buf = Buffer.from(b64, 'base64')
  const out = await gunzip(buf)
  return JSON.parse(out.toString())
}

/** Lit toute l’extraction (tous les agents) d’une période. */
export const readExtraction = async (backupId, start, end) => {
  const c = getRedisClient()
  if (!c) return {} // fallback : pas de Redis prêt

  const key = periodKey(backupId, start, end)
  const entries = await c.hGetAll(key) // { agentId: b64gz, ... }
  if (!entries || Object.keys(entries).length === 0) return {}

  const result = {}
  // Décodage séquentiel (suffisant)
  for (const [agentId, b64] of Object.entries(entries)) {
    result[agentId] = await decode(b64)
  }
  return result
}

/**
 * Upsert d’un agent pour une période.
 * payload = objet JSON (sera compressé).
 */
export const upsertAgentExtraction = async (backupId, start, end, agentId, payload) => {
  const c = getRedisClient()
  if (!c) return

  const key = periodKey(backupId, start, end)
  const encoded = await encode(payload)
  // Un seul champ à poser
  await c.hSet(key, agentId.toString(), encoded)
}

/**
 * Upsert massif : plusieurs agents d’un coup pour une période.
 * agentsMap : { [agentId]: payload }
 * Pipeline pour réduire les RTT.
 */
export const upsertManyAgentsExtraction = async (backupId, start, end, agentsMap) => {
  const c = getRedisClient()
  if (!c) return

  const key = periodKey(backupId, start, end)
  const p = c.multi()
  for (const [agentId, payload] of Object.entries(agentsMap)) {
    // encode à la volée ; si très gros volume, pré-encode en amont en Promise.all
    p.hSet(key, agentId.toString(), await encode(payload))
  }
  await p.exec()
}

/**
 * Invalidation d’un agent dans TOUTES les périodes d’une juridiction (backupId).
 * Sans index : SCAN + MATCH + COUNT, puis HDEL en pipeline.
 */
export const invalidateAgentEverywhere = async (backupId, agentId, scanCount = 10) => {
  const c = getRedisClient()
  if (!c) return

  const match = `${PREFIX}:${backupId}:*`
  let cursor = '0'
  let iterations = 0

  do {
    const { cursor: next, keys } = await c.scan(cursor, { MATCH: match, COUNT: scanCount })
    cursor = next
    if (keys.length) {
      const p = c.multi()
      for (const k of keys) p.hDel(k, agentId.toString())
      await p.exec()
    }
    // filet de sécurité
    if (++iterations > 1e6) {
      console.warn('🛑 Abort SCAN: too many iterations')
      break
    }
  } while (cursor !== '0' && cursor !== 0)
}

/**
 * Invalidation d’une période complète (supprime la clé HASH).
 * Utilise UNLINK pour éviter de bloquer si la valeur est grosse.
 */
export const deletePeriod = async (backupId, start, end) => {
  const c = getRedisClient()
  if (!c) return
  const key = periodKey(backupId, start, end)
  await c.unlink(key)
}

/**
 * Purge complète d’une juridiction (toutes les périodes).
 * SCAN sur l’espace hrExt:{backupId}:* puis UNLINK en pipeline.
 */
export const invalidateBackup = async (backupId, scanCount = 1000) => {
  const c = getRedisClient()
  if (!c) return

  const match = `${PREFIX}:${backupId}:*`
  let cursor = '0'
  let iterations = 0

  do {
    const { cursor: next, keys } = await c.scan(cursor, { MATCH: match, COUNT: scanCount })

    // ⚠️ Normalise le type pour éviter la boucle infinie
    cursor = String(next) // ← clé du problème

    if (keys.length) {
      const p = c.multi()
      for (const k of keys) p.unlink(k)
      await p.exec()
    }

    // filet de sécurité
    if (++iterations > 1e6) {
      console.warn('🛑 Abort SCAN: too many iterations')
      break
    }
  } while (cursor !== '0' && cursor !== 0)

  await invalidateAjustBackup(backupId)
}

/** Vérifie si une période existe (au moins un champ). */
export const periodExists = async (backupId, start, end) => {
  const c = getRedisClient()
  if (!c) return false
  const key = periodKey(backupId, start, end)
  const len = await c.hLen(key)
  return len > 0
}
