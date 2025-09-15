import { randomUUID } from 'node:crypto'

const jobs = new Map() // id -> { status, progress, result, error, userId, createdAt }

export function createJob(userId, payload) {
  const id = randomUUID()
  jobs.set(id, { status: 'queued', progress: 0, createdAt: Date.now(), userId, payload })
  console.log({ status: 'queued', progress: 0, createdAt: Date.now(), userId, payload })
  return id
}
export function setJobProgress(id, p, step) {
  const j = jobs.get(id)
  if (j) {
    j.progress = p
    j.step = step
    j.status = 'running'
  }
}
export function setJobResult(id, result) {
  const j = jobs.get(id)
  if (j) {
    j.status = 'done'
    j.result = result
    j.progress = 100
  }
}
export function setJobError(id, msg) {
  const j = jobs.get(id)
  if (j) {
    j.status = 'error'
    j.error = msg
  }
}
export function getJob(id) {
  return jobs.get(id)
}
export function cleanupOld(maxAgeMs = 6 * 60 * 60 * 1000) {
  const now = Date.now()
  for (const [id, j] of jobs) if (now - j.createdAt > maxAgeMs) jobs.delete(id)
}
