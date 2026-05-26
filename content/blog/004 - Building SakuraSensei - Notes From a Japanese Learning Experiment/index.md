---
title: "Building SakuraSensei: Notes From a Japanese Learning Experiment
"
date: 2025-12-01
draft: False
tags: ["Machine Learning", "Computer Vision", "Side Project"]
summary: "What started as a joke about my friend became a lesson in product thinking, user behavior, and the quiet satisfaction of finishing something"
---

[Talk to SakuraSensei here!](https://t.me/SakuraSenseiNoBot)\
[Follow SakuraSensei's free feed here!](https://t.me/sakurasenseishiken)

After building my [first Telegram bot](/blog/002---building-facechangergifbot---reflections-on-shipping-a-side-project/) and watching it gain traction as a source of entertainment, I found myself wanting to work on something more meaningful. Fun is great, but I wanted my next project to be educational. At the same time, I was learning Japanese myself, hovering around JLPT N3, and constantly looking for lighthearted ways to stay exposed to vocabulary, kanji, and grammar. [SakuraSensei](https://t.me/SakuraSenseiNoBot) grew out of that intersection: a personal learning aid that also served as a technical playground for LangChain and a RAG (Retrieval Augmented Generation) framework.

## Why SakuraSensei Exists


{{< figure src="sakurasensei.png" class="align-center" width="70%" alt="Sakura Sensei" caption="Sakura Sensei on Telegram!">}}

The original motivation was simple. I wanted a Japanese tutor that did not feel heavy or academic, something I could interact with casually while still learning. Many tools are effective but rigid. I wanted something conversational, forgiving, and available at any time.

Telegram was not a deeply strategic choice. It was practical. I did not want to design a web interface or deal with mobile app store guidelines. Telegram gave me a clean interaction layer with minimal friction, and I could focus entirely on the backend logic and learning experience.

I structured SakuraSensei around the JLPT levels because they are universally understood by Japanese learners. Saying N5 or N3 immediately sets expectations for difficulty, vocabulary, and grammar. That shared understanding removed ambiguity for both the user and the system.

The name Sakura was chosen for similar reasons. It is a common Japanese name, easy to remember, friendly, and familiar. It also helps with discoverability and makes it easier for users to emotionally connect with the bot. Before SakuraSensei, my own Japanese learning was self directed and informal, which made empathy a core design principle. I was building something I would personally want to use.

## Laying the Technical Foundation

For the language model, I chose Claude. At the time, Anthropic had built [a solid foundation around agent tooling](https://www.anthropic.com/engineering/building-effective-agents), which aligned well with LangChain. I also wanted to try Claude after hearing positive feedback about its reasoning quality. In practice, this decision paid off. LangChain felt surprisingly smooth. Instead of wrestling with model configurations, VRAM constraints, or output parsing, I was making straightforward API calls. Once credits were topped up, the system was mostly plug and play.

{{< figure src="japmaterials.png" class="align-center" width="50%" alt="Japanese Learnign Materials" caption="While most of the materials were pretty easy, JaQuad was actually extremely difficulty and probably intended for native speakers.">}}


The retrieval system came together quickly. I collected JLPT grammar references, vocabulary lists, dictionary data, and other learning materials, converted them into embeddings, and indexed them. The goal was never to replace the language model’s reasoning, but to ground it. The vector database exists to supply facts and references so responses are anchored in real material rather than hallucinated explanations.

## Giving Sakura a Personality

{{< figure src="sakurapersona.png" class="align-center" width="100%" alt="Japanese Learnign Materials" caption="I felt the japanese retrieval was a little shobby sometimes, so I made an english backup">}}


Rather than hardcoding personality traits into prompts, I opted to load Sakura’s personality through RAG. A list of hardcoded traits would consume context window tokens and increase the risk of inconsistent behavior. With retrieval, only the relevant personality details are loaded when needed, saving tokens and cost at the expense of a small increase in retrieval latency.

Sakura’s personality is intentionally imperfect. Some traits are loosely modeled after my own preferences, such as favourite pokemon `Piplup`!, and favourite food `taikyaki 鯛焼き`! Others were generated and refined with the help of ChatGPT. To test consistency, I asked the same questions repeatedly in different forms and temporarily disabled the RAG system to confirm which responses were grounded and which were purely model generated.

I did consider pushing Sakura further, including more exaggerated character tropes (like a tsundere sensei), but ultimately decided against it. There are content boundaries and moderation considerations that were not worth the overhead. It is something I might revisit in the future, but not for this iteration.

## Expanding Beyond Conversation

Once the core tutoring experience worked, I started experimenting with content. I wanted to incorporate anime and songs, media I already consume regularly, into learning. This led to the YouTube quiz pipeline. Videos were downloaded using yt-dlp, along with subtitles where available. Human generated subtitles were preferred, with autogenerated ones used as a fallback.

I experimented with Whisper for transcription, but while the accuracy was acceptable, the output was too granular. Sentence boundaries became a problem, and since YouTube subtitles already provided reasonable segmentation, I chose the simpler route.

{{< figure src="news.png" class="align-center" width="60%" alt="Japanese Learning Materials - News" caption="A news article would be summarized everyday into ac compact form with kanji explanations!">}}


News content came next. After anime and music, news felt like a natural progression. RSS feeds made retrieval straightforward. The real challenge was deciding how to structure the output. I settled on a format that included a summary, key vocabulary and kanji, and guiding questions to encourage active thinking rather than passive reading.

{{< figure src="sakurashiken.png" class="align-center" width="60%" alt="Sakura Sensei no Shiken" caption="Users following this feed would receive a free news summary and quiz everyday">}}

To support both interaction and passive consumption, I implemented a dual agent architecture. One agent handles personal conversations, while another operates in channels where users can simply follow along without effort.

## Monetization and Tradeoffs

SakuraSensei uses a turn based pricing model. You pay as you use. Subscriptions would have required limits anyway, similar to existing AI services, and this model felt fairer for casual learners.

I had no hesitation adding voice features. The main decision was between providers, weighing cost against voice quality. 

Pricing required careful consideration. Micropayments come with disproportionately high fees (flat 50cents in Singapore for stripe!), so I had to introduce bulk packages to make it more worthwhile for me. I calculated worst case token usage scenarios to ensure sustainability. Payments worked immediately after integrating Stripe, which was a rare and satisfying experience.

## Quizzes, Data, and Learning Design

{{< figure src="animequiz.png" class="align-center" width="60%" alt="Anime Close Question Quiz" caption="Personally, I felt the distractors were really tricky!">}}


Quiz generation relied heavily on JLPT kanji lists matched against subtitle content. Simple Cloze questions alone were not enough. Distractors had to be plausible. I generated options using homophones, similar readings based on edit distance, and same JLPT level fallbacks. This made the quizzes more challenging and hopefully educational.

That said, anime quizzes, while fun, turned out to be less engaging than expected over time. They are enjoyable, but novelty wears off quickly. If I could measure one additional thing, it would be how different quiz formats affect retention. Multiple styles would likely perform better than relying solely on cloze questions.

## Architectural Choices and Constraints

I must admit the tech stack for this project wasn't thoroughly researched. FAISS was chosen for vector search because it is free and open source and META has mantained a rather good impression to me research wise . While hosted solutions offer convenience, I tend to prefer fully open systems. Native SQLite in python powers the database, which is more than sufficient at the current scale. If SakuraSensei ever reaches tens of thousands of users, migrating to PostgreSQL would make sense, but that would be a good problem to have.

Ultimately, this was an exercise in using LangChain’s abstraction. After spending too much time dealing with low level configurations in other projects, having that complexity handled was refreshing. 

## Lessons, Friction, and Reality

Surprisingly, the new libraries I had set out to learn was the least of my problems. Rather, data popluation took so much time and effort. Rate limits, cookies, and data preparation slowed everything down. Fortunately, I never had to remove a feature entirely.

One incorrect assumption I made was overestimating how engaging quizzes alone would be. Fun does not automatically translate to long term retention. 2 months down the road, I myself find myself swiping away when I get the daily 1pm quiz notification from Telegram. If even I, the creator with vested interest, am unable to retain attention, why would it happen to an user? 

## Philosophy and Looking Ahead

I do not believe AI should replace language teachers. At least not for now. Human connection remains central to teaching. SakuraSensei is meant to complement learning by simulating conversation and providing practice, not replacing instructors. Good language learning, to me, means being able to speak, not just read or write.

For now, SakuraSensei is complete. It achieved its primary goal: giving me hands on experience with LangChain and RAG while producing a functional Japanese learning tool. Turning it into a larger business would require marketing, which I do not have time for at the moment.

I am writing this while the project is still fresh in my mind. Before it becomes just another repository, I wanted to capture the thinking, tradeoffs, and lessons that are not obvious from reading the code alone. Building educational AI is hard, especially when you are trying to make learning genuinely enjoyable. Execution matters far more than ideas, and even then, not everything lands the way you expect. Still, I had lots of fun building SakuraSensei.