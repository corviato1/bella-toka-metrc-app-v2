# GrowTrack — Internal Cannabis Plant Management System

## Overview
This is an internal web application for cannabis cultivation facilities. It replaces the METRC UI with a fast, clean, tablet-friendly interface for tracking plants, scanning barcodes, moving plants between rooms, and syncing with the METRC compliance API.

## Architecture

### Frontend (`/frontend`)
- **React 18** + **Vite** (port 5000)
- **Tailwind CSS** — dark theme, charcoal + sage green palette
- **Zustand** — auth state management with localStorage persistence
- **React Router v6** — client-side routing
- **@zxing/browser** — barcode/QR camera scanning

### Backend (`/server`)
- **Express.js** — API server running on port 8888
- **PostgreSQL (Neon)** — via `pg` package
- **JWT** — authentication via Bearer tokens + httpOnly cookies
- **bcrypt** — password hashing
- **Zod** — request validation
- **express-rate-limit** — rate limiting

### Netlify Functions (`/netlify/functions`)
Production serverless functions for Netlify deployment:
- `auth.js` — login/logout
- `movePlants.js` — plant movement + METRC API sync
- `locations.js` — CRUD for facility locations
- `history.js` — movement history

## Pages
- `/login` — Authentication
- `/` — Dashboard (stats, recent movements, quick actions)
- `/scanner` — Barcode scanner + batch plant movement
- `/locations` — Manage facility rooms/sections (admin only for edits)
- `/history` — Movement history with search and pagination

## Database Schema
- `users` — staff accounts with roles (admin/staff)
- `plants` — METRC-tagged plants with current location
- `locations` — predefined facility rooms/sections
- `movements` — full audit trail of plant movements

## Environment Variables
```
DATABASE_URL=postgresql://...neon.tech/...
JWT_SECRET=your-long-random-secret
METRC_API_KEY=your-metrc-vendor-api-key
METRC_LICENSE_NUMBER=your-license
ADMIN_EMAIL=admin@facility.com
ADMIN_PASSWORD=your-password
```

## Development Setup
1. Set `DATABASE_URL` in Replit secrets
2. Run `node server/setup-admin.js` to create the first admin user
3. The app starts automatically with `bash start.sh`
   - Backend: `http://localhost:8888`
   - Frontend: `http://0.0.0.0:5000`

## Production Deployment (Netlify)
1. Connect GitHub repo to Netlify
2. Build settings: base=`frontend`, command=`npm run build`, publish=`dist`
3. Set environment variables in Netlify dashboard
4. Run `node server/setup-admin.js` pointing to Neon DB to seed admin user

## Security Notes
- METRC API key is never exposed to frontend
- All API endpoints require JWT authentication
- Passwords hashed with bcrypt (cost factor 12)
- Rate limiting on all endpoints (stricter on auth)
- Input validation with Zod on all endpoints
