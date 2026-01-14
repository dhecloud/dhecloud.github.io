---
title: "Telegram Bottle Management System"
date: 2025-12-12
---

[Link to Bot](http://t.me/rhbottlebot)


A production-ready inventory management system built to track stored customer items through Telegram. The bot provides staff with an intuitive Telegram interface for managing item storage, retrieval, and expiration tracking, while automatically notifying customers through WhatsApp when their items are stored or ready for collection.

The system combines the convenience of Telegram's messaging platform for internal operations with WhatsApp Business API for customer-facing communications, backed by cloud-based spreadsheet storage for data persistence and accessibility.

## Technologies Used

**Backend & Bot Framework:**
- Python 3.11 with python-telegram-bot v20.7 for conversation-driven workflows
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
- Adjust quantities for existing inventory entries

**Customer Communication:**
- Automated WhatsApp notifications when items are stored or ready for collection
- PDPA (Personal Data Protection Act) compliance with opt-in consent tracking
- Delivery failure monitoring and activity history logging
- Pre-approved message templates for consistent communication

**Administrative Tools:**
- Role-based access control with authorized user management
- Photo documentation for storage and retrieval proof
- Multi-field data tracking including timestamps, staff operators, and status changes
- Conversation-based UI with inline keyboards for streamlined workflows

**Data Management:**
- 14-field comprehensive records for each inventory item
- Active/Removed status tracking with audit trail
- Synchronized data between Google Sheets, SQLite, and local storage
- Singapore-focused phone number handling with international format support

