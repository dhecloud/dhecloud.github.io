---
title: "AI Invoice & Expense Claims Automation"
date: 2026-05-01
aliases:
  - /freelance/telegram-invoice-claims-bot/
---

A production document processing system deployed for Alpine United, an F&B operator, with a Telegram interface for staff to forward bills, delivery orders, and expense receipts. Both pipelines (supplier invoice ingestion and staff expense claims) send the images and PDFs to Claude, which extracts structured data via forced tool use, eliminating manual data entry across both workflows.

When a staff member forwards a photo or PDF, the system identifies the document type and company, extracts key fields (supplier, date, total, GST breakdown, line items), checks for duplicates, and files the document to the appropriate Google Drive folder while logging it to Google Sheets. The claims pipeline adds per-staff identity tracking, live FX conversion for non-SGD receipts, and an auto-refreshing daily expense summary tab on the claims sheet.

## Technologies Used

**Backend & Bot Framework:**
- Python with python-telegram-bot (async, job queue) for conversation-driven workflows
- Pydantic for structured data validation

**AI & Extraction:**
- Anthropic Claude API with forced tool use for structured JSON extraction from images and PDFs

**Data & Integrations:**
- Google Sheets API for bill logging and expense claim tracking
- Google Calendar API for staff roster synchronization
- SQLite for local bill and claim records
- frankfurter.app for live FX rate conversion on non-SGD receipts

**Deployment:**
- systemd service with a watchdog shell script on Linux

## Key Features

**Invoice Processing Pipeline:**
- Accepts JPEG, PNG, WebP, and PDF files sent to configured Telegram chats
- Claude extracts supplier name, document type, company, invoice date, total, GST, and line items
- Routes documents to per-company, per-type Google Drive folders (Supplier Bill, Delivery Order, Confidential, Urgent)
- Duplicate detection with staff confirmation prompt before filing
- Low-confidence extractions surfaced for staff review before committing

**Staff Expense Claims Pipeline:**
- Supergroup topic routing by claim category (meals, transport, miscellaneous) and company
- Per-claim serial numbers with Drive upload, Sheets row tracking, and inline field editing via reply buttons
- Supporting document attachments filed as numbered Drive files against the parent claim
- FX conversion for non-SGD receipts using live exchange rates
- `/myclaims` browser with pagination, unpaid-only filter, and keyword search
- Daily expense summary tab auto-rebuilt on each new, edited, or deleted claim

**Staff Identity and Roster:**
- Telegram user IDs bound to canonical staff names sourced from a Staff Google Sheet
- Unregistered users prompted for identity before a claim is processed
- Staff bindings and roster synced daily at midnight from Google Calendar and Sheets
