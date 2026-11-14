// Site search: keyword scoring blended with semantic (embedding) ranking.
//
// Keyword results show instantly. The sentence model loads in the background
// the first time the dialog opens, then results re-rank with it. If the model
// cannot load (offline, blocked CDN), keyword results stay and the status line
// says so. MODEL and DTYPE must match scripts/build-embeddings.mjs.

const TRANSFORMERS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2";
const MODEL = "Xenova/all-MiniLM-L6-v2";
const DTYPE = "q8";
const MAX_RESULTS = 5;
const SEMANTIC_MIN = 0.2; // below this cosine, a semantic match is noise
const KEYWORD_WEIGHT = 0.3;

const SECTION_LABELS = {
  blog: "Blog",
  projects: "Project",
  freelance: "Client work",
  publications: "Paper",
};

const dialog = document.getElementById("site-search");
if (dialog && dialog.showModal) init();

function init() {
  const input = dialog.querySelector(".search-input");
  const list = dialog.querySelector(".search-results");
  const status = dialog.querySelector(".search-status");

  let pages = null;
  let chunks = null; // [{ page, vec: Int8Array }]
  let embedder = null;
  let modelState = "idle"; // idle | loading | ready | failed
  let dataPromise = null;
  let seq = 0; // guards against out-of-order async results

  function open() {
    if (!dialog.open) dialog.showModal();
    input.focus();
    input.select();
    loadData();
    loadModel();
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href="#search"]');
    if (!link) return;
    event.preventDefault();
    open();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = (event.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || event.target.isContentEditable) return;
    event.preventDefault();
    open();
  });

  // Clicking the backdrop closes the dialog.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  let timer = 0;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(run, 120);
  });

  function loadData() {
    if (dataPromise) return dataPromise;
    dataPromise = Promise.all([
      fetch("/search-index.json").then((r) => r.json()),
      fetch("/search-embeddings.json")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([index, emb]) => {
      pages = index.map((p) => ({
        ...p,
        _title: p.title.toLowerCase(),
        _tags: (p.tags || []).join(" ").toLowerCase(),
        _summary: (p.summary || "").toLowerCase(),
        _content: (p.content || "").toLowerCase(),
      }));
      if (emb && emb.model === MODEL && emb.dtype === DTYPE) {
        chunks = emb.chunks.map((c) => ({ page: c.page, vec: decode(c.v) }));
      }
      run();
    });
    return dataPromise;
  }

  async function loadModel() {
    if (modelState !== "idle") return;
    modelState = "loading";
    setStatus();
    try {
      const { pipeline, env } = await import(TRANSFORMERS_URL);
      env.allowLocalModels = false;
      embedder = await pipeline("feature-extraction", MODEL, { dtype: DTYPE });
      modelState = "ready";
    } catch (err) {
      console.warn("Semantic search model failed to load", err);
      modelState = "failed";
    }
    setStatus();
    run();
  }

  function setStatus(text) {
    if (text !== undefined) {
      status.textContent = text;
      return;
    }
    if (modelState === "loading") status.textContent = "Loading smarter search…";
    else if (modelState === "failed") status.textContent = "Keyword results only";
    else status.textContent = "";
  }

  async function run() {
    const query = input.value.trim();
    const mine = ++seq;
    if (!pages) return;
    if (!query) {
      render([], "");
      setStatus();
      return;
    }

    const lexical = keywordScores(query);
    let semantic = null;
    if (embedder && chunks) {
      try {
        const out = await embedder(query, { pooling: "mean", normalize: true });
        if (mine !== seq) return;
        semantic = semanticScores(out.data);
      } catch (err) {
        console.warn("Query embedding failed", err);
      }
    }
    if (mine !== seq) return;

    const ranked = pages
      .map((page, i) => {
        const lex = lexical[i];
        const sem = semantic ? semantic[i] : 0;
        const semScore = sem >= SEMANTIC_MIN ? sem : 0;
        return { page, score: semScore + KEYWORD_WEIGHT * lex, lex, sem };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS);

    render(ranked, query);
    if (modelState === "ready") setStatus();
  }

  // Keyword score per page, normalised so the best page scores 1.
  function keywordScores(query) {
    const terms = query
      .toLowerCase()
      .split(/[^a-z0-9+#.]+/)
      .filter((t) => t.length > 1);
    const raw = pages.map((p) => {
      let score = 0;
      for (const term of terms) {
        if (p._title.includes(term)) score += 3;
        if (p._tags.includes(term)) score += 2;
        if (p._summary.includes(term)) score += 1.5;
        const hits = countOccurrences(p._content, term, 20);
        if (hits) score += 0.5 + Math.log2(1 + hits) * 0.5;
      }
      return score;
    });
    const max = Math.max(...raw, 0);
    return max ? raw.map((s) => s / max) : raw;
  }

  // Best cosine per page across its chunks (vectors are unit length).
  function semanticScores(q) {
    const best = new Array(pages.length).fill(0);
    for (const c of chunks) {
      let dot = 0;
      for (let i = 0; i < q.length; i++) dot += q[i] * c.vec[i];
      if (dot > best[c.page]) best[c.page] = dot;
    }
    return best;
  }

  function render(results, query) {
    list.replaceChildren();
    if (!query) return;
    if (!results.length) {
      const li = document.createElement("li");
      li.className = "search-empty";
      li.textContent = "No matches.";
      list.append(li);
      return;
    }
    for (const { page } of results) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = page.url;
      a.className = "search-hit";

      const title = document.createElement("span");
      title.className = "search-hit-title";
      title.textContent = page.title;

      const meta = document.createElement("span");
      meta.className = "search-hit-meta";
      meta.textContent = SECTION_LABELS[page.section] || page.section;

      const snippet = document.createElement("span");
      snippet.className = "search-hit-snippet";
      snippet.textContent = snippetFor(page, query);

      a.append(title, meta, snippet);
      li.append(a);
      list.append(li);
    }
  }

  function snippetFor(page, query) {
    const terms = query
      .toLowerCase()
      .split(/[^a-z0-9+#.]+/)
      .filter((t) => t.length > 1);
    const sentences = (page.content || "").split(/(?<=[.!?])\s+/);
    for (const s of sentences) {
      const lower = s.toLowerCase();
      if (s.length > 20 && terms.some((t) => lower.includes(t))) return clip(s, 160);
    }
    return clip(page.summary || sentences[0] || "", 160);
  }
}

function clip(text, n) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
}

function countOccurrences(haystack, needle, cap) {
  let count = 0;
  let from = 0;
  while (count < cap) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) break;
    count++;
    from = at + needle.length;
  }
  return count;
}

function decode(base64) {
  const bin = atob(base64);
  const out = new Float32Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    const byte = bin.charCodeAt(i);
    out[i] = (byte > 127 ? byte - 256 : byte) / 127;
  }
  return out;
}
