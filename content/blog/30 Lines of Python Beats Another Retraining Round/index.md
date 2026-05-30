---
title: "30 lines of Python beats another retraining round"
date: 2026-05-30
draft: true
tags: ["RAG", "production", "engineering"]
summary: "We train our way out of problems we should code our way out of, because retraining is the more impressive-sounding move."
---

There's a tax you pay every time you decide to fix a model problem by retraining the model. It's not just the GPU time. It's the days of data generation, the eval loop, the regression check on every other task the model also has to do well. The tax is so big that for a lot of bugs, the better answer is to leave the model alone and write a deterministic guard around it.

I'm going to claim this is more often true than people admit — and that we, collectively, train our way out of problems we should code our way out of, because retraining is the more impressive-sounding move.

---

## The objections

> *"But that's a hack."*

Yes. It is a 30-line hack. Production systems run ten thousand of them. The Linux kernel is mostly 30-line hacks.

> *"But what if it doesn't generalise?"*

It doesn't have to. It has to handle this exact failure mode, and stop. Generalisation is the *model's* job. The guard's job is to backstop the specific failure mode the model has at the specific point in the pipeline where it has it.

> *"But we'll accumulate a pile of guards and lose track."*

Maybe. We'll also lose track of model versions, dataset revisions, prompt iterations, and adapter checkpoints. Engineering is the practice of keeping track of things. Add a docstring.

---

## Five guards from one project

Here's what the alternative actually looks like in practice. Each of these was a real bug, with a real "retrain" path I considered, and a small fix that closed the bug in an afternoon.

**1. Whitespace normalisation at the prompt boundary.** A class of OOD-shaped queries — extra leading spaces, smart quotes, tab characters, copy-paste artefacts — were causing token-level shifts that the rewriter was sensitive to. The model would emit a slightly different rendered query, the time resolver would pick up the wrong span, retrieval would miss. The "proper" fix would have been to augment the training data with whitespace-perturbed examples. The actual fix was `re.sub(r"\s+", " ", query).strip()` at the prompt boundary. The bug disappeared. No retraining.

**2. Input-abuse pre-flight gate.** Some inputs were pathological: 8000-word rambles, repeating-character spam, queries that were a single emoji repeated 200 times. The rewriter would either crash, time out, or — worse — produce a "valid"-looking rewrite that sent retrieval somewhere weird. The "proper" fix would have been to train the rewriter to recognise and gracefully reject these. The actual fix was a length cap and a repetition detector that short-circuits to a canned "I can't process this query" response *before* the model runs. About 25 lines of Python. Catches everything.

**3. Time-phrase restoration on the rewriter output.** The rewriter occasionally drops a time phrase from the user's query during normalisation, in violation of its own training. Downstream, the time resolver sees a query with no temporal anchor and falls back to a wide window. The "proper" fix would have been more training examples emphasising time-phrase preservation. The actual fix was a post-processor that regex-matches time phrases in the original query, checks whether they survived the rewrite, and splices the missing ones back in. There's a *guardrail lift rate* metric tracking how often it fires, which doubles as a regression check for the next rewriter version.

**4. Citation injection fallback.** The response model is supposed to end every sentence with `[N][N]…` citation markers. Most of the time it does. Occasionally — on harder prompts and smaller bases — it skips them entirely. The "proper" fix would have been to train a bigger LoRA with more citation-heavy examples and grind compliance from 99.5% to 99.9%. The actual fix was a token-Jaccard injection pass that scores each sentence against each retrieved doc and appends the best match in canonical form. It only runs when the response emitted zero citations — it's a salvage path, not a normaliser. The UI explicitly labels when it fires so users know the citations are machine-injected.

**5. Broad-query bypass.** Multi-day "show me everything from last week" queries used to take thirty seconds through the LoRA, with non-trivial hallucination risk because the context was huge. The "proper" fix would have been to fine-tune a model that handles long-context summarisation better. The actual fix was to pre-compute daily digests offline and render them with a deterministic markdown template when the query asks for a broad range. The LoRA is never called. The latency dropped to milliseconds. The hallucination rate went to zero — because there's no language model in the path.

---

## The rule

For each model failure I find, I ask one question:

> *Is the symptom local or systemic?*

**Local** means: a specific shape of input produces a specific shape of broken output, and you can describe the shape. Whitespace perturbations. Missing citations. Specific time phrases dropped. Pathological-length queries. These are guard candidates. The guard's contract is narrow and explicit; it can be unit-tested.

**Systemic** means: the model misunderstands the task in a way you can't enumerate. It picks the wrong intent across many different inputs. It hallucinates details consistent with its prior even when the context contradicts. It writes in the wrong register. These are retrain candidates, because no finite list of guards covers them.

My contention: most of what gets called systemic is actually local in disguise. We just don't notice, because retraining is the muscle we reach for. Three of the five guards above were originally on my "retrain" list before I sat down and described the failure mode precisely enough to see how narrow it was.

---

## When to retrain instead

Three cases where the guard is the wrong tool:

- **The symptom is everywhere.** Every fifth query, not every twentieth. If your filter is making the same mistake across a wide swath of inputs, you don't have a guard problem; you have a model problem.
- **The guard would require domain logic the pipeline can't reasonably own.** Entity disambiguation. Multi-hop reasoning. Anything where the "right" deterministic answer requires you to rebuild the model's capability in code. Don't.
- **The guard has its own false-positive rate that exceeds the failure rate it's catching.** A whitespace normaliser that strips a leading space the user actually meant. A repetition detector that flags a legitimate "ha ha ha." If the guard makes the system worse on its own error modes than the model was on the original ones, kill the guard.

---

## The honest reckoning

Guards accumulate. After a year you have 40 of them, and they need a test suite, and someone has to remember that they exist when debugging weird production behaviour. Some of them will become wrong when the model improves and you stop needing them.

This is fine. Pruning a 30-line guard is much cheaper than pruning a training-data dependency. Each guard is a single function, in a single file, with a single failure mode it claims to catch. They are *legible* in a way that "we augmented the training set with 3000 more examples of X" is not.

The pile is not the price you pay. The pile is the artefact. Each entry in the pile is a bug you caught cheaply.

---

## Close

"Retrain" is the impressive answer. "Write a guard" is the boring one. Production rewards boring.

If you have a model bug today, before you queue the retrain job: write the symptom down in one sentence. Describe the input shape that causes it. Describe the output shape it produces. Now ask whether the gap between those two shapes is something you can close in 30 lines of code. Often, it is. The 30 lines run forever. The retraining job pays its tax every time you have to do it again.
