---
title: "The tip of the iceberg: evals in the age of self-improving loops"
date: 2026-09-24
draft: false
tags: ["evals", "agents", "LLM-as-judge", "production"]
summary: "Self-improving loops used to have a human reviewing the results. Now an automated score decides what is kept, and an eval is only a slice of everything a system could be asked, so user feedback has to stay in the loop."
---

In March 2026, Karpathy's autoresearch[^autoresearch] put recursive self-improvement back in the spotlight. An agent edits a training script, runs it, and keeps the change if a metric improves. Since then, Shopify's CEO,[^fortune] Google Research[^google] and researchers[^aide]<sup>,</sup>[^rehearse] alike have been running loops like it. In each, an automated score decides what the loop keeps.

If the eval is how we judge the loop, the loop is only as good as the eval. The problem is that an eval is a small part of what the system could be asked.

## An eval is a slice

Picture every question a system could receive, and every answer it could give. That space is huge. An eval is a slice of it: a few hundred or thousand cases we thought of, wrote down and know how to score.

<!-- fig:slice -->
<div style="max-width:600px;margin:1.5rem auto"><svg viewBox="0 0 560 344" style="width:100%;height:auto;font-family:inherit" role="img" aria-label="An iceberg. The eval is the small tip above the waterline. A dashed, lower waterline shows a bigger eval, which reveals a little more of the iceberg, but almost all of what the system could be asked stays hidden under water.">
<defs><clipPath id="sl-d-band"><rect x="0" y="0" width="560" height="130"/></clipPath><clipPath id="sl-d-under"><rect x="0" y="90" width="560" height="254"/></clipPath><clipPath id="sl-d-tip"><rect x="0" y="0" width="560" height="90"/></clipPath></defs>
<path d="M262 22L281 44L296 36L322 90L342 118L378 142L430 170L468 214L492 262L458 300L400 326L318 334L236 328L170 306L118 268L102 224L132 178L176 146L210 118L226 90L240 58L250 52Z" fill="#3b82c4" fill-opacity="0.32" clip-path="url(#sl-d-under)"/>
<path d="M262 22L281 44L296 36L322 90L342 118L378 142L430 170L468 214L492 262L458 300L400 326L318 334L236 328L170 306L118 268L102 224L132 178L176 146L210 118L226 90L240 58L250 52Z" fill="currentColor" fill-opacity="0.12" clip-path="url(#sl-d-band)"/>
<path d="M262 22L281 44L296 36L322 90L342 118L378 142L430 170L468 214L492 262L458 300L400 326L318 334L236 328L170 306L118 268L102 224L132 178L176 146L210 118L226 90L240 58L250 52Z" fill="currentColor" fill-opacity="0.26" clip-path="url(#sl-d-tip)"/>
<path d="M262 22L268 90M281 44L272 68M226 90L254 176L132 178M254 176L378 142M254 176L468 214M170 306L290 280L400 326M290 280L492 262M290 280L318 334" fill="none" stroke="currentColor" stroke-opacity="0.18" stroke-width="1.5" stroke-linejoin="round"/>
<path d="M262 22L281 44L296 36L322 90L342 118L378 142L430 170L468 214L492 262L458 300L400 326L318 334L236 328L170 306L118 268L102 224L132 178L176 146L210 118L226 90L240 58L250 52Z" fill="none" stroke="currentColor" stroke-opacity="0.7" stroke-width="2" stroke-linejoin="round"/>
<path d="M0 90H560" stroke="currentColor" stroke-opacity="0.7" stroke-width="2"/>
<path d="M0 130H560" stroke="currentColor" stroke-opacity="0.6" stroke-width="2" stroke-dasharray="8 6"/>
<text x="342" y="70" fill="currentColor" font-size="22" font-weight="700">Eval</text>
<text x="16" y="120" fill="currentColor" fill-opacity="0.75" font-size="19">A bigger eval</text>
<text x="300" y="250" fill="currentColor" fill-opacity="0.9" font-weight="700" font-size="21" text-anchor="middle">Everything it could be asked</text>
</svg></div>

A loop improves the system on that slice. Outside the slice, nothing pushes back. The score cannot see those cases, so a change that quietly breaks them looks the same as a change that does nothing.

We should still make the slice as big as we can: more cases, cases taken from real failures, generated edge cases. But even a big slice will never account for every edge case and situation a system meets.

## The score on the slice is only a proxy

Inside the slice, the score is still a proxy, and a loop will optimize the proxy. Text metrics like ROUGE and BERTScore, retrieval metrics and a model used as a judge each reward something close to what we want, not the thing itself. A model judge can also be inconsistent on subjective cases, so it needs calibrating against human grades.[^evals]

Optimizing on this slice also has a cost we do not see. A change that raises the score can quietly wear down what the system does well everywhere else, so while we optimize the slice, we should watch that the system's general knowledge and capabilities do not regress. [My last post](/blog/008---when-the-harness-knows-better-than-the-model/) has an example: rules added to avoid worst cases piled up and clashed with each other.

## The person who used to steer is gone

Before AI coding, a human iterated by hand. They reviewed the results at each step and decided the direction, the methods and the approach, so they often noticed what the eval missed.

In a self-improving loop, the agent makes those calls itself. A model is not a human, and it does not make the same judgement calls. The direction it picks may not be the one a person would choose, or would accept. The score is what holds it in place, and the score covers only a slice.

<!-- fig:steer -->
<div style="max-width:600px;margin:1.5rem auto"><svg viewBox="0 0 560 276" style="width:100%;height:auto;font-family:inherit" role="img" aria-label="Two copies of the same improvement loop: change, score, then a decision about what to change next. Before, a human reviews the results and steers. Now the agent makes that decision and sees only the score, and the human sits outside the loop.">
<text x="8" y="64" fill="currentColor" font-size="18" font-weight="700">Before</text>
<rect x="84" y="30" width="80" height="56" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="2"/><text x="124" y="64" fill="currentColor" font-size="18" text-anchor="middle">Change</text>
<path d="M164 58H182" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="2"/><path d="M175 52L182 58L175 64" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="2" stroke-linejoin="round"/>
<rect x="184" y="30" width="70" height="56" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="2"/><text x="219" y="64" fill="currentColor" font-size="18" text-anchor="middle">Score</text>
<path d="M254 58H272" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="2"/><path d="M265 52L272 58L265 64" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="2" stroke-linejoin="round"/>
<rect x="274" y="30" width="190" height="56" fill="none" stroke="currentColor" stroke-width="2.5"/>
<text x="288" y="53" fill="#3b8fe0" font-size="18" font-weight="700">Human</text>
<text x="288" y="76" fill="currentColor" font-size="16">reviews, then steers</text>
<path d="M369 86V110H124V88" fill="none" stroke="currentColor" stroke-opacity="0.4" stroke-width="2"/><path d="M118 95L124 88L130 95" fill="none" stroke="currentColor" stroke-opacity="0.4" stroke-width="2" stroke-linejoin="round"/>
<text x="8" y="194" fill="currentColor" font-size="18" font-weight="700">Now</text>
<rect x="84" y="160" width="80" height="56" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="2"/><text x="124" y="194" fill="currentColor" font-size="18" text-anchor="middle">Change</text>
<path d="M164 188H182" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="2"/><path d="M175 182L182 188L175 194" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="2" stroke-linejoin="round"/>
<rect x="184" y="160" width="70" height="56" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="2"/><text x="219" y="194" fill="currentColor" font-size="18" text-anchor="middle">Score</text>
<path d="M254 188H272" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="2"/><path d="M265 182L272 188L265 194" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="2" stroke-linejoin="round"/>
<rect x="274" y="160" width="190" height="56" fill="none" stroke="#e5484d" stroke-width="2.5"/>
<text x="288" y="183" fill="currentColor" font-size="18" font-weight="700">Agent</text>
<text x="288" y="206" fill="#e5484d" font-size="16" font-weight="700">sees only the score</text>
<path d="M369 216V240H124V218" fill="none" stroke="currentColor" stroke-opacity="0.4" stroke-width="2"/><path d="M118 225L124 218L130 225" fill="none" stroke="currentColor" stroke-opacity="0.4" stroke-width="2" stroke-linejoin="round"/>
<path d="M464 188H484" fill="none" stroke="currentColor" stroke-opacity="0.45" stroke-width="2" stroke-dasharray="4 4"/>
<rect x="486" y="160" width="74" height="56" fill="none" stroke="currentColor" stroke-opacity="0.7" stroke-width="2" stroke-dasharray="6 5"/>
<text x="523" y="194" fill="#3b8fe0" font-size="18" text-anchor="middle">Human</text>
</svg></div>

Yet that is not an argument against these loops. A loop can try far more ideas than a person iterating by hand. The autoresearch README estimates about 100 experiments while you sleep,[^autoresearch] which is why self-improvement speeds up system development so much. The aim is to keep that speed and add back some of the judgement the human used to supply.

## What I do about it

**Look at user feedback and try to understand their intent.** It is the one signal that comes from outside the slice. A complaint tells you what they were trying to do, and every one becomes a permanent case, so the slice grows from what users actually hit.

I think much of system development can now be handed to agents and loops, and that will only grow. But not all of it. The users are the ones who know what the system is for, so it is not fully hands-off.

[^evals]: Mikaela Grace, Jeremy Hadfield, Rodrigo Olivares and Jiri De Jonghe, ["Demystifying evals for AI agents"](https://www.anthropic.com/research/demystifying-evals-for-ai-agents), Anthropic Engineering, January 2026.
[^autoresearch]: Andrej Karpathy, [autoresearch](https://github.com/karpathy/autoresearch), GitHub README, March 2026.
[^fortune]: Jeremy Kahn, ["'The Karpathy Loop': Former OpenAI researcher's autonomous agents ran 700 experiments in 2 days"](https://fortune.com/2026/03/17/andrej-karpathy-loop-autonomous-ai-agents-future/), Fortune, March 2026.
[^google]: Yale Song and Yiwen Song, ["Automating coherent long-form video generation"](https://research.google/blog/coherent-long-form-video-generation/), Google Research, September 2026.
[^aide]: Srikanth, Zhao, Xu, Wu and Jiang, ["Recursive self-improvement of AI research agents"](https://arxiv.org/abs/2609.26457), 2026.
[^rehearse]: Ji and Ding, ["Rehearse: Stepping Back from the Confidence Cliff in Self-Improving Autoresearch"](https://arxiv.org/abs/2607.27687), 2026.
