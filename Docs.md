# Aira — Technical Architecture & Development Plan

## 1. Project Overview

Aira is a voice-first agentic application being developed for **AMS Hackathon 2026**.

The objective is not simply to create a voice chatbot.

The objective is to build a reliable agentic system where a user can communicate naturally through a phone call while the backend can:

1. Understand the user's intent
2. Retrieve relevant information
3. Reason about the request
4. Decide whether an action is required
5. Call controlled tools
6. Maintain state
7. Return a natural response
8. Recover gracefully from failures

The system will be designed as a modular application rather than a single agent script.

---

# 2. Product Philosophy

The system should follow five principles:

### 2.1 Bounded autonomy

The LLM should not have unrestricted control over the application.

The agent can reason and request actions, but application code validates and executes those actions.

### 2.2 Reliability over complexity

A smaller reliable agent is preferred over a complicated multi-agent architecture that is difficult to test and debug.

The first version will therefore use a **single LangGraph agent**.

Multi-agent architecture is intentionally postponed.

### 2.3 Voice-first experience

The phone conversation is the primary user interface.

The user should not need to understand the underlying AI architecture.

### 2.4 Modular infrastructure

Voice, agent orchestration, LLM inference, RAG, tools, database, and deployment should remain separate components.

This allows individual components to be replaced without rebuilding the entire system.

### 2.5 Production-oriented development

Reliability, security, observability, evaluation, latency, cost, and failure handling will be considered during development rather than added after the agent works.

---

# 3. High-Level Architecture

```text
                         USER
                           │
                           │ Phone
                           ▼
                    ┌─────────────┐
                    │  SnapServe  │
                    │  Voice API  │
                    └──────┬──────┘
                           │
                           │ transcript / response
                           ▼
                    ┌─────────────┐
                    │   FastAPI   │
                    │ Application │
                    └──────┬──────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │     LangGraph      │
                 │   Agent Runtime    │
                 └─────────┬──────────┘
                           │
             ┌─────────────┼──────────────┐
             │             │              │
             ▼             ▼              ▼
           LLM            RAG           Tools
             │             │              │
             │             ▼              │
             │       Vector Database      │
             │                            │
             └─────────────┬──────────────┘
                           ▼
                    Application State
                           │
                           ▼
                       Supabase
```

---

# 4. System Components

## 4.1 SnapServe — Voice Layer

SnapServe is responsible for the phone interface.

Responsibilities:

* Receive phone calls
* Handle speech-to-text
* Handle text-to-speech
* Connect the caller to the backend agent
* Return generated responses to the caller

SnapServe should remain an infrastructure/integration layer.

The core agent logic should not depend directly on SnapServe-specific business logic.

---

# 5. FastAPI — Application Layer

FastAPI will expose the application's backend interface.

Responsibilities:

* Receive agent requests
* Authenticate requests
* Validate input
* Manage sessions
* Invoke the LangGraph runtime
* Return structured responses
* Handle API errors
* Provide health checks

Example conceptual flow:

```text
POST /agent
       │
       ▼
Validate request
       │
       ▼
Load session state
       │
       ▼
Invoke LangGraph
       │
       ▼
Return response
```

FastAPI should not contain the agent's reasoning logic.

---

# 6. LangGraph — Agent Runtime

LangGraph will be responsible for orchestrating the agent workflow.

The first version will use a single agent.

Conceptual graph:

```text
START
  │
  ▼
Understand Request
  │
  ▼
Determine Intent
  │
  ├───────────────┐
  │               │
  ▼               ▼
Knowledge       Action
Request         Required
  │               │
  ▼               ▼
RAG             Tool
  │               │
  └───────┬───────┘
          ▼
      Generate Response
          │
          ▼
         END
```

The graph should make agent behavior explicit instead of relying on an unrestricted LLM loop.

---

# 7. LLM Layer

The LLM is the reasoning component.

It will be responsible for:

* Understanding natural language
* Classifying intent
* Deciding whether knowledge retrieval is required
* Deciding whether a tool should be used
* Generating natural responses
* Interpreting tool results

The LLM should not directly access databases or arbitrary APIs.

All external actions should happen through controlled tools.

---

# 8. RAG System

RAG will provide the agent with reliable application-specific knowledge.

Pipeline:

```text
Documents
    ↓
Ingestion
    ↓
Cleaning
    ↓
Chunking
    ↓
Embedding
    ↓
Vector Database
    ↓
Retriever
    ↓
Relevant Context
    ↓
LLM
```

The knowledge base may contain:

* FAQs
* Service information
* Policies
* Pricing
* Operating hours
* Product information
* Other approved business information

The agent should use retrieved information instead of inventing company-specific facts.

---

# 9. RAG Requirements

The RAG system will eventually support:

* Document ingestion
* Metadata
* Versioning
* Chunking
* Embeddings
* Semantic search
* Metadata filtering
* Retrieval limits
* Optional reranking
* Source tracking
* Evaluation

The initial implementation should remain simple.

Complex retrieval techniques will only be introduced when they solve an identified problem.

---

# 10. Agent Tools

Tools are controlled capabilities exposed to the agent.

Examples:

```text
search_knowledge()
check_availability()
create_booking()
cancel_booking()
get_customer()
create_support_ticket()
```

Tools must have strict contracts.

Example:

```text
create_booking(
    customer_id,
    service_id,
    date,
    time
)
```

Tools should:

* Validate inputs
* Validate authorization
* Enforce business rules
* Return structured results
* Handle errors explicitly
* Avoid exposing internal implementation details

The LLM should never receive unrestricted database or system access.

---

# 11. State & Memory

The system will distinguish between:

### Conversation state

Temporary information needed during the current interaction.

Example:

```text
Customer wants AC service
Preferred date: Monday
Preferred time: After 6 PM
```

### Persistent application state

Information that must survive the conversation.

Examples:

```text
Customer
Booking
Service request
Ticket
Conversation metadata
```

Supabase/PostgreSQL will eventually store persistent application state.

---

# 12. Database

Supabase/PostgreSQL will be used for structured application data.

Potential entities:

```text
customers
services
appointments
support_tickets
conversations
messages
agent_runs
```

Database access must happen through application-level services or controlled tools.

The LLM should never directly generate SQL for production execution.

---

# 13. Reliability

The agent will be designed for failure.

External dependencies may fail:

```text
LLM
SnapServe
Vector database
Supabase
External APIs
Network
```

The system should therefore implement:

* Timeouts
* Retries for transient failures
* Exponential backoff
* Error classification
* Graceful fallback
* Circuit-breaking where appropriate
* Idempotency for state-changing operations

---

# 14. Idempotency

State-changing operations must be safe to retry.

Example:

```text
create_booking()
       │
       ▼
request_id = abc123
       │
       ▼
Booking created
```

If the same request is received again:

```text
request_id = abc123
       │
       ▼
Existing booking returned
```

This prevents duplicate operations caused by network retries or voice/API failures.

---

# 15. Latency

Voice applications are sensitive to response latency.

The system should minimize:

* STT latency
* Retrieval latency
* LLM latency
* Tool latency
* TTS latency
* Network overhead

Streaming should be used where supported.

The system should measure latency rather than optimizing based on assumptions.

---

# 16. Context Management

The entire conversation should not be sent to the LLM indefinitely.

The agent should eventually maintain:

```text
Recent messages
+
Conversation summary
+
Important extracted facts
+
Relevant retrieved knowledge
```

This reduces:

* Token usage
* Latency
* Cost
* Context noise

---

# 17. Security

Secrets must never be committed to Git.

Sensitive values include:

```text
SNAPSERVE_API_KEY
LLM_API_KEY
DATABASE_URL
SUPABASE credentials
```

Secrets will be provided through environment variables or the deployment platform's secret management.

The system should also implement:

* Input validation
* Authentication
* Authorization
* Rate limiting
* Request validation
* Tool permission boundaries
* Audit logging

---

# 18. Observability

Every important agent execution should eventually be traceable.

Useful fields include:

```text
request_id
session_id
agent_version
model
latency
token usage
tool calls
retrieved documents
errors
final result
```

This allows debugging questions such as:

> Why did the agent give this answer?

> Why did it call this tool?

> Which document did it retrieve?

> Why did the call become slow?

---

# 19. Evaluation

The agent will have a fixed evaluation dataset.

Examples:

```text
Question
Expected intent
Expected tool
Expected behavior
Expected answer properties
```

Tests should cover:

* Normal questions
* RAG questions
* Tool usage
* Missing information
* Invalid inputs
* Ambiguous requests
* Tool failures
* RAG failures
* Prompt injection attempts
* Unsupported requests

Agent changes should be evaluated against this dataset before being considered stable.

---

# 20. Development Phases

## Phase 0 — Architecture

Define:

* Product scope
* Agent responsibilities
* State model
* Tool contracts
* RAG architecture
* API contracts
* Failure behavior
* Security boundaries

No implementation yet.

---

## Phase 1 — LLM Core

Build:

```text
Input
 ↓
LLM
 ↓
Structured agent decision
```

Focus on reliable structured outputs and clear prompting.

---

## Phase 2 — RAG

Build:

```text
Knowledge
 ↓
Ingestion
 ↓
Embeddings
 ↓
Vector DB
 ↓
Retriever
 ↓
Agent
```

Evaluate retrieval quality before adding complexity.

---

## Phase 3 — LangGraph

Build the actual agent workflow:

```text
Request
 ↓
Intent
 ↓
Decision
 ├── RAG
 ├── Tool
 └── Direct response
 ↓
Final response
```

---

## Phase 4 — Tools

Introduce controlled actions.

Each tool gets:

* Schema
* Validation
* Error handling
* Authorization
* Idempotency requirements

---

## Phase 5 — Database & State

Introduce Supabase/PostgreSQL.

Persist:

* Customers
* Sessions
* Conversations
* Actions
* Application data

---

## Phase 6 — Voice Integration

Connect the completed agent runtime to SnapServe.

```text
Phone
 ↓
SnapServe
 ↓
FastAPI
 ↓
LangGraph
 ↓
Response
 ↓
SnapServe
 ↓
Phone
```

---

## Phase 7 — Reliability

Add:

* Timeouts
* Retries
* Fallbacks
* Idempotency
* Rate limiting
* Error handling

---

## Phase 8 — Observability

Add:

* Structured logs
* Traces
* Metrics
* Agent execution tracking
* Latency monitoring

---

## Phase 9 — Evaluation

Build automated tests for:

* Agent behavior
* RAG
* Tools
* Failure scenarios
* Security boundaries

---

## Phase 10 — Production Hardening

Review:

* Security
* Cost
* Performance
* Scalability
* Failure recovery
* Deployment
* Monitoring

Only after these stages should additional agent complexity such as multi-agent orchestration be considered.

---

# 21. Definition of Done

The project is considered successful when:

```text
✓ User can call the system
✓ Voice interaction works
✓ Agent understands the request
✓ Agent can retrieve trusted knowledge
✓ Agent can use controlled tools
✓ Agent maintains required state
✓ Actions are validated
✓ Failures are handled gracefully
✓ Secrets are protected
✓ Agent behavior can be observed
✓ Core behavior is evaluated
✓ Application can be deployed reliably
```

The goal is not maximum complexity.

The goal is a **small, reliable, explainable agentic system that actually works.**
