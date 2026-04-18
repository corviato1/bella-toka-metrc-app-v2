#!/bin/bash
set -e

echo "[post-merge] Installing root npm deps..."
npm install --no-audit --no-fund

echo "[post-merge] Installing frontend npm deps..."
(cd frontend && npm install --no-audit --no-fund --legacy-peer-deps)

echo "[post-merge] Running DB migrations..."
node server/migrate.js

echo "[post-merge] Done."
