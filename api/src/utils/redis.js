import { createClient } from 'redis'
import config from 'config'
import zlib from 'zlib'
import { promisify } from 'util'
import { invalidateAgentEverywhere, invalidateBackup } from './hrExtractorCache'
import { invalidateAjustBackup } from './hrExtAjustCache'

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)

let client = null
const superCache = {}
const defaultTTL = 3600 // 1h

const useCompression = true // mettre à false pour débug

export const getFullKey = (cacheName, key) => `${cacheName}:${key}`

let redisReady = Promise.resolve()

export const getRedisClient = () => {
  if (client && client.isReady) return client
  console.warn('⚠️ Redis client non prêt ou indisponible')
  return null
}

export const waitForRedis = () => redisReady

export const initRedis = () => {
  if (!config.redis) {
    console.warn('⚠️ Pas de config Redis')
    return
  }

  if (client) return redisReady

  redisReady = (async () => {
    try {
      console.log('🔧 config.redis =', config.redis)

      client = createClient({
        url: config.redis,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 100, 1000),
          keepAlive: true,
        },
        maxRetriesPerRequest: 0,
      })

      setInterval(() => {
        if (client?.isReady) {
          client.ping().catch((err) => console.error('❌ Ping Redis échoué', err))
        }
        //console.log(client?.isReady)
      }, 30000)

      client.on('error', (err) => {
        console.error('❌ Redis Client Error', err)
        if (err.message.includes('Socket closed unexpectedly')) {
          console.warn('♻️ Reconnexion forcée Redis')
          client.quit().catch(() => {})
          client = null
          initRedis()
        }
      })

      client.on('end', () => {
        console.warn('⚠️ Connexion Redis terminée')
      })

      client.on('reconnecting', () => {
        console.warn('♻️ Tentative de reconnexion Redis...')
      })

      await client.connect()
      console.log('✅ Redis connecté')

      return client
    } catch (err) {
      console.error('❌ Échec connexion Redis:', err)
      client = null
      return client
    }
  })()

  return redisReady
}

// === GET ===
export const getCacheValue = async (key, cacheName) => {
  const fullKey = getFullKey(cacheName, key)

  if (!client) {
    return superCache[fullKey] ?? null
  }

  try {
    const value = await client.get(fullKey)
    if (!value) return null

    if (!useCompression) {
      return JSON.parse(value)
    }

    const buffer = Buffer.from(value, 'base64')
    const decompressed = await gunzip(buffer)
    return JSON.parse(decompressed.toString())
  } catch (err) {
    console.error(`❌ getCacheValue(${fullKey}) échoué :`, err)
    return null
  }
}

// === SET ===
export const setCacheValue = async (key, value, cacheName, ttl = defaultTTL) => {
  const fullKey = getFullKey(cacheName, key)

  if (!client) {
    superCache[fullKey] = value
    return
  }

  try {
    const json = JSON.stringify(value)

    if (!useCompression) {
      await client.set(fullKey, json)
      return
    }

    const compressed = await gzip(json)
    const encoded = compressed.toString('base64')
    await client.set(fullKey, encoded)

    const rawSize = getObjectSizeInMB(value)
    const compressedSize = (compressed.length / 1024 / 1024).toFixed(2)

    //console.log(`🔍 Taille HR brute : ${rawSize} Mo`)
    //console.log(`📦 Taille HR compressée : ${compressedSize} Mo`)
  } catch (err) {
    console.error(`❌ setCacheValue(${fullKey}) échoué :`, err)
  }
}

// === DELETE ===
export const deleteCacheValue = async (key, cacheName) => {
  const fullKey = getFullKey(cacheName, key)

  if (!client) {
    delete superCache[fullKey]
    return
  }

  try {
    await client.del(fullKey)
  } catch (err) {
    console.error(`❌ deleteCacheValue(${fullKey}) échoué :`, err)
  }
}

export const getObjectSizeInMB = (obj) => {
  const str = JSON.stringify(obj)
  const sizeInBytes = Buffer.byteLength(str, 'utf8')
  return +(sizeInBytes / 1024 / 1024).toFixed(2) // en Mo
}

export const loadOrWarmHR = async (backupId, models) => {
  const cacheKey = 'hrBackup'
  let hr = await getCacheValue(backupId, cacheKey)

  if (!hr) {
    //console.log(`⚠️  Cache manquant pour ${cacheKey}:${backupId} → recalcul`)
    hr = await models.HumanResources.getCurrentHrNew(backupId)
    await setCacheValue(backupId, hr, cacheKey, 3600)
    await invalidateBackup(backupId)
    await invalidateAjustBackup(backupId)
  } else {
    //console.log(`✅ Cache utilisé pour ${cacheKey}:${backupId}`)
  }

  return hr
}

/**
 * Met à jour ou ajoute un élément dans un tableau stocké en cache
 * @param {string} key - La clé simple (ex: backupId)
 * @param {string} cacheName - Le préfixe du cache (ex: hrBackup)
 * @param {object} item - L'élément à insérer ou remplacer (doit contenir un champ 'id')
 * @param {number} [ttl=defaultTTL] - TTL en secondes (optionnel)
 */
export const updateCacheListItem = async (key, cacheName, item, ttl = defaultTTL) => {
  if (!item?.id) {
    console.error(`❌ updateCacheListItem : item invalide ou sans id`, item)
    return
  }

  const list = (await getCacheValue(key, cacheName)) || []

  const index = list.findIndex((el) => el.id == item.id)

  if (index !== -1) {
    list[index] = item
  } else {
    list.push(item)
  }

  await setCacheValue(key, list, cacheName, ttl)
  await invalidateAgentEverywhere(key, item.id)
  await invalidateAjustBackup(key)
}

/**
 * Supprime un élément d'un tableau stocké en cache
 * @param {string} key - La clé
 * @param {string} cacheName - Le préfixe du cache
 * @param {number} itemId - L'id de l'élément à supprimer
 */
export const removeCacheListItem = async (key, cacheName, itemId) => {
  const list = (await getCacheValue(key, cacheName)) || []
  const newList = list.filter((el) => el.id != itemId)
  await setCacheValue(key, newList, cacheName)
  await invalidateAgentEverywhere(key, itemId)
  await invalidateAjustBackup(key)
}

/**
 * Liste toutes les clés correspondant à un pattern glob.
 * @param {string} pattern ex: '*' ou 'hrExt:42:*'
 * @param {number} count   taille de lot suggérée pour SCAN (200–2000)
 * @returns {Promise<string[]>}
 */
export async function listKeys(pattern = '*', count = 1000) {
  const c = getRedisClient()
  if (!c) {
    console.warn('Redis non prêt')
    return []
  }

  const keys = []
  let cursor = '0'
  let iterations = 0

  do {
    const { cursor: next, keys: batch } = await c.scan(cursor, { MATCH: pattern, COUNT: count })
    if (batch?.length) keys.push(...batch)
    cursor = next
    // filet de sécurité
    if (++iterations > 1e6) {
      console.warn('🛑 Abort SCAN: too many iterations')
      break
    }
  } while (cursor !== '0' && cursor !== 0)

  return keys
}

/** Affiche joliment et retourne le nombre de clés */
export async function printKeys(pattern = '*') {
  const ks = await listKeys(pattern)
  console.log(`Pattern "${pattern}" → ${ks.length} clé(s)`)
  ks.forEach((k) => console.log(' -', k))
  return ks.length
}

// Initialisation immédiate si config présente
if (config.redis) {
  initRedis()
}
