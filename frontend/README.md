# Jolly console

Web console for Jolly, the voice clerk for Indian litigation advocates. It is a
thin client: every matter, brief line, citation, answer and call event on screen
is read live from the Jolly FastAPI backend. Nothing is hardcoded.

| Page | Backend calls |
| --- | --- |
| **Today** (`/`) | `GET /briefs/daily[?date=]` |
| **Matters** (`/matters`) | `GET /cases` |
| **Matter** (`/matters/:id`) | `GET /cases/{id}`, `/brief`, `/timeline`, `/tasks`, `/documents`, `GET /cases/{id}/search`, `POST /cases/{id}/ask`, `POST /cases/{id}/documents` |
| **Call** (`/call`) | `POST /call`, `GET /call/{id}` (polled), `GET /bolna/executions/recent` (every 4s) |
| **How it works** (`/how`) | none |

The header pings `GET /health`. On Render's free plan the API sleeps when idle
and takes about a minute to wake; the console shows a "waking up" state and
keeps retrying for two minutes before offering a manual retry.

## Run locally

```bash
# backend, from the repo root
SEED_DEMO_DATA=true uv run uvicorn backend.main:app --port 8000

# console
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:8000
npm ci
npm run dev                 # http://localhost:5173
```

The backend's default `CORS_ORIGINS` allows `http://localhost:5173` (dev) and
`http://localhost:4173` (`npm run preview`). In production set `CORS_ORIGINS`
on the backend to the console's URL.

## Build

```bash
npm run build   # tsc -b && vite build -> dist/
```

`VITE_API_URL` is baked in at build time.
