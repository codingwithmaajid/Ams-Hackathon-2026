# Aira — Voice AI Agentic System

Aira is a production-oriented voice AI system built for the **AMS Hackathon 2026**.

It combines phone-based voice interaction with an agentic backend capable of reasoning, retrieving knowledge, using tools, maintaining state, and performing actions.

## Architecture

```text
Phone Call
    ↓
SnapServe
    ↓
FastAPI
    ↓
LangGraph Agent
    ├── LLM Inference
    ├── RAG
    ├── Tools
    ├── Memory / State
    └── Business Logic
    ↓
Supabase / External Services
```

## Core Stack

* **Voice:** SnapServe
* **Backend:** FastAPI
* **Agent orchestration:** LangGraph
* **LLM:** LLM inference provider
* **RAG:** Vector database + embeddings
* **Database:** Supabase / PostgreSQL
* **Deployment:** Render
* **Containerization:** Docker
* **Observability:** Planned

## Project Goal

Build a reliable voice-first agent that can:

* Understand natural language conversations
* Retrieve information from a controlled knowledge base
* Decide when tools are required
* Execute validated actions
* Maintain conversation state
* Handle failures safely
* Operate through a real phone call

The system will be developed incrementally, with reliability, observability, latency, security, and evaluation considered from the beginning.

## Status

**Phase:** Architecture & Planning

Implementation will begin only after the architecture, agent contracts, workflows, and development plan are documented.

See:

* [`docs.md`](./docs.md) — technical architecture and development process
* [`status.md`](./status.md) — implementation status and timeline
