# Jolly landing

Public landing page for Jolly, built in Google AI Studio by maj. One hero section; the Demo button opens the console (`/home/` on jolly.golnk.in).

```bash
cd landing
npm install
npm run dev     # http://localhost:3000
npm run build   # static output in dist/
```

Env (optional, defaults shown in `.env.example`): `VITE_API_URL` (backend), `VITE_CONSOLE_URL` (console).

Deploy: a Render static site with root `landing`, build `npm install && npm run build`, publish `dist`.

## jolly.golnk.in (landing + console on one domain)

`scripts/build_site.sh` builds the landing page at `/` and the console at `/home/` into `site-dist/`.
Render static site: root = repo root, build `bash scripts/build_site.sh`, publish `site-dist`,
rewrite `/home/*` → `/home/index.html`, custom domain `jolly.golnk.in` (CNAME to the onrender.com host).
