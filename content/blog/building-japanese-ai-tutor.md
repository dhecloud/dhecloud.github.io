---
title: "Building a Japanese AI Tutor with RAG"
date: 2025-01-15
emoji: "🎌"
summary: "Notes on building SakuraSensei—context-aware conversation, multi-dataset retrieval, and cloze generation from YouTube."
tags: ["LLM", "RAG", "LangChain"]
---

Content of your blog post goes here.

## Section heading

You can include images:

![Description](/images/blog/example.png)

And code:

```python
from langchain.chains import ConversationalRetrievalChain

chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=vectorstore.as_retriever(),
)
```
