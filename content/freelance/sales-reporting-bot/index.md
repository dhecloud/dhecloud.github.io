---
title: "Automated POS Sales Reporting Pipeline"
date: 2026-02-20
---

An automated sales reporting pipeline deployed for Alpine United, an F&B operator. The system scrapes live sales figures from multiple bar venues and delivers them to management via Telegram, eliminating manual POS checks during service hours.

The pipeline logs into two separate POS platforms (Qashier HQ and Getz) using headless Chrome, exports sales CSVs, parses the figures, and delivers formatted updates to authorized Telegram users on a rolling 30-minute schedule, time-gated to each venue's operating hours.

## Technologies Used

**Bot & Scheduling:**
- Python with python-telegram-bot for command handling and job scheduling
- Docker for containerized deployment

**Scraping:**
- Selenium with headless Chrome for automated POS dashboard login and CSV export
- Multi-account scraping across configurable POS dashboards

## Key Features

**Automated Reporting:**
- Scrapes Qashier HQ and Getz dashboards on a 30-minute interval
- Parses downloaded CSVs to extract gross/total sales figures
- Sends consolidated updates to a configurable list of Telegram users and groups

**Time-Gated Scheduling:**
- POS1 reports active 20:50–00:20 daily
- POS2 reports active Sat/Sun 00:00–04:20 to match weekend night shifts
- `/run_tonight` command for manual override and fallback, auto-expiring at 5am

**Shift-Aware Logic:**
- Determines current shift from wall-clock time
- Matches downloaded CSVs to the correct shift date for accurate reporting

**Safety:**
- Cooldown-protected `/run_once` test command to prevent scraper spam
- Role-based authorization for all commands
