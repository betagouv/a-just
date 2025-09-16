import fs from 'fs'
import path from 'path'

const CY_ROOT = path.resolve(__dirname, '..', '..', '..', 'end-to-end', 'cypress', 'e2e')
const API_TEST_ROOT = path.resolve(__dirname, '..', '..', 'test', 'api')

function walk(dir, out = [], fileRegex = /\.cy\.[jt]s$/) {
  if (!fs.existsSync(dir)) return out
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (e.isFile() && fileRegex.test(e.name)) out.push(p)
  }
  return out
}

function extractTitlesFromFile(filePath, root, source) {
  const rel = path.relative(root, filePath).replace(/\\/g, '/')
  const src = fs.readFileSync(filePath, 'utf8')
  const lines = src.split(/\r?\n/)
  const stack = []
  const items = []
  const describeRe = /\bdescribe\s*\(\s*([`'"])(.*?)\1\s*,/g
  const itRe = /\bit\s*\(\s*([`'"])(.*?)\1\s*,/g

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx]
    // Enter describes on this line
    let m
    describeRe.lastIndex = 0
    while ((m = describeRe.exec(line))) {
      stack.push(m[2])
    }
    // Add its on this line
    itRe.lastIndex = 0
    while ((m = itRe.exec(line))) {
      const title = (stack.length ? stack.join(' > ') + ' > ' : '') + m[2]
      items.push({ title, file: rel, line: idx + 1, source })
    }
    // Heuristic pop: closing lines
    if (/^\s*\)\s*[,;]?\s*$/.test(line) || /^\s*\}\s*\)\s*[,;]?\s*$/.test(line)) {
      if (stack.length) stack.pop()
    }
  }
  return items
}

export function buildTestCorpus() {
  const items = []
  // Cypress e2e
  for (const f of walk(CY_ROOT, [], /\.cy\.[jt]s$/)) {
    try { items.push(...extractTitlesFromFile(f, CY_ROOT, 'cy')) } catch {}
  }
  // API mocha tests (plain .js under api/test/api)
  for (const f of walk(API_TEST_ROOT, [], /\.[jt]s$/)) {
    try { items.push(...extractTitlesFromFile(f, API_TEST_ROOT, 'api')) } catch {}
  }
  return items
}

export function formatCorpusLines(items) {
  return (
    items
      .map((it) => `- ${it.title}  [${(it.source || 'cy')}:${it.file}${it.line ? `:${it.line}` : ''}]`)
      .join('\n') + '\n'
  )
}
