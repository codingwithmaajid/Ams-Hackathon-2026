# Jolly landing

Public landing page for Jolly, built in Google AI Studio by maj. One hero section, and the Demo button opens the console's `/call` page.

```bash
cd landing
npm install
npm run dev     # http://localhost:3000
npm run build   # static output in dist/
```

Env (optional, defaults shown in `.env.example`): `VITE_API_URL` (backend), `VITE_CONSOLE_URL` (console).

Deploy: a Render static site with root `landing`, build `npm install && npm run build`, publish `dist`.
