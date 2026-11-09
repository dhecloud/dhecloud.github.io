---
title: "Social Food Drawing & Review Web App"
date: 2026-11-08
description: "Mobile web app where friends draw their meals and post them with a rating and review."
---

[Link to App](https://william-app.william-app.workers.dev/)

A social web app for a group of friends to draw their meals and post them with a place, a rating and a review. It runs in the phone browser and can be added to the home screen.

Posts appear in a shared feed with likes, comments and bookmarks. Each user has a profile and a diary calendar of what they ate each day. The design was revised over several rounds based on the client's feedback.

## Technologies Used

**Frontend:**
- React with TypeScript and React Router
- Vite
- Canvas drawing with touch and pinch-to-zoom
- Web app manifest for home screen install

**Backend & Data:**
- Supabase for authentication, Postgres database and image storage
- Row Level Security policies
- SQL migrations and database triggers

**Integrations & Deployment:**
- Photon (OpenStreetMap) for place search
- Cloudflare Workers for hosting

## Key Features

**Drawing & Posting:**
- Drawing canvas with colour palette, pen size, undo, clear and zoom
- Place search, store name, meal tag, rating and review
- Backdating a post to the day the meal was eaten
- Edit window after posting

**Social:**
- Chronological feed with likes, comments and bookmarks
- Profiles with bio, followers and following lists
- User search by name
- Diary calendar showing the drawings for each day

**Account Management:**
- Email sign up with terms agreement
- Post reporting
- Account deletion that removes the user's data and files
