---
title: "Your eval was the bug: three times I retrained the wrong thing"
date: 2026-05-30
draft: true
tags: ["evaluation", "debugging", "RAG"]
summary: "Three war stories where the model was fine and the eval was lying — and the rule I now follow before queuing any retraining job."
---

For most of my career I've defaulted to one assumption when a model is wrong: the model is wrong. The training data needs more examples. The hyperparameters need a sweep. The loss function isn't capturing what I care about. So you go fix it, re-run the eval, see if the number moved.

I've been running a RAG project for a few months where that assumption was wrong three times in a row. The model was fine. The eval was lying to me. Each time, I'd burned days on the wrong fix before I noticed. This post is the three war stories and the rule I now follow.

---

## War story #1 — the two-year anchor mismatch

My eval set was a few hundred multi-turn conversations sampled across two years of historical data. Each conversation had its own *anchor* — its own "today" relative to which phrases like "yesterday" and "last week" should resolve. Roughly a hundred unique anchor dates in total.

The eval harness, sensibly, took a single `--reference-date` flag. Less sensibly, it applied that single date to every conversation, regardless of when the conversation was actually anchored in the dataset. So a conversation from twenty-two months ago, where the user asked "what happened yesterday," was being scored against a reference date set by the harness default — which meant the time resolver was being asked to find documents on a "yesterday" that was nearly two years from when the conversation actually happened.

The model was correct. The eval was telling me it was failing on a few dozen conversations, all of which had this exact failure mode. I spent three days assuming I'd introduced a regression in the time resolver — diffing branches, re-running on prior checkpoints, rebuilding the parser test suite. The git history shows me adding logging, removing logging, adding more aggressive logging, then finally printing the reference date that the parser was receiving on each turn.

Once the per-conversation reference-date override was in, those failures disappeared. The fix was a one-line change in the harness. The diagnosis was three days of looking at the wrong piece of the system.

---

## War story #2 — 60% of filter false negatives were labeler errors

The relevance filter — a small classifier that decides whether a retrieved doc is on-topic enough to send to the response model — had what looked like a serious recall problem. On the held-out set, it was missing a meaningful fraction of docs that the ground truth marked as relevant.

I started building augmentation data. I sketched out a curriculum-style approach. I priced out a bigger base model. Before any of that landed, I ran a manual audit on a sample of the false negatives: open each one, read the doc, read the query, decide for myself whether the label was right.

Roughly 60% of the time, the *label* was wrong. The doc genuinely wasn't relevant. The model was correctly rejecting it; the harness was scoring the rejection as a failure.

I ran seven rounds of ground-truth cleaning over the following weeks. Each round: pull all the false negatives, audit a stratified sample, find the systematic labeler mistakes, fix them, re-run. The headline recall number climbed without me touching the model.

The retraining I'd been about to do would have *worsened* the filter. I'd have been teaching it to accept irrelevant docs to match a bad ground truth.

---

## War story #3 — the in-distribution eval that overstated by an order of magnitude

This one I've drafted as a separate post, so the short version: my "respectable" multi-turn accuracy on the in-distribution eval set was an order of magnitude higher than the same model's accuracy on a deliberately-noisy OOD set. Same model. Same retrieval. Different inputs.

The IID set hadn't been wrong, exactly — it had been *trivial*. It was sampled from the same distribution that trained the rewriter, so it measured how well the rewriter had memorised its own training shape, not how well it handled the messy queries real users type. Building the OOD generator was the fix; the model was fine, the eval was the bottleneck.

---

## The rule

After the third war I wrote the rule down. It's the poster on the wall.

> *Before you retrain anything, audit the eval. Run a stratified manual review of failures. Spot-check the ground truth. Look for harness bugs — date math, off-by-ones, default args, reference dates, anchor mismatches. "What's the eval bug?" before "what's the model bug?"*

This isn't a rule against retraining. It's a rule against retraining *first*. Each of the three wars cost me days because I went straight to the model when the cheaper, smaller, faster fix was somewhere in the harness or the labels.

---

## The tooling that makes this practical

You can't audit an eval if you can't reconstruct individual failures. A few things made the audits cheap enough that I started doing them by reflex:

- **Stage-attribution judges.** A teacher LLM that walks each conversation through the pipeline and attributes the failure to its earliest broken stage (rewrite, time, intent, retrieve, filter, respond). When the attribution says "rewrite failed," you go look at the rewriter. When it says "time failed in 90% of cases on conversations from one specific quarter," you know you have an anchor problem.
- **Per-conversation replay logs.** Every failed eval row, given an ID, should be one command away from "show me everything that happened in this conversation, end to end." If it's a manual recipe to recover the trace, you won't bother.
- **Ground-truth cleaning as a first-class workflow.** Not "we'll get to it." A scheduled batch every time the eval set grows past some threshold, with a stratified-sample protocol so it's reproducible.

---

## When this rule doesn't apply

Auditing is most useful when the failures are *categorical* — when you can look at one example and say "this is right or wrong, and here's why." It's much less useful when the failure is a statistical aggregate (perplexity, BLEU on a 50K test set), or when the eval is well-trodden and you're the nth person to use it. Don't audit MMLU. Do audit the eval you wrote last month.

There's also a kind of audit fatigue. After a few wins it's tempting to assume *everything* is an eval bug. It isn't. The point of the rule is to spend an hour up front before you commit to a week of retraining — not to convince yourself the model is never wrong.

---

## Close

Three wins paid for the rule many times over. Three days of misdiagnosis on the anchor mismatch alone. A month of avoided retraining on the filter. A whole class of model improvements that would have been chasing phantom failures.

The cheap version of all of this: *before you train, look.* At the eval. At the labels. At the harness defaults. The bug is more often there than you'd think.
