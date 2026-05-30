---
title: "Train your model on the input distribution it'll see at inference"
date: 2026-05-30
draft: true
tags: ["RAG", "training", "distribution shift"]
summary: "Half the work on my last RAG project was iteratively closing the gap between the distribution each component was trained on and what it actually received at inference."
---

There's a quiet assumption in most ML training: that the data you train on looks like the data you'll see at inference. Half the time it does. The other half — the half that breaks production — it doesn't, and the gap is invisible until something downstream goes wrong.

Most of my last RAG project, in retrospect, was iteratively closing this gap. Every component had an *implicit input distribution* it assumed at training time, and at inference the upstream pipeline produced something slightly different, and the model behaved badly in a way that wasn't visible from its own validation set. Once I started noticing the pattern, it was everywhere.

This post is the pattern, four places I hit it, and the rule I now follow.

---

## The pattern

You train a component on data drawn from distribution **A**. At inference, the upstream pipeline produces data drawn from distribution **B**. A ≠ B in subtle ways — the upstream's outputs have idiosyncrasies the raw data didn't, or vice versa. Your model's validation set is drawn from A, so it looks fine. In production, it isn't.

The fix is uncomfortable: regenerate your training data so it matches what the upstream actually produces. Sometimes this means running the rest of the pipeline at training-data-generation time, even when that's expensive and even when the upstream is non-deterministic.

---

## Four places it bit me

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

## The rule

For every model component in a pipeline, write down the input distribution it will see at inference. Be specific — not "documents" but "documents that have already been filtered by component X, ranked by component Y, and reordered by component Z." Then make sure your training data matches that distribution, even if it means running the upstream pipeline at training-data-generation time.

When you change the upstream, regenerate the training data for everything downstream. The model's task may not have changed, but its input distribution did.

---

## When this is hard

- **When the upstream is non-deterministic.** If you change the LLM in an upstream stage, the downstream training data is now stale. You either accept some drift or you accept the cost of regeneration.
- **When the upstream changes faster than you can retrain.** Sometimes the right answer is to freeze the upstream until downstream is caught up; sometimes it's to live with the drift and monitor for behavioural change.
- **When training data is the bottleneck.** Some tiers need a lot of upstream calls to regenerate. Budget for it; don't pretend it's free.

## When this is easy

- When the upstream is deterministic and cheap (regex, rules, classical algorithms). Just run it.
- When the upstream is a model whose outputs you can cache. Generate once, train on the cache.
- When the gap is small and you can fix it with a thin preprocessor instead of retraining. (See the sister post on guards.)

---

## Close

*Your data drift problem is a pipeline alignment problem.* Every model component is implicitly trained on a hypothesis about what its inputs will look like. If the hypothesis is wrong, no amount of model capacity fixes it. You can throw a bigger model at the symptom and the bigger model will be marginally more robust to the mismatch, but it'll still be doing the wrong job — solving for distribution A when production is feeding it distribution B.

Look at every component in your pipeline and ask the question: *is this trained on what it'll actually see?* If the answer is "approximately," regenerate.
