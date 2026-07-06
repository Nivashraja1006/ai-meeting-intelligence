# AI Meeting Intelligence Assistant

Production-grade GenAI portfolio project that turns raw meeting transcripts into structured intelligence in ~10 seconds — summaries, action items, decisions, sentiment, and a ready-to-send follow-up email.

**Target use case:** Replace the 30+ minutes professionals spend after every meeting writing notes, assigning tasks, and drafting follow-ups.

---

## Live demo

| Layer | URL |
|-------|-----|
| Frontend (Vercel) | [Deploy →](https://vercel.com/new) then update this row |
| Backend (Render) | [Deploy →](https://dashboard.render.com) then update this row |
| API docs | `{BACKEND_URL}/docs` |

**After deploying**, run from project root:

```powershell
powershell -File scripts/update-readme-urls.ps1 `
  -BackendUrl "https://your-api.onrender.com" `
  -FrontendUrl "https://your-app.vercel.app"
git add README.md && git commit -m "docs: add live demo URLs" && git push
```

Or push to GitHub first:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/push-to-github.ps1
```

Full guide: [DEPLOY.md](DEPLOY.md)

---

## What it does

**Input:** Paste a transcript or upload audio (auto-transcribed via OpenAI Whisper)

**Output** (guaranteed JSON schema via forced LLM tool calling):

- Structured meeting summary
- Action items with owners and due dates
- Key decisions made
- Open questions
- Per-participant sentiment
- Complete follow-up email draft

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI (Python) |
| LLM | Anthropic Claude — forced `tool_use` / function calling |
| Transcription | OpenAI Whisper API |
| Auth | JWT (access + refresh tokens), bcrypt password hashing |
| Database | SQLite via SQLAlchemy |
| PDF export | fpdf2 |
| Frontend | React + Vite + Tailwind CSS |
| Deploy | Docker → Render or Fly.io; frontend → Vercel |

---

## Architecture

```
┌─────────────┐     JWT      ┌──────────────────────────────────────────┐
│  React UI   │ ──────────►  │  FastAPI Backend                         │
│  (Vercel)   │              │  /auth/*  /meetings/analyze              │
└─────────────┘              │  /meetings/upload-audio  /meetings/{id}  │
                             └──────┬───────────────┬───────────────────┘
                                    │               │
                         ┌──────────▼───┐    ┌──────▼──────┐
                         │ Anthropic    │    │ OpenAI      │
                         │ Claude       │    │ Whisper     │
                         │ (tool_use)   │    │             │
                         └──────────────┘    └─────────────┘
                                    │
                         ┌──────────▼──────────┐
                         │ SQLite (SQLAlchemy) │
                         └─────────────────────┘
```

**Core engineering decision:** All LLM output flows through a single forced tool call (`extract_meeting_intelligence`). The model cannot return freeform text — only validated JSON matching our Pydantic schema.

---

## Forced tool_use vs prompted JSON

### The problem with "just ask for JSON"

Prompting `"respond in JSON"` is fragile in production:

- Model wraps JSON in markdown code fences
- Missing fields, wrong types, hallucinated keys
- Requires regex stripping and hope-based `json.loads()`
- Silent failures when parsing succeeds but schema is wrong

### Before: prompted JSON (anti-pattern)

```python
# ❌ Fragile — never do this in production
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    messages=[{
        "role": "user",
        "content": f"Analyze this transcript and return JSON with keys: "
                   f"meeting_title, summary, action_items...\n\n{transcript}"
    }],
)
text = response.content[0].text
# Now pray: strip ```json fences, parse, validate, retry manually...
data = json.loads(text.strip().removeprefix("```json").removesuffix("```"))
```

**Failure modes:** markdown wrappers, truncated JSON, `sentiment: "happy"` instead of enum, missing `due_date` on action items.

### After: forced tool_use (this project)

```python
# ✅ Production approach — model MUST call the tool
response = client.messages.create(
    model=settings.anthropic_model,
    max_tokens=4096,
    system=SYSTEM_PROMPT,
    tools=[EXTRACT_MEETING_INTELLIGENCE_TOOL],
    tool_choice={"type": "tool", "name": "extract_meeting_intelligence"},
    messages=[{"role": "user", "content": transcript}],
)

# Extract structured input from tool_use block — already a dict
tool_input = next(
    block.input for block in response.content
    if block.type == "tool_use" and block.name == "extract_meeting_intelligence"
)

# Second line of defense: Pydantic validation
return MeetingIntelligence.model_validate(tool_input)
```

**Why this wins:**

| Concern | Prompted JSON | Forced tool_use |
|---------|---------------|-----------------|
| Output format | Unpredictable text | Guaranteed tool input object |
| Schema enforcement | Post-hoc parsing | API-level `input_schema` |
| Type safety | Manual checks | Pydantic `model_validate()` |
| Debugging | Parse errors opaque | Validation errors are field-specific |
| Retry strategy | Re-prompt blindly | Re-call tool with validation error context |

See full implementation: [`backend/app/services/anthropic_service.py`](backend/app/services/anthropic_service.py)

---

## Retry strategy

If Pydantic validation fails on the first tool response, we retry **once** with the validation errors injected into the conversation:

```python
except ValidationError as first_error:
    retry_messages = [
        {"role": "user", "content": transcript},
        {"role": "assistant", "content": response.content},
        {"role": "user", "content": f"Your previous tool output failed validation. "
                                    f"Errors: {error_detail}. "
                                    f"Call extract_meeting_intelligence again with corrected output."},
    ]
    retry_response = _call_anthropic(client, retry_messages)
```

**Interview talking point:** One retry balances cost/latency vs reliability. More than one retry risks infinite loops and doubled API spend. If retry fails → `502` with explicit error (never silently return bad data).

---

## Interview tradeoffs (talking points)

### 1. Forced tool_use vs prompted JSON
**Choice:** Forced `tool_choice` with Pydantic validation.  
**Why:** Consulting deliverables need deterministic, parseable output. A demo that returns malformed JSON once loses credibility.  
**Tradeoff:** Slightly more setup (tool schema maintenance) vs dramatically lower failure rate.

### 2. Retry-once validation
**Choice:** Single retry with error context, then hard fail.  
**Why:** Catches ~90% of edge cases (wrong enum, missing field) without exponential API cost.  
**Tradeoff:** ~2× latency on failure path; acceptable because failures are rare with forced tools.

### 3. Whisper for audio transcription
**Choice:** OpenAI Whisper API (`whisper-1`) instead of self-hosted.  
**Why:** Zero infra for a portfolio MVP; excellent accuracy; simple multipart upload.  
**Tradeoffs to mention:**
- **Cost:** ~$0.006/minute of audio
- **Latency:** Adds 5–30s before Claude analysis even starts
- **Alternative:** Deepgram/AssemblyAI for streaming; local Whisper for cost control at scale

### 4. JWT vs session auth
**Choice:** Stateless JWT (access + refresh tokens).  
**Why:** Frontend on Vercel, backend on Render — no shared server-side session store needed. Scales horizontally without sticky sessions.  
**Tradeoffs:**
- **Pro:** Works across separate deploy targets; no Redis required
- **Con:** Can't revoke individual tokens without a blocklist (acceptable for MVP)
- **Alternative:** Session cookies + Redis if same-domain monolith

### 5. SQLite now vs Postgres later
**Choice:** SQLite with Docker volume / Render persistent disk.  
**Why:** Zero database ops for portfolio; SQLAlchemy makes migration trivial.  
**Tradeoffs:**
- **Pro:** Free, fast to ship, fine for single-user demo and interviews
- **Con:** No concurrent writes across multiple backend instances
- **Migration path:** Change `DATABASE_URL` to Postgres connection string; same SQLAlchemy models

### 6. Rate limiting
**Choice:** In-memory per-user limiter (10 req/min on analyze endpoints).  
**Why:** Protects Anthropic/OpenAI spend from abuse without external deps.  
**Tradeoff:** Resets on server restart; use Redis for multi-instance production.

---

## Project structure

```
ai-meeting-intelligence-assistant/
├── backend/
│   ├── app/
│   │   ├── routers/       # auth, meetings
│   │   ├── services/      # anthropic, whisper, meeting, pdf, auth
│   │   ├── schemas/       # Pydantic models
│   │   ├── models/        # SQLAlchemy (User, Meeting, ActionItem)
│   │   └── main.py
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   └── src/               # React + Vite + Tailwind
├── docker-compose.yml
├── render.yaml
├── DEPLOY.md
└── README.md
```

---

## Quick start (local)

### Option A: Docker Compose (recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:8000  
- API docs: http://localhost:8000/docs  

### Option B: Manual

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # Add ANTHROPIC_API_KEY, OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Run tests

```bash
cd backend
pytest tests/ -v
```

---

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/signup` | — | Create account |
| `POST` | `/auth/login` | — | Get JWT tokens |
| `POST` | `/auth/refresh` | — | Refresh token pair |
| `POST` | `/meetings/analyze` | JWT | Analyze transcript text |
| `POST` | `/meetings/upload-audio` | JWT | Upload audio → Whisper → analyze |
| `GET` | `/meetings` | JWT | List meeting history |
| `GET` | `/meetings/{id}` | JWT | Get meeting detail |
| `GET` | `/meetings/{id}/export-pdf` | JWT | Download PDF report |
| `GET` | `/health` | — | Health check |

---

## Environment variables

### Backend (`backend/.env`)

```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
JWT_SECRET_KEY=long-random-string
CORS_ORIGINS=http://localhost:5173,https://your-app.vercel.app
DATABASE_URL=sqlite:///./meetings.db
```

### Frontend (`frontend/.env`)

```
VITE_API_URL=http://localhost:8000
```

See [DEPLOY.md](DEPLOY.md) for production deployment.

---

## 30-second elevator pitch (interviews)

> "I built a meeting intelligence assistant that replaces 30 minutes of post-meeting admin with a 10-second API call. The core engineering decision was **forced Anthropic tool_use** instead of prompting for JSON — the model can only return data matching our Pydantic schema, with a single retry on validation failure. It supports text and audio input via Whisper, JWT auth, per-user persistence in SQLite, PDF export, and a React frontend deployed separately on Vercel. I can walk you through the tradeoffs: why tool calling beats JSON prompting, why JWT over sessions for split deploys, and how I'd migrate SQLite to Postgres for scale."

---

## License

MIT — portfolio / demonstration project.
