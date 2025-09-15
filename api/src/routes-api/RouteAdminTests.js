import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import axios from 'axios'
import { buildTestCorpus, formatCorpusLines } from '../utils/tests-corpus'

const HF_TOKEN = process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN || ''
const MODEL = 'BAAI/bge-small-en-v1.5'

// Persist corpus within API tree, to remove dependency on end-to-end/exploration
const CORPUS_FILE = path.resolve(__dirname, '..', 'var', 'tests-corpus', 'user-stories.txt')

function parseCorpusLine(line) {
  // "- title  [relative-file]"
  const m = /^-\s+(.*?)\s+\[(.+)\]$/.exec(line.trim())
  if (!m) return null
  return { title: m[1], file: m[2] }
}

function cosine(a, b) {
  let dot = 0,
    na = 0,
    nb = 0
  for (let i = 0; i < a.length; i++) {
    const x = a[i]
    const y = b[i]
    dot += x * y
    na += x * x
    nb += y * y
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

async function hfEmbed(texts) {
  if (!HF_TOKEN) {
    throw new Error('HF_TOKEN is not set on server')
  }
  const url = `https://api-inference.huggingface.co/models/${encodeURIComponent(MODEL)}`
  const { data } = await axios.post(
    url,
    { inputs: texts, options: { wait_for_model: true } },
    { headers: { Authorization: `Bearer ${HF_TOKEN}` } },
  )
  return data
}

function toVector(arr) {
  if (Array.isArray(arr[0])) {
    const dim = arr[0].length
    const sum = new Array(dim).fill(0)
    for (const token of arr) {
      for (let i = 0; i < dim; i++) sum[i] += token[i]
    }
    return sum.map((v) => v / arr.length)
  }
  return arr
}

async function embedBatched(texts, batchSize = 32) {
  const out = []
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const res = await hfEmbed(batch)
    for (const emb of res) out.push(toVector(emb))
  }
  return out
}

export default class RouteAdminTests extends Route {
  constructor(params) {
    super(params)
  }

  @Route.Get({
    path: '/list',
    accesses: [Access.isAdmin],
  })
  async list(ctx) {
    const exists = fs.existsSync(CORPUS_FILE)
    if (!exists) {
      this.sendOk(ctx, { items: [], exists })
      return
    }

    const lines = fs
      .readFileSync(CORPUS_FILE, 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    const items = []
    for (const line of lines) {
      const it = parseCorpusLine(line)
      if (it) items.push(it)
    }
    this.sendOk(ctx, { items, exists: true, path: CORPUS_FILE })
  }

  @Route.Post({
    path: '/reindex',
    accesses: [Access.isAdmin],
  })
  async reindex(ctx) {
    try {
      const items = buildTestCorpus()
      const text = formatCorpusLines(items)
      fs.mkdirSync(path.dirname(CORPUS_FILE), { recursive: true })
      fs.writeFileSync(CORPUS_FILE, text, 'utf8')
      this.sendOk(ctx, { ok: true, corpusPath: CORPUS_FILE, count: items.length })
    } catch (e) {
      this.sendOk(ctx, { ok: false, error: e?.message, corpusPath: CORPUS_FILE })
    }
  }

  @Route.Post({
    path: '/search',
    bodyType: Types.object().keys({
      query: Types.string().required(),
      topK: Types.number(),
    }),
    accesses: [Access.isAdmin],
  })
  async search(ctx) {
    const { query, topK = 20 } = this.body(ctx)

    // Optionally refresh corpus if missing
    if (!fs.existsSync(CORPUS_FILE)) {
      await this.reindex(ctx)
    }

    if (!fs.existsSync(CORPUS_FILE)) {
      this.sendOk(ctx, { items: [] })
      return
    }

    const lines = fs
      .readFileSync(CORPUS_FILE, 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    const items = []
    for (const line of lines) {
      const it = parseCorpusLine(line)
      if (it) items.push(it)
    }

    if (items.length === 0) {
      this.sendOk(ctx, { items: [] })
      return
    }

    // Embed corpus + query
    const titles = items.map((it) => it.title)
    const [Ecorpus, [EqRaw]] = await Promise.all([embedBatched(titles), hfEmbed([query])])
    const Eq = toVector(EqRaw)

    const ranked = items
      .map((it, i) => ({ title: it.title, file: it.file, score: cosine(Ecorpus[i], Eq) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    this.sendOk(ctx, { items: ranked })
  }
}
