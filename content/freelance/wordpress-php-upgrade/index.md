---
title: "Legacy WordPress PHP Upgrade & Plugin Modernisation"
date: 2026-11-02
description: "PHP, WordPress core and plugin upgrade for a healthcare organisation's website, tested on a copy before going live."
---

PHP upgrade for a healthcare organisation's WordPress website, done for a digital agency. The site ran on an unsupported PHP version with many outdated plugins.

The live site was copied locally and run on both PHP versions to compare pages, forms, scheduled tasks and outgoing emails. One bundled plugin broke the homepage on the new version, so I patched it. The update went live outside office hours, followed by a report listing every update and what it fixed.

## Technologies Used

**Platform:**
- WordPress, PHP, MySQL
- WP-CLI for core, plugin and theme updates

**Testing:**
- PHPCompatibility scan and PHP lint across the codebase
- Local copy of the site run on both PHP versions
- Screenshot comparison on desktop and mobile
- Fake mail server to compare outgoing emails

**Hosting:**
- Managed WordPress hosting with staging, backups and a PHP version manager

## Key Features

**Upgrade:**
- Backup and password-protected staging site before any change
- WordPress core, theme and plugin updates, including security fixes
- Patch for a legacy plugin that failed on the new PHP version
- Live change outside office hours with a rollback plan

**Verification:**
- Page-by-page output comparison between old and new PHP
- Checks of the contact form, appointment booking, editor saves and scheduled tasks

**Reporting:**
- Before and after version report
- Written report of every update, what it fixed, and issues found
