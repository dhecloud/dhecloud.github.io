---
title: "Building FaceChangerGIFBot: Reflections on Shipping a Side Project
"
date: 2025-11-18
draft: False
tags: ["Machine Learning", "Computer Vision", "Side Project"]
summary: "What started as a joke about my friend became a lesson in product thinking, user behavior, and the quiet satisfaction of finishing something"
---

## Why I Built It in the First Place

It all started with a research demo on X. I follow a few accounts that tweet about interesting developments in Computer Vision, and I saw a clip of a realistic face swap that preserved subtle facial expressions - even the nuance of a raised eyebrow! I had just finished watching snippets of RuPaul’s Drag Race funny moments, and the thought hit me immediately: "It would be hilarious if that was my friend."

That's it. No grand vision. No market analysis. Just the mental image of my friend dramatically side-eyeing the camera in a blonde wig, and the certainty that it would be hilarious.

The joke landed. My friends loved it. And somewhere between the laughter and the "do me next" requests, a thought crept in: *what if this could actually be a thing?*


{{< giflike src="punggol.mp4" caption="one of the earliest gifs to be swapped" width="60%">}}



I threw together a quick MVP — a Telegram bot that could swap faces in short GIFs, running inference on my desktop GPU. Nothing too fancy. Just enough to see if the idea had legs.

It did. The moment my friends started using it of their own volition, I realised I could try to monetize this.

---

## Wearing Every Hat


{{< giflike src="wicked.mp4" caption="Where's my magic hat?" width="60%">}}

Here's what no one tells you about solo projects: most of the work isn't coding.

Coding, in contrast, was probably the easiest for me. I was the designer figuring out how the bot should respond to edge cases. The QA tester catching my own bugs. The support person answering "why isn't this working?" messages at odd hours.

And then there was marketing — something I'd never had to think about in research. Papers generally don't need to be advertised (thought in this day and age people do talk about their research online). Bots competing for attention on Telegram do.

This was nothing like academic work. In research, you optimize for novelty and rigor. Here, I was optimizing for "Does this confuse people?" and "Can anyone actually find this?" Filling this gap was frustrating, and self-doubt littered every step. "Am I doing this right?" When I tried to share clips of funny swaps on TikTok, I was often flagged for "unoriginal content." That led me down a unfruitful rabbit hole of trying to beat the filters using geometric transformations.


---

## Building for Real Users Changes Everything


People didn't use the bot the way I expected. Some wanted to insert themselves into music videos. Others wanted to prank colleagues. A few... well, let's just say I learned very quickly why content moderation pipelines exist.

I had to think about things that never crossed my mind during development: What happens when someone uploads NSFW content? What if the face detection fails silently? What if someone tries to use this for something genuinely harmful? Where do I draw that line of censorship and moderation?



{{< giflike src="anaconda.mp4" caption="my anaconda don't.. but my bot does!" width="80%">}}

Every new feature request was a window into how differently people think. Some thought the process was too complicated; others thought it was just right. And, of course, everyone wanted it faster and free.

---

## What Went Better Than Expected

The sweet spot surprised me.

When the swaps worked, they hit this perfect uncanny valley - real enough to be funny, fake enough to be obviously a joke. My friends would share results in group chats, and the reactions were exactly what I'd hoped for: confused laughter, mock outrage, demands for more.

The bot stayed stable mostly (except when i was using the GPU to game or other work). The architecture, scrappy as it was, held up well enough to add features without rewriting everything. These aren't glamorous wins. No one writes blog posts about "my webhook didn't crash." But after enough late nights debugging production issues, I learned to appreciate boring reliability.

---

## What I'd Do Differently


{{< giflike src="gaaay.mp4" caption="GEI DESU!" width="50%">}}


If I could go back:

**Logging and monitoring from day one.** I spent too many hours squinting at error messages that could have been obvious with proper observability. "Something went wrong" is not a useful log entry. In addition, capturing user activity early could maybe helped me retain more users via marketing messages.

**Document decisions, not just code.** Six months later, I'd look at a design choice and have no idea why I made it. Was it a constraint? A preference? A 2am decision I forgot about? Writing down the "why" matters more than I thought. I ended up doing this via notetaking on notetaking.

**Think about abuse earlier.** Content moderation wasn't an afterthought, but it wasn't a first thought either. Users will find every edge case you didn't consider, and some of them will be trying to. I implemented NSFW detection as soon as i realised this, and I am rather confident that nothing got through the detection.

**A clearer business model.** The premium tiers worked, but I never figured out the right balance between free usage and paid features. More experimentation early would have helped.

**Market more** I think marketing is important. I managed to get word out via word of mouth. But most users were just free users and not paying users.

---

## Research vs. Shipping


In research, you optimize for novelty. You write for reviewers who will scrutinize your methodology. Feedback comes months later, filtered through peer review.

Here, feedback was instant and unfiltered. Users didn't care about my architecture decisions. They cared whether the bot worked. "Your model has interesting properties" means nothing when someone's face swap looks like a melted candle. And once users leave, they likely do not come back.

There's a different kind of satisfaction in shipping. Less prestige, maybe, but more tangible. You can watch someone use your work in real-time. You know they liked it when they perform another swap.

I wouldn't trade my research background; I enjoyed the rigor and it gave me the skills to build this. But shipping taught me something papers never could: the gap between "it works on my machine" and "it works for everyone" is where most of the learning happens.

---


## What This Project Gave Me


The strangest part was watching my code become part of other people's days.

Someone would swap once every morning at 10am. Some loved Katy Perry music videos. Some actually took it upon themselves to bypass the content moderation filters. Some would go on a swapping spree from morning till night. My bot was a small, weird piece of their social lives.

At some point, I stopped adding features. Not because the bot was perfect; it wasn't. But I'd reached a point where the returns were diminishing and I felt my attention was better allocated elsewhere..

{{< giflike src="mariah.mp4" caption="It's timeeeee!" width="50%">}}

Research trains you to go deep. This trained me to go wide. I learnt to design a product with the user experience in mind. I learned that real learning sticks when it's attached to real stakes. Every debugging session, every user request, every payment integration headache - they taught me that I only had one chance to gain a customer.



---

## Looking Forward

{{< giflike src="fitness_swap.mp4" caption="this gets me every time" width="50%">}}

This project changed how I think about building things.

While I didn't make much money from this bot, I had a blast of a time creating it. And hopefully my users had their share of laughter too. As of writing, I have around 127 monthly active users, which is more than what I had ever expected.

I will probably leave FaceChangerGIFBot running for the time being. Though current advances has allowed services like Higgsfields to produce a much more realistic face swap, I believe my bot serves the perfect combo of confusion, incredulality, realisticness and comedy. 

FaceChangerGIFBot started as a joke about my friend. It turned into a crash course in product development, user behavior, and the quiet satisfaction of finishing something.

Not bad for a side project.

---

*Try the bot [here](http://t.me/FaceChangerGIFBot) or check out [my portfolio](https://dhecloud.xyz).*
