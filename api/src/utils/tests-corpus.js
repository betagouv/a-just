import fs from 'fs'
import path from 'path'

const TEST_ROOT = path.resolve(__dirname, '..', '..', '..', 'end-to-end', 'cypress', 'e2e')

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (e.isFile() && /\.cy\.[jt]s$/.test(e.name)) out.push(p)
  }
  return out
}

function extractTitlesFromFile(filePath) {
  const rel = path.relative(TEST_ROOT, filePath).replace(/\\/g, '/')
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
      items.push({ title, file: rel, line: idx + 1 })
    }
    // Heuristic pop: closing lines
    if (/^\s*\)\s*[,;]?\s*$/.test(line) || /^\s*\}\s*\)\s*[,;]?\s*$/.test(line)) {
      if (stack.length) stack.pop()
    }
  }
  return items
}

export function buildTestCorpus() {
  const files = walk(TEST_ROOT, [])
  const items = []
  for (const f of files) {
    try {
      items.push(...extractTitlesFromFile(f))
    } catch (e) {
      // ignore parse errors
    }
  }
  return items
}

export function formatCorpusLines(items) {
  return (
    items
      .map((it) => `- ${it.title}  [${it.file}${it.line ? `:${it.line}` : ''}]`)
      .join('\n') + '\n'
  )
}
