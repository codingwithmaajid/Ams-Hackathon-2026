# AIRA Project Status

Last updated: August 23, 2026

## DONE

Repository inspection:

- FastAPI backend exists in `server.py`.
- Inline browser form exists at `GET /`.
- SnapServe outbound call endpoint exists at `POST /call`.
- SnapServe API key is read from `SNAPSERVE_API_KEY`.
- Dockerfile exists for Render-style deployment.
- Python project uses `uv`, `pyproject.toml`, and Python 3.12.
- Project planning has shifted from a generic voice agent to AIRA, an AI Judicial Workflow Assistant.

Implemented application capabilities:

- Start an outbound SnapServe call by passing an agent ID and phone number.
- Keep the SnapServe key server-side.
- Basic request validation for the current call launcher.
- Basic HTTP error handling for SnapServe failures.
- Milestone 1 backend foundation.
- `GET /` service metadata endpoint.
- `GET /health` lightweight health endpoint.
- Environment-based backend configuration.
- Structured JSON application logging.
- Consistent JSON error responses.
- Configurable CORS origins for local frontend development.
- Pytest coverage for root, health, and validation errors.

## IN PROGRESS

No implementation milestone is currently in progress.

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

- Exact court/judicial domain for the demo.
- Whether demo data is synthetic or based on sanitized real documents.
- Initial LLM provider.
- Initial embedding provider.
- Initial vector store.
- Initial database provider.
- Authentication approach for hackathon demo.
- SnapServe inbound/agent webhook capabilities and expected payload shape.
- Whether UI should remain simple or become a richer review dashboard.

## DECISIONS

- Human judicial authority is preserved.
- AI automates workflow, not judicial judgment.
- The MVP focuses on one flagship workflow: preparing a case for an upcoming hearing.
- Voice is an interface, not the agent.
- SnapServe remains the current voice/telephony provider.
- FastAPI remains the application boundary.
- First agent implementation should be a single LangGraph agent.
- LLM actions must go through controlled tools.
- Uploaded documents are untrusted data.
- Factual outputs should be source-grounded and cite documents.
- Consequential legal actions require human approval.

## NEXT STEPS

NEXT:

Milestone 2 - Database and case management.

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
6. Confirm SnapServe inbound conversation integration path.

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
  -> SnapServe outbound call API
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
  -> SnapServe voice interface
  -> FastAPI
  -> LangGraph judicial workflow agent
  -> RAG + tools + approval workflows
  -> PostgreSQL/Supabase and document storage
```
