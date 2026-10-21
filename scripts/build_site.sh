#!/usr/bin/env bash
# One static site for jolly.golnk.in:
#   /        -> landing/   (Demo button -> /home/call)
#   /home/*  -> frontend/  (advocate console)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/site-dist"
API="${VITE_API_URL:-https://jolly-backend-poqc.onrender.com}"
rm -rf "$OUT"

(cd "$ROOT/landing" && npm ci && VITE_API_URL="$API" VITE_CONSOLE_URL="/home" npm run build)
(cd "$ROOT/frontend" && npm ci && VITE_API_URL="$API" VITE_BASE="/home/" npm run build)

cp -r "$ROOT/landing/dist" "$OUT"
cp -r "$ROOT/frontend/dist" "$OUT/home"
# SPA fallback for the console (Cloudflare Pages / Netlify style; ignored elsewhere)
printf "/home/*  /home/index.html  200\n" > "$OUT/_redirects"
echo "Built $OUT (landing at /, console at /home/)"
