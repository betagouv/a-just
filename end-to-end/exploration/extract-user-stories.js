#!/usr/bin/env node
/*
  Extract user stories from Cypress end-to-end tests.
  - Scans end-to-end/cypress/e2e for *.js and *.ts files
  - For each test, outputs a line with the concatenation of enclosing describe/context titles + the it/specify title
  - Writes results to end-to-end/exploration/user-stories.txt

  Implementation details:
  - Tries to use @babel/parser for robust AST-based extraction if available.
  - Falls back to a lightweight, no-deps parser that tracks describe/context blocks and their scopes.
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const E2E_DIR = path.join(ROOT, 'cypress', 'e2e');
const OUTPUT = path.join(__dirname, 'user-stories.txt');

/** Recursively list files with given extensions */
function listFiles(dir, exts, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listFiles(p, exts, out);
    else if (exts.includes(path.extname(e.name))) out.push(p);
  }
  return out;
}

/** Attempt extraction using @babel/parser if present */
function parseWithBabel(filePath, code) {
  let parser;
  try {
    parser = require('@babel/parser');
  } catch (e) {
    return null; // not available
  }
  const t = require('@babel/types');

  const ast = parser.parse(code, {
    sourceType: 'unambiguous',
    plugins: [
      'typescript',
      'jsx',
      'classProperties',
      'dynamicImport',
      'optionalChaining',
      'nullishCoalescingOperator',
    ],
  });

  const stories = [];
  const stack = [];

  function getLiteralValue(node) {
    if (t.isStringLiteral(node)) return node.value;
    if (t.isTemplateLiteral(node) && node.expressions.length === 0) {
      return node.quasis.map(q => q.value.cooked).join('');
    }
    return null;
  }

  function visit(node, ancestors = []) {
    if (!node || typeof node !== 'object') return;

    // Detect describe/context calls
    if (t.isCallExpression(node) && t.isIdentifier(node.callee)) {
      const name = node.callee.name;
      if ((name === 'describe' || name === 'context') && node.arguments.length >= 2) {
        const title = getLiteralValue(node.arguments[0]);
        const fn = node.arguments[1];
        if (title && (t.isFunction(fn) || t.isArrowFunctionExpression(fn))) {
          stack.push(title);
          if (t.isBlockStatement(fn.body)) {
            fn.body.body.forEach(child => visit(child, ancestors.concat(node)));
          } else {
            visit(fn.body, ancestors.concat(node));
          }
          stack.pop();
          return;
        }
      }
      // Detect it/specify calls
      if ((name === 'it' || name === 'specify') && node.arguments.length >= 1) {
        const title = getLiteralValue(node.arguments[0]);
        if (title) {
          stories.push({ file: filePath, title: [...stack, title].join(' > ') });
        }
      }
    }

    // Generic traversal
    for (const key of Object.keys(node)) {
      const val = node[key];
      if (Array.isArray(val)) val.forEach((n) => visit(n, ancestors.concat(node)));
      else if (val && typeof val === 'object') visit(val, ancestors.concat(node));
    }
  }

  visit(ast, []);
  return stories;
}

/** Fallback extraction: naive scanner tracking describe/context braces */
function parseNaive(filePath, code) {
  const stories = [];
  const stack = []; // { title, end }

  function isIdentStart(ch) {
    return /[A-Za-z_$]/.test(ch);
  }
  function isIdent(ch) {
    return /[A-Za-z0-9_$]/.test(ch);
  }

  function skipWs(i) {
    while (i < code.length && /\s/.test(code[i])) i++;
    return i;
  }

  function readQuoted(idx) {
    const quote = code[idx];
    let i = idx + 1;
    let out = '';
    while (i < code.length) {
      const ch = code[i];
      if (ch === '\\') { i += 2; continue; }
      if (ch === quote) return { text: out, end: i + 1 };
      out += ch; i++;
    }
    return null;
  }

  function matchKeywordAt(i, kw) {
    if (code.slice(i, i + kw.length) !== kw) return false;
    const before = i - 1 >= 0 ? code[i - 1] : '';
    const after = i + kw.length < code.length ? code[i + kw.length] : '';
    if ((before && isIdent(before)) || (after && isIdent(after))) return false;
    return true;
  }

  const keywords = ['describe', 'context', 'it', 'specify'];

  let i = 0;
  while (i < code.length) {
    // Find potential identifier start
    if (!isIdentStart(code[i])) { i++; continue; }

    // Check for f/x prefixes
    let baseIdx = i;
    let prefix = '';
    if ((code[i] === 'f' || code[i] === 'x') && isIdent(code[i+1])) {
      prefix = code[i];
      baseIdx = i + 1;
    }

    // Try to match any keyword at baseIdx
    let matched = null;
    for (const kw of keywords) {
      if (matchKeywordAt(baseIdx, kw)) { matched = kw; break; }
    }
    if (!matched) { i++; continue; }

    // Move index after keyword
    i = baseIdx + matched.length;
    i = skipWs(i);
    if (code[i] !== '(') continue; // not a call
    i++;
    i = skipWs(i);
    const q = code[i];
    if (q !== '"' && q !== '\'' && q !== '`') continue; // first arg not a string literal
    const titleRes = readQuoted(i);
    if (!titleRes) continue;
    const title = titleRes.text.trim();
    i = titleRes.end;

    // Find next '{' which starts the callback body
    const braceIdx = code.indexOf('{', i);
    const baseKind = matched; // already stripped prefix by matching at baseIdx
    if (baseKind === 'describe' || baseKind === 'context') {
      if (braceIdx !== -1) {
        let k = braceIdx + 1;
        let depth = 1;
        let inS = false, sCh = '';
        let inTpl = false;
        while (k < code.length && depth > 0) {
          const ch = code[k];
          if (inS) { if (ch === '\\') k += 2; else if (ch === sCh) { inS = false; k++; } else k++; continue; }
          if (inTpl) {
            if (ch === '\\') { k += 2; continue; }
            if (ch === '`') { inTpl = false; k++; continue; }
            if (ch === '$' && code[k+1] === '{') { depth++; k += 2; continue; }
            if (ch === '}') { depth--; k++; continue; }
            k++; continue;
          }
          if (ch === '"' || ch === '\'') { inS = true; sCh = ch; k++; continue; }
          if (ch === '`') { inTpl = true; k++; continue; }
          if (ch === '{') { depth++; k++; continue; }
          if (ch === '}') { depth--; k++; continue; }
          k++;
        }
        const endIndex = k;
        stack.push({ title, end: endIndex });
      }
    } else if (baseKind === 'it' || baseKind === 'specify') {
      // Ensure stack only includes active describes
      while (stack.length && stack[stack.length - 1].end < i) stack.pop();
      stories.push({ file: filePath, title: [...stack.map(s => s.title), title].join(' > ') });
    }
  }

  return stories;
}

function main() {
  if (!fs.existsSync(E2E_DIR)) {
    console.error(`E2E directory not found: ${E2E_DIR}`);
    process.exit(1);
  }

  const files = listFiles(E2E_DIR, ['.js', '.ts']);
  const all = [];
  for (const f of files) {
    const code = fs.readFileSync(f, 'utf8');
    const astStories = parseWithBabel(f, code);
    if (astStories && astStories.length) all.push(...astStories);
    else all.push(...parseNaive(f, code));
  }

  // Sort by filename then title
  all.sort((a, b) => (a.file === b.file ? a.title.localeCompare(b.title) : a.file.localeCompare(b.file)));

  const lines = all.map(s => `- ${s.title}  [${path.relative(E2E_DIR, s.file)}]`);
  fs.writeFileSync(OUTPUT, lines.join('\n') + (lines.length ? '\n' : ''), 'utf8');

  console.log(`Extracted ${all.length} user stories from ${files.length} files.`);
  console.log(`Output written to: ${path.relative(process.cwd(), OUTPUT)}`);
}

if (require.main === module) {
  main();
}
