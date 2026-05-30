# Freelance page handoff prompt

**How to use:** When adding a new freelance project to `content/freelance/`, paste the prompt below into an agent running in that project's repo. The agent will read the project source, ask for any missing details (date, client name permission, live URL), and produce a directory slug plus an `index.md` you can paste into this repo at `content/freelance/<slug>/index.md`.

Update this file when the freelance section's format changes (new sibling pages establish patterns worth referencing).

---

You're drafting a public-facing "freelance project" page for the owner of this project, to be published on their personal Hugo site at dhecloud.xyz. It will live alongside existing siblings under `content/freelance/`: `telegram-bottle-system`, `enterprise-wordpress`, `product-launch-landing-page`, `sales-reporting-bot`, `telegram-invoice-claims-bot`. (Folder slugs may still mention "telegram"; the published titles do not. Lead with capability in the title, see style constraints below.)

## Your deliverable

At the end of your response, output one code block containing:
1. A short kebab-case directory slug for this project (e.g. `inventory-dashboard`, `realtime-sync-bot`).
2. The full contents of the `index.md` to be saved at `content/freelance/<slug>/index.md` in the dhecloud.xyz repo.

The user will copy your output into the dhecloud.xyz repo themselves. Do not attempt to write to any external path.

## How to gather the information

Read the actual project source: README, package manifests (package.json, requirements.txt, pyproject.toml, etc.), entry points, deployment config, any docs. Ground every claim in what the code actually does, not marketing speculation. If you need information that isn't in the repo (project completion date, whether the client name can be public, the live URL), ask the user before drafting.

## Format

Frontmatter:
```
---
title: "Short descriptive title"
date: YYYY-MM-DD
---
```

Body structure:
- Optional link line at the top for live products: `[Link to X](url)`
- One or two short paragraphs: what it does, the problem it solves, any notable architectural choice. Plain prose.
- `## Technologies Used` with **bolded sub-category lines** (e.g. **Backend & Bot Framework:**, **Data & Integrations:**, **Deployment:**) and bulleted items under each. For very small projects, skip sub-categories and use one flat list.
- `## Key Features` with the same bolded sub-category pattern. For multi-client roles, replace with `## Featured Projects` + `## Key Responsibilities` (see the WordPress example).

## Style constraints

- **Lead with the capability or domain, not the interface platform.** When the substance is AI extraction, automation, integrations, or a domain problem, that goes in the title. Interface platforms (Telegram, Slack, web form, etc.) are interface choices and belong in the body as a detail, not in the title. Repeating an interface name across entries flattens the freelance page into "X-platform developer," which the owner is not.
- **No emdashes (—) in prose.** Use commas, colons, periods, or parens instead. Strong user preference.
- **No software versions in tech-stack lists.** Strip language minor versions (`Python 3.11` → `Python`), library versions (`python-telegram-bot v20.7` → `python-telegram-bot`, `Pydantic v2` → `Pydantic`), model version tags (`claude-sonnet-4-6` → `Claude`), and "(latest version)" parentheticals. Versions age fast; the stack name carries the meaning. Keep behavioral qualifiers like "async, job queue" that describe *what* is used rather than *which version*.
- No marketing fluff: avoid "cutting-edge", "innovative", "scalable", "robust" unless backed by a specific claim.
- No invented metrics. If the code doesn't show a number, don't write one.
- No secrets leaked: no API keys, credentials, internal URLs, customer-data schemas, even in passing.
- Client names: match the existing pattern (some entries name clients, some are generic). If you're unsure whether the client name is public, ask. Default to generic.

## Reference examples (all currently published, copy the closest shape)

### Multi-channel operations system — `telegram-bottle-system/index.md`
```
---
title: "Bottle Storage & Customer Notification System"
date: 2025-12-12
---

[Link to Bot](http://t.me/rhbottlebot)

A production inventory and notification system for tracking customer-stored items at bars. Staff manage storage, retrieval, and expiration through a Telegram interface, while customers receive automated WhatsApp messages when their items are stored or ready for collection.

The system pairs internal staff operations with customer-facing communications via the WhatsApp Business API, backed by cloud-based spreadsheet storage for data persistence and accessibility.

## Technologies Used

**Backend & Bot Framework:**
- Python with python-telegram-bot for conversation-driven workflows
- Flask + Waitress for webhook handling
- Docker & Docker Compose for containerized deployment

**Data & Integrations:**
- Google Sheets API for primary data storage and collaborative access
- SQLite for local consent tracking and delivery logging
- Meta WhatsApp Cloud API for customer notifications
- phonenumbers library for international phone validation and normalization

**Deployment:**
- Multi-process Docker container running both webhook server and bot polling
- Persistent volume mapping for photo storage and database
- Timezone-aware for accurate timestamp tracking

## Key Features

**Core Management Operations:**
- Add and register new stored items with auto-generated serial numbers
- Search and filter active inventory by customer name, phone, or serial number
- Remove items from storage with staff accountability tracking
- Extend expiration dates for items with time-limited storage policies

**Customer Communication:**
- Automated WhatsApp notifications when items are stored or ready for collection
- PDPA (Personal Data Protection Act) compliance with opt-in consent tracking
- Delivery failure monitoring and activity history logging

**Administrative Tools:**
- Role-based access control with authorized user management
- Photo documentation for storage and retrieval proof
- Conversation-based UI with inline keyboards for streamlined workflows
```

### Scheduled automation pipeline — `sales-reporting-bot/index.md`
```
---
title: "Automated POS Sales Reporting Pipeline"
date: 2026-02-20
---

An automated sales reporting pipeline deployed for Alpine United, an F&B operator. The system scrapes live sales figures from multiple bar venues and delivers them to management via Telegram, eliminating manual POS checks during service hours.

The pipeline logs into two separate POS platforms using headless Chrome, exports sales CSVs, parses the figures, and delivers formatted updates to authorized Telegram users on a rolling 30-minute schedule, time-gated to each venue's operating hours.

## Technologies Used

**Bot & Scheduling:**
- Python with python-telegram-bot for command handling and job scheduling
- Docker for containerized deployment

**Scraping:**
- Selenium with headless Chrome for automated POS dashboard login and CSV export

## Key Features

**Automated Reporting:**
- Scrapes POS dashboards on a 30-minute interval
- Parses downloaded CSVs to extract gross/total sales figures
- Sends consolidated updates to a configurable list of Telegram users and groups

**Time-Gated Scheduling:**
- Reports active during configured operating windows
- `/run_tonight` command for manual override and fallback, auto-expiring at 5am

**Safety:**
- Cooldown-protected `/run_once` test command to prevent scraper spam
- Role-based authorization for all commands
```

### Multi-client role pattern — `enterprise-wordpress/index.md`
```
---
title: "Enterprise WordPress Development & Maintenance"
date: 2025-05-01
---

Lead developer for high-traffic organizational websites, focusing on security, performance optimization, and UI/UX consistency.

## Featured Projects

**[SATA CommHealth](http://sata.com.sg/)** (2025)
- Large-scale healthcare organization website
- Security hardening and performance optimization

**[Tanjong Pagar Town Council](https://www.tptc.org.sg/)** (2025)
- Government organization website
- Accessibility compliance and responsive design

## Key Responsibilities

**Development:**
- Custom WordPress theme development
- Plugin integration and customization
- Performance optimization for high-traffic sites

**Security & Maintenance:**
- Regular security audits and updates
- Backup and disaster recovery planning

## Technologies Used

- WordPress
- PHP, JavaScript, HTML5, CSS3
- MySQL database optimization
- Security plugins and hardening
```

### Single deliverable — `product-launch-landing-page/index.md`
```
---
title: "Product Launch Landing Page"
date: 2025-12-15
---

Developed a high-conversion, "rebellious" aesthetic landing page using Tailwind CSS. Integrated Stripe API for secure, seamless payment processing.

## Technologies Used

**Frontend:**
- Tailwind CSS for custom styling and responsive design

**Payment Integration:**
- Stripe API for payment processing
- Secure checkout flow

## Key Features

- Custom design aesthetic optimized for conversion
- Fully responsive layout across all devices
- Stripe integration for seamless payment processing
```

## Starting steps

1. Read the README and main entry point(s) to understand what this project is.
2. Read package manifests and deployment configs to enumerate the tech stack.
3. Ask the user for: project completion date, client public-name permission, live URL if any.
4. Pick the example shape (multi-channel operations, automation pipeline, multi-client role, single deliverable) that best matches.
5. Draft the markdown, run it past the constraints (capability-led title, no emdashes, no versions, no fluff, no invented numbers), output the slug + `index.md` in one fenced block.
