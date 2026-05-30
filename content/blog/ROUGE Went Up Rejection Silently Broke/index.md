---
title: "ROUGE went up. Rejection silently broke."
date: 2026-05-30
draft: true
tags: ["evaluation", "metrics", "RAG"]
summary: "A story about picking the wrong metric — and the one-liner that saved me from shipping a silent hallucination regression."
---

A few months ago I shipped a response-model checkpoint that was four points better on ROUGE-L. In the same release I shipped a silent regression in the model's ability to *refuse* to answer when it had no supporting evidence. I almost missed it. The thing that caught it wasn't ROUGE, wasn't training loss, wasn't a hand-curated test set — it was a one-line metric I'd added a few iterations earlier on a whim, because I didn't trust ROUGE to tell me the whole story.

This post is about why aggregated metrics lie, what it looks like when they do, and the cheap thing that saved me.

## The setup

The response model in my RAG pipeline has two distinct jobs. When the retrieved context contains evidence for the user's question, it should answer fluently with citations. When the context is empty or irrelevant, it should *refuse* — say something like "I don't have any records of that."

These are different failure modes. Confident-but-wrong is a hallucination. Refusal-when-it-could-have-answered is unhelpful. They cost differently, they break differently, and they require different training signals.

ROUGE-L measures surface similarity between the generated response and the gold response, averaged across the eval set. It does not distinguish "the model gave a different but valid answer" from "the model gave a *hallucinated* answer when it should have refused." Both look the same to ROUGE: high lexical overlap on the cases where the model answered, plus some noise.

## The catch

I bumped the training data for v7 — added some examples, rebalanced some categories. ROUGE-L moved from roughly 0.704 to roughly 0.748. Training loss curves looked healthy. I was ready to ship.

Then I checked the rejection-agreement metric. It's a one-liner: of the eval rows where the gold response was a refusal, what fraction of the model's responses were *also* refusals? On v6 the number was 100%. On v7 it was 97.6%.

Two-point-four percentage points sounds small. In context it isn't. The model had learned to *answer* a class of queries it should have refused. It was generating fluent, citation-styled responses for empty-context cases — and ROUGE was rewarding it for being verbose where it should have been silent. The headline number went up partly *because* the model was hallucinating in a ROUGE-friendly way.

## The diagnosis

The v7 training set leaned harder on positive examples (cases where the model should answer). The negative examples (cases where the model should refuse) were proportionally diluted. Cross-entropy loss optimised for the positive case — the easier, higher-volume signal — and the refusal behaviour eroded.

This is the kind of regression that's only visible if you measure refusal as its own number. Loss won't show you. ROUGE won't show you. Even a hand-curated test set won't show you unless you've explicitly stratified it by failure mode and tracked each stratum separately.

## The lesson

Every aggregated metric collapses some failure mode into a number. That metric will move in the wrong direction whenever the model trades a failure mode the metric *measures* for one it *doesn't*. ROUGE rewards surface similarity. Rejection agreement rewards epistemic humility. They are not the same metric, and they will not move together.

## The cheap thing

For every task, write down the failure modes you care about — *separately*. Build a one-line metric for each. Use them as checkpoint selectors, not just as numbers you read off after training. If a checkpoint improves the primary metric but regresses any of the per-failure-mode metrics, reject it.

This sounds obvious. Most teams I've worked with don't do it. The default is to pick a single headline metric (loss, ROUGE, accuracy, F1) and let the others wander, which is fine right up until the day they wander far enough to break production.

## When this matters

Any task with multiple failure modes that can't be collapsed into one number. RAG response generation is one (answer well *and* refuse well). Classification with abstention is one (correct *and* know-when-to-pass). Code generation with "I don't know" is one. Anything where *saying nothing* is sometimes the right output.

If your task has a "right answer" axis and an "abstain" axis, you have two failure modes. ROUGE measures the first. Build a one-liner for the second and run it on every checkpoint.

## Close

The four-point ROUGE gain was real. It just came packaged with a regression I'd have shipped if I hadn't been measuring the other thing.

Pick the metrics for the failure modes. Not the other way around.
