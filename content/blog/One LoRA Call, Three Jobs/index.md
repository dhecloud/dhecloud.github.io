---
title: "One LoRA call, three jobs: how I collapsed intent, time and query rewriting into one structured output"
date: 2026-05-30
draft: true
tags: ["RAG", "LoRA", "NLP"]
summary: "Why I stopped running separate classifiers, how the slot schema works, what the guardrails catch that the model can't."
---

Most RAG pipelines I've seen have a stack of upstream classifiers: one for intent, one to extract time phrases, one to rewrite the query for retrieval. Each is a separate model call, a separate failure mode, and a separate dataset to maintain. On a domain-specific assistant I've been building, I ended up doing all three in one structured LoRA call — and multi-turn rewrite accuracy on out-of-distribution queries jumped by double-digit points. Here's how it works and why I think it's the right default for small-model RAG.

## What the pipeline used to look like

- Three sequential calls: intent classifier → time-phrase extractor → rewrite model.
- Each one had its own training data and its own quirks.
- Latency was fine; *correctness* wasn't — errors at the intent stage poisoned the rewrite, errors in the rewrite stripped the time phrase, and we'd retrieve over the wrong window with high confidence.

## The slot schema

- One LoRA on Qwen3.5-2B emits a JSON object with four slots: `{intent, time, rendered_query, metadata}`.
- `intent ∈ {semantic_search, counting, full_recall, out_of_scope}`.
- The model is trained to never drop the time phrase from `rendered_query` (and there's a guardrail below that restores it if it does).
- Multi-turn coreference is handled by feeding the previous `rendered_query` and `time` into the prompt — no chat history blob, just the structured prior turn.
- Show the schema, show one example input/output (a synthetic one is fine).

## The guardrails

- Whitespace normalization at the prompt boundary (one of the cheapest wins; OOD-shaped queries break tokenization on leading/trailing spaces).
- Input-abuse gate: hard caps on length + a repetition detector before the model ever runs.
- Time-phrase restoration: if `rendered_query` is missing a time phrase that appeared in the user input, splice it back in.
- The point: *retraining on noise-infused examples is slower than a deterministic fix.* I trained the model to do the language work, then I wrote 30 lines of Python to handle the cases the model was never going to handle reliably.

## The curriculum

- ~30K teacher-synthesized multi-turn examples, with a curriculum: 2-turn → 3-turn → 4-turn.
- Iterations added self-correction + rambling repair, then pronoun resolution + subject-override cases.
- The augmentation targets came from a per-category failure inventory on the previous run — not vibes.

## The numbers (qualitative version)

- In-distribution multi-turn rendered-query accuracy: double-digit-point improvement.
- OOD multi-turn rendered-query accuracy: double-digit-point improvement, ending *higher* than IID (more on that in a separate post).
- Intent macro-F1: 0.99+.
- One model. One call. One failure mode to debug.

## When this would be a bad idea

- If your intent space is huge (say, hundreds of routing labels), the LoRA can't memorize the schema.
- If your tasks have wildly different output lengths/styles, the joint-training rate tax can be bigger than the savings.
- If you can't afford to retrain when you add a slot — separate models are easier to evolve independently.

## Close

The lesson I'd quote at someone over coffee: *if a single structured output covers it, don't run three classifiers.* It's not just cheaper at inference. It collapses three failure modes into one debuggable surface.
