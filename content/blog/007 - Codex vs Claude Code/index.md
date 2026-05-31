---
title: "In praise of a lazy coding agent: Codex vs Claude Code"
date: 2026-04-17
draft: false
tags: ["coding agents", "opinion", "developer tools"]
summary: "An agent that writes just enough keeps you owning the project. An agent that writes everything quietly takes it from you."
---

Writing code used to be a real chunk of the cost. You sat there and typed it out, and that took time and effort. But there was always a second, larger cost underneath it: reading it, understanding it, and being on the hook for it six months later. Coding agents made the writing nearly free and left that second cost exactly where it was. So when I compare Codex and Claude Code, I'm not really asking which one writes more code. I'm asking which one leaves me still owning my project at the end of the session.

I've been using both for a while now, on the same kinds of tasks. They have different personalities, and the difference matters more than any benchmark.

## Codex is thorough to a fault

Codex is impressive in the way a very eager junior engineer is impressive. Ask it for a function and you get the function, plus error handling for cases that can't happen, plus a config option nobody asked for, plus a helper class to make the config option extensible, plus tests for the helper class. Every individual decision looks defensible. The sum is a codebase you didn't write and don't fully recognise.

I've started calling this code diarrhea. Not because any single line is bad, but because the volume itself is the problem. More code is more surface area: more to read, more to review, more places for a bug to hide, more decisions baked in that you never consciously made. The agent treats thoroughness as the goal. But good code is usually the opposite of thorough. Good code is the smallest thing that solves the problem and can be deleted later without fear.

The real failure mode is subtle. Each turn, Codex hands you something that looks done. It compiles, it has tests, it reads like a competent engineer wrote it. So you skim it and move on. Do that ten times and you've lost the plot of your own project. You're no longer the author. You're a reviewer who stopped reviewing carefully somewhere around turn three, signing off on a system you'd struggle to explain.

## Claude Code is lazy, and that's a feature

Claude Code, by contrast, is lazy. You ask for the function and you get the function. Often a little less than you'd have written yourself. Sometimes you have to nudge it: "yes, also handle the empty case." It does not gold-plate. It does not invent abstractions you didn't ask for. Left alone it errs toward doing the obvious minimal thing and stopping.

I've never read this as a weakness. It's the right default, because it keeps the decisions with me. When the agent does just enough, I'm the one who notices the gap, decides whether it matters, and chooses how to fill it. The act of asking for the next piece keeps me holding the shape of the system in my head. I stay the author. The agent stays the tool.

This is the part I think gets lost in the race to make agents more autonomous and more "complete." We are not actually trying to remove the human from the loop (well, at least for me). We are trying to make the human faster at the parts that are tedious while keeping them in charge of the parts that are decisions. An agent that writes just enough is implicitly respecting that line. An agent that writes everything erases it, and hands you the maintenance bill later.

## The catch: Opus is inconsistent

I'd recommend Claude Code without hesitation if it were consistent. It isn't quite, unfortunately. Opus has mostly good weeks and then some strange weeks. In the days leading up to a new version shipping, it goes from a bestie who totally gets me to an annoying student who just won't pay attention in class. The same prompts that landed last week now get half-read, half-answered, and faintly off.

{{< figure src="ok.png" class="align-center" width="70%" alt="Key and Peele 'Okay' sketch" caption="The stages of Opus 'getting' me. ok. [(skit)](https://www.youtube.com/watch?v=0pufATqebv8)">}}

r/Claude lights up with the same complaint every release cycle, so it isn't only me imagining it.

This stings more because it's a subscription. I'm paying the same flat fee every month whether Opus is a bestie or a distracted student. So there are stretches where the value just isn't there, and during those weeks a competitor on the same budget might genuinely get me further. I haven't switched, but I've thought about it more than once mid-bad-week.

## What I actually want

I don't want the most capable agent. I want the one that keeps me capable. Those are different goals, and I think the industry is optimising hard for the first while quietly assuming it implies the second. It doesn't. The more an agent does, the less I understand, and the less I understand, the worse my decisions get, which is the one thing I can't delegate.

So I'll take the lazy one. I'll take the agent that sometimes makes me ask twice, that leaves me doing the thinking.