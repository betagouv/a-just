import { randomUUID } from 'node:crypto'
import { getRedisClient, waitForRedis } from './redis'

const JOBS_HASH_KEY = 'jobs:map'
const memJobs = new Map() // fallback local si Redis indisponible

async function ensureRedis() {
  await waitForRedis()
  return getRedisClient() // peut retourner null si non prêt / pas de config
}

async function hgetJSON(id) {
  const key = String(id)
  const client = await ensureRedis()
  if (client) {
    const val = await client.hGet(JOBS_HASH_KEY, key)
    return val ? JSON.parse(val) : null
  }
  return memJobs.get(key) || null
}

async function hsetJSON(id, obj) {
  const key = String(id)
  obj.updatedAt = Date.now()
  const client = await ensureRedis()
  if (client) {
    await client.hSet(JOBS_HASH_KEY, key, JSON.stringify(obj))
  } else {
    memJobs.set(key, obj)
  }
}

export async function createJob(userId, payload) {
  const id = randomUUID()
  const job = {
    status: 'queued',
    progress: 0,
    step: 'init',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    userId,
    payload,
  }
  await hsetJSON(id, job)
  return id
}

export async function setJobProgress(id, progress, step) {
  const job = await hgetJSON(id)
  if (!job) return
  job.status = 'running'
  job.progress = progress
  if (step !== undefined) job.step = step
  await hsetJSON(id, job)
}

export async function setJobResult(id, result) {
  const job = await hgetJSON(id)
  if (!job) return
  job.status = 'done'
  job.progress = 100
  job.result = result
  await hsetJSON(id, job)
}

export async function setJobError(id, msg) {
  const job = await hgetJSON(id)
  if (!job) return
  job.status = 'error'
  job.error = msg
  await hsetJSON(id, job)
}

export async function getJob(id) {
  return await hgetJSON(id)
}

/**
 * Nettoyage des vieux jobs (hash sans TTL par champ).
 * Appel périodiquement ou à la fin d’un job
 */
export async function cleanupOld(maxAgeMs = 6 * 60 * 60 * 1000) {
  const client = await ensureRedis()
  const now = Date.now()

  if (client) {
    // HGETALL -> { field1: json1, field2: json2, ... }
    const all = await client.hGetAll(JOBS_HASH_KEY)
    const toDelete = []
    for (const [id, json] of Object.entries(all)) {
      try {
        const j = JSON.parse(json)
        const age = now - (j.updatedAt || j.createdAt || 0)
        if (age > maxAgeMs) toDelete.push(String(id))
      } catch {
        toDelete.push(String(id))
      }
    }
    if (toDelete.length) {
      await client.hDel(JOBS_HASH_KEY, toDelete)
    }
  } else {
    for (const [id, j] of memJobs) {
      const age = now - (j.updatedAt || j.createdAt || 0)
      if (age > maxAgeMs) memJobs.delete(id)
    }
  }
}
