# AIRA Technical Stack Plan

This document describes selected and candidate technologies for the hackathon MVP. It reflects the current repository and avoids adding technology until it is needed.

## Current Repository Stack

| Area | Current State |
| --- | --- |
| Backend | FastAPI in `server.py` |
| Frontend | Inline HTML/JavaScript served by FastAPI |
| Package manager | `uv` |
| Python | `>=3.12` |
| HTTP client | `requests` |
| Voice provider | SnapServe outbound call API |
| Docker | `python:3.12-slim` image with `uv` |
| Deployment | Render, based on project context |
| AI | Not implemented |
| RAG | Not implemented |
| Database | Not implemented |

## Frontend

### Selected For Current Prototype

Technology: Inline HTML/JavaScript served by FastAPI.

Why:

- Already exists.
- Simple enough for starting SnapServe calls.
- No frontend build pipeline required.

Alternatives:

- React/Vite.
- Next.js.
- Server-rendered templates.

Tradeoffs:

- Inline HTML is fast for the prototype but poor for a full document-review workflow.
- A richer review UI may be needed for citations, timelines, approvals, and document viewing.

### Planned MVP Direction

Recommendation: keep the current UI minimal until backend contracts are clear. If a review dashboard is needed, use a small React/Vite frontend only after the pre-hearing brief schema is defined.

Voice UI:

- SnapServe remains the phone interface.
- The visual UI should support review, citations, approvals, and workflow state.

Deployment:

- Current FastAPI-served UI can deploy with the backend on Render.
- A future separate frontend should only be introduced if the review experience requires it.

## Backend

Technology: FastAPI.

Why:

- Already implemented.
- Good fit for typed request/response APIs.
- Strong Python ecosystem for AI, document processing, and LangGraph.

Alternatives:

- Flask: simpler but weaker typing and OpenAPI ergonomics.
- Django: strong full-stack framework but heavier than needed for the MVP.
- Node/Express: viable, but current repo is Python.

Tradeoffs:

- FastAPI is appropriate for the MVP.
- Long-running document processing may require background jobs later.

Python version:

- Current project requires Python `>=3.12`.

API architecture:

- Current: `POST /call` for outbound SnapServe calls.
- Planned: protected agent/conversation endpoints after contracts are defined.

Background jobs:

- Not needed for the current prototype.
- Planned need: document ingestion, OCR, embedding, and batch evaluation.
- Candidate options: simple async task queue first; Celery/RQ only if needed.

## Agent Orchestration

Recommended: LangGraph.

Why:

- Explicit graph states fit bounded judicial workflows.
- Easier to audit than an unrestricted agent loop.
- Supports tool routing and controlled workflow steps.

Alternatives:

- Plain function pipeline: simpler, but less flexible for branching workflows.
- LangChain agent loop: faster to prototype, but easier to over-autonomize.
- Multi-agent architecture: postponed because it increases complexity.

Tradeoffs:

- LangGraph has a learning curve.
- The MVP should use one graph and one agent.

## AI

### LLM

Selection: not confirmed.

Criteria:

- Reliable structured output.
- Good summarization.
- Strong instruction following.
- Latency acceptable for voice-assisted use.
- Data handling suitable for sensitive legal-like documents.

Alternatives:

- OpenAI models.
- Azure OpenAI.
- Anthropic.
- Local/open-weight models for offline demos.

Tradeoffs:

- Hosted models are faster to integrate but require careful data controls.
- Local models improve control but may reduce quality and increase setup burden.

### Embeddings

Selection: not confirmed.

Criteria:

- Strong retrieval quality on legal/procedural text.
- Reasonable cost.
- Metadata-compatible vector storage.

Alternatives:

- Hosted embedding APIs.
- Open-source embedding models.

Tradeoffs:

- Hosted embeddings simplify the MVP.
- Local embeddings improve control but add infrastructure.

### Speech-to-Text and Text-to-Speech

Current: SnapServe is the voice/telephony provider.

Why:

- Existing SnapServe access and outbound calling work.
- Fits hackathon voice-first requirement.

Alternatives:

- LiveKit with separate STT/TTS providers.
- Twilio plus STT/TTS.

Tradeoffs:

- SnapServe should remain for the MVP unless its inbound agent integration is insufficient.
- LiveKit should not replace SnapServe without a specific reason.

## RAG

Recommended MVP approach:

- Start with a controlled synthetic document set.
- Parse text documents first.
- Add OCR only if required by demo documents.
- Use case-scoped chunk metadata.
- Implement semantic search plus keyword fallback if needed.
- Add citations before adding advanced retrieval features.

Alternatives:

- Full document AI pipeline from day one.
- Managed search service.
- SQL-only keyword search.

Tradeoffs:

- Simple RAG is enough for a hackathon if documents are controlled.
- Hybrid retrieval and reranking should be added only if baseline retrieval misses key facts.

Reranking:

- Planned, not required for first MVP unless retrieval quality is poor.

## Data

### Relational Database

Recommended: PostgreSQL, likely through Supabase.

Why:

- Fits structured case, hearing, task, approval, and audit data.
- Supabase can accelerate setup for a hackathon.

Alternatives:

- SQLite for local demo.
- Render PostgreSQL.
- Neon.

Tradeoffs:

- Supabase adds managed auth/storage options but introduces platform coupling.
- SQLite is simple but weak for realistic multi-user access and audit workflows.

### Object Storage

Selection: not confirmed.

Needed for:

- Source legal documents.
- Parsed text artifacts.
- OCR outputs.

Alternatives:

- Supabase Storage.
- S3-compatible storage.
- Local fixtures for demo.

Tradeoffs:

- Local fixtures are fastest for MVP.
- Managed storage is better for realistic upload workflows.

### Vector Storage

Selection: not confirmed.

Options:

- Supabase pgvector.
- Chroma for local MVP.
- Qdrant.
- Pinecone.

Recommendation:

- Use the simplest option that supports case-scoped filtering and reliable demo retrieval. Supabase pgvector is attractive if Supabase is already selected.

## Infrastructure

Docker:

- Current Dockerfile builds and runs the FastAPI app.

Render:

- Current deployment target.
- Good enough for the web service MVP.

GitHub:

- Repository: `codingwithmaajid/Ams-Hackathon-2026`.
- Use GitHub for source control and planning artifacts.

Observability:

- Current: basic logging only.
- Planned: structured logs with request ID, session ID, case ID, tool calls, retrieval documents, approvals, errors, and latency.

Alternatives:

- Render logs only for MVP.
- OpenTelemetry later.
- LangSmith or similar tracing for agent runs, if allowed by data policy.

Tradeoffs:

- Render logs are fastest but limited.
- Full tracing improves debugging but adds setup and privacy review.

## Security

Authentication:

- Not implemented.
- MVP must define at least a demo authentication assumption before case data is exposed.

Authorization:

- Not implemented.
- Planned RBAC with case-level access isolation.

Secrets:

- Current: `SNAPSERVE_API_KEY` from environment.
- Planned: all LLM, database, storage, and provider secrets through environment variables or platform secret management.

Security tradeoffs:

- A hackathon demo can use synthetic data and simplified auth.
- Any real judicial deployment requires formal security, privacy, legal, accessibility, procurement, and institutional review.

## Recommended MVP Stack

- FastAPI backend.
- Existing SnapServe voice layer.
- Single LangGraph workflow.
- Hosted LLM provider selected by availability and data policy.
- Simple embeddings provider.
- Supabase PostgreSQL with pgvector, if approved.
- Local synthetic document fixtures first.
- Render deployment.
- Structured logs before complex tracing.

This is the smallest stack that can demonstrate the flagship workflow without pretending to be production-ready.
