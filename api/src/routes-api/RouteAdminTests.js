import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import axios from 'axios'
import { buildTestCorpus, formatCorpusLines } from '../utils/tests-corpus'
import os from 'os'

const HF_TOKEN = process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN || ''
const MODEL = 'BAAI/bge-small-en-v1.5'

// Persist corpus within API tree, to remove dependency on end-to-end/exploration
const CORPUS_FILE = path.resolve(__dirname, '..', 'var', 'tests-corpus', 'user-stories.txt')

function parseCorpusLine(line) {
  // "- title  [relative-file[:line]]"
  const m = /^-\s+(.*?)\s+\[(.+?)\]$/.exec(line.trim())
  if (!m) return null
  let file = m[2]
  let lineNum = undefined
  const fileMatch = /^(.*?):(\d+)$/.exec(file)
  if (fileMatch) {
    file = fileMatch[1]
    lineNum = parseInt(fileMatch[2], 10)
  }
  return { title: m[1], file, line: lineNum }
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
      .map((it, i) => ({ title: it.title, file: it.file, line: it.line, score: cosine(Ecorpus[i], Eq) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    this.sendOk(ctx, { items: ranked })
  }

  @Route.Get({
    path: '/snippet',
    queryType: Types.object().keys({ file: Types.string().required(), line: Types.number().required() }),
    accesses: [Access.isAdmin],
  })
  async snippet(ctx) {
    const q = ctx.request?.query || {}
    const file = q.file
    const line = parseInt(q.line, 10) || 1
    // Resolve file under project root end-to-end folder
    const projectRoot = path.resolve(__dirname, '..', '..', '..')
    const absPath = path.resolve(projectRoot, 'end-to-end', 'cypress', 'e2e', file)
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
    this.sendOk(ctx, { exists: true, file, line: itStartLine, start: itStartLine, end: itEndLine, snippet, includedBefores: scopedBefores.length, debug: { requestedLine: line, requestedOffset, tokenPos: targetIt.tokenPos ?? targetIt.startChar } })
  }
}
