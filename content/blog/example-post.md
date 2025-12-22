---
title: "Example Post: Building a Japanese AI Tutor"
date: 2025-01-15
draft: true
tags: ["LLM", "RAG", "LangChain"]
summary: "Notes on building SakuraSensei, a context-aware Japanese learning bot."
---

This is an example blog post. Delete or rename this file and create your own.

## Adding images

Place images in `/static/images/blog/` and reference them:

```markdown
![Alt text](/images/blog/your-image.png)
```

## Code blocks

```python
from langchain.chains import ConversationalRetrievalChain

chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=vectorstore.as_retriever(),
    memory=memory,
)
```

## Writing workflow

1. Create new `.md` file in `content/blog/`
2. Set `draft: false` when ready to publish
3. Commit and push — GitHub Actions rebuilds the site
