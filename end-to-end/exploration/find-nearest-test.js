// Use the global fetch available in Node 18+. If not available, instruct the user.
const fetchFn = globalThis.fetch;
if (!fetchFn) {
  console.error("Global fetch is not available. Please run with Node 18+ or install node-fetch and import it.");
  process.exit(1);
}

const HF_TOKEN = process.env.HF_TOKEN;
const model = "BAAI/bge-small-en-v1.5";

async function embed(texts){
  if (!HF_TOKEN) {
    throw new Error("HF_TOKEN is not set. export HF_TOKEN=your_token");
  }
  // Use the canonical models endpoint (works for feature-extraction)
  const url = `https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`;
  const res = await fetchFn(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: texts, options: { wait_for_model: true } }),
  });
  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`HF API ${res.status}: ${bodyText}`);
  }
  let data;
  try {
    data = JSON.parse(bodyText);
  } catch {
    throw new Error(`Unexpected HF API response (not JSON): ${bodyText.slice(0, 200)}...`);
  }
  return data; // array (or nested arrays) of vectors
}

// Normalize output to a flat vector per text. If tokens x dim, average tokens.
function toVector(arr) {
  if (Array.isArray(arr[0])) {
    const dim = arr[0].length;
    const sum = new Array(dim).fill(0);
    for (const token of arr) {
      for (let i = 0; i < dim; i++) sum[i] += token[i];
    }
    return sum.map(v => v / arr.length);
  }
  return arr;
}

function cosine(a,b){
  const dot = a.reduce((s,x,i)=>s + x*b[i],0);
  const na = Math.hypot(...a), nb = Math.hypot(...b);
  return dot / (na*nb);
}

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const STORIES_FILE = path.join(ROOT, 'user-stories.txt');

function readCorpus() {
  if (!fs.existsSync(STORIES_FILE)) {
    console.error(`Corpus file not found: ${STORIES_FILE}. Run extract-user-stories.js first.`);
    process.exit(1);
  }
  const lines = fs.readFileSync(STORIES_FILE, 'utf8')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
  // Each line format: "- title  [relative-file]"
  const corpus = [];
  for (const line of lines) {
    const m = /^-\s+(.*?)\s+\[(.+)\]$/.exec(line);
    if (m) corpus.push({ title: m[1], file: m[2] });
  }
  return corpus;
}

function getQueryFromCLI() {
  const q = process.argv.slice(2).join(' ').trim();
  if (!q) {
    console.error('Usage: node exploration/find-nearest-test.js "your user story query"');
    process.exit(1);
  }
  return q;
}

async function embedBatched(texts, batchSize = 32) {
  const out = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const res = await embed(batch);
    // res is array of arrays; normalize each
    for (const emb of res) out.push(toVector(emb));
  }
  return out;
}

const run = async () => {
  const items = readCorpus();
  const query = getQueryFromCLI();
  const texts = items.map(it => it.title);
  const [Ecorpus, [EqRaw]] = await Promise.all([
    embedBatched(texts),
    embed([query]),
  ]);
  const Eq = toVector(EqRaw);
  const ranked = items
    .map((it,i)=>({ title: it.title, file: it.file, score: cosine(Ecorpus[i], Eq) }))
    .sort((a,b)=>b.score-a.score)
    .slice(0, 20);
  console.table(ranked.map(r => ({ score: +r.score.toFixed(4), title: r.title, file: r.file })));
};
run();