# Writing suggestions: RAG project → resume + dhecloud.xyz

A digest of the obsidian wiki, organized into (1) resume bullet options, (2) a ranked menu of blog-post angles, and (3) starter drafts for the three strongest posts. Pick what fits, ignore what doesn't.

**On masking.** This project is internal. The version below scrubs absolutes that would identify the system (corpus size, accuracy %, label distributions, domain-specific personas) and keeps technique-level results that any reader could reproduce on a public model (latency in ms/token, relative speedups, ROUGE deltas between two training runs, methodology ratios). If you want even less, the easiest next pass is to drop *all* numbers and lean on "substantial," "double-digit-point," "order-of-magnitude" framing. If you want more, you can selectively put back the specific numbers you're comfortable disclosing.

Phrases I've used in place of specifics:
- "timestamped event logs" / "domain-specific corpus" — instead of naming the dataset
- "double-digit accuracy gains" — instead of `X% → Y%`
- "the dominant failure stage" — instead of `51% of failures`
- Relative ratios (`~10×`, `~13×`, `~2×`) — kept verbatim, because they describe technique impact, not the business

---

## 1. Resume bullets

Three tiers — pick one set or mix. Numbers retained are technique-level (reproducible by a reader on a public model); business numbers are scrubbed.

### Tier A — short, high-signal (good for a "Projects" section)

- **Domain-specific RAG system over timestamped event logs** — built an end-to-end retrieval-augmented assistant with intent-routed retrieval, hybrid BM25 + fine-tuned BGE embeddings, cross-encoder reranking, and pre-computed digests for broad multi-day queries.
- **Five specialized LoRAs on Qwen3.5-2B** — query rewriting, response generation (event + counting), dedup summarization, and turn summarization. A unified multi-task r=32 LoRA showed positive cross-task transfer, beating per-task baselines on the response heads.
- **ONNX export with KV cache + IOBinding** — ~13× decode-speed improvement over a no-cache implementation; ~2× faster than a PyTorch + PEFT reference on the same hardware. Enables on-device NPU deployment with hot-swappable LoRA adapters from a single base graph.
- **Custom stage-attribution evaluation** — DeepSeek-based judge that traces each pipeline failure to its earliest broken stage; cost-efficient via prompt caching (cents per run); surfaced an order-of-magnitude gap between in-distribution and out-of-distribution multi-turn performance.

### Tier B — fuller bullets (good if the project is the centerpiece)

- Designed and built a temporal RAG pipeline over a domain-specific timestamped log corpus with **intent-routed retrieval** (`semantic_search`/`counting`/`full_recall`/`out_of_scope`), bundling intent + time + rewrite into a single structured LoRA call to eliminate redundant classifiers. Drove double-digit-point gains on both in-distribution and out-of-distribution multi-turn evaluation.
- Trained five LoRA adapters (r=8–32) for distinct pipeline tasks; designed and shipped a **unified multi-task LoRA** that recovered or beat per-task baselines on three of five tasks (+5.4 pp ROUGE-L on event response, +2.1 pp on counting) while keeping intent macro-F1 above 0.99. Ruled out pure prompt tuning via direct ablation (large regression on the slot-rewrite head, consistent with published scaling curves).
- Exported a Qwen3-0.6B base + LoRA-as-input ONNX graph with on-device KV cache via ONNX Runtime IOBinding; reached **~15 ms/token** on commodity hardware, a ~13× improvement over the naive feed-dict path, enabling NPU deployment of multiple hot-swappable adapters from a single base graph.
- Built a stage-attribution evaluation harness on top of RAGAS 0.4.x + custom IR metrics; LLM judge reconstructs the conversation, attributes each failure to its earliest broken stage (rewrite/time/intent/retrieve/filter/respond), and exploits prompt caching to drive judge cost to cents per 250-turn run. Diagnosed rewrite as the dominant failure stage and surfaced an order-of-magnitude IID → OOD performance cliff that drove an OOD data-generation pass.

### Tier C — one-liner (top of resume / LinkedIn headline / portfolio site)

> Built a production-quality domain-specific RAG pipeline — five specialized LoRA adapters, intent-routed retrieval, on-device ONNX deployment with KV cache + IOBinding, and a stage-attribution evaluation harness that traces every failure to a single broken stage.

---

## 2. Blog-post angle menu (ranked)

Each one is a self-contained essay. Pick the ones you actually want to write — these are pitches, not commitments. None of these require disclosing internal data; the techniques transfer to any RAG system.

1. **"One LoRA call, three jobs: bundling intent, time and query rewrite into a single structured output."** Why I stopped running separate classifiers, how the slot schema works, what the guardrails catch that the model can't, before/after framing using a synthetic public-data example. Universal RAG-builder appeal.
2. **"How I got ~15 ms/token from a LoRA on ONNX Runtime."** The two-implementation arc (iterative deltas → LoRA-as-inputs single graph), the KV cache + IOBinding speedup, the two non-obvious lifetime/binding pitfalls. Strongest technical-depth signal — and entirely demonstrable on a public Qwen base.
3. **"My in-distribution eval was an order of magnitude overestimate."** The IID → OOD cliff in multi-turn accuracy, why it happened, the OOD generator I built, and what "rambling + self-correction + weak referent" actually looks like as synthesized data. Methodology piece — these tend to get shared.
4. **"Unified multi-task LoRA: when joint training helps and when it tanks."** The +5.4 pp surprise on event generation, the small regression on slot rewriter, the failed alternatives (pure prompt tuning, hybrid LoRA + soft prompts). Includes negative results, which is rare and valuable.
5. **"Pre-computing daily digests so the LLM never sees the broad query."** Tiered offline summarization, deterministic markdown render, follow-up turns cached. The "broad question → small context" trick.
6. **"Stage-attribution judges: don't grade your RAG as one black box."** Why per-stage attribution beats end-to-end scoring, what the judge prompt looks like, the kind of pathological failures it catches. Pairs naturally with #3.
7. **"Why I won't grade my filter on F1."** Recall-dominant evaluation, the surprising fraction of false negatives that were labeler errors, the iterative ground-truth cleaning loop. Short and opinionated.
8. **"Risk-gated semantic dedup."** Why clustering logs with shared vocabulary breaks naive dedup, the strict-vs-loose threshold gating, mirroring it in training data to keep train/inference distributions aligned.

**Recommended ship order**: #1 (broadest), then #2 (deepest), then #4 (most counter-intuitive). Save #3 + #6 as a methodology pair, and #5/#7/#8 as short companion posts.

### Round 2 — more angles (insight-first, not topic-first)

These were added on a second pass through the wiki, looking for the *surprising thing learned* rather than just "topics I worked on." None require disclosing internal data.

**Strongest — write these first**

9. **"Don't make the LLM do math (the placeholder-and-fill pattern)."** Your counting head emits a literal `{sum}` token; the pipeline fills it in from doc metadata before the user sees the response. The same pattern shows up four other places in your project (time resolution, citation injection, time-phrase restoration, metadata footnote). Frame it as a *design pattern*: anything the pipeline can compute from authoritative data, the model should emit as a slot, not a value. Full draft below as Draft D.

10. **"Your eval was the bug."** The per-conversation reference-date story — a class of "model failures" were actually the eval harness anchoring every conversation to a single date when the dataset spanned two years. Pair it with the stat that ~60% of false-negative filter labels were labeler errors. Lesson: *before you retrain, ask whether the eval set is the load-bearing piece.* Reverse-direction debugging.

11. **"30 lines of Python beats another retraining round."** You have at least four places in the project where a deterministic guard beat retraining: time-phrase restoration in the slot rewriter, whitespace normalization at the prompt boundary, the metadata-footnote regex, citation-fallback Jaccard. Opinionated piece: *stop fine-tuning your way out of problems that are 30 lines of code.* Short, sharp, very shareable.

12. **"ROUGE went up. Rejection silently broke."** The v7 response-LoRA story: +4 pp ROUGE-L but rejection rate quietly fell from 100% to 97.6%. You only caught it because you'd picked rejection agreement (not loss, not ROUGE) as the checkpoint selector. Lesson: *every aggregated metric hides at least one failure mode.*

**Strong — write if you want depth**

13. **"Train your model on the input distribution it'll see at inference."** The unifying theme across half your project. Dedup runs at training-data-generation time. Turnsum doesn't run on digest outputs because that's an OOD input regime. Counting LoRA assumes the upstream filter caught all off-topic queries. Could be the meta-post for the whole series.

14. **"Calibrated yes/no from a teacher LLM via logprobs at T=1."** Your CSAT trick — at temperature 1.0, ask the judge a yes/no, pull top-20 logprobs, pool variants of "yes" / "no" for a soft P(yes). At T=0 the alternatives collapse to the `-9999` floor and calibration dies. Niche but punchy for eval/judging readers.

15. **"The deployment constraint that flowed backwards into my training decisions."** Hot-swap LoRA in ONNX bakes rank into the graph topology, so every sibling adapter has to share rank. That meant adapters that didn't need r=16 came up to r=16 anyway. Lesson: *deployment topology is a training constraint.*

16. **"Synthetic OOD data shouldn't work, but it did."** Conventional wisdom says synthesized data is worse than real data. Your OOD generator (rambling, self-correction, weak referents, surface noise) was 100% synthetic and it closed a double-digit IID→OOD gap. Reframe: *think of synthetic data as a fuzzer, not a sampler.*

**Quick companion posts**

17. **"Defensive RAG: never return nothing."** Your time resolver always returns a window — a 3-day fallback if nothing parses. Bad retrieval beats no retrieval. Short principle piece.

18. **"Curriculum learning for multi-turn rewriters."** 2-turn → 3-turn → 4-turn. Compounding-error story. One illustrative chart.

19. **"Prompt tuning still doesn't work below 11B (I have the numbers)."** You replicated Lester et al.'s scaling curve with a large regression on your slot rewriter at 1.7B. Most readers know prompt tuning is weak at small scale; very few have seen it confirmed on a real production task.

20. **"Broad queries shouldn't reach the LLM at all."** The pre-computed digest cache. Contrarian framing: *not every question is a retrieval question; some are aggregation queries that LLMs hallucinate on and that templates serve perfectly.* The "RAG is not the only tool" essay.

---

## 3. Starter drafts

Three drafts below. They're frames, not finished posts — written so you can stretch or compress each section. Drafts use placeholder framing for examples; you can either keep the abstract framing or substitute a small synthetic dataset to show the technique.

---

### Draft A — "One LoRA call, three jobs"

**Working title:** *One LoRA call, three jobs: how I collapsed intent, time and query rewriting into one structured output*

**Hook:**

Most RAG pipelines I've seen have a stack of upstream classifiers: one for intent, one to extract time phrases, one to rewrite the query for retrieval. Each is a separate model call, a separate failure mode, and a separate dataset to maintain. On a domain-specific assistant I've been building, I ended up doing all three in one structured LoRA call — and multi-turn rewrite accuracy on out-of-distribution queries jumped by double-digit points. Here's how it works and why I think it's the right default for small-model RAG.

**Section 1 — what the pipeline used to look like.**
- Three sequential calls: intent classifier → time-phrase extractor → rewrite model.
- Each one had its own training data and its own quirks.
- Latency was fine; *correctness* wasn't — errors at the intent stage poisoned the rewrite, errors in the rewrite stripped the time phrase, and we'd retrieve over the wrong window with high confidence.

**Section 2 — the slot schema.**
- One LoRA on Qwen3.5-2B emits a JSON object with four slots: `{intent, time, rendered_query, metadata}`.
- `intent ∈ {semantic_search, counting, full_recall, out_of_scope}`.
- The model is trained to never drop the time phrase from `rendered_query` (and there's a guardrail below that restores it if it does).
- Multi-turn coreference is handled by feeding the previous `rendered_query` and `time` into the prompt — no chat history blob, just the structured prior turn.
- Show the schema, show one example input/output (a synthetic one is fine).

**Section 3 — the guardrails.**
- Whitespace normalization at the prompt boundary (one of the cheapest wins; OOD-shaped queries break tokenization on leading/trailing spaces).
- Input-abuse gate: hard caps on length + a repetition detector before the model ever runs.
- Time-phrase restoration: if `rendered_query` is missing a time phrase that appeared in the user input, splice it back in.
- The point: *retraining on noise-infused examples is slower than a deterministic fix.* I trained the model to do the language work, then I wrote 30 lines of Python to handle the cases the model was never going to handle reliably.

**Section 4 — the curriculum.**
- ~30K teacher-synthesized multi-turn examples, with a curriculum: 2-turn → 3-turn → 4-turn.
- Iterations added self-correction + rambling repair, then pronoun resolution + subject-override cases.
- The augmentation targets came from a per-category failure inventory on the previous run — not vibes.

**Section 5 — the numbers (qualitative version).**
- In-distribution multi-turn rendered-query accuracy: double-digit-point improvement.
- OOD multi-turn rendered-query accuracy: double-digit-point improvement, ending *higher* than IID (more on that in a separate post).
- Intent macro-F1: 0.99+.
- One model. One call. One failure mode to debug.

**Section 6 — when this would be a bad idea.**
- If your intent space is huge (say, hundreds of routing labels), the LoRA can't memorize the schema.
- If your tasks have wildly different output lengths/styles, the joint-training rate tax can be bigger than the savings.
- If you can't afford to retrain when you add a slot — separate models are easier to evolve independently.

**Section 7 — close.**
- The lesson I'd quote at someone over coffee: *if a single structured output covers it, don't run three classifiers.* It's not just cheaper at inference. It collapses three failure modes into one debuggable surface.

---

### Draft B — "How I got ~15 ms/token from a LoRA on ONNX Runtime"

**Working title:** *Two ways to export a LoRA to ONNX (one of them is ~13× faster)*

**Hook:**

I wanted to run a 0.6B Qwen + LoRA adapter on-device, which meant ONNX. The naive export gave me ~100 ms/token, which is too slow to feel interactive. After two rewrites and a hard look at how ONNX Runtime moves tensors around, I got it to ~15 ms/token. The two big levers were keeping LoRA weights as graph *inputs* instead of two separate ONNX files, and binding the KV cache to on-device buffers with IOBinding so they stop crossing the host boundary every step. Here are both, with the pitfalls I hit.

(This whole post is reproducible on any public Qwen + LoRA — feel free to swap in your own task.)

**Section 1 — the setup.**
- Base: Qwen3-0.6B. Adapter: r=16 LoRA on attention + MLP projections.
- Goal: single decode loop, no PyTorch at inference, KV cache on-device.
- Constraint: the base graph should be reusable across LoRA tasks (hot-swap the adapter, not the base).

**Section 2 — Implementation 1: two ONNX files.**
- Idea: base graph exposes 196 hidden-state outputs (one per LoRA target) and 196 delta inputs. A second LoRA graph takes hidden states, returns deltas.
- Inference loop: iterate `deltas_{k+1} = LoRA(harvest(base(x; deltas_k)))` until argmax stabilizes.
- Numerical agreement vs PyTorch: `max|Δ| ≈ 3e-4` — fine.
- Latency: 3–12 ORT calls per token, ~100 ms/token. Too slow.
- Diagnosis: per-step host-device transit, every iteration, for both base and adapter.

**Section 3 — Implementation 2: single graph, LoRA weights as inputs.**
- Base graph contains the math `y = Wx + (xA)B`, but `A` and `B` are graph inputs, not initializers.
- One ORT session. One call per token. Hot-swap is just rebinding two tensors.
- Numerical agreement: `max|Δ| ≈ 7e-4`.
- *But* — without KV cache, still ~200 ms/token, because past K/V tensors are now a feed-dict that crosses host↔device on every step.

**Section 4 — KV cache + IOBinding (the real win).**
- IOBinding lets you tell ORT *"this input/output lives at this device buffer; don't copy it for me."*
- I pre-allocate caller-owned device buffers for `past_key`/`past_value` per layer and rebind them as outputs each step.
- Decode latency drops to ~15 ms/token. That's the ~13× number in the headline.

**Section 5 — two pitfalls that cost me a day each.**
1. **OrtValue lifetime is tied to the IO binding.** If you create an OrtValue from a torch tensor whose storage goes out of scope, the binding silently reads garbage. Use `ortvalue_from_shape_and_type()` for caller-owned buffers; do *not* try to reuse a torch tensor across calls.
2. **Rebinding the same `io_binding` corrupts C-string pointers.** I tried to keep one binding object and re-bind tensors each step. Symptom: tensors are bound to names like `pa` and `pas` (truncated). Fix: allocate a fresh `io_binding` per decode step. Cheap.

**Section 6 — the numbers, on paper.**
- Implementation 1 (iterative deltas): ~100 ms/token.
- Implementation 2 (single graph, no cache): ~200 ms/token (worse, because of the per-step KV transit).
- Implementation 2 + KV cache + IOBinding: ~15 ms/token.
- PyTorch + PEFT reference, same model and hardware: ~30 ms/token. So this is ~2× faster than the PyTorch baseline.

**Section 7 — what this unlocks.**
- Multiple LoRA adapters share one base graph; each adapter binary is just two matrices per layer.
- On an NPU target, this collapses "N separate 1.5B models" down to "one 1.5B + N tiny adapters."
- The same trick applies to any compile-once-then-run-many deployment story.

**Section 8 — close.**
- ONNX Runtime is a tensor scheduler. The fast path is the one where tensors don't move. Everything else — graph topology, where the LoRA math lives — is downstream of "stop copying."

---

### Draft C — "My in-distribution eval was an order of magnitude overestimate"

**Working title:** *The IID-to-OOD gap: when your in-distribution eval is lying to you*

**Hook:**

For a few weeks I thought my RAG pipeline was answering multi-turn conversations at a respectable hit rate. Then I built an out-of-distribution test set and the number dropped by roughly an order of magnitude. On a system I would have happily shipped. Here's how I built the OOD generator that surfaced it, what the structural noise actually looked like, and why I now distrust any eval that doesn't synthesize its own ugly inputs.

**Section 1 — what "in-distribution" was buying me.**
- Eval queries were sampled from the query-rewriter's own validation splits.
- Clean, canonical phrasing. One topic per turn. No filler. No self-correction.
- Multi-turn accuracy looked respectable. I assumed that was bad but representative.

**Section 2 — what a real user actually types.**
- Rambling: two-clause queries that change subject mid-sentence.
- Self-correction: "the package — no, the car — yesterday afternoon, around three."
- Weak referents: "did it happen again."
- Surface noise stacked on top: typos, abbreviations, broken punctuation.
- I wrote 20 of these by hand and the assistant fell over on most of them. That was the moment I stopped trusting the IID number.

**Section 3 — the OOD generator.**
- A teacher-LLM prompt that takes a clean query and applies one or more transformations: rambling, self-correction, conjoined topics, weak referents.
- A second pass layers surface noise (typos, abbreviations, missing punctuation).
- Multi-turn conversations stitched together with deliberate referent decay across turns.
- The point isn't realism — it's *adversarial coverage*. If you can't handle the synthesized version, you definitely can't handle the real one.

**Section 4 — the numbers (in ratios).**
- Multi-turn accuracy on the OOD set was roughly **an order of magnitude worse** than on the IID set.
- After OOD-targeted retraining of the slot rewriter, both numbers climbed, and OOD ended up *higher* than IID — a hint that the headroom wasn't where I'd assumed.
- One detail worth flagging: the IID set was anchored on a single reference date, which masked a class of time-resolver bugs that only surface when each conversation has its own anchor. A per-conversation anchor override recovered another batch of "failures" that were actually eval-harness bugs.

**Section 5 — the stage-attribution judge.**
- End-to-end accuracy alone can't diagnose a multi-stage pipeline.
- A teacher-LLM judge reconstructs the conversation, walks the stages (rewrite, time, intent, retrieve, filter, respond), and emits `{stage, ok, reason}` plus `primary_failure_stage`.
- Result: the *rewrite* stage owned the majority of failures. That's where I spent the next month.
- Cost: cents per multi-hundred-turn run, with aggressive prompt caching. There is no excuse for not running this.

**Section 6 — the rule I'd put on a poster.**
- *If your eval set was generated by the same distribution that trained your model, your eval is measuring whether the model overfit, not whether it works.*
- Synthesize noise. Look at the failures. Bucket them. Generate training data targeted at the buckets. Repeat.

**Section 7 — close.**
- The IID/OOD gap is the post. Everything else in the system — the LoRAs, the retrieval, the digest cache — would have looked fine on the IID number and quietly broken in production. The eval was the load-bearing piece.

---

### Draft D — "Don't make the LLM do math (the placeholder-and-fill pattern)"

*Closer to a first-pass draft than A/B/C, since the wiki had enough material. Edit the voice to yours, but the structure and examples should hold.*

**Working title:** *Don't make the LLM do math: a placeholder pattern for production RAG*

**Hook**

A lot of production RAG bugs share a shape. The model emits a number, and the number is wrong. It emits a date, and the date is hallucinated. It cites a document that doesn't appear in its context. The standard fix is "retrain" or "tighten the prompt." There's a cheaper one I keep reaching for: don't let the model emit the value at all. Have it emit a placeholder. Fill the placeholder in afterwards, deterministically, from data you control.

I used this pattern five times in the last RAG system I built. Every instance was something I'd tried to teach the model first, struggled with for structural reasons, and then trivially fixed by moving the responsibility out of the model and into the pipeline. This post is the pattern, the examples, and what I'd warn you about.

**The pattern, in one sentence**

> *For any value the pipeline can compute from authoritative data, the model should emit a slot — not a literal — and the pipeline should fill the slot before the user sees the response.*

That's it. Everything below is examples and edge cases.

---

**Example 1 — Counting (`{sum}`)**

My response model has a counting head. Its job is to emit sentences like:

> "Person in the driveway in `{sum}` captures `[1][2][3]`."

That `{sum}` is a literal — three characters, curly braces and all — that the pipeline replaces with a real count read from document metadata before streaming the response to the user. The model never sees a number. It doesn't add. It doesn't approximate. It learns a shape, and the shape always has a placeholder where a count would go.

Earlier versions of this head were trained to emit the integer directly. With format-free prompts, compliance hovered around 32%. With a small stratified training set and a strict format, format compliance went to 100% — but only because the model was no longer being asked to do arithmetic. It was being asked to emit a token. Tokens it can do. Counting retrieved documents it cannot, at least not at 2B scale.

The unlock was realising counting isn't a reasoning problem in this pipeline. It's a *formatting* problem with the number bolted on. Once you split the two, the formatting half collapses to a tiny problem with high reliability, and the counting half is one line of Python that walks `len(docs)` (or sums an `occurrence_count` field, depending on what "count" means).

The cost of this trick was an afternoon to wire up `_resolve_sum()` in the generator. The benefit is that the count is now provably correct, because nothing in the path can corrupt it.

**Example 2 — Time resolution (deterministic parser, with a guaranteed fallback)**

The slot rewriter normalises dates into a canonical form (`"Mon 07-Apr-2026"`), and then a separate, *rule-based* parser reads that normalised query and turns time phrases into a `(start, end)` tuple for retrieval. The parser handles around a hundred patterns — absolute dates, relative phrases, calendar periods, time-of-day modifiers, ranges. It runs in microseconds.

The model could do this. I trained a LoRA to do this. It works. It is also slower, occasionally hallucinates years that don't exist in the corpus, and produces conflicting outputs when the query has multiple time references. The rules engine doesn't have those problems. So in production, the LoRA is an opt-in fallback for novel phrasings, and the deterministic parser owns the common path.

The placeholder-style move here is the *no-parse fallback*. When the parser can't make sense of the time phrase, it doesn't return `None` — returning `None` would silently un-scope the retrieval and run it over the entire corpus. It returns `[ref − 3 days, ref]`. A wide-but-defensive window. Always *something.*

This is the placeholder pattern applied to a failure mode rather than a value: when the system can't compute the right answer, it produces a clearly-bounded conservative answer, never an absence.

**Example 3 — Citations (Jaccard injection when the model forgets)**

The response model is supposed to end every sentence with `[N][N]…` citation markers. Most of the time it does. Some of the time — typically on smaller bases under many-doc, multi-turn prompts — it doesn't. The compliance ceiling isn't a LoRA-rank problem; it's the base model's instruction-following limit, and you can grind out a tenth of a percent with more training but no more.

So the pipeline has a fallback. After generation, if zero citation markers were emitted, a tiny post-processor scores each sentence against each retrieved doc using token-Jaccard overlap (alphanumeric tokens, length > 2, small stop-list removed), and appends the best-matching doc's index in canonical `[N]` form. It caps at two cites per sentence, applies a 0.6× drop-off filter to avoid noisy double-citing, and falls back to `[1]` if no doc clears a 0.10 overlap threshold (because the *format* still has to be valid downstream).

Two design notes. First, the UI surfaces when the fallback fires — there's an explicit "citations injected by fallback" caption. The pipeline is allowed to fix the format, but the user is told. Second, the function is a no-op if any citation is already present. It's a salvage path, not a normaliser; it only runs when the model failed.

The pattern is the same: the format invariant (`every sentence ends in [N]`) is enforced by the pipeline, not the model. The model is responsible for *content*. The shape is the pipeline's problem.

**Example 4 — Time-phrase restoration (guardrail on the rewriter)**

The slot rewriter occasionally drops a time phrase that was present in the user's original query. Its own prompt forbids this, and the training data discourages it, but the base model's prior overrides the prompt under certain conjunctions ("how many times last week, around 25 August" — model picks one and discards the other). When that happens, the downstream time resolver receives a query with no temporal anchor and you retrieve over the wrong window with high confidence.

The fix is a guardrail that runs post-rewrite: detect any time-phrase regex hits in the *original* query that don't appear in the *rewritten* query, and splice them back in. There's a "guardrail lift rate" metric to track how often it fires, partly to monitor LoRA regression and partly to flag when the augmentation budget should be spent.

This is the same pattern in yet another form. The model owns the language work; the pipeline owns the invariant ("time phrases from the user's query should survive into the rewrite"). When the model breaks the invariant, the pipeline repairs it.

**Example 5 — Metadata footnotes (post-processor)**

The lightest of the five. The response model occasionally needs to emit a tail like:

> *Timestamps: 2026-04-07 14:31, 14:42. Risk levels: L3, L4.*

You can train this. We did, briefly. It was unreliable in the way you'd expect: occasional missing fields, occasional made-up timestamps, occasional duplication. So we shipped a regex post-processor that builds the footnote from the cited docs' metadata, rather than waiting for the next training run.

This one barely needs a defence. It's just *data assembly*, and data assembly belongs in code.

---

**Why this works**

Three reasons.

**Separation of concerns.** Small LLMs are good at shape and tone. They are bad at arithmetic, deterministic lookup, and format invariants under cognitive load. Splitting the response into "shape (model)" and "values (pipeline)" puts each capability in the place where it's strong. The model writes fluent sentences with placeholders; the pipeline guarantees the placeholders resolve to the truth.

**Cost.** Each of the five examples above was the *result* of trying to teach the model to do it itself. Each took at least a week of training-data iteration and ablation. The placeholder version, in every case, took an afternoon. You give up some local elegance — "look, the model can write a complete answer on its own!" — in exchange for a global guarantee.

**Auditability.** When the count is wrong, you know which function produced it. There's a stack trace. There's a unit test. The model could have written the same sentence and produced the same wrong number, and you'd be looking at training curves and prompt diffs for a week.

---

**When this is a bad idea**

It isn't free. Three places I'd be careful.

**When the placeholder's value depends on synthesis the model is doing in parallel.** Counting is easy because the count doesn't change based on how the model decides to phrase the sentence. But if your placeholder is, say, the *grammatical number* of a noun ("there was one event" vs "there were three events"), now the pipeline and the model are coupled through grammar, and you'll be doing string surgery.

**When the model starts hallucinating the placeholder itself.** If `{sum}` shows up in the training data often enough, the model can start emitting it in contexts where you don't want it — bleeding the format into freeform text. You'll either need a guardrail to strip stray placeholders, or you accept some leakage and let the post-processor be defensive.

**When the deterministic fill is itself the hard problem.** If filling the placeholder requires solving the thing you were trying to avoid (e.g., the citation Jaccard injection still has to decide which doc is the most relevant for each sentence, and that's not trivial), you've just moved the bug, not killed it. The Jaccard fallback works well enough because it only runs when the model has *fully failed* to cite — it's a salvage path, not a primary one. If it ran on every sentence, it would be worse than the model.

---

**Close**

The first time this pattern earned its keep was on counting. I'd spent two weeks tuning training data and prompts to get the model to emit accurate integers, and every checkpoint had some pathology — off-by-ones, repeats, formatting drift. Switching to `{sum}` took an afternoon. Compliance hit 100%. The bug I'd been chasing vanished.

That's the trade. Some local elegance for a global guarantee. For anything user-visible — counts, dates, citations, metadata — take the guarantee.

The line I'd put on a poster: *the model owns the language; the pipeline owns the truth.* If a value belongs to the pipeline, don't let the model hold it.

---

### Draft E — "Your eval was the bug"

*~1700 words, developed prose. Three war stories + the rule.*

**Working title:** *Your eval was the bug: three times I retrained the wrong thing*

**Hook**

For most of my career I've defaulted to one assumption when a model is wrong: the model is wrong. The training data needs more examples. The hyperparameters need a sweep. The loss function isn't capturing what I care about. So you go fix it, re-run the eval, see if the number moved.

I've been running a RAG project for a few months where that assumption was wrong three times in a row. The model was fine. The eval was lying to me. Each time, I'd burned days on the wrong fix before I noticed. This post is the three war stories and the rule I now follow.

---

**War story #1 — the two-year anchor mismatch**

My eval set was a few hundred multi-turn conversations sampled across two years of historical data. Each conversation had its own *anchor* — its own "today" relative to which phrases like "yesterday" and "last week" should resolve. Roughly a hundred unique anchor dates in total.

The eval harness, sensibly, took a single `--reference-date` flag. Less sensibly, it applied that single date to every conversation, regardless of when the conversation was actually anchored in the dataset. So a conversation from twenty-two months ago, where the user asked "what happened yesterday," was being scored against a reference date set by the harness default — which meant the time resolver was being asked to find documents on a "yesterday" that was nearly two years from when the conversation actually happened.

The model was correct. The eval was telling me it was failing on a few dozen conversations, all of which had this exact failure mode. I spent three days assuming I'd introduced a regression in the time resolver — diffing branches, re-running on prior checkpoints, rebuilding the parser test suite. The git history shows me adding logging, removing logging, adding more aggressive logging, then finally printing the reference date that the parser was receiving on each turn.

Once the per-conversation reference-date override was in, those failures disappeared. The fix was a one-line change in the harness. The diagnosis was three days of looking at the wrong piece of the system.

---

**War story #2 — 60% of filter false negatives were labeler errors**

The relevance filter — a small classifier that decides whether a retrieved doc is on-topic enough to send to the response model — had what looked like a serious recall problem. On the held-out set, it was missing a meaningful fraction of docs that the ground truth marked as relevant.

I started building augmentation data. I sketched out a curriculum-style approach. I priced out a bigger base model. Before any of that landed, I ran a manual audit on a sample of the false negatives: open each one, read the doc, read the query, decide for myself whether the label was right.

Roughly 60% of the time, the *label* was wrong. The doc genuinely wasn't relevant. The model was correctly rejecting it; the harness was scoring the rejection as a failure.

I ran seven rounds of ground-truth cleaning over the following weeks. Each round: pull all the false negatives, audit a stratified sample, find the systematic labeler mistakes, fix them, re-run. The headline recall number climbed without me touching the model.

The retraining I'd been about to do would have *worsened* the filter. I'd have been teaching it to accept irrelevant docs to match a bad ground truth.

---

**War story #3 — the in-distribution eval that overstated by an order of magnitude**

This one I've drafted as a separate post, so the short version: my "respectable" multi-turn accuracy on the in-distribution eval set was an order of magnitude higher than the same model's accuracy on a deliberately-noisy OOD set. Same model. Same retrieval. Different inputs.

The IID set hadn't been wrong, exactly — it had been *trivial*. It was sampled from the same distribution that trained the rewriter, so it measured how well the rewriter had memorised its own training shape, not how well it handled the messy queries real users type. Building the OOD generator was the fix; the model was fine, the eval was the bottleneck.

---

**The rule**

After the third war I wrote the rule down. It's the poster on the wall.

> *Before you retrain anything, audit the eval. Run a stratified manual review of failures. Spot-check the ground truth. Look for harness bugs — date math, off-by-ones, default args, reference dates, anchor mismatches. "What's the eval bug?" before "what's the model bug?"*

This isn't a rule against retraining. It's a rule against retraining *first*. Each of the three wars cost me days because I went straight to the model when the cheaper, smaller, faster fix was somewhere in the harness or the labels.

---

**The tooling that makes this practical**

You can't audit an eval if you can't reconstruct individual failures. A few things made the audits cheap enough that I started doing them by reflex:

- **Stage-attribution judges.** A teacher LLM that walks each conversation through the pipeline and attributes the failure to its earliest broken stage (rewrite, time, intent, retrieve, filter, respond). When the attribution says "rewrite failed," you go look at the rewriter. When it says "time failed in 90% of cases on conversations from one specific quarter," you know you have an anchor problem.
- **Per-conversation replay logs.** Every failed eval row, given an ID, should be one command away from "show me everything that happened in this conversation, end to end." If it's a manual recipe to recover the trace, you won't bother.
- **Ground-truth cleaning as a first-class workflow.** Not "we'll get to it." A scheduled batch every time the eval set grows past some threshold, with a stratified-sample protocol so it's reproducible.

---

**When this rule doesn't apply**

Auditing is most useful when the failures are *categorical* — when you can look at one example and say "this is right or wrong, and here's why." It's much less useful when the failure is a statistical aggregate (perplexity, BLEU on a 50K test set), or when the eval is well-trodden and you're the nth person to use it. Don't audit MMLU. Do audit the eval you wrote last month.

There's also a kind of audit fatigue. After a few wins it's tempting to assume *everything* is an eval bug. It isn't. The point of the rule is to spend an hour up front before you commit to a week of retraining — not to convince yourself the model is never wrong.

---

**Close**

Three wins paid for the rule many times over. Three days of misdiagnosis on the anchor mismatch alone. A month of avoided retraining on the filter. A whole class of model improvements that would have been chasing phantom failures.

The cheap version of all of this: *before you train, look.* At the eval. At the labels. At the harness defaults. The bug is more often there than you'd think.

---

### Draft F — "30 lines of Python beats another retraining round"

*~1700 words, developed prose. Opinionated piece — sister post to Draft D, but framed as engineering judgment rather than design pattern.*

**Working title:** *30 lines of Python beats another retraining round*

**Hook**

There's a tax you pay every time you decide to fix a model problem by retraining the model. It's not just the GPU time. It's the days of data generation, the eval loop, the regression check on every other task the model also has to do well. The tax is so big that for a lot of bugs, the better answer is to leave the model alone and write a deterministic guard around it.

I'm going to claim this is more often true than people admit — and that we, collectively, train our way out of problems we should code our way out of, because retraining is the more impressive-sounding move.

---

**The objections**

> *"But that's a hack."*

Yes. It is a 30-line hack. Production systems run ten thousand of them. The Linux kernel is mostly 30-line hacks.

> *"But what if it doesn't generalise?"*

It doesn't have to. It has to handle this exact failure mode, and stop. Generalisation is the *model's* job. The guard's job is to backstop the specific failure mode the model has at the specific point in the pipeline where it has it.

> *"But we'll accumulate a pile of guards and lose track."*

Maybe. We'll also lose track of model versions, dataset revisions, prompt iterations, and adapter checkpoints. Engineering is the practice of keeping track of things. Add a docstring.

---

**Five guards from one project**

Here's what the alternative actually looks like in practice. Each of these was a real bug, with a real "retrain" path I considered, and a small fix that closed the bug in an afternoon.

**1. Whitespace normalisation at the prompt boundary.** A class of OOD-shaped queries — extra leading spaces, smart quotes, tab characters, copy-paste artefacts — were causing token-level shifts that the rewriter was sensitive to. The model would emit a slightly different rendered query, the time resolver would pick up the wrong span, retrieval would miss. The "proper" fix would have been to augment the training data with whitespace-perturbed examples. The actual fix was `re.sub(r"\s+", " ", query).strip()` at the prompt boundary. The bug disappeared. No retraining.

**2. Input-abuse pre-flight gate.** Some inputs were pathological: 8000-word rambles, repeating-character spam, queries that were a single emoji repeated 200 times. The rewriter would either crash, time out, or — worse — produce a "valid"-looking rewrite that sent retrieval somewhere weird. The "proper" fix would have been to train the rewriter to recognise and gracefully reject these. The actual fix was a length cap and a repetition detector that short-circuits to a canned "I can't process this query" response *before* the model runs. About 25 lines of Python. Catches everything.

**3. Time-phrase restoration on the rewriter output.** The rewriter occasionally drops a time phrase from the user's query during normalisation, in violation of its own training. Downstream, the time resolver sees a query with no temporal anchor and falls back to a wide window. The "proper" fix would have been more training examples emphasising time-phrase preservation. The actual fix was a post-processor that regex-matches time phrases in the original query, checks whether they survived the rewrite, and splices the missing ones back in. There's a *guardrail lift rate* metric tracking how often it fires, which doubles as a regression check for the next rewriter version.

**4. Citation injection fallback.** The response model is supposed to end every sentence with `[N][N]…` citation markers. Most of the time it does. Occasionally — on harder prompts and smaller bases — it skips them entirely. The "proper" fix would have been to train a bigger LoRA with more citation-heavy examples and grind compliance from 99.5% to 99.9%. The actual fix was a token-Jaccard injection pass that scores each sentence against each retrieved doc and appends the best match in canonical form. It only runs when the response emitted zero citations — it's a salvage path, not a normaliser. The UI explicitly labels when it fires so users know the citations are machine-injected.

**5. Broad-query bypass.** Multi-day "show me everything from last week" queries used to take thirty seconds through the LoRA, with non-trivial hallucination risk because the context was huge. The "proper" fix would have been to fine-tune a model that handles long-context summarisation better. The actual fix was to pre-compute daily digests offline and render them with a deterministic markdown template when the query asks for a broad range. The LoRA is never called. The latency dropped to milliseconds. The hallucination rate went to zero — because there's no language model in the path.

---

**The rule**

For each model failure I find, I ask one question:

> *Is the symptom local or systemic?*

**Local** means: a specific shape of input produces a specific shape of broken output, and you can describe the shape. Whitespace perturbations. Missing citations. Specific time phrases dropped. Pathological-length queries. These are guard candidates. The guard's contract is narrow and explicit; it can be unit-tested.

**Systemic** means: the model misunderstands the task in a way you can't enumerate. It picks the wrong intent across many different inputs. It hallucinates details consistent with its prior even when the context contradicts. It writes in the wrong register. These are retrain candidates, because no finite list of guards covers them.

My contention: most of what gets called systemic is actually local in disguise. We just don't notice, because retraining is the muscle we reach for. Three of the five guards above were originally on my "retrain" list before I sat down and described the failure mode precisely enough to see how narrow it was.

---

**When to retrain instead**

Three cases where the guard is the wrong tool:

- **The symptom is everywhere.** Every fifth query, not every twentieth. If your filter is making the same mistake across a wide swath of inputs, you don't have a guard problem; you have a model problem.
- **The guard would require domain logic the pipeline can't reasonably own.** Entity disambiguation. Multi-hop reasoning. Anything where the "right" deterministic answer requires you to rebuild the model's capability in code. Don't.
- **The guard has its own false-positive rate that exceeds the failure rate it's catching.** A whitespace normaliser that strips a leading space the user actually meant. A repetition detector that flags a legitimate "ha ha ha." If the guard makes the system worse on its own error modes than the model was on the original ones, kill the guard.

---

**The honest reckoning**

Guards accumulate. After a year you have 40 of them, and they need a test suite, and someone has to remember that they exist when debugging weird production behaviour. Some of them will become wrong when the model improves and you stop needing them.

This is fine. Pruning a 30-line guard is much cheaper than pruning a training-data dependency. Each guard is a single function, in a single file, with a single failure mode it claims to catch. They are *legible* in a way that "we augmented the training set with 3000 more examples of X" is not.

The pile is not the price you pay. The pile is the artefact. Each entry in the pile is a bug you caught cheaply.

---

**Close**

"Retrain" is the impressive answer. "Write a guard" is the boring one. Production rewards boring.

If you have a model bug today, before you queue the retrain job: write the symptom down in one sentence. Describe the input shape that causes it. Describe the output shape it produces. Now ask whether the gap between those two shapes is something you can close in 30 lines of code. Often, it is. The 30 lines run forever. The retraining job pays its tax every time you have to do it again.

---

### Draft G — "ROUGE went up. Rejection silently broke."

*~900 words. Shorter and punchier than D/E/F. Could land on Hacker News on its own.*

**Working title:** *ROUGE went up. Rejection silently broke. (A story about picking the wrong metric.)*

**Hook**

A few months ago I shipped a response-model checkpoint that was four points better on ROUGE-L. In the same release I shipped a silent regression in the model's ability to *refuse* to answer when it had no supporting evidence. I almost missed it. The thing that caught it wasn't ROUGE, wasn't training loss, wasn't a hand-curated test set — it was a one-line metric I'd added a few iterations earlier on a whim, because I didn't trust ROUGE to tell me the whole story.

This post is about why aggregated metrics lie, what it looks like when they do, and the cheap thing that saved me.

**The setup**

The response model in my RAG pipeline has two distinct jobs. When the retrieved context contains evidence for the user's question, it should answer fluently with citations. When the context is empty or irrelevant, it should *refuse* — say something like "I don't have any records of that."

These are different failure modes. Confident-but-wrong is a hallucination. Refusal-when-it-could-have-answered is unhelpful. They cost differently, they break differently, and they require different training signals.

ROUGE-L measures surface similarity between the generated response and the gold response, averaged across the eval set. It does not distinguish "the model gave a different but valid answer" from "the model gave a *hallucinated* answer when it should have refused." Both look the same to ROUGE: high lexical overlap on the cases where the model answered, plus some noise.

**The catch**

I bumped the training data for v7 — added some examples, rebalanced some categories. ROUGE-L moved from roughly 0.704 to roughly 0.748. Training loss curves looked healthy. I was ready to ship.

Then I checked the rejection-agreement metric. It's a one-liner: of the eval rows where the gold response was a refusal, what fraction of the model's responses were *also* refusals? On v6 the number was 100%. On v7 it was 97.6%.

Two-point-four percentage points sounds small. In context it isn't. The model had learned to *answer* a class of queries it should have refused. It was generating fluent, citation-styled responses for empty-context cases — and ROUGE was rewarding it for being verbose where it should have been silent. The headline number went up partly *because* the model was hallucinating in a ROUGE-friendly way.

**The diagnosis**

The v7 training set leaned harder on positive examples (cases where the model should answer). The negative examples (cases where the model should refuse) were proportionally diluted. Cross-entropy loss optimised for the positive case — the easier, higher-volume signal — and the refusal behaviour eroded.

This is the kind of regression that's only visible if you measure refusal as its own number. Loss won't show you. ROUGE won't show you. Even a hand-curated test set won't show you unless you've explicitly stratified it by failure mode and tracked each stratum separately.

**The lesson**

Every aggregated metric collapses some failure mode into a number. That metric will move in the wrong direction whenever the model trades a failure mode the metric *measures* for one it *doesn't*. ROUGE rewards surface similarity. Rejection agreement rewards epistemic humility. They are not the same metric, and they will not move together.

**The cheap thing**

For every task, write down the failure modes you care about — *separately*. Build a one-line metric for each. Use them as checkpoint selectors, not just as numbers you read off after training. If a checkpoint improves the primary metric but regresses any of the per-failure-mode metrics, reject it.

This sounds obvious. Most teams I've worked with don't do it. The default is to pick a single headline metric (loss, ROUGE, accuracy, F1) and let the others wander, which is fine right up until the day they wander far enough to break production.

**When this matters**

Any task with multiple failure modes that can't be collapsed into one number. RAG response generation is one (answer well *and* refuse well). Classification with abstention is one (correct *and* know-when-to-pass). Code generation with "I don't know" is one. Anything where *saying nothing* is sometimes the right output.

If your task has a "right answer" axis and an "abstain" axis, you have two failure modes. ROUGE measures the first. Build a one-liner for the second and run it on every checkpoint.

**Close**

The four-point ROUGE gain was real. It just came packaged with a regression I'd have shipped if I hadn't been measuring the other thing.

Pick the metrics for the failure modes. Not the other way around.

---

### Draft H — "Train your model on the input distribution it'll see at inference"

*~1800 words. The meta-post that ties the series together.*

**Working title:** *Train your model on the input distribution it'll see at inference*

**Hook**

There's a quiet assumption in most ML training: that the data you train on looks like the data you'll see at inference. Half the time it does. The other half — the half that breaks production — it doesn't, and the gap is invisible until something downstream goes wrong.

Most of my last RAG project, in retrospect, was iteratively closing this gap. Every component had an *implicit input distribution* it assumed at training time, and at inference the upstream pipeline produced something slightly different, and the model behaved badly in a way that wasn't visible from its own validation set. Once I started noticing the pattern, it was everywhere.

This post is the pattern, four places I hit it, and the rule I now follow.

---

**The pattern**

You train a component on data drawn from distribution **A**. At inference, the upstream pipeline produces data drawn from distribution **B**. A ≠ B in subtle ways — the upstream's outputs have idiosyncrasies the raw data didn't, or vice versa. Your model's validation set is drawn from A, so it looks fine. In production, it isn't.

The fix is uncomfortable: regenerate your training data so it matches what the upstream actually produces. Sometimes this means running the rest of the pipeline at training-data-generation time, even when that's expensive and even when the upstream is non-deterministic.

---

**Four places it bit me**

**1. Dedup-aware training data.** The production corpus runs every incoming log through a dedup pass before indexing — similar entries (same incident across multiple cameras, same activity over a few minutes) are clustered and only representatives kept. Dedup removes roughly two-thirds of the raw volume.

I trained the early response LoRA on a corpus sampled from the *raw* logs, before dedup. Validation looked fine. Production was off in ways I couldn't quite pin down — the model was over-confident on certain query shapes and under-confident on others.

The mismatch: at inference, the model saw fewer, more diverse documents per query because the corpus was deduped. At training, it had been overfitting to repeated incident descriptions, which made some categories look more frequent in its prior than they were in production.

The fix was unglamorous. Run the same dedup pass on the training-data-generation pipeline. Now the training data has the distribution the model will see at inference. The regressions disappeared without changing the model architecture or the prompt.

**2. Counting LoRA assumes the filter is upstream.** The response model has a counting head that handles questions like "how many times did X happen." Upstream of the response model, a relevance filter removes off-topic retrieved docs. If you ask "how many cars in the driveway last week," the filter rejects the "dog in the kitchen" docs before they ever reach the counting head.

The first version of the counting LoRA was trained on data that *included* off-topic docs and was taught to output "I can't answer this" when the docs were irrelevant. Sensible-sounding goal. Useless in practice. By the time the counting head runs in production, the filter has already removed the irrelevant docs. The counting LoRA never sees the input distribution it was trained to refuse on.

So I simplified the LoRA's training: filter-clean data only, refusal examples removed. The model got smaller, training got faster, accuracy on the cases it actually sees in production went up. The "rejection" capability wasn't useful — it was a capability for a distribution that didn't exist downstream, and worse, the rejection behaviour would occasionally fire on borderline inputs and look like a bug.

The lesson: don't teach a model to handle inputs the upstream won't give it.

**3. Turnsum gets a deterministic stub for broad-query digests.** The pipeline has a turn-summarisation LoRA: given a (user query, assistant response) pair, produce a one-or-two-sentence summary that goes into the next turn's prompt for coreference and context. Most assistant responses are narrative prose with citations. The LoRA was trained on those.

Some assistant responses aren't narrative. For broad-range queries ("everything from last week"), the system returns a markdown digest — a table of timestamps and event descriptions, no flowing prose. Structurally different from anything in the turnsum training set.

The first version sent the digest through the turnsum LoRA anyway. The summaries it produced were bad in a specific way: the LoRA tried to narrativise the digest ("the user asked about last week and the system reported that on Monday at 3pm…"), losing the structure, hallucinating connectives, occasionally inventing details that weren't in the digest at all. Because it had never been trained on inputs like this.

The fix was to skip the LoRA entirely for digest outputs. Generate the next-turn summary with a deterministic stub: `f"The user asked about {topic}. The system returned a digest of {N} events from {start} to {end}."` Cache it in Redis. Done.

The general lesson: if a component is about to receive an out-of-distribution input, don't run it on that input. Detect the case upstream and route around it. The model is allowed to have limits; the pipeline is allowed to know what they are.

**4. Cascade faithfulness in summarisation tiers.** The corpus has summarisation at multiple time scales — 6-hour digests, 24-hour digests, weekly digests. They cascade: the 24-hour summariser doesn't see raw logs at inference, it sees the 6-hour summariser's output. The weekly summariser sees the 24-hour output.

The naive training approach trains each tier on `(raw_logs, gold_summary)` pairs, because that's the data you have. The 24-hour tier's training is then on raw logs, but at inference it's looking at 6-hour summaries — which have artifacts the raw logs don't (lost timestamps, stitched-together event descriptions, repeated phrasings the 6-hour LoRA prefers).

The fix is to *cascade* the training data. Train the 24-hour summariser on `(6h_summaries, gold_24h_summary)` pairs, using the actual 6-hour LoRA's outputs as the input. Now the training distribution matches the inference distribution, including the upstream's idiosyncrasies. The weekly summariser, in turn, trains on the actual 24-hour LoRA's outputs.

This is expensive. Every time you retrain an upstream tier, you might need to regenerate training data for everything downstream. It's worth it. The errors that compound through summarisation cascades are the kind that look fine on each component's validation set and catastrophic in production.

---

**The rule**

For every model component in a pipeline, write down the input distribution it will see at inference. Be specific — not "documents" but "documents that have already been filtered by component X, ranked by component Y, and reordered by component Z." Then make sure your training data matches that distribution, even if it means running the upstream pipeline at training-data-generation time.

When you change the upstream, regenerate the training data for everything downstream. The model's task may not have changed, but its input distribution did.

---

**When this is hard**

- **When the upstream is non-deterministic.** If you change the LLM in an upstream stage, the downstream training data is now stale. You either accept some drift or you accept the cost of regeneration.
- **When the upstream changes faster than you can retrain.** Sometimes the right answer is to freeze the upstream until downstream is caught up; sometimes it's to live with the drift and monitor for behavioural change.
- **When training data is the bottleneck.** Some tiers need a lot of upstream calls to regenerate. Budget for it; don't pretend it's free.

**When this is easy**

- When the upstream is deterministic and cheap (regex, rules, classical algorithms). Just run it.
- When the upstream is a model whose outputs you can cache. Generate once, train on the cache.
- When the gap is small and you can fix it with a thin preprocessor instead of retraining. (See the sister post on guards.)

---

**Close**

*Your data drift problem is a pipeline alignment problem.* Every model component is implicitly trained on a hypothesis about what its inputs will look like. If the hypothesis is wrong, no amount of model capacity fixes it. You can throw a bigger model at the symptom and the bigger model will be marginally more robust to the mismatch, but it'll still be doing the wrong job — solving for distribution A when production is feeding it distribution B.

Look at every component in your pipeline and ask the question: *is this trained on what it'll actually see?* If the answer is "approximately," regenerate.

---

## Notes on style and structure

- Each draft assumes ~1500–2500 words finished. Section bullets are the skeleton, not the prose — fill them in with the voice you use on dhecloud.xyz.
- Draft A has the broadest audience; B has the deepest technical signal; C is the methodology piece that gets shared in DMs. Personally I'd ship in that order.
- Don't write all three at once. Ship A, watch what lands, then write B or C with that feedback in mind.
- For B (the ONNX/IOBinding post), the relevant code lives under `demo/onnx_export/`. You can extract a small, sanitized snippet of the IOBinding setup — that's the part readers will screenshot, and it's purely about ORT plumbing, not your data.
- If a reader asks for "the dataset" — point them at any public RAG benchmark (e.g. a HotpotQA subset filtered to timestamped queries). The technique transfers; the corpus isn't the point.
