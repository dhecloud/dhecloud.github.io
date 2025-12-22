# Portfolio — Hugo + PaperMod (Single Page)

Minimal single-page portfolio. All sections render on index.html, blog posts link out to individual pages.

## Structure

```
portfolio/
├── hugo.toml                     # Site config
├── layouts/
│   ├── index.html                # Custom single-page homepage
│   └── blog/
│       └── single.html           # Blog post template
├── assets/css/extended/
│   ├── custom.css                # Homepage styles
│   └── blog.css                  # Blog post styles
├── content/
│   ├── _index.md                 # About section (top of page)
│   ├── projects.md               # Projects section
│   ├── publications.md           # Publications section
│   └── blog/
│       ├── _index.md
│       └── *.md                  # Blog posts
├── static/images/
│   ├── profile.png               # Your photo (optional)
│   └── blog/                     # Blog post images
└── themes/PaperMod/              # Theme (add via submodule)
```

## Homepage layout

```
┌─────────────────────────────┐
│     Andrew Koh              │
│     email                   │
│     [profile image]         │
│     [social icons]          │
├─────────────────────────────┤
│     About text...           │
├─────────────────────────────┤
│     Projects                │
│     • Project 1             │
│     • Project 2             │
├─────────────────────────────┤
│     Blog                    │
│     🎌 Post Title - summary │
│     🔊 Post Title - summary │
├─────────────────────────────┤
│     Publications            │
│     Paper 1...              │
│     Paper 2...              │
└─────────────────────────────┘
```

## Setup

### 1. Install Hugo

```bash
brew install hugo        # macOS
sudo apt install hugo    # Linux
```

### 2. Add theme

```bash
cd portfolio
git init
git submodule add --depth=1 https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
```

### 3. Configure

Edit `hugo.toml`:
- `baseURL` → your GitHub Pages URL
- `params.socialIcons` → your LinkedIn, etc.

Optionally add profile image:
- Add `static/images/profile.png`
- Add to `hugo.toml`: `[params] profileImage = "/images/profile.png"`

### 4. Preview locally

```bash
hugo server -D
# http://localhost:1313
```

### 5. Deploy

```bash
git add .
git commit -m "Initial commit"
git remote add origin git@github.com:dhecloud/dhecloud.github.io.git
git push -u origin main
```

GitHub → Settings → Pages → Source: **GitHub Actions**

## Writing blog posts

Create `content/blog/your-post.md`:

```markdown
---
title: "Your Post Title"
date: 2025-01-20
emoji: "🚀"
summary: "One-line description shown on homepage."
tags: ["Tag1", "Tag2"]
---

Your content here. Markdown supported.

![Image](/images/blog/your-image.png)
```

The emoji + title + summary appear on the homepage. Full content lives on `/blog/your-post/`.

## Customization

- **Add/remove sections**: Edit `layouts/index.html`
- **Styling**: Edit `assets/css/extended/custom.css`
- **Profile image**: Set `params.profileImage` in `hugo.toml`
- **Social links**: Edit `params.socialIcons` in `hugo.toml`
