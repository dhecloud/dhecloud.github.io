---
title: "Don't trust the LLM to do math: a placeholder pattern for production RAG"
date: 2026-03-31
draft: false
tags: ["RAG", "production", "design patterns"]
summary: "For any value the pipeline can compute from authoritative data, the model should emit a slot, not a literal, and the pipeline should fill the slot before the user sees the response."
---

A lot of production RAG bugs share a shape. The model emits a number, and the number is wrong. The standard fix is "retrain" or "tighten the prompt." This post is about a cheaper one: don't let the model emit the value at all.

Every number in a response should be accountable. You should be able to point to exactly where it came from. If you can't, it came from the model. Wrong reasoning tends to be visible; a user reads a sentence and something feels off. Numbers don't have that property. A wrong count can look authoritative, fit grammatically, and pass a quick read without raising any flags. They slip through insidiously in a way that a nonsensical sentence never could.

## The common fixes

**Tool use.** Give the model a calculator or code interpreter. The model reasons about what to compute; the tool does the computation. Probably the right default for cloud-hosted systems with flexible latency budgets.

**Code generation.** Have the model emit code that computes the answer, then execute it. Auditable and deterministic.

**Chain of thought / reasoning models.** Showing working before producing an answer reduces arithmetic errors. Reasoning models spend more compute on intermediate steps. Both are genuinely better at numerical tasks than a vanilla forward pass.

**Retrieval for numbers.** For values that exist in a knowledge base, retrieve the number rather than generating it.

**Prompting.** Be explicit about format, add examples, penalise deviations during training. Helps at the margins but doesn't eliminate the failure mode. You've raised the floor, not removed the risk.

All legitimate. My situation closed most of them. Three hard constraints applied:

- **Low latency.** Tool calls, code execution, and extra inference steps all add time that compounds quickly in a multi-turn loop.
- **Edge deployment.** Runs on device, not a data center. No headroom to throw compute at the problem.
- **The numbers aren't retrievable.** The values I need are counts of query results, aggregates over retrieved documents. They don't exist until the pipeline produces them, so there's nothing to retrieve.

That ruled out everything except prompting, and prompting alone wasn't enough.

## My specific case: counting

Users ask things like "how many times did X happen last week?" The response model needs to produce a sentence with an accurate number. Getting that right is harder than it sounds.

The first instinct was to train the model to emit the integer directly. With format-free prompts, compliance hovered around 32%. With a strict training format, compliance hit 100% but the counts were still wrong. At 2B scale, the model cannot reliably count retrieved documents. It approximates. It confidently emits the wrong number in a grammatically correct sentence.

```
before:  query --> [response model] --> "Person in the driveway in 4 captures [1][2][3]."
                                                                      ^
                                                               model guessed wrong

after:   query --> [response model] --> "Person in the driveway in {sum} captures [1][2][3]."
                                                                      ^
                                                               pipeline fills: len(relevant_docs) = 3
```

The insight was that counting is two separate problems bundled into one: an entailment problem (which documents are relevant to the query?) and a response generation problem (produce a fluent answer). Conflating them is what makes counting hard.

Split them apart and both become tractable. An entailment model handles relevance classification with high precision. The response model generates the right shape of output, emitting `{sum}` wherever a count would go:

```
query + retrieved docs
        |
        v
[entailment model] --> relevant_docs
                              |
                              v
                    [response model] --> "...in {sum} captures [1][2][3]..."
                              |
                              v
                    pipeline: {sum} = len(relevant_docs)
                              |
                              v
                    "...in 3 captures [1][2][3]..."
```

> "Person in the driveway in `{sum}` captures `[1][2][3]`."

That `{sum}` is a literal that the pipeline replaces with `len(relevant_docs)` before the response reaches the user. No model does arithmetic. Neither model has to do the other's job.

Wiring up `_resolve_sum()` took an afternoon. The count is now provably correct because nothing in the path can corrupt it.

## Why this works

**Separation of concerns.** Small LLMs are good at shape and tone. They are bad at arithmetic and format invariants under cognitive load. Splitting into "shape (model)" and "values (pipeline)" puts each capability where it's strong.

**Cost.** Training the model to emit accurate integers took weeks and every checkpoint had pathologies: off-by-ones, repeats, formatting drift. The placeholder version took an afternoon.

**Auditability.** When the count is wrong, you know which function produced it. There's a stack trace and a unit test. With a model-generated number, you're looking at training curves and prompt diffs.

## When this is a bad idea

**When the placeholder depends on synthesis the model is doing in parallel.** Counting works because the count doesn't change based on how the model phrases the sentence. If your placeholder is the grammatical number of a noun ("there was one event" vs "there were three events"), the pipeline and model are now coupled through grammar.

**When the model hallucinates the placeholder itself.** If `{sum}` appears in training data often enough, the model can start emitting it in unwanted contexts. You'll need a guardrail or accept some leakage.

**When the deterministic fill is itself the hard problem.** If filling the placeholder requires solving the thing you were trying to avoid, you've moved the bug, not killed it. This works for counting because `len(docs)` is trivial.

## Close

In my case, I was able to explicitly define the problem and decompose it to my advantage. Counting was separable into entailment and generation, and that seam was exploitable. Not every problem has a clean seam, but it's worth looking for one before reaching for more training.

Every number a user sees should have a clear owner: the pipeline or the model. Pipeline numbers can be tested, traced, and trusted. Model numbers can be wrong in ways that are hard to catch. For any number the pipeline can compute, take the guarantee.

{{< alert >}}
**The model owns the language. The pipeline owns the truth.**
{{< /alert >}}
