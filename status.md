# Aira — Development Status

**Project:** AMS Hackathon 2026
**Current Phase:** Phase 0 — Architecture & Planning
**Status:** 🟡 Planning
**Last Updated:** August 23, 2026

---

# Timeline

## Phase 0 — Architecture & Planning

**Status:** 🟡 In Progress

### Completed

* [x] Identified voice AI as the primary interface
* [x] Tested LiveKit voice agent architecture
* [x] Evaluated STT / TTS / voice pipeline concepts
* [x] Tested SnapServe phone calling
* [x] Obtained SnapServe API access
* [x] Built a FastAPI interface for initiating outbound calls
* [x] Deployed the initial application to Render
* [x] Confirmed the need for a separate agentic backend
* [x] Decided to use LangGraph for agent orchestration
* [x] Decided to introduce RAG
* [x] Decided to use controlled tools instead of unrestricted LLM actions
* [x] Decided to start with a single agent rather than a multi-agent system

### Current Work

* [ ] Finalize product scope
* [ ] Finalize system architecture
* [ ] Define agent responsibilities
* [ ] Define agent state
* [ ] Define tool contracts
* [ ] Define RAG requirements
* [ ] Define API contracts
* [ ] Define failure-handling strategy
* [ ] Define evaluation strategy

**Rule:** No major implementation begins until the architecture is sufficiently defined.

---

# Phase 1 — LLM Core

**Status:** ⚪ Not Started

### Goals

* [ ] Select initial LLM inference provider
* [ ] Define system prompt
* [ ] Define structured agent output
* [ ] Establish model interface
* [ ] Test basic reasoning quality
* [ ] Establish initial latency/cost baseline

---

# Phase 2 — RAG

**Status:** ⚪ Not Started

### Goals

* [ ] Define knowledge-base format
* [ ] Create initial knowledge documents
* [ ] Build ingestion pipeline
* [ ] Implement chunking
* [ ] Generate embeddings
* [ ] Select vector database
* [ ] Implement retrieval
* [ ] Evaluate retrieval quality
* [ ] Add metadata/source tracking

---

# Phase 3 — LangGraph Agent

**Status:** ⚪ Not Started

### Goals

* [ ] Define agent state
* [ ] Define graph nodes
* [ ] Implement intent routing
* [ ] Implement RAG path
* [ ] Implement direct-response path
* [ ] Implement tool path
* [ ] Implement final response generation
* [ ] Test graph transitions

---

# Phase 4 — Tools

**Status:** ⚪ Not Started

### Goals

* [ ] Define first business tools
* [ ] Define schemas
* [ ] Validate inputs
* [ ] Implement authorization boundaries
* [ ] Implement structured tool results
* [ ] Implement tool error handling
* [ ] Add idempotency to state-changing operations

---

# Phase 5 — Database & State

**Status:** ⚪ Not Started

### Goals

* [ ] Configure Supabase/PostgreSQL
* [ ] Define database schema
* [ ] Implement persistent sessions
* [ ] Implement conversation state
* [ ] Implement customer state
* [ ] Implement action persistence

---

# Phase 6 — Voice Integration

**Status:** 🟢 Initial voice calling works

### Existing

* [x] SnapServe API integration
* [x] Outbound call endpoint
* [x] Phone number input
* [x] FastAPI backend
* [x] Render deployment

### Remaining

* [ ] Connect SnapServe conversation to the agent backend
* [ ] Pass user intent/transcript to LangGraph
* [ ] Return agent responses to SnapServe
* [ ] Test complete phone conversation
* [ ] Handle interruptions/failures

---

# Phase 7 — Reliability

**Status:** ⚪ Not Started

### Goals

* [ ] Request timeouts
* [ ] Retry strategy
* [ ] Exponential backoff
* [ ] Failure classification
* [ ] Graceful fallbacks
* [ ] Idempotency
* [ ] Rate limiting
* [ ] Circuit-breaking where required

---

# Phase 8 — Observability

**Status:** ⚪ Not Started

### Goals

* [ ] Structured logging
* [ ] Request IDs
* [ ] Session IDs
* [ ] Agent execution traces
* [ ] Tool execution logs
* [ ] Retrieval tracing
* [ ] Latency metrics
* [ ] Error metrics
* [ ] Cost/token tracking

---

# Phase 9 — Evaluation

**Status:** ⚪ Not Started

### Goals

* [ ] Create evaluation dataset
* [ ] Test normal conversations
* [ ] Test RAG accuracy
* [ ] Test tool selection
* [ ] Test invalid inputs
* [ ] Test tool failures
* [ ] Test RAG failures
* [ ] Test prompt injection resistance
* [ ] Add regression tests

---

# Phase 10 — Production Hardening

**Status:** ⚪ Not Started

### Goals

* [ ] Security review
* [ ] Secret management review
* [ ] Authentication
* [ ] Authorization
* [ ] Performance testing
* [ ] Cost optimization
* [ ] Deployment review
* [ ] Failure recovery testing
* [ ] Final demo testing

---

# Architecture Evolution

```text
CURRENT

Phone
  ↓
SnapServe
  ↓
FastAPI
  ↓
Outbound Call


TARGET

Phone
  ↓
SnapServe
  ↓
FastAPI
  ↓
LangGraph
  ├── LLM
  ├── RAG
  ├── Tools
  └── State
       ↓
   Supabase
```

---

# Current Principle

> **Do not optimize for the number of agents or amount of AI. Optimize for reliability, controlled autonomy, useful behavior, and a system we can actually understand and debug.**

---

# Immediate Next Step

**Finish Phase 0.**

Before writing the production agent:

1. Define the exact product use case.
2. Define the agent's responsibilities.
3. Define the conversation lifecycle.
4. Define the state.
5. Define the RAG knowledge model.
6. Define tool contracts.
7. Define failure paths.
8. Define evaluation criteria.

Only then begin implementation.
