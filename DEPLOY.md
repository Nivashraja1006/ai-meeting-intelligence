# Deployment Guide — Day 9

Deploy the **backend** (Docker) to Render or Fly.io, and the **frontend** to Vercel.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (local dev)
- [Render](https://render.com) or [Fly.io](https://fly.io) account (backend)
- [Vercel](https://vercel.com) account (frontend)
- API keys: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`

---

## 1. Local development with Docker Compose

From the project root:

```bash
docker compose up --build
```

| Service  | URL                    |
|----------|------------------------|
| Backend  | http://localhost:8000  |
| Frontend | http://localhost:5173  |
| API docs | http://localhost:8000/docs |

SQLite data persists in the `meeting_data` Docker volume.

### Backend only (Docker)

```bash
cd backend
docker build -t ai-meeting-api .
docker run -p 8000:8000 --env-file .env -v meeting_data:/app/data ai-meeting-api
```

---

## 2. Deploy backend to Render (recommended)

1. Push this repo to GitHub.
2. In Render: **New → Blueprint** and connect the repo (uses `render.yaml`),  
   **or** **New → Web Service → Docker** with:
   - **Root Directory:** `backend`
   - **Dockerfile Path:** `Dockerfile`
3. Set environment variables:

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | Your Anthropic key |
| `OPENAI_API_KEY` | Your OpenAI key |
| `JWT_SECRET_KEY` | Long random string (32+ chars) |
| `CORS_ORIGINS` | `https://YOUR-APP.vercel.app` (add localhost for testing if needed) |
| `DATABASE_URL` | `sqlite:////app/data/meetings.db` |

4. Attach a **persistent disk** at `/app/data` (1 GB) so SQLite survives redeploys.
5. Deploy. Note your live URL: `https://ai-meeting-intelligence-api.onrender.com`

Verify: `GET https://YOUR-API.onrender.com/health` → `{"status":"ok"}`

---

## 3. Deploy backend to Fly.io (alternative)

```bash
# Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
cd backend
fly auth login
fly launch --no-deploy
fly secrets set ANTHROPIC_API_KEY=sk-ant-... OPENAI_API_KEY=sk-... JWT_SECRET_KEY=your-secret
fly secrets set CORS_ORIGINS=https://YOUR-APP.vercel.app
fly volumes create meeting_data --region iad --size 1
fly deploy
```

Live URL: `https://ai-meeting-intelligence-api.fly.dev`

---

## 4. Deploy frontend to Vercel

1. Import the GitHub repo in Vercel.
2. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Set environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://YOUR-API.onrender.com` (or Fly.io URL) |

4. Deploy. Note your live URL: `https://YOUR-APP.vercel.app`

---

## 5. Post-deploy checklist

- [ ] Update backend `CORS_ORIGINS` to include your exact Vercel URL (no trailing slash)
- [ ] Redeploy backend after CORS change
- [ ] Sign up on the live frontend → run a test analysis
- [ ] Confirm PDF export and meeting history work
- [ ] Render free tier: first request may take ~30s (cold start)

---

## Environment variable reference

### Backend

```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
JWT_SECRET_KEY=
CORS_ORIGINS=https://your-app.vercel.app
DATABASE_URL=sqlite:////app/data/meetings.db
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW_SECONDS=60
```

### Frontend (Vercel)

```
VITE_API_URL=https://your-api.onrender.com
```

---

## Production notes

- **SQLite on Render/Fly:** Works with a mounted volume; migrate to Postgres for multi-instance scaling (Day 10 interview talking point).
- **JWT secret:** Never commit; rotate if exposed.
- **CORS:** Use explicit origins in production — `allow_origins=["*"]` is disabled.
- **Rate limits:** Tune `RATE_LIMIT_REQUESTS` for demo vs production traffic.
