---
title: "When the harness knows better than the model, until it doesn't"
date: 2026-11-13
draft: false
tags: ["agents", "harness engineering", "production"]
summary: "A date guard I wrote for weak models was right for the case it was built for, then silently overruled a correct model on a harder one."
---


When I was tasked with building our data analytics assistant at work (around May 2026), I built a custom harness around the open-source Qwen3.5 122B-A10B. Staff ask questions in plain language, such as how a promotion did, and the assistant queries the company's data and writes the answer. The harness is everything around the model: the code that decides what the model sees, which tools it can call, and what happens to its output.

One weakness showed up early: date arithmetic. Like many models at the time, it struggled to turn "last week" into exact dates, and it would return a start date a day off, or a range with the wrong number of days. In a replay, the right week came back in almost none of the fetches.

So I handled dates in code instead. The harness resolved them and handed the result to the model, the same idea as in [my post on not letting the model do math](/blog/006---dont-make-the-llm-do-math/). That was the right call at the time, and it worked well enough that I stopped thinking about it. For a while, the harness knew better than the model. Then the model improved and the questions got harder, and the same code started producing wrong answers.

## The bug

Here is a simplified version of the kind of question that broke it. A user asks: "How did the Prime Day promotion do compared to the same-length period before it?"

Here is what happened to that question on its way to an answer.

<div style="max-width:600px;margin:1.5rem auto">
<svg viewBox="0 0 560 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Timeline from 29 June to 15 July. The model chose a comparison window of 30 June to 7 July and a promotion window of 8 to 15 July, 8 days each. A rule moved the comparison start to 29 June, making it 9 days against 8, but the answer still said same-length." style="width:100%;height:auto;font-family:inherit">
<rect x="24" y="122" width="30" height="58" rx="4" fill="#e5484d" fill-opacity="0.14"/>
<text x="24" y="26" font-size="15" font-weight="700" text-anchor="start" fill="currentColor" fill-opacity="1">What the model chose</text>
<text x="24" y="112" font-size="15" font-weight="700" text-anchor="start" fill="currentColor" fill-opacity="1">What the answer used</text>
<path d="M57 70 V62 H291 V70" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
<text x="174.0" y="53" font-size="15" font-weight="500" text-anchor="middle" fill="currentColor" fill-opacity="1">comparison · 8 days</text>
<path d="M297 70 V62 H531 V70" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
<text x="414.0" y="53" font-size="15" font-weight="500" text-anchor="middle" fill="currentColor" fill-opacity="1">promotion · 8 days</text>
<path d="M27 164 V156 H291 V164" fill="none" stroke="#e5484d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
<text x="159.0" y="147" font-size="15" font-weight="500" text-anchor="middle" fill="#e5484d" fill-opacity="1">comparison · 9 days</text>
<path d="M297 164 V156 H531 V164" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
<text x="414.0" y="147" font-size="15" font-weight="500" text-anchor="middle" fill="currentColor" fill-opacity="1">promotion · 8 days</text>
<line x1="24" y1="182" x2="534" y2="182" stroke="currentColor" stroke-opacity="0.5"/>
<line x1="39.0" y1="182" x2="39.0" y2="187" stroke="currentColor" stroke-opacity="0.5"/>
<text x="39.0" y="204" font-size="14" font-weight="400" text-anchor="middle" fill="currentColor" fill-opacity="0.8">29</text>
<line x1="69.0" y1="182" x2="69.0" y2="187" stroke="currentColor" stroke-opacity="0.5"/>
<text x="69.0" y="204" font-size="14" font-weight="400" text-anchor="middle" fill="currentColor" fill-opacity="0.8">30</text>
<line x1="99.0" y1="182" x2="99.0" y2="187" stroke="currentColor" stroke-opacity="0.5"/>
<line x1="129.0" y1="182" x2="129.0" y2="187" stroke="currentColor" stroke-opacity="0.5"/>
<line x1="159.0" y1="182" x2="159.0" y2="187" stroke="currentColor" stroke-opacity="0.5"/>
<line x1="189.0" y1="182" x2="189.0" y2="187" stroke="currentColor" stroke-opacity="0.5"/>
<line x1="219.0" y1="182" x2="219.0" y2="187" stroke="currentColor" stroke-opacity="0.5"/>
<line x1="249.0" y1="182" x2="249.0" y2="187" stroke="currentColor" stroke-opacity="0.5"/>
<line x1="279.0" y1="182" x2="279.0" y2="187" stroke="currentColor" stroke-opacity="0.5"/>
<text x="279.0" y="204" font-size="14" font-weight="400" text-anchor="middle" fill="currentColor" fill-opacity="0.8">7</text>
<line x1="309.0" y1="182" x2="309.0" y2="187" stroke="currentColor" stroke-opacity="0.5"/>
<text x="309.0" y="204" font-size="14" font-weight="400" text-anchor="middle" fill="currentColor" fill-opacity="0.8">8</text>
<line x1="339.0" y1="182" x2="339.0" y2="187" stroke="currentColor" stroke-opacity="0.5"/>
<line x1="369.0" y1="182" x2="369.0" y2="187" stroke="currentColor" stroke-opacity="0.5"/>
<line x1="399.0" y1="182" x2="399.0" y2="187" stroke="currentColor" stroke-opacity="0.5"/>
<line x1="429.0" y1="182" x2="429.0" y2="187" stroke="currentColor" stroke-opacity="0.5"/>
<line x1="459.0" y1="182" x2="459.0" y2="187" stroke="currentColor" stroke-opacity="0.5"/>
<line x1="489.0" y1="182" x2="489.0" y2="187" stroke="currentColor" stroke-opacity="0.5"/>
<line x1="519.0" y1="182" x2="519.0" y2="187" stroke="currentColor" stroke-opacity="0.5"/>
<text x="519.0" y="204" font-size="14" font-weight="400" text-anchor="middle" fill="currentColor" fill-opacity="0.8">15</text>
<text x="39.0" y="222" font-size="13" font-weight="600" text-anchor="middle" fill="currentColor" fill-opacity="0.7">Jun</text>
<text x="99.0" y="222" font-size="13" font-weight="600" text-anchor="middle" fill="currentColor" fill-opacity="0.7">Jul</text>
<text x="24" y="246" font-size="15" font-weight="600" text-anchor="start" fill="#e5484d" fill-opacity="1">A rule moved the start back to Jun 29.</text>
<text x="24" y="266" font-size="15" font-weight="600" text-anchor="start" fill="#e5484d" fill-opacity="1">The answer still said “same-length”.</text>
</svg>
</div>

The model had read the question correctly. My code moved the comparison's start back by one day, and the answer still called the two windows the same length. Nothing in the system noticed.

This kind of scaffolding is an override: it fills in, snaps, or rewrites what the model chose. The date rule was built for "last week" and was right for that. It could not tell that this time the model had been correct, because an override sees only the output, not the reasoning behind it.

The same turn had two more overrides. One told the model the user had not asked for a comparison, because its keyword check missed the English words for it. Another defaulted a table header to a period-over-period label. Each was small and reasonable. Together they overruled three correct decisions in one answer.

That made it hard to find. An override also erases its own evidence: the model's choice never reached the answer, so there was no model error to point at and the logs pointed nowhere. We were debugging a model that was not broken.

## What I changed

I removed the rule, then went through every override and asked what it was betting the model could not do. Each one got one of three outcomes: remove it, convert it to a hint the model can disagree with, or keep it because it guards something the model should never decide.

The undated question was the clearest case. The code used to invent a time period. Now it binds nothing and tells the model that no time was named, along with today's date and the latest date with data. The model decides what to do, including asking the user.

## The lesson

A harness exists to bolster the model's abilities. Back when hallucinations were a large concern and the model's knowledge was still in question, scaffolding like this was paramount to a system's accuracy. Yet as models evolve, the harness around them has to evolve too, and it is not always a simple unplug and replace. In my case, a lot of the scaffolding I had implemented earlier was now constraining the system.

The constraint was subtle. Scaffolding pushes the agent toward the route you designed. When the model was weak, that was the point. Once it could reason about the question, the same push worked against it: instead of working out what the user wanted, it was steered down the path I had built for the questions I had imagined.

<!-- fig:steering -->
<div style="max-width:600px;margin:1.5rem auto">
<svg viewBox="0 0 560 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The same question handled two ways. A user asks why returns jumped after the promotion. With scaffolding, the question is matched to the nearest fixed route, a sales summary, and the answer covers sales, which nobody asked about. Without it, the model works out that the user wants a cause, looks at returns by product, and answers why returns rose." style="width:100%;height:auto;font-family:inherit">
<text x="24" y="26" font-size="15" font-weight="400" text-anchor="start" fill="currentColor" fill-opacity="0.7">User asks:</text>
<text x="100" y="26" font-size="15" font-weight="700" text-anchor="start" fill="currentColor" fill-opacity="1">“Why did returns jump after the promotion?”</text>
<line x1="280" y1="52" x2="280" y2="250" stroke="currentColor" stroke-opacity="0.25"/>
<text x="24" y="70" font-size="15" font-weight="700" text-anchor="start" fill="currentColor" fill-opacity="1">With scaffolding</text>
<text x="24" y="112" font-size="15" font-weight="400" text-anchor="start" fill="currentColor" fill-opacity="1">Matched to the nearest route:</text>
<text x="24" y="132" font-size="15" font-weight="700" text-anchor="start" fill="#e5484d" fill-opacity="1">sales summary</text>
<path d="M44 142 V162" stroke="currentColor" stroke-opacity="0.5" stroke-width="2" fill="none"/>
<path d="M39 160 L44 168 L49 160" stroke="currentColor" stroke-opacity="0.5" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
<text x="24" y="188" font-size="15" font-weight="400" text-anchor="start" fill="currentColor" fill-opacity="1">Runs the route as designed</text>
<path d="M44 198 V218" stroke="currentColor" stroke-opacity="0.5" stroke-width="2" fill="none"/>
<path d="M39 216 L44 224 L49 216" stroke="currentColor" stroke-opacity="0.5" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
<text x="24" y="244" font-size="15" font-weight="700" text-anchor="start" fill="#e5484d" fill-opacity="1">Answer: how sales did</text>
<text x="24" y="264" font-size="14" font-weight="400" text-anchor="start" fill="#e5484d" fill-opacity="1">Nobody asked about sales.</text>
<text x="304" y="70" font-size="15" font-weight="700" text-anchor="start" fill="currentColor" fill-opacity="1">Without it</text>
<text x="304" y="112" font-size="15" font-weight="400" text-anchor="start" fill="currentColor" fill-opacity="1">Works out what is wanted:</text>
<text x="304" y="132" font-size="15" font-weight="700" text-anchor="start" fill="currentColor" fill-opacity="1">a cause for the spike</text>
<path d="M324 142 V162" stroke="currentColor" stroke-opacity="0.5" stroke-width="2" fill="none"/>
<path d="M319 160 L324 168 L329 160" stroke="currentColor" stroke-opacity="0.5" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
<text x="304" y="188" font-size="15" font-weight="400" text-anchor="start" fill="currentColor" fill-opacity="1">Pulls returns by product</text>
<path d="M324 198 V218" stroke="currentColor" stroke-opacity="0.5" stroke-width="2" fill="none"/>
<path d="M319 216 L324 224 L329 216" stroke="currentColor" stroke-opacity="0.5" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
<text x="304" y="244" font-size="15" font-weight="700" text-anchor="start" fill="currentColor" fill-opacity="1">Answer: why returns rose</text>
</svg>
</div>




I was not the only one to find this. When the Claude Code team audited their own system prompt, they removed over 80% of it for the newest models, with no measurable loss on their coding evaluations.[^1] Their explanation matches what I saw: rules written to avoid worst cases had piled up, and they clashed with each other and with what the user asked for. A rule that said to write no comments by default was wrong whenever a user wanted them. They replaced it with one line asking the model to match the surrounding code.

Vercel hit the same wall with an internal text-to-SQL agent. They replaced a stack of specialized tools with a file system and bash.[^2] On a five-query benchmark, the success rate went from 80% to 100% and the average run time fell from 275 seconds to 77. Their explanation was blunt: they had been doing the model's thinking for it. They also note it worked because their semantic layer was already good documentation, so the lesson comes with a condition. Their advice was to "build for the model that you'll have in six months, not for the one that you have today."

Swapping in a newer model is not a simple unplug and replace either. Everything I had tuned, the prompts, the rules, the fixes, was shaped around how the old model behaved: its habits, its mistakes, what it needed spelled out. A smarter model does not inherit that fit. It may not need instructions the old one did, or read the same hint differently, or fail in new places where the old tuning was quietly holding things up. Some of the tuning became dead weight, and some of it started to work against the new model's strengths.

<!-- fig:curve -->
<div style="max-width:600px;margin:1.5rem auto">
<svg viewBox="0 0 560 275" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustrative chart over time. The model improves steadily. A rule written in May assumes a fixed level of ability. While the model is below that level the rule helps. Once the model passes it, the rule holds the model back." style="width:100%;height:auto;font-family:inherit">
<polygon points="40,110 328.0,110 40,200" fill="currentColor" fill-opacity="0.07"/>
<polygon points="328.0,110 520,110 520,50" fill="#e5484d" fill-opacity="0.18"/>
<line x1="40" y1="110" x2="520" y2="110" stroke="currentColor" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.7"/>
<line x1="40" y1="200" x2="520" y2="50" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
<circle cx="328.0" cy="110" r="5" fill="currentColor"/>
<text x="44" y="102" font-size="14" font-weight="400" text-anchor="start" fill="currentColor" fill-opacity="0.8">what my rule assumes</text>
<text x="520" y="38" font-size="14" font-weight="600" text-anchor="end" fill="currentColor" fill-opacity="1">what the model can do</text>
<text x="48" y="140" font-size="14" font-weight="700" text-anchor="start" fill="currentColor" fill-opacity="1">rule helps</text>
<text x="48" y="158" font-size="14" font-weight="400" text-anchor="start" fill="currentColor" fill-opacity="0.8">(model is weaker)</text>
<line x1="328.0" y1="84" x2="328.0" y2="102" stroke="currentColor" stroke-opacity="0.5"/>
<text x="328.0" y="78" font-size="14" font-weight="600" text-anchor="middle" fill="currentColor" fill-opacity="1">the model catches up</text>
<text x="520" y="140" font-size="14" font-weight="700" text-anchor="end" fill="#e5484d" fill-opacity="1">rule holds the model back</text>
<line x1="40" y1="232" x2="520" y2="232" stroke="currentColor" stroke-opacity="0.5"/>
<text x="280" y="252" font-size="13" font-weight="400" text-anchor="middle" fill="currentColor" fill-opacity="0.6">time  →</text>
<line x1="40" y1="232" x2="40" y2="30" stroke="currentColor" stroke-opacity="0.5"/>
<text x="24" y="20" font-size="13" font-weight="600" text-anchor="start" fill="currentColor" fill-opacity="0.75">↑ model capability</text>
</svg>
</div>




## Closing

A harness knows better than the model only for as long as the model is weak. When the model catches up, the harness is the last to find out, because nobody tells it. Models behave differently from one version to the next, so the harness is the software you actually have to maintain.

If you are building on a model today, assume some of what you add will go stale. That is fine. The cost comes from not knowing which parts, so leave yourself a way to find out.

[^1]: [@trq212, post on X](https://x.com/trq212/status/2080710971228918066).
[^2]: Andrew Qu, ["We removed 80% of our agent's tools"](https://vercel.com/blog/we-removed-80-percent-of-our-agents-tools), Vercel, December 2025.
