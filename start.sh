#!/bin/bash
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "[start.sh] Running DB migrations..."
  node server/migrate.js
  echo "[start.sh] Migrations complete."
fi

set +e

node server/index.js &
BACKEND_PID=$!

sleep 2

cd frontend && npm run dev

kill $BACKEND_PID 2>/dev/null
