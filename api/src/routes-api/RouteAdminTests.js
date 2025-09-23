import dotenv from 'dotenv'
import path from 'path'
// Ensure we always load the API-level .env regardless of the process working directory
// and override any pre-set process.env so local api/.env is the single source of truth
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true })
import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { spawn } from 'child_process'
// path already imported above
import fs from 'fs'
import crypto from 'crypto'
import axios from 'axios'
import { buildTestCorpus, formatCorpusLines } from '../utils/tests-corpus'
import os from 'os'

// Small helper to read envs robustly (trim whitespace)
const ENV = (k, d = '') => {
  const v = process.env[k]
  if (typeof v === 'string') return v.trim()
  return v ?? d
}

// Embeddings provider configuration
const EMBEDDINGS_PROVIDER = (ENV('EMBEDDINGS_PROVIDER', 'hf') || 'hf').toLowerCase() // 'hf' | 'albert'
// HF configuration
const HF_TOKEN = ENV('HF_TOKEN') || ENV('HUGGINGFACE_TOKEN') || ''
const HF_MODEL = ENV('HF_EMBEDDINGS_MODEL', 'BAAI/bge-small-en-v1.5')
// Albert configuration
const ALBERT_API_BASE = ENV('ALBERT_BASE_URL', 'https://albert.api.etalab.gouv.fr')
const ALBERT_API_KEY = ENV('ALBERT_API_KEY', '')
const ALBERT_MODEL = ENV('ALBERT_EMBEDDINGS_MODEL', 'embeddings-small') // alias of BAAI/bge-m3
// Albert chat model for summaries (must be a text-generation model id)
const ALBERT_CHAT_MODEL = ENV('ALBERT_CHAT_MODEL', '')

// One-time diagnostic log to confirm active provider/model
try {
  const activeModel = EMBEDDINGS_PROVIDER === 'albert' ? ALBERT_MODEL : HF_MODEL
  // keep it short; appears once at module load
  console.info('[embeddings] provider=%s model=%s', EMBEDDINGS_PROVIDER, activeModel)
} catch {}

// Persist corpus within API tree, to remove dependency on end-to-end/exploration
const CORPUS_FILE = path.resolve(__dirname, '..', 'var', 'tests-corpus', 'user-stories.txt')
function safeName(s) { return (s || '').toString().replace(/[^A-Za-z0-9_.-]+/g, '_') }
function embeddingsFilePath() {
  const provider = EMBEDDINGS_PROVIDER
  const model = EMBEDDINGS_PROVIDER === 'albert' ? ALBERT_MODEL : HF_MODEL
  const embDir = path.resolve(__dirname, '..', 'var', 'tests-corpus')
  const file = `embeddings-${safeName(provider)}-${safeName(model)}.json`
  return path.join(embDir, file)
}

// In-memory embeddings cache { items, vectors }
let EMB_CACHE = null

// Map short source tag to human-friendly kind
function sourceToKind(source) {
  return (source || 'cy') === 'api' ? 'unit test' : 'end to end test'
}

function parseCorpusLine(line) {
  // "- title  [source:relative-file[:line]]" or legacy "[relative-file[:line]]"
  const m = /^-\s+(.*?)\s+\[(.+?)\]$/.exec(line.trim())
  if (!m) return null
  let raw = m[2]
  let source = 'cy'
  // source:file(:line)?
  const srcMatch = /^(\w+?):(.+)$/.exec(raw)
  if (srcMatch) {
    source = srcMatch[1]
    raw = srcMatch[2]
  }

  let file = raw
  let lineNum = undefined
  const fileMatch = /^(.*?):(\d+)$/.exec(file)
  if (fileMatch) {
    file = fileMatch[1]
    lineNum = parseInt(fileMatch[2], 10)
  }
  return { title: m[1], source, file, line: lineNum }
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
  const url = `https://api-inference.huggingface.co/models/${encodeURIComponent(HF_MODEL)}`
  const { data } = await axios.post(
    url,
    { inputs: texts, options: { wait_for_model: true } },
    { headers: { Authorization: `Bearer ${HF_TOKEN}` } },
  )
  return data
}

// Call Albert embeddings endpoint and return an array of vectors (shape compatible with toVector consumer)
async function albertEmbed(texts) {
  if (!ALBERT_API_KEY) {
    throw new Error('ALBERT_API_KEY is not set on server')
  }
  const url = `${ALBERT_API_BASE.replace(/\/$/, '')}/v1/embeddings`
  const payload = {
    model: ALBERT_MODEL,
    input: texts,
    // encoding_format: 'float' // default, explicit not required
  }
  const { data } = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${ALBERT_API_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  // data: { data: [{ embedding, index, object }, ...] }
  if (!data || !Array.isArray(data.data)) {
    throw new Error('Invalid response from Albert embeddings API')
  }
  return data.data.map((d) => d.embedding)
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
    let vectors
    if (EMBEDDINGS_PROVIDER === 'albert') {
      vectors = await albertEmbed(batch)
    } else {
      // default: hf
      const res = await hfEmbed(batch)
      vectors = res
    }
    for (const emb of vectors) out.push(toVector(emb))
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
    for (const l of lines) {
      const it = parseCorpusLine(l)
      if (it) items.push({ ...it, kind: sourceToKind(it.source) })
    }
    // Ensure cache exists for current provider/model on first page load
    const filePath = embeddingsFilePath()
    await (async () => {
      // Build if missing
      if (!fs.existsSync(filePath)) {
        const titles = items.map((it) => it.title)
        const vectors2d = await embedBatched(titles)
        const vectors = vectors2d.map((v) => toVector(v))
        fs.mkdirSync(path.dirname(filePath), { recursive: true })
        fs.writeFileSync(
          filePath,
          JSON.stringify({ items, vectors, updatedAt: new Date().toISOString(), meta: { provider: EMBEDDINGS_PROVIDER, model: EMBEDDINGS_PROVIDER === 'albert' ? ALBERT_MODEL : HF_MODEL } }),
          'utf8'
        )
        EMB_CACHE = { items, vectors }
      }
    })()
    // Report cache status to the UI (no sensitive data)
    let cache = { exists: fs.existsSync(filePath), path: filePath }
    try {
      if (cache.exists) {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        cache = { ...cache, meta: raw?.meta || null, size: Array.isArray(raw?.vectors) ? raw.vectors.length : 0, updatedAt: raw?.updatedAt || null }
      }
    } catch {}
    this.sendOk(ctx, { items, exists: true, path: CORPUS_FILE, cache })
  }

  @Route.Post({
    path: '/reindex',
    accesses: [Access.isAdmin],
  })
  async reindex(ctx) {
    try {
      const items = buildTestCorpus()
      const body = formatCorpusLines(items)
      fs.mkdirSync(path.dirname(CORPUS_FILE), { recursive: true })
      fs.writeFileSync(CORPUS_FILE, body, 'utf8')

      // Build and persist embeddings for the corpus so searches only embed the query
      const titles = items.map((it) => it.title)
      const vectors2d = await embedBatched(titles)
      const vectors = vectors2d.map((v) => toVector(v))
      const filePath = embeddingsFilePath()
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      fs.writeFileSync(
        filePath,
        JSON.stringify({ items, vectors, updatedAt: new Date().toISOString(), meta: { provider: EMBEDDINGS_PROVIDER, model: EMBEDDINGS_PROVIDER === 'albert' ? ALBERT_MODEL : HF_MODEL } }),
        'utf8'
      )
      EMB_CACHE = { items, vectors }

      this.sendOk(ctx, { ok: true, path: CORPUS_FILE })
    } catch (e) {
      console.error(e)
      this.sendErr(ctx, e)
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

    // Load or refresh embeddings cache
    const ensureCache = async () => {
      const filePath = embeddingsFilePath()
      if (!EMB_CACHE) {
        if (fs.existsSync(filePath)) {
          try {
            const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
            const cacheProvider = raw?.meta?.provider
            const cacheModel = raw?.meta?.model
            const currentModel = EMBEDDINGS_PROVIDER === 'albert' ? ALBERT_MODEL : HF_MODEL
            const providerMatch = cacheProvider === EMBEDDINGS_PROVIDER
            const modelMatch = cacheModel === currentModel
            if (Array.isArray(raw?.items) && Array.isArray(raw?.vectors) && providerMatch && modelMatch) {
              EMB_CACHE = { items: raw.items, vectors: raw.vectors }
            }
          } catch {}
        }
      }
      // If cache missing or out of sync, rebuild now (one-time cost)
      if (!EMB_CACHE || (EMB_CACHE.items?.length !== items.length)) {
        const titlesNow = items.map((it) => it.title)
        const vecs2d = await embedBatched(titlesNow)
        const vecs = vecs2d.map((v) => toVector(v))
        EMB_CACHE = { items, vectors: vecs }
        try {
          fs.mkdirSync(path.dirname(filePath), { recursive: true })
          fs.writeFileSync(
            filePath,
            JSON.stringify({ items, vectors: vecs, updatedAt: new Date().toISOString(), meta: { provider: EMBEDDINGS_PROVIDER, model: EMBEDDINGS_PROVIDER === 'albert' ? ALBERT_MODEL : HF_MODEL } }),
            'utf8'
          )
        } catch {}
      }
    }
    await ensureCache()

    // Embed only the query and compare against cached corpus vectors
    let queryVec
    if (EMBEDDINGS_PROVIDER === 'albert') {
      const res = await albertEmbed([query])
      queryVec = res[0]
    } else {
      const res = await hfEmbed([query])
      // hf returns nested arrays in some cases; toVector handles averaging
      queryVec = Array.isArray(res) && res.length ? res[0] : res
    }
    const Eq = toVector(queryVec)

    const ranked = items
      .map((it, i) => ({ title: it.title, source: it.source || 'cy', kind: sourceToKind(it.source), file: it.file, line: it.line, score: cosine(EMB_CACHE.vectors[i], Eq) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    this.sendOk(ctx, { items: ranked })
  }

  @Route.Get({
    path: '/snippet',
    queryType: Types.object().keys({ file: Types.string().required(), line: Types.number().required(), source: Types.string() }),
    accesses: [Access.isAdmin],
  })
  async snippet(ctx) {
    const q = ctx.request?.query || {}
    const file = q.file
    const line = parseInt(q.line, 10) || 1
    const source = (q.source || 'cy').toString()
    // Resolve file under proper root
    const projectRoot = path.resolve(__dirname, '..', '..', '..')
    const cyPath = path.resolve(projectRoot, 'end-to-end', 'cypress', 'e2e', file)
    const apiPath = path.resolve(projectRoot, 'api', 'test', 'api', file)
    const absPath = source === 'api' ? apiPath : cyPath
    if (!absPath.startsWith(path.resolve(projectRoot))) {
      ctx.throw(400, 'Bad file path')
      return
    }
    if (!fs.existsSync(absPath)) {
      this.sendOk(ctx, { exists: false })
      return
    }
    const sourceText = fs.readFileSync(absPath, 'utf8')
    const lines = sourceText.split(/\r?\n/)
    // Precompute line start positions to robustly map between line <-> char offsets
    const lineStarts = new Array(lines.length)
    {
      let acc = 0
      for (let i = 0; i < lines.length; i++) {
        lineStarts[i] = acc
        // add this line length plus 1 for the newline (\n). This also works if original was \r\n since we split on \r?\n
        acc += lines[i].length + 1
      }
    }

    // Simple lexer helpers
    const reToken = /\b(describe|beforeEach|it)\s*\(/g
    const findBlockEnd = (startIdx) => {
      let i = startIdx
      let depth = 0
      let inStr = false
      let strQuote = ''
      let inLineComment = false
      let inBlockComment = false
      while (i < sourceText.length) {
        const ch = sourceText[i]
        const nxt = sourceText[i + 1]
        if (inLineComment) { if (ch === '\n') inLineComment = false; i++; continue }
        if (inBlockComment) { if (ch === '*' && nxt === '/') { inBlockComment = false; i += 2; continue } i++; continue }
        if (inStr) { if (ch === '\\') { i += 2; continue } if (ch === strQuote) { inStr = false; strQuote = '' } i++; continue }
        if (ch === '/' && nxt === '/') { inLineComment = true; i += 2; continue }
        if (ch === '/' && nxt === '*') { inBlockComment = true; i += 2; continue }
        if (ch === '\'' || ch === '"' || ch === '`') { inStr = true; strQuote = ch; i++; continue }
        if (ch === '{') { depth++; i++; continue }
        if (ch === '}') { depth--; i++; if (depth === 0) return i; continue }
        i++
      }
      return -1
    }

    // Collect tokens across the whole file; compute depths by containment (no skipping of inner tokens)
    const allDescribes = [] // { start, end }
    const befores = [] // { startChar, endChar, depth }
    const itBlocks = [] // { startChar, endChar, depth, tokenPos }

    // Precompute offset of requested line using lineStarts
    const requestedLineIdx = Math.max(0, Math.min(lines.length - 1, line - 1))
    const requestedOffset = lineStarts[requestedLineIdx]

    // Manual scan: respect strings and comments so commented-out tokens are ignored
    {
      let i = 0
      let inLineComment = false
      let inBlockComment = false
      let inStr = false
      let strQuote = ''
      const isWordChar = (ch) => /[A-Za-z0-9_]/.test(ch)

      const tryMatchToken = (pos, word) => {
        if (pos > 0 && isWordChar(sourceText[pos - 1])) return null
        if (!sourceText.startsWith(word, pos)) return null
        const end = pos + word.length
        if (end < sourceText.length && isWordChar(sourceText[end])) return null
        // skip whitespace to '(' after word
        let j = end
        while (j < sourceText.length && /\s/.test(sourceText[j])) j++
        if (sourceText[j] !== '(') return null
        // find first '{' after this position (still using global text; comments inside args won't matter)
        const braceStart = sourceText.indexOf('{', j)
        if (braceStart === -1) return null
        const blockEnd = findBlockEnd(braceStart)
        if (blockEnd === -1) return null
        return { tokenPos: pos, braceStart, blockEnd }
      }

      while (i < sourceText.length) {
        const ch = sourceText[i]
        const nxt = sourceText[i + 1]

        if (inLineComment) { if (ch === '\n') inLineComment = false; i++; continue }
        if (inBlockComment) { if (ch === '*' && nxt === '/') { inBlockComment = false; i += 2; continue } i++; continue }
        if (inStr) {
          if (ch === '\\') { i += 2; continue }
          if (ch === strQuote) { inStr = false; strQuote = '' }
          i++
          continue
        }
        if (ch === '/' && nxt === '/') { inLineComment = true; i += 2; continue }
        if (ch === '/' && nxt === '*') { inBlockComment = true; i += 2; continue }
        if (ch === '\'' || ch === '"' || ch === '`') { inStr = true; strQuote = ch; i++; continue }

        // Try tokens at this position
        let hit = null
        hit = hit || (tryMatchToken(i, 'describe'))
        if (hit) { allDescribes.push({ start: hit.braceStart, end: hit.blockEnd }); i = hit.braceStart + 1; continue }

        hit = tryMatchToken(i, 'beforeEach')
        if (hit) {
          const depth = allDescribes.filter((d) => d.start <= hit.braceStart && hit.blockEnd <= d.end).length
          befores.push({ startChar: hit.braceStart, endChar: hit.blockEnd, depth })
          i = hit.braceStart + 1; continue
        }

        hit = tryMatchToken(i, 'it')
        if (hit) {
          const depth = allDescribes.filter((d) => d.start <= hit.braceStart && hit.blockEnd <= d.end).length
          itBlocks.push({ startChar: hit.braceStart, endChar: hit.blockEnd, depth, tokenPos: i })
          i = hit.braceStart + 1; continue
        }

        i++
      }
    }

    // Prefer the it block that contains the requested offset; else the first it after the offset
    let targetIt = itBlocks.find((b) => b.startChar <= requestedOffset && requestedOffset <= b.endChar) ||
                   itBlocks.find((b) => b.tokenPos >= requestedOffset) || null

    if (!targetIt) {
      // Line-based fallback: walk upwards to find a line containing it(, else downwards.
      const itLineRe = /^\s*it\s*\(/
      let startIdx = requestedLineIdx
      while (startIdx >= 0 && !itLineRe.test(lines[startIdx])) startIdx--
      if (startIdx < 0) {
        startIdx = requestedLineIdx
        while (startIdx < lines.length && !itLineRe.test(lines[startIdx])) startIdx++
      }
      if (startIdx >= 0 && startIdx < lines.length) {
        // derive tokenPos from this line occurrence
        const lineText = lines[startIdx]
        const col = lineText.indexOf('it(')
        const tokenPos = lineStarts[startIdx] + (col >= 0 ? col : 0)
        // find braceStart and its matching end
        const braceStart = sourceText.indexOf('{', tokenPos)
        const blockEnd = braceStart >= 0 ? findBlockEnd(braceStart) : -1
        if (braceStart >= 0 && blockEnd > braceStart) {
          targetIt = { startChar: braceStart, endChar: blockEnd, depth: 0, tokenPos }
        }
      }
      if (!targetIt) {
        // ultimate fallback: small window
        const start = Math.max(1, line - 5)
        const end = Math.min(lines.length, line + 10)
        const snippet = lines.slice(start - 1, end).join(os.EOL)
        this.sendOk(ctx, { exists: true, file, line, start, end, snippet, includedBefores: 0, debug: { requestedLine: line, requestedOffset } })
        return
      }
    }

    // Map char positions to line numbers
    const charToLine = (pos) => {
      // binary search over lineStarts
      let lo = 0, hi = lineStarts.length - 1, ans = lineStarts.length - 1
      while (lo <= hi) {
        const mid = (lo + hi) >> 1
        if (lineStarts[mid] <= pos) { ans = mid; lo = mid + 1 } else { hi = mid - 1 }
      }
      return ans + 1
    }

    // Depth of the selected it block
    const targetDepth = targetIt.depth || 0
    const itStartLine = charToLine(targetIt.tokenPos ?? targetIt.startChar)
    const itEndLine = charToLine(targetIt.endChar)

    // Determine ancestor describe chain enclosing the target 'it'
    const ancestors = allDescribes.filter((d) => d.start <= targetIt.startChar && targetIt.startChar <= d.end)

    // Select beforeEach blocks that are within any ancestor describe range and appear before the it
    const scopedBefores = befores
      .filter((b) => {
        if (b.startChar >= targetIt.startChar) return false
        return ancestors.some((d) => d.start <= b.startChar && b.endChar <= d.end)
      })
      .sort((a, b) => a.startChar - b.startChar)

    let parts = []
    for (const b of scopedBefores) {
      const sL = charToLine(b.startChar)
      const eL = charToLine(b.endChar)
      const text = lines.slice(sL - 1, eL).join(os.EOL)
      parts.push(text)
    }
    const itText = lines.slice(itStartLine - 1, itEndLine).join(os.EOL)
    parts.push(itText)
    const snippet = parts.join(`\n\n`)
    // Debug logs
    try {
      console.log('[snippet]', { file, requestedLine: line, itStartLine, itEndLine, includedBefores: scopedBefores.length })
    } catch {}
    // Generate or load cached French summary using Albert chat API (LLM detects commented tests)
    const summary = await generateSnippetSummaryFr(snippet).catch(() => null)
    this.sendOk(ctx, { exists: true, file, line: itStartLine, start: itStartLine, end: itEndLine, snippet, summaryFr: summary, includedBefores: scopedBefores.length, debug: { requestedLine: line, requestedOffset, tokenPos: targetIt.tokenPos ?? targetIt.startChar } })
  }
}

// === Summarization helpers ===
function summariesDir() {
  return path.resolve(__dirname, '..', 'var', 'tests-corpus', 'summaries')
}

function safeFsMkdir(p) {
  try { fs.mkdirSync(p, { recursive: true }) } catch {}
}

function summaryCachePath(hash, provider, model) {
  const dir = summariesDir()
  safeFsMkdir(dir)
  const p = (provider || '').toString().trim() || 'unknown'
  const m = (model || '').toString().trim() || 'unknown'
  return path.join(dir, `fr-${safeName(p)}-${safeName(m)}-${hash}.txt`)
}

async function generateSnippetSummaryFr(snippet) {
  const text = (snippet || '').toString().trim()
  if (!text) return null
  // Only generate with Albert chat if configured
  if (!ALBERT_API_KEY || !ALBERT_CHAT_MODEL) return null
  const prov = 'albert'
  const mod = ALBERT_CHAT_MODEL
  // Cache keyed only by snippet text so the LLM decides comment status
  const hash = crypto.createHash('sha256').update(text).digest('hex')
  const cacheFile = summaryCachePath(hash, prov, mod)
  try {
    if (fs.existsSync(cacheFile)) {
      const cached = fs.readFileSync(cacheFile, 'utf8')
      if (cached && cached.trim()) return cached
    }
  } catch {}

  try {
    const summary = await albertChatSummarize(text)
    if (summary && summary.trim()) {
      try { fs.writeFileSync(cacheFile, summary, 'utf8') } catch {}
      return summary
    }
  } catch (e) {
    try { console.warn('[summary] failed to generate:', e?.response?.status || '', e?.message || e) } catch {}
  }
  return null
}

async function albertChatSummarize(codeSnippet) {
  const systemPrompt = 'Vous êtes un expert en programmation et en communication claire. Votre rôle est d’\u00e9xpliquer des tests automatis\u00e9s en fran\u00e7ais de mani\u00e8re concise et accessible.'
  const userPrompt = [
    'R\u00e9sumez le test ci-dessous en 1 \u00e0 2 phrases, en fran\u00e7ais, pour un utilisateur non technique qui conna\u00eet le produit. N\u2019ajoutez pas d\u2019introduction (pas de "R\u00e9sum\u00e9"). N\u2019utilisez pas de guillemets.',
    'Analysez d\'abord si le test a \u00e9t\u00e9 rendu inop\u00e9rant (par ex. si toutes les assertions et v\u00e9rifications sont comment\u00e9es, si le test est neutralis\u00e9 via xit/skip, ou si la logique est enti\u00e8rement comment\u00e9e) — c\'est-\u00e0-dire s\'il r\u00e9ussit toujours car aucune v\u00e9rification r\u00e9elle n\'est ex\u00e9cut\u00e9e.',
    'Si c\'est le cas, commencez votre reponse par: "Test comment\u00e9 " \u2014. ',
    'Ignorez les console.log. Style direct et concis.',
    '# D\u00e9but du code',
    codeSnippet,
    '# Fin du code',
  ].join('\n')

  const url = `${ALBERT_API_BASE.replace(/\/$/, '')}/v1/chat/completions`
  const body = {
    model: ALBERT_CHAT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    stream: false,
  }
  try {
    const { data, status } = await axios.post(url, body, {
      headers: { Authorization: `Bearer ${ALBERT_API_KEY}`, 'Content-Type': 'application/json' },
      timeout: 30000,
    })
    // OpenAI-like response: choices[0].message.content
    const content = data?.choices?.[0]?.message?.content
    return typeof content === 'string' ? content : null
  } catch (e) {
    try {
      const status = e?.response?.status
      const respData = e?.response?.data
      // Truncate large payloads
      const bodyPreview = typeof respData === 'string' ? respData.slice(0, 2000) : JSON.stringify(respData)?.slice(0, 2000)
      console.error('[albert-chat] error', {
        status,
        body: bodyPreview,
      })
    } catch {}
    throw e
  }
}
