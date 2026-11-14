// Build-time step for the site search.
//
// Reads the slim index Hugo writes (public/search-index.json), splits each
// page into overlapping chunks, embeds every chunk with a small sentence
// model, and writes public/search-embeddings.json for the browser to rank
// against. The browser loads the same model to embed the query, so the
// MODEL and DTYPE values here must match static/js/search.js.
//
// Usage: node scripts/build-embeddings.mjs [publicDir] [outDir]

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pipeline } from "@huggingface/transformers";

const MODEL = "Xenova/all-MiniLM-L6-v2";
const DTYPE = "q8";
const CHUNK_WORDS = 120;
const CHUNK_STRIDE = 90;
const MAX_CHUNKS_PER_PAGE = 12;

const publicDir = process.argv[2] ?? "public";
const outDir = process.argv[3] ?? publicDir;
const pages = JSON.parse(await readFile(join(publicDir, "search-index.json"), "utf8"));

function chunk(words) {
  const out = [];
  for (let i = 0; i < words.length && out.length < MAX_CHUNKS_PER_PAGE; i += CHUNK_STRIDE) {
    out.push(words.slice(i, i + CHUNK_WORDS).join(" "));
    if (i + CHUNK_WORDS >= words.length) break;
  }
  return out;
}

// Each page gets one "head" chunk (title, tags, summary) plus body chunks.
// Every chunk is prefixed with the title so it keeps its context.
const items = [];
pages.forEach((page, pageIndex) => {
  const tags = (page.tags ?? []).join(", ");
  items.push({
    pageIndex,
    text: [page.title, tags, page.summary].filter(Boolean).join(". "),
  });
  const words = (page.content ?? "").split(/\s+/).filter(Boolean);
  for (const body of chunk(words)) {
    items.push({ pageIndex, text: `${page.title}. ${body}` });
  }
});

console.log(`Embedding ${items.length} chunks from ${pages.length} pages with ${MODEL} (${DTYPE})`);
const extractor = await pipeline("feature-extraction", MODEL, { dtype: DTYPE });

// Vectors are unit length, so each value is in [-1, 1]. Store as int8 in
// base64 to keep the file small; the browser rescales by 1/127.
const vectors = [];
for (const item of items) {
  const output = await extractor(item.text, { pooling: "mean", normalize: true });
  const int8 = Int8Array.from(output.data, (v) => Math.max(-127, Math.min(127, Math.round(v * 127))));
  vectors.push(Buffer.from(int8.buffer).toString("base64"));
}

const dims = vectors.length ? Buffer.from(vectors[0], "base64").length : 0;
const payload = {
  model: MODEL,
  dtype: DTYPE,
  dims,
  chunks: items.map((item, i) => ({ page: item.pageIndex, v: vectors[i] })),
};
await writeFile(join(outDir, "search-embeddings.json"), JSON.stringify(payload));
console.log(`Wrote ${outDir}/search-embeddings.json (${dims} dims)`);
