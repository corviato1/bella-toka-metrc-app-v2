# Bella Toka — Cannabis Plant Management System

## Overview
Internal web app for Bella Toka's cannabis cultivation facility. Designed for two users (mike, carmen) on a tablet in landscape mode. Provides three focused pages for daily operations: reporting biowaste, moving plants with a barcode scanner, and viewing where all plants are located. Syncs with METRC compliance API.

## Architecture

### Frontend (`/frontend`)
- **React 18** + **Vite** (port 5000)
- **Tailwind CSS** with `darkMode: 'class'` — dark/light theme toggle persisted in localStorage
- **Zustand** — auth + theme state with localStorage persistence
- **React Router v6** — 3 page routes
- **@zxing/browser** — camera barcode scanning on Move Plants page

### Backend (`/server`)
- **Express.js** — API server on port 8888 (starts after DB migrate in `start.sh`)
- **PostgreSQL (Neon)** — via `pg` package
- **JWT** — authentication via Bearer tokens + httpOnly cookies
- **bcrypt** — password hashing (cost 12)
- **multer** — photo upload for biowaste reports (saved to `server/uploads/`)
- **Zod** — request validation
- **express-rate-limit** — rate limiting

## Pages (3 total, no-scroll, tablet landscape)
- `/login` — Authentication with Bella Toka branding + theme toggle
- `/` — **Report Biowaste**: Camera capture, location dropdown, weight input, METRC submission
- `/move` — **Move Plants**: Barcode scanner + manual tag entry, group move to location
- `/where` — **What is Where**: Section cards with plant counts and last movement time, METRC sync

## Navigation
Single top bar (no sidebar):
- Left: Bella Toka wordmark (BT logo)
- Center: 3 tab buttons
- Right: Theme toggle (sun/moon) + user dropdown (logout)

## Database Schema
- `users` — mike and carmen (equal privileges)
- `plants` — METRC-tagged plants with current location
- `locations` — facility rooms/sections
- `movements` — full audit trail of plant moves (used for "What is Where" timestamps)
- `biowaste_reports` — timestamped biowaste submissions with photo path
- `sync_log` — tracks when METRC syncs last happened

## Server Routes
- `POST /api/auth/login` — username + password → JWT
- `GET /api/plants/summary` — per-location plant count + last movement time (powers "What is Where")
- `POST /api/plants/move` — move plant tags to new location (records movements)
- `GET /api/locations` — list all locations
- `GET /api/metrc/locations/sync` — pull locations from METRC → upsert local DB
- `GET /api/metrc/plants/sync` — pull plants from METRC → upsert local DB
- `POST /api/metrc/move` — proxy plant moves to METRC API
- `POST /api/metrc/biowaste` — proxy biowaste report to METRC API
- `POST /api/biowaste/photo` — multipart photo upload (saved to server/uploads/)
- `POST /api/biowaste/report` — save biowaste record to DB

## Environment Variables
```
DATABASE_URL=postgresql://...neon.tech/...
JWT_SECRET=your-long-random-secret
MIKE_PASSWORD=override-dev-password   (default: x)
CARMEN_PASSWORD=override-dev-password (default: x)
METRC_API_KEY=your-metrc-vendor-api-key
METRC_LICENSE_NUMBER=your-facility-license
METRC_BASE_URL=https://api-ca.metrc.com  (default, adjust per state)
```

## Development Setup
1. Set `DATABASE_URL` and `JWT_SECRET` in Replit secrets
2. `bash start.sh` — runs migrations then starts both servers
   - Backend: `http://localhost:8888`
   - Frontend: `http://0.0.0.0:5000`
3. Login with `mike` / `x` or `carmen` / `x`

## METRC Notes
- METRC API key is never sent to the frontend — all METRC calls are proxied through Express
- When `METRC_API_KEY`/`METRC_LICENSE_NUMBER` are not set, sync/submit endpoints return 503 with a clear message; the app continues to work locally without METRC
- "What is Where" auto-syncs from METRC once every 7 days (checked in localStorage); manual Sync button available

## Security
- METRC credentials only in server env — never exposed to browser
- All non-auth endpoints require JWT
- Passwords hashed with bcrypt (cost 12)
- Rate limiting: 500 req/15min globally, 20 req/15min on auth
- Input validation with Zod on all write endpoints
