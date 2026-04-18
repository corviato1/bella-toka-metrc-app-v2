You are a senior full-stack engineer. You will build a COMPLETE, production-ready system with strict security practices.

This is an INTERNAL-ONLY web application for an indoor cannabis cultivation facility. The purpose is to REPLACE the poor METRC UI with a fast, clean, controlled internal interface.

CRITICAL RULES (DO NOT VIOLATE):
- Replit is ONLY for development and code generation. NEVER use Replit for hosting, routing, or production execution.
- Production hosting MUST use Netlify (frontend + serverless functions).
- Database MUST use Neon (PostgreSQL).
- All sensitive operations MUST occur server-side only (Netlify Functions).
- METRC API keys MUST NEVER be exposed to frontend.
- Follow least-privilege and zero-trust principles.
- All endpoints must be authenticated.
- No shortcuts, no mock architecture. Build real structure.

--------------------------------------------------
TECH STACK
--------------------------------------------------

Frontend:
- React (Vite)
- Tailwind CSS (clean, low-eye-strain UI)
- Zustand (state management)
- React Router
- QR/Barcode scanning: use @zxing/browser or html5-qrcode

Backend:
- Netlify Functions (Node.js)
- Neon PostgreSQL
- Drizzle ORM (preferred) OR node-postgres

Security:
- JWT auth (httpOnly cookies)
- Rate limiting
- Input validation (Zod)
- No secrets in frontend
- AES-256 encryption for sensitive stored data (optional but preferred)

Deployment:
- GitHub repo
- Netlify connected to GitHub
- Environment variables configured in Netlify ONLY

--------------------------------------------------
APP PURPOSE
--------------------------------------------------

This app allows internal staff to:
- Track plants
- Move plants between rooms/locations
- Scan METRC tags (barcodes)
- Push updates to METRC via API
- Replace inefficient METRC UI workflows

--------------------------------------------------
CORE FEATURES (MUST BUILD ALL)
--------------------------------------------------

1) AUTHENTICATION SYSTEM
- Login page (email + password)
- JWT session stored in httpOnly cookie
- Role-based access (admin / staff)
- Logout functionality
- Protect all routes

--------------------------------------------------

2) DASHBOARD (HOME)
- Clean, minimal UI
- Dark mode default (low eye strain)
- Show:
  - Total plants
  - Plants per room
  - Recent movements
- Fast load, no clutter

--------------------------------------------------

3) BARCODE SCANNER (PRIMARY FEATURE)

This is the MOST IMPORTANT feature.

FLOW:
- Open scanner page
- Use camera to scan METRC plant tags
- Allow MULTI-SCAN (continuous scanning)
- Display scanned items in a list
- Prevent duplicates
- Show count of scanned plants

UI:
- Large scan viewport
- Clear feedback on successful scan
- List below scanner

CONTROLS:
- "Clear List" button
- "Confirm Location" dropdown
  (example: Veg Room A, Flower Room B, Dry Room, etc.)
- "DONE" button

ON DONE:
- Send batch request to backend:
  {
    plantIds: [],
    newLocation: "string"
  }

BACKEND:
- Validate all plant IDs
- Store movement log in database
- Call METRC API to update plant locations
- Return success/failure per item

--------------------------------------------------

4) LOCATION MANAGEMENT
- Predefined list of rooms/sections
- Stored in database
- Admin can add/edit/remove locations

--------------------------------------------------

5) MOVEMENT HISTORY
- Table view:
  - Plant ID
  - From location
  - To location
  - Timestamp
  - User
- Filter + search

--------------------------------------------------

6) METRC INTEGRATION (SERVER-SIDE ONLY)

- Create Netlify function:
  /api/metrc/move-plants

- This function:
  - Receives plant IDs + location
  - Formats request to METRC API
  - Sends request securely using API key (env variable)
  - Handles rate limits + retries
  - Logs results

- NEVER expose METRC credentials to frontend

--------------------------------------------------

7) DATABASE (NEON)

Tables:

users:
- id
- email
- password_hash
- role
- created_at

plants:
- id
- metrc_tag
- current_location
- created_at

locations:
- id
- name

movements:
- id
- plant_id
- from_location
- to_location
- user_id
- timestamp

--------------------------------------------------

8) API LAYER (NETLIFY FUNCTIONS)

Create endpoints:

/api/auth/login
/api/auth/logout
/api/plants/move
/api/plants/list
/api/locations
/api/movements/history

All endpoints:
- Require authentication
- Validate inputs (Zod)
- Rate limit requests
- Return structured JSON

--------------------------------------------------

9) UI / DESIGN REQUIREMENTS

- Dark theme (charcoal + soft green accents)
- No harsh whites
- Rounded edges
- Smooth transitions
- Large touch-friendly buttons
- Designed for tablets + mobile use inside facility

Think:
- Fast
- Clean
- Zero clutter
- Industrial but modern

--------------------------------------------------

10) SECURITY REQUIREMENTS (MANDATORY)

- No secrets in frontend
- Use environment variables for:
  - DATABASE_URL
  - JWT_SECRET
  - METRC_API_KEY
- Hash passwords (bcrypt)
- Validate ALL inputs
- Sanitize outputs
- No stack traces exposed
- Implement basic rate limiting per IP

--------------------------------------------------

11) PROJECT STRUCTURE

/frontend
  /src
    /components
    /pages
    /store
    /api
    /utils

/netlify
  /functions
    auth.js
    movePlants.js
    metrc.js
    locations.js
    history.js

--------------------------------------------------

12) DEPLOYMENT INSTRUCTIONS (IN README)

You MUST generate a complete README.md that includes:

- Step-by-step setup on Windows using VS Code
- How to run locally
- How to connect Neon database
- How to deploy to Netlify
- How to set environment variables
- How to connect GitHub repo to Netlify
- How to test METRC integration safely

--------------------------------------------------

13) EXTRA (OPTIONAL BUT STRONGLY PREFERRED)

- Offline queue if network fails (store scans locally, retry later)
- Sound/vibration feedback on scan
- Bulk error handling UI
- Loading indicators everywhere needed

--------------------------------------------------

FINAL REQUIREMENT

You must output:
- Full folder structure
- All files with full code (no placeholders)
- Working implementation
- Clean, readable, production-quality code

No partial builds.
No pseudocode.
No skipping steps.

This is a real system replacing METRC workflows.
