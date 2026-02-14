---
title: "Semantic Deduplication for RAG: Reducing Redundancy in Data"
date: 2026-02-14
draft: False
tags: ["RAG"]
summary: "How temporal bucketing plus lightweight lexical filtering makes semantic deduplication tractable, cutting corpus redundancy by up to 80%."
---


## TL;DR

Building a Retrieval-Augmented Generation (RAG) system on top of real-world logs is not as simple as it seems. You quickly discover an uncomfortable truth:

> Most of your data is the same event repeated dozens of times.

This results in extremely bad downstream retrieval performance. To combat this, I developed a deduplication pipeline that reduced redundancy by up to 80%, combining:

1. hash-based exact filtering
2. lexical sliding-window suppression
3. temporal-aware embedding clustering

The key insight, however, is rather simple:

> Understanding your data distribution can really simplify the problem statement.

Why solve big problem when you can solve small problem?

---
 
## The Problem: When Duplicates Overwhelm Your RAG System

Imagine you’re building a RAG assistant for a constant/streaming source of incoming text descriptions.

Every few seconds, the system emits something like:

> “A cat met a rat on the mat”  
> “A rat met a cat on the mat”  
> “A rat met a cat on the mat”  
> "On the mat, a cat met a rat.”  
> "The cat ate the rat on the mat"  

and so on. In one day, you can easily get up to 600 logs of many near-duplicates, across multiple events. 

At scale (across months and years), this creates serious issues:

First, retrieval quality degrades. Duplicates dominate your Top-K results: instead of retrieving diverse evidence, you retrieve the same entries phrased 12 ways. This creates a lot of noise downstream when you have to use the entries for whatever purposes.

Second, embedding compute gets wasted. The latency for embedding documents is not insignificant. Embedding documents where half are redundant is simply wasteful.

Thirdly, users get frustrated. Simple queries can return pages of repetitive context that are neither helpful nor useful.

You might argue that this is not a RAG problem, but rather an issue with the source; and to a certain extent i do agree. In an ideal world, we would have properly distinct and unique context entries that we can retrieve right off the bat. But alas, it is never that easy.

## Making Deduplication work



The very first and obvious step is to remove near identical copies. Doing [levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance) or [Jaccard similarity](https://studymachinelearning.com/jaccard-similarity-text-similarity-metric-in-nlp/) based on your data is straight forward and simple, and probably could reliably remove a significant portion. However, this approach misses paraphrases completely.

How do we check if two sentences are semantically similar? In the past, we could do NER recognition using spacy and maybe lemmatize the verbs and try to determine some sort of overlap using a wordbank. In the age of LLMs, however, we use sentence embeddings.

It is still not that straight forward. If you have ever taken a basic [computational complexity](https://en.wikipedia.org/wiki/Big_O_notation) class, you would know that computing the similarity of each datapoint against every other datapoint is a prohibitively expensive`O(n²)`. Even if you do not have any hardware constraints, it is probably still not a good idea.

I needed a solution that would bring it down to less than `O(n²)`. 

Luckily, my data had a temporal property I could leverage. Creating buckets based on this temporal property effectively created sliding windows. Each sliding window was small enough but still meaningful enough that I could do single pass clustering (under the umbrella term online clustering). From there, I could deduplicate the entries that belongs to each cluster either by choosing the member closest to the centroid, or by using another summarizer on each cluster. This process is `O(k · w)` and in practice completed almost instantly (as opposed to brute forcing it which would take hours).

Of course the hyperparameters like window size and similarity threshold had to be tweaked to ensure that the deduplicating wasn't too fragile or sensitive, but this was the overall idea.

On my data, redundancy dropped by up to 80%, and retrieval results become more diverse and meaningful. Embedding compute decreases significantly, clustering becomes tractable, and in general the RAG system becomes less brittle.

## Closing Thoughts
Deduplication is one of the most underappreciated scaling tactic in RAG.
Before trying to make your retrieval models biggers, or introduce more complexity in your rerankers and generators, ask yourself:

> Could I actually first break down the issue into simpler constituents?