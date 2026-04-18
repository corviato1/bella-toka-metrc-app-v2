#!/bin/bash
# Start backend API server
node server/index.js &
BACKEND_PID=$!

# Start frontend dev server
cd frontend && npm run dev

# If frontend exits, kill backend too
kill $BACKEND_PID 2>/dev/null
