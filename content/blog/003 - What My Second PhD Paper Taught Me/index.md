---
title: "What my Second PhD Paper Taught Me
"
date: 2025-11-25
draft: False
tags: ["Machine Learning", "Automated Audio Captioning", "PhD"]
summary: "A personal reflection on an APSIPA paper, focusing on the pressures, constraints, and lessons that shaped the work beyond what appeared in the final publication."
---

[Paper](https://arxiv.org/abs/2206.01918). If you haven't read my reflections about my first paper, click  <a href='/blog/001---the-hidden-struggles-of-my-first-doctoral-paper/'>here</a>. Lots of lore in there.

## Mindset Check

I had just come off publishing my first [paper](https://arxiv.org/abs/2108.04692) and wanted to ride that momentum into another one. At the same time, I could feel the so-called “AI wars” accelerating. Every other week, OpenAI or Meta seemed to be releasing a larger model or a more impressive result. I was very aware of the clock ticking on my PhD, and I was in a hurry to graduate.

Mentally, I was anxious. Not about the work itself, but about relevance. I was worried about being left behind while industry labs pushed out bigger and bigger models at a pace academia simply couldn’t match.

{{< figure src="MLM.png" class="align-center" width="70%" alt="Masked Language Modeling" caption="[source](https://sbert.net/examples/sentence_transformer/unsupervised_learning/MLM/README.html). Masked Language Modeling. Close questions, language model style">}}


This paper came from a mix of excitement and pressure. Pretraining tasks were all the rage back then. Masked language modelling, next sentence prediction ([BERT](https://arxiv.org/abs/1810.04805)), and similar objectives seems to be the trend. To me, many of these felt almost like primary school homework exercises. Useful, yes, but still largely classification tasks. I was more interested in whether these simple ideas could be adapted to open-ended sequence generation.

Then OpenAI released a [paper](https://openai.com/index/formal-math/) on chaining non-trivial reasoning steps for math. That was the spark. The idea that *how* you present data during training could matter just as much as the architecture itself stuck with me, and that became the seed for this paper. [Chain of thought reasoning](https://arxiv.org/abs/2201.11903), as of writing, became the de facto standard for eliciting complex reasoning from large language models. 

---

## Initial Expectations

Coming off my first published papers alongside many failed experiments before this research project, I did not expect smooth sailing. That said, I already had a working data-to-results pipeline, which meant I could implement my intended strategy relatively quickly. This alone made the project feel unusually frictionless in the early stages.

{{< figure src="meme1.png" class="align-center" width="70%" alt="Model design - so many variables!" caption="Enough of model design!">}}

This time, I wanted my research angle to focus on a **training method rather than overthinking model design**. The goal was to make it as model-agnostic as possible. In theory, this could be plugged into many different setups.

The inspiration itself was simple, maybe even a bit naïve. If children are unable to form proper sentences with correct grammar before a certain age (at the risk of anthropomorphizing models), perhaps our models might also learn better if they started small.

Based on that intuition, I designed a curriculum where keywords from each caption were fed in as ground truth at the beginning of training. As training progressed, the model would slowly transition back to the full ground truth captions. In my head, this also acted a bit like dropout; a form of regularization that nudged the model away from over-reliance on exact sequences.


---

## Constraints I Couldn’t Ignore

There were quite a few experiments I wanted to include in the paper but had to remove due to space constraints. I had actually run several different curricula as ablations, exploring variations beyond what eventually made it into the final version.

{{< figure src="meme2.png" class="align-center" width="70%" alt="So many trashed figures!" caption="I wish they weren't so strict on the 4 pages contraint">}}

In the end, I narrowed it down to two: a **keyword curriculum** and a **frequency-based curriculum**, with the latter serving as a contrast. The goal was not to exhaustively explore every possible curriculum design, but to support the hypothesis that keyword-based progression was particularly useful for automated audio captioning.

In hindsight, many of these decisions were shaped less by theory and more by practicality. Time, space, and compute all played a role in determining what survived into the final paper.

---

## Looking Back With More Experience


Looking back now, this paper actually felt like a breeze compared to the hurdles I faced in later work. That alone probably explains why it remains one of my favorites.

If I were to redo it today, I would definitely adopt a more rigorous experimental methodology. At the time, finding the right experimental settings often felt like searching for a needle in a haystack—blindfolded. But I also recognize that I would not have learned this lesson without going through that phase.

{{< figure src="apsipa.jpg" class="align-center" width="50%" alt="APSIPA in Hanoi, Vietnam" caption="APSIPA in Hanoi, Vietnam">}}

I published this paper in APSIPA2023. This was my first conference post lockdown (or ["circuit breaker"](https://en.wikipedia.org/wiki/2020%E2%80%9321_Singapore_circuit_breaker_measures) as coined in Singapore) and I got to travel to Hanoi, Vietnam! I also helped to present a paper for another [paper](https://arxiv.org/abs/2304.12688) I helped author. Presenting in real life was a totally different experience. I couldn't rely on live captions to aid my hearing impairment, only my wits. Still, it was fun. 

{{< giflike src="paper_show_and_tell.mp4" caption="Show and Tell session at APSIPA. Sorry for the bad footage" width="80%">}}


Given where I was in my PhD and what I knew then, most of the decisions I made were reasonable. The paper’s relative simplicity, and the fact that it came together more smoothly than others, makes it stand out in my memory. Not because it was the most sophisticated work I did, but because it taught me how research can sometimes flow, and how rare that feeling actually is.
