# Project page handoff prompt

**How to use:** When adding a new personal/passion project to `content/projects/`, paste the prompt below into an agent running in that project's repo. The agent will read the project source, ask for any missing details (date, live URL, related blog post slug), and produce a directory slug plus an `index.md` you can paste into this repo at `content/projects/<slug>/index.md`.

This handoff is for personal/passion projects. Use `prompts/freelance-page-handoff.md` for paid client work instead.

Update this file when the projects section's format changes.

---

You're drafting a public-facing "project" page for the owner of this project, to be published on their personal Hugo site at dhecloud.xyz. It will live under `content/projects/` alongside `sakurasensei`, `facechangergifbot`, `acoustic-event-detection`, `hand-pose-estimation`. These are the owner's personal/passion projects: bots, research code, side experiments.

## Your deliverable

At the end of your response, output one code block containing:
1. A short kebab-case directory slug (e.g. `pose-tracker`, `embedding-cache`).
2. The full contents of the `index.md` to be saved at `content/projects/<slug>/index.md` in the dhecloud.xyz repo.

The user copies your output into the dhecloud.xyz repo themselves. Do not attempt to write to any external path.

## How to gather the information

Read the actual project source: README, package manifests (package.json, requirements.txt, pyproject.toml, etc.), entry points, deployment config, any docs. Ground every claim in what the code actually does, not speculation. If you need information that isn't in the repo (project date, live URL, whether there's an associated blog post on dhecloud.xyz, public-name permissions), ask the user before drafting.

## Format

Frontmatter (simpler than blog posts: no draft/tags/summary fields):
```
---
title: "Short descriptive title with optional subtitle after a colon"
date: YYYY-MM-DD
---
```

Body structure:
- **Optional link line at the top** for projects with an associated blog post: `[Read the full blog post about X](/blog/<slug-of-related-post>/)`. Skip if no associated post.
- **Brief description**: one or two short paragraphs covering what it does, the problem it solves, and any notable technical choice. No marketing language.
- `## Technologies Used` with **bolded sub-category lines** (e.g. **AI & Computer Vision:**, **Backend & Infrastructure:**, **Payment & Subscriptions:**, **Content Moderation:**) and bullets under each.
- `## Key Features` with the same bolded sub-category pattern.
- Optional `## Use Cases` at the bottom if the project has applications worth listing outside its primary purpose (rare; only when genuinely useful).

## Style constraints

- **Lead with the capability or domain, not the interface platform.** When the substance is AI extraction, automation, integrations, or a domain problem, that goes in the title. Interface platforms (Telegram, Slack, web form, etc.) are interface choices and belong in the body as a detail, not the title. Repeating an interface name across entries flattens the projects page into "X-platform developer," which the owner is not.
- **No emdashes (—) in prose.** Use commas, colons, periods, or parens. Strong user preference.
- **No software versions in tech-stack lists.** Strip language minor versions (`Python 3.11` → `Python`), library versions (`python-telegram-bot v20.7` → `python-telegram-bot`, `Pydantic v2` → `Pydantic`), model version tags (`claude-sonnet-4-6` → `Claude`), and "(latest version)" parentheticals. Versions age fast; the stack name carries the meaning. Keep behavioral qualifiers like "async, job queue" that describe *what* is used rather than *which version*.
- No marketing fluff: avoid "cutting-edge", "innovative", "scalable", "robust" unless backed by a specific claim.
- No invented metrics. If the code doesn't show a number, don't write one.
- No leaked secrets: no API keys, credentials, internal URLs, customer-data schemas.

## Reference examples

### Project with associated blog post — `sakurasensei/index.md`
```
---
title: "SakuraSensei: Japanese Conversational AI Tutor"
date: 2025-12-01
---

[Read the full blog post about building SakuraSensei](/blog/004---building-sakurasensei-notes-from-a-japanese-learning-experiment/)

Context-aware Japanese Telegram bot with LangChain, custom persona, memory persistence, multi-dataset RAG (JLPT, JMDICT, Tatoeba, JaSquad), multi-agent news explanation, cloze-question generation from YouTube via Whisper + VAD.

## Technologies Used

**AI & Language Models:**
- LangChain for conversation orchestration
- Custom persona and memory persistence
- Multi-agent architecture

**Data Sources & RAG:**
- JLPT vocabulary and grammar datasets
- JMDICT (Japanese-English dictionary)
- Tatoeba example sentences
- JaSquad question-answering dataset

**Audio Processing:**
- Whisper for speech recognition
- Voice Activity Detection (VAD)
- YouTube audio extraction

**Platform:**
- Telegram Bot API
- Python backend

## Key Features

**Conversational Learning:**
- Context-aware conversations in Japanese
- Personalized learning experience with memory
- Custom AI persona for engaging interactions

**Multi-Dataset RAG:**
- Retrieval-augmented generation from multiple Japanese learning resources
- JLPT-level appropriate content

**News Explanation:**
- Multi-agent system for explaining Japanese news
- Breaking down complex articles into learnable content

**Interactive Quizzes:**
- Cloze-question generation from YouTube videos
- Automated question creation using Whisper transcription

**Memory & Persistence:**
- Conversation history tracking
- User progress monitoring
- Personalized learning paths
```

### Project with blog post and monetization — `facechangergifbot/index.md`
```
---
title: "FaceChangerGIFBot: Face Swap for GIFs and Clips"
date: 2025-11-18
---

[Read the full blog post about building FaceChangerGIFBot](/blog/002---building-facechangergifbot---reflections-on-shipping-a-side-project/)

Real-time face swap Telegram bot using ONNX inference. Stripe-integrated subscriptions, content moderation, Cloudflare Tunnel webhooks.

## Technologies Used

**AI & Computer Vision:**
- ONNX Runtime for optimized inference
- Face detection and alignment models
- Real-time face swapping algorithms

**Backend & Infrastructure:**
- Python backend
- Cloudflare Tunnel for secure webhook handling
- Telegram Bot API

**Payment & Subscriptions:**
- Stripe API integration
- Subscription management system
- Usage tracking and billing

**Content Moderation:**
- Automated content filtering
- Safety and compliance checks

## Key Features

**Face Swapping:**
- Real-time face swap on GIFs
- Video clip face replacement
- High-quality output with ONNX inference

**Telegram Integration:**
- Easy-to-use bot interface
- Direct upload and processing

**Monetization:**
- Stripe-powered subscription system
- Multiple tier options

**Safety:**
- Content moderation system
- Usage limits and controls
```

### Project without blog post, with use cases — `acoustic-event-detection/index.md`
```
---
title: "Acoustic Event Detection for Emergency Telephony"
date: 2023-12-02
---

Streaming audio event-detection with custom PyTorch model. Nine acoustic classes, log-mel extraction, VAD, caption generation (SRT/XML/JSON), Dockerized deployment.

## Technologies Used

**Deep Learning:**
- PyTorch for model development
- Custom neural network architecture
- Real-time inference pipeline

**Audio Processing:**
- Log-mel spectrogram extraction
- Voice Activity Detection (VAD)
- Streaming audio processing

**Deployment:**
- Docker containerization

**Output Formats:**
- SRT (SubRip) subtitle format
- XML structured output
- JSON for API integration

## Key Features

**Real-Time Detection:**
- Streaming audio processing
- Low-latency event detection

**Multi-Class Classification:**
- Nine distinct acoustic event classes
- Emergency-specific sound detection

**Caption Generation:**
- Automated event timestamping
- Multiple output format support (SRT/XML/JSON)

## Use Cases

- Emergency telephony systems
- Automated call analysis
- Safety monitoring applications
- Event logging and documentation
```

## Starting steps

1. Read the README and main entry point(s) to understand the project.
2. Read package manifests and deployment configs to enumerate the tech stack.
3. Ask the user for: project date, live URL, whether there's an associated blog post on dhecloud.xyz (and if so the slug).
4. Pick the closest example shape and draft the markdown.
5. Run it past the style constraints (capability-led title, no emdashes, no versions, no fluff, no invented numbers), then output the slug and `index.md` in one fenced block.
