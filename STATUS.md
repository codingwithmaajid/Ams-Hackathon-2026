# Jolly Project Status

Last updated: October 19, 2026

## DONE

Repository inspection:

- FastAPI backend exists in `server.py`.
- Inline browser form exists at `GET /`.
- Bolna outbound call endpoint exists at `POST /call`.
- Bolna API key is read from `BOLNA_API_KEY`.
- Dockerfile exists for Render-style deployment.
- Python project uses `uv`, `pyproject.toml`, and Python 3.12.
- Project renamed from AIRA to Jolly and retargeted at the Bolna Symphony Buildathon (submission deadline October 31, 2026).
- Voice layer switched from SnapServe to Bolna (`backend/services/bolna_client.py`).
- Bolna webhook receiver at `POST /bolna/webhook`.
- Milestone 2 case store (SQLModel on SQLite, Postgres-ready via `DATABASE_URL`): `Case`, `Document`, `HearingEvent`, `Task`.
- Three synthetic Indian matters seeded on startup (dates relative to today): C.C. 1042/2025 (Sec 138 NI Act, Egmore), C.S. 2217/2024 (Madras HC specific performance), M.C. 789/2025 (Family Court maintenance).
- Case APIs: `GET /cases`, `/cases/{id}`, `/timeline`, `/tasks`, `/documents`, `/brief`; `GET /briefs/daily`.
- Source-grounded case brief and daily morning brief, every line cited to document + paragraph; untrusted document text is never spoken.
- Live Bolna custom functions: `POST /bolna/tools/get-case-brief` (matches spoken numbers like "ten forty two" or client names) and `POST /bolna/tools/get-daily-brief`.

Implemented application capabilities:

- Start an outbound Bolna call by passing an agent ID and phone number.
- Keep the Bolna key server-side.
- Basic request validation for the current call launcher.
- Basic HTTP error handling for Bolna failures.
- Milestone 1 backend foundation.
- `GET /` service metadata endpoint.
- `GET /health` lightweight health endpoint.
- Environment-based backend configuration.
- Structured JSON application logging.
- Consistent JSON error responses.
- Configurable CORS origins for local frontend development.
- Pytest coverage for root, health, and validation errors.

## IN PROGRESS

- Milestone 3: ingestion, Gemini embeddings (free tier) and cited retrieval for open questions.

## PLANNED

Product capabilities:

- Prepare Case 1042 for a hearing.
- Retrieve authorized case documents.
- Classify documents.
- Extract metadata.
- Build procedural timeline.
- Retrieve hearing history.
- Identify postponements.
- Identify missing documents.
- Generate source-grounded pre-hearing brief.
- Present reviewable citations.
- Support human approval for follow-up workflow.

Technical capabilities:

- Milestone 2 - Database and case management.
- LangGraph single-agent workflow.
- RAG ingestion and retrieval.
- Object storage for documents.
- PostgreSQL/Supabase for structured data.
- Vector storage for document chunks.
- Tool contracts for case, document, hearing, timeline, workflow, knowledge, generation, and approvals.
- Authentication and RBAC.
- Audit logging.
- Observability.
- Evaluation fixtures.

## BLOCKED

The following require human confirmation before implementation:

- Authentication approach for hackathon demo.
- Bolna agent setup in the dashboard (prompt, custom function, webhook URL).
- Whether UI should remain simple or become a richer review dashboard.

## DECISIONS

- Human judicial authority is preserved.
- AI automates workflow, not judicial judgment.
- The MVP focuses on one flagship workflow: preparing a case for an upcoming hearing.
- Voice is an interface, not the agent.
- Bolna is the voice/telephony provider (replaced SnapServe, October 2026).
- Primary user: advocates at Indian litigation firms; judges/court staff secondary.
- Demo data is synthetic.
- LLM + embeddings: Google Gemini free tier (AI Studio key).
- Database: SQLite via SQLModel now, Postgres later. Vectors: embeddings stored in SQLite, NumPy cosine search.
- FastAPI remains the application boundary.
- First agent implementation should be a single LangGraph agent.
- LLM actions must go through controlled tools.
- Uploaded documents are untrusted data.
- Factual outputs should be source-grounded and cite documents.
- Consequential legal actions require human approval.

## NEXT STEPS

NEXT:

Milestone 3 - Ingestion, embeddings and cited retrieval.

P0 - MVP critical:

1. Define the minimal case model.
2. Choose the Milestone 2 persistence approach.
3. Add case management APIs only after contracts are agreed.
4. Add tests for case creation/listing/retrieval.
5. Keep RAG, AI agent, embeddings, voice integration, and document processing out of Milestone 2 unless explicitly re-scoped.

P1 - Important:

1. Confirm the exact demo case domain and user role.
2. Create synthetic Case 1042 fixture documents.
3. Define tool contracts before implementing tools.
4. Define pre-hearing brief schema.
5. Define approval policy matrix.
6. Wire the Bolna `get_case_brief` custom function to the real brief generator.

P2 - Future:

1. Multilingual interaction.
2. Postponement analytics.
3. Advanced scheduling and calendar integration.
4. Broader case workflow management.
5. Institutional compliance review.
6. Accessibility review.

## Current Implementation Boundary

Implementation is not started for the judicial assistant itself.

The existing code is only a voice-call integration prototype:

```text
Frontend or API client
  -> FastAPI backend
  -> Bolna outbound call API
  -> Phone call
```

Milestone 1 backend foundation:

```text
backend.main:app
  -> GET /
  -> GET /health
  -> POST /call
  -> configuration
  -> logging
  -> error handling
  -> CORS
```

Target planned architecture:

```text
Judge / Authorized Staff
  -> Bolna voice interface
  -> FastAPI
  -> LangGraph judicial workflow agent
  -> RAG + tools + approval workflows
  -> PostgreSQL/Supabase and document storage
```
