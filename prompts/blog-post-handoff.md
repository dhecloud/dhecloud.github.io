# Blog post handoff prompt

**How to use:** When you want to draft a new blog post about a project, paste the prompt below into an agent running in that project's repo. The agent will ask about the angle, read the project source, and produce a `draft: true` blog post you can paste into this repo at `content/blog/<NNN - Title>/index.md` (pick `NNN` based on the next number in sequence).

The output is a **first draft for you to polish into your voice**, not a publish-ready post. Voice is harder to template than format; expect to rewrite paragraphs.

Update this file when blog patterns shift.

---

You're drafting a blog post for the owner of this project, to be published on their personal Hugo site at dhecloud.xyz. The post will live in `content/blog/` alongside existing entries:

- 001 - The Hidden Struggles of My First Doctoral Paper
- 002 - Building FaceChangerGIFBot - Reflections on Shipping a Side Project
- 003 - What My Second PhD Paper Taught Me
- 004 - Building SakuraSensei - Notes From a Japanese Learning Experiment
- 005 - Semantic Deduplication for RAG - Reducing Redundancy in Data
- 006 - Don't Make the LLM Do Math

Your output is explicitly a first draft. The owner will polish it into their voice before publishing. Set `draft: true` in frontmatter without exception.

## Your deliverable

A markdown blog post in one fenced code block at the end of your response. Do not pick a directory name or number; the owner does that on their end.

In your response (outside the code block), include one short paragraph naming what you think the angle is, and two or three sentences flagging anything you fabricated or guessed at so the owner knows what to verify.

## What kind of post

The owner writes two distinct kinds of post. Ask which flavor before drafting:

1. **Project reflection** (e.g. 002, 004) — narrative about building something, what was learned, what would be done differently. Personal voice, sectioned by phase or theme, includes embedded media via Hugo shortcodes (`{{< giflike src="x.mp4" caption="..." width="60%" >}}`). Tone: candid, slightly wry, first person.

2. **Technical lesson** (e.g. 005, 006) — a specific technical insight, framed by the problem it solves. Direct opening hook, problem statement, the insight, why it works, when it doesn't, close. Tone: terse, observational, "here's a pattern I extracted." Concrete examples (specific numbers, real code, real scenarios) over generic claims.

If you can't reach the owner, infer: long-running build with stories → reflection; specific technique they extracted → technical lesson.

## How to gather the information

Read the project source: README, key entry points, recent commits, internal notes. For technical lessons, find the specific design decision worth writing about (the seam in the problem, the trick that worked, the failure mode that taught something). For reflections, look for what was non-obvious during the build, what surprised the owner, what they'd change.

**Ask the owner before drafting:** what's the angle? What's the one thing they want a reader to walk away with? If they can't answer, the post isn't ready and you should say so rather than fabricate one.

## Format

Frontmatter:
```
---
title: "Descriptive title: optional subtitle after a colon"
date: YYYY-MM-DD
draft: true
tags: ["short", "tags"]
summary: "One-sentence summary used in feed listings. Specific, not generic."
---
```

Body structure varies by flavor.

**Technical lesson skeleton:**
- Strong opening (one or two sentences stating the insight bluntly, or the problem starkly).
- Problem context — what was hard and why.
- The insight, elaborated with a concrete example.
- Why it works (separation of concerns, the seam exploited, etc).
- When it doesn't work / edge cases.
- Close: distilled takeaway. A `{{< alert >}}...{{< /alert >}}` callout works for a punchy one-liner.

**Reflection skeleton:**
- Optional TL;DR or strong opening hook.
- Sections by phase or theme (## H2 headings like "Why I Built It in the First Place", "Wearing Every Hat", "What I'd Do Differently").
- First person, embedded media where it adds context.
- Close that distills what the experience taught.

Use `> blockquotes` for key insight lines in technical posts (the semantic dedup post uses this pattern well).

## Style constraints

- **No emdashes (—) in prose.** Use commas, colons, periods, or parens. Strong user preference.
- **First person.** "I built", "I noticed", "my system". Not "we" or generic "you should".
- **Concrete over generic.** Specific numbers, real code, real scenarios. Not "improved performance significantly."
- **No marketing fluff.** Avoid "cutting-edge", "innovative", "scalable", "robust" unless backed by a measurement.
- **No invented metrics.** If you don't know the number, write `<!-- TODO: verify -->` inline. Don't make one up.
- **No leaked secrets:** no API keys, internal URLs, customer-data shapes.
- **Hugo shortcodes available:**
  - `{{< giflike src="..." caption="..." width="60%" >}}` for embedded video/gifs
  - `{{< alert >}}**Punchy takeaway.**{{< /alert >}}` for closing callouts

## Reference examples

### Technical lesson — `006 - Don't Make the LLM Do Math/index.md`
```
---
title: "Don't trust the LLM to do math: a placeholder pattern for production RAG"
date: 2026-03-31
draft: false
tags: ["RAG", "production", "design patterns"]
summary: "For any value the pipeline can compute from authoritative data, the model should emit a slot, not a literal, and the pipeline should fill the slot before the user sees the response."
---

A lot of production RAG bugs share a shape. The model emits a number, and the number is wrong. The standard fix is "retrain" or "tighten the prompt." This post is about a cheaper one: don't let the model emit the value at all.

Every number in a response should be accountable. You should be able to point to exactly where it came from. If you can't, it came from the model. Wrong reasoning tends to be visible; a user reads a sentence and something feels off. Numbers don't have that property.

## The common fixes

**Tool use.** Give the model a calculator or code interpreter. The model reasons about what to compute; the tool does the computation. Probably the right default for cloud-hosted systems with flexible latency budgets.

**Code generation.** Have the model emit code that computes the answer, then execute it. Auditable and deterministic.

[... more options ...]

All legitimate. My situation closed most of them. Three hard constraints applied:

- **Low latency.** Tool calls, code execution, and extra inference steps all add time.
- **Edge deployment.** Runs on device, not a data center.
- **The numbers aren't retrievable.** The values I need are counts of query results.

That ruled out everything except prompting, and prompting alone wasn't enough.

## My specific case: counting

[problem statement with concrete numbers: "With format-free prompts, compliance hovered around 32%. With a strict training format, compliance hit 100% but the counts were still wrong."]

[ASCII diagram showing before/after pipeline]

The insight was that counting is two separate problems bundled into one: an entailment problem (which documents are relevant?) and a response generation problem (produce a fluent answer). Conflating them is what makes counting hard.

## Why this works

**Separation of concerns.** [...]
**Cost.** [...]
**Auditability.** [...]

## When this is a bad idea

**When the placeholder depends on synthesis the model is doing in parallel.** [...]
**When the model hallucinates the placeholder itself.** [...]
**When the deterministic fill is itself the hard problem.** [...]

## Close

In my case, I was able to explicitly define the problem and decompose it to my advantage. Counting was separable into entailment and generation, and that seam was exploitable. Not every problem has a clean seam, but it's worth looking for one before reaching for more training.

{{< alert >}}
**The model owns the language. The pipeline owns the truth.**
{{< /alert >}}
```

### Reflection — abridged `002 - Building FaceChangerGIFBot/index.md`
```
---
title: "Building FaceChangerGIFBot: Reflections on Shipping a Side Project"
date: 2025-11-18
draft: false
tags: ["Machine Learning", "Computer Vision", "Side Project"]
summary: "What started as a joke about my friend became a lesson in product thinking, user behavior, and the quiet satisfaction of finishing something"
---

## Why I Built It in the First Place

It all started with a research demo on X. I follow a few accounts that tweet about interesting developments in Computer Vision, and I saw a clip of a realistic face swap that preserved subtle facial expressions, even the nuance of a raised eyebrow. I had just finished watching snippets of RuPaul's Drag Race funny moments, and the thought hit me immediately: "It would be hilarious if that was my friend."

That's it. No grand vision. No market analysis. Just the mental image of my friend dramatically side-eyeing the camera in a blonde wig, and the certainty that it would be hilarious.

{{< giflike src="punggol.mp4" caption="one of the earliest gifs to be swapped" width="60%">}}

I threw together a quick MVP, a Telegram bot that could swap faces in short GIFs, running inference on my desktop GPU. Nothing too fancy. Just enough to see if the idea had legs.

## Wearing Every Hat

Here's what no one tells you about solo projects: most of the work isn't coding.

[... narrative about being designer, QA, support, marketer ...]

## Building for Real Users Changes Everything

People didn't use the bot the way I expected. Some wanted to insert themselves into music videos. Others wanted to prank colleagues. [...]

## What I'd Do Differently

**Logging and monitoring from day one.** I spent too many hours squinting at error messages that could have been obvious with proper observability. [...]

**Document decisions, not just code.** Six months later, I'd look at a design choice and have no idea why I made it. [...]

**Think about abuse earlier.** [...]

## Research vs. Shipping

In research, you optimize for novelty. You write for reviewers who will scrutinize your methodology. Feedback comes months later, filtered through peer review.

Here, feedback was instant and unfiltered. Users didn't care about my architecture decisions. They cared whether the bot worked.

## Looking Forward

[Close that distills the lesson and the personal payoff.]

Not bad for a side project.
```

## Starting steps

1. Ask the owner which flavor (technical lesson or reflection) and the one thing they want a reader to walk away with.
2. Read the project source for grounding. Look for the specific decision/insight (technical) or the specific surprising moments (reflection).
3. Draft the post. Run it past every style constraint (no emdashes, first person, concrete, no fluff, no invented metrics, `draft: true`).
4. Output the markdown in one fenced block. In your response (outside the block), name what you think the angle is and flag anything you fabricated or guessed at.
