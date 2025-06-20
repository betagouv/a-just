import { createClient } from 'redis'
import config from 'config'
import zlib from 'zlib'
import { promisify } from 'util'

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)

let client = null
const superCache = {}
const defaultTTL = 3600 // 1h

const useCompression = true // met à false pour débug

export const getFullKey = (cacheName, key) => `${cacheName}:${key}`
let redisReady = Promise.resolve()
if (config.redis) {
  redisReady = (async () => {
    try {
      console.log('🔧 config.redis =', config.redis)
      client = await createClient({ url: config.redis })
        .on('error', (err) => console.error('❌ Redis Client Error', err))
        .connect()

      console.log('✅ Redis connecté')
    } catch (err) {
      console.error('❌ Échec connexion Redis:', err)
      client = null
    }
  })()
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
      await client.setEx(fullKey, ttl, json)
      return
    }

    const compressed = await gzip(json)
    const encoded = compressed.toString('base64')
    await client.setEx(fullKey, ttl, encoded)

    const rawSize = getObjectSizeInMB(value)
    const compressedSize = (compressed.length / 1024 / 1024).toFixed(2)

    console.log(`🔍 Taille HR brute : ${rawSize} Mo`)
    console.log(`📦 Taille HR compressée : ${compressedSize} Mo`)
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
    console.log(`⚠️  Cache manquant pour ${cacheKey}:${backupId} → recalcul`)
    hr = await models.HumanResources.getCacheNew(backupId, true)
    await setCacheValue(backupId, hr, cacheKey, 3600)
  } else {
    console.log(`✅ Cache utilisé pour ${cacheKey}:${backupId}`)
  }

  return hr
}

export const getRedisClient = () => client

export const waitForRedis = () => redisReady
