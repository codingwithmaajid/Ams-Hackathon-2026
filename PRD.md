# Product Requirements Document - AIRA

## 1. Product Overview

AIRA is an AI-powered Judicial Workflow Assistant for the AMS Hackathon 2026. It is a voice-first, tool-driven assistant that prepares, coordinates, executes, and tracks administrative work around judicial proceedings while preserving human judicial authority.

Core principle:

```text
Human decides. AI prepares, coordinates, executes, and tracks.
```

## 2. Problem Statement

Judicial officers and court staff spend substantial time preparing for hearings, reviewing fragmented records, finding previous orders, checking hearing history, tracking postponements, identifying missing filings, coordinating scheduling, and preparing administrative follow-up. These tasks are document-heavy and repetitive, but mistakes can affect fairness, delay, and trust.

## 3. Target Users

- Judges.
- Judicial clerks.
- Court registry staff.
- Authorized administrative court personnel.
- Court IT administrators.

## 4. User Personas

Judge:

- Needs a concise, source-grounded case brief before a hearing.
- Must retain final decision authority.
- Needs fast access to previous orders, filings, and hearing history.

Judicial clerk:

- Prepares case bundles and administrative drafts.
- Tracks missing documents and deadlines.
- Coordinates follow-up after hearings.

Registry staff:

- Manages case metadata, filings, schedules, and notices.
- Needs consistent administrative status tracking.

Court administrator:

- Needs auditability, access control, reliability, and operational reporting.

## 5. Goals

- Reduce manual preparation time for hearings.
- Provide source-grounded case summaries and pre-hearing briefs.
- Identify missing or referenced-but-unavailable documents.
- Build accurate procedural timelines.
- Track hearing history and postponements.
- Support approved administrative follow-up.
- Keep the human judge in control of judicial decisions.
- Make actions auditable and explainable.

## 6. Non-Goals

AIRA will not:

- Decide guilt, innocence, liability, sentence, verdict, or legal outcome.
- Recommend who should win or lose.
- Replace judges, clerks, or court procedure.
- Execute consequential legal actions without human approval.
- Allow the LLM to directly access databases, secrets, filesystems, shell, or arbitrary APIs.
- Treat uploaded legal documents as trusted instructions.
- Claim production readiness for real courts during the hackathon.

## 7. User Stories

- As a judge, I want to say "Prepare Case 1042 for tomorrow" so I can review the key materials before the hearing.
- As a judge, I want every factual statement in the brief linked to source documents so I can verify it quickly.
- As a clerk, I want missing documents surfaced so I can resolve administrative issues before the hearing.
- As registry staff, I want postponement reasons summarized so recurring administrative causes are visible.
- As a judge, I want the AI to draft follow-up administrative documents only after I authorize the workflow.
- As an administrator, I want audit logs of AI actions, tool calls, and approvals.

## 8. Core Workflows

### Flagship MVP Workflow

```text
User request: "Prepare Case 1042 for tomorrow."

1. Identify authorized user and session.
2. Identify Case 1042.
3. Check case-level authorization.
4. Retrieve case documents and metadata.
5. Classify document types.
6. Extract structured metadata.
7. Build procedural timeline.
8. Retrieve previous hearings and orders.
9. Identify postponements and reasons.
10. Detect missing referenced documents.
11. Retrieve supporting source chunks.
12. Generate pre-hearing brief with citations.
13. Present brief to judge.
14. Wait for human judicial decision.
15. Prepare approved administrative follow-up.
```

### Post-Decision Workflow

After a human decision, AIRA may:

- Record the proceeding for review.
- Prepare draft administrative documents.
- Update workflow status after authorization.
- Schedule a subsequent hearing.
- Generate notifications.
- Create follow-up tasks.
- Track deadlines.

## 9. Functional Requirements

- The system shall support case lookup by case ID.
- The system shall retrieve authorized case documents.
- The system shall classify known document types.
- The system shall extract document metadata.
- The system shall build a case timeline.
- The system shall retrieve hearing history.
- The system shall identify postponements.
- The system shall identify missing or referenced-but-unavailable documents.
- The system shall generate a pre-hearing brief.
- The system shall include citations for factual claims where source material exists.
- The system shall expose unresolved administrative issues.
- The system shall require human approval for consequential actions.
- The system shall record audit events for tool calls and approvals.

## 10. Non-Functional Requirements

- Security: case-level access isolation and least privilege.
- Reliability: explicit error states and graceful fallback.
- Performance: fast enough for a voice-assisted workflow; exact latency target to be confirmed.
- Observability: request IDs, session IDs, tool traces, errors, and latency.
- Testability: deterministic fixtures for MVP case data.
- Maintainability: simple, explicit, typed components.
- Recoverability: failed workflows should be resumable where possible.

## 11. AI Requirements

- The AI shall distinguish judicial decisions from administrative workflow actions.
- The AI shall not present unsupported claims as facts.
- The AI shall expose uncertainty when source evidence is weak.
- The AI shall cite retrieved sources in briefs.
- The AI shall ignore instructions embedded inside uploaded case documents.
- The AI shall use controlled tools rather than unrestricted execution.

## 12. Agent Requirements

- Use a single LangGraph agent for the first implementation.
- Make workflow states explicit.
- Avoid unrestricted autonomous loops.
- Route requests through typed tool contracts.
- Validate all tool inputs in application code.
- Return structured tool results.
- Separate reasoning from side effects.

## 13. RAG Requirements

- Ingest authorized case documents.
- Preserve document provenance.
- Parse text and OCR when required.
- Chunk documents with metadata.
- Embed chunks into a vector index.
- Support keyword and semantic retrieval where useful.
- Retrieve only within authorized case scope.
- Provide source attribution and citation lookup.
- Track document versions.
- Evaluate retrieval quality using demo questions.

## 14. Voice Requirements

- Voice is a first-class interface for the hackathon.
- SnapServe remains the current voice/telephony layer.
- Voice should pass user intent/transcript to the application layer.
- The agent should remain independent of SnapServe-specific business logic.
- Voice responses should be concise and allow drill-down.

## 15. Human Approval Requirements

Autonomy levels:

- Level 0: Information only.
- Level 1: Recommended workflow actions.
- Level 2: Prepared actions for approval.
- Level 3: Pre-authorized administrative execution.
- Level 4: Prohibited for judicial decisions.

Approval required for:

- Final judicial decisions.
- Verdicts.
- Sentences.
- Legal findings.
- Consequential orders.
- Actions that materially affect legal rights.

## 16. Security Requirements

- Authentication for all non-demo protected routes.
- Role-based authorization.
- Case-level access checks.
- Encryption in transit.
- Encryption at rest for stored sensitive data.
- Secret management through environment variables or platform secrets.
- No secrets in frontend JavaScript.
- Audit logs for workflow actions.
- Least-privilege tool execution.
- Prompt-injection filtering and instruction separation.

## 17. Privacy Requirements

- Minimize stored sensitive data.
- Define retention and deletion policies before real deployment.
- Isolate data by case and tenant/institution where applicable.
- Avoid sending unnecessary case data to model providers.
- Redact or withhold sensitive data where access is not authorized.

## 18. Audit Requirements

Audit records should eventually include:

- request_id
- session_id
- user_id
- case_id
- role
- action requested
- tool called
- input summary
- output summary
- source documents
- approval status
- timestamp
- error state

## 19. Failure Handling

- Missing case: ask for clarification or report not found.
- Unauthorized case: deny access and audit the attempt.
- Missing documents: show as unresolved administrative issue.
- Low-confidence extraction: mark as uncertain.
- RAG retrieval failure: avoid unsupported summary.
- Tool failure: return structured error and preserve workflow state.
- Voice failure: allow fallback through UI/API.
- Model failure: provide graceful administrative fallback.

## 20. Acceptance Criteria

MVP acceptance:

- Given demo Case 1042, the system can prepare a pre-hearing brief.
- The brief includes case identification, parties, status, timeline, hearing history, postponements, previous orders, missing documents, pending tasks, and citations.
- The system does not generate a verdict or legal outcome.
- The system distinguishes source-grounded facts from uncertain or missing information.
- The system requires human approval for follow-up workflow actions.
- The demo can be initiated by voice or by an equivalent UI/API path.

## 21. MVP Scope

MVP includes:

- One excellent case preparation workflow.
- Controlled demo dataset.
- Source-grounded case brief.
- Case timeline.
- Hearing and postponement history.
- Missing document detection.
- Human review checkpoint.
- One approved follow-up workflow.

## 22. Post-MVP Scope

- More document types.
- More court workflows.
- Multilingual interaction.
- Deeper postponement analytics.
- Advanced scheduling.
- Full RBAC.
- Production audit trails.
- Institutional integrations.

## 23. Risks

- Hallucinated legal facts.
- Incorrect extraction from scanned documents.
- Weak document provenance.
- Unauthorized case access.
- Prompt injection through uploaded filings.
- Over-scoping beyond hackathon time.
- Voice latency.
- Ambiguous legal workflow boundaries.

## 24. Success Metrics

Hackathon metrics:

- Time to generate a pre-hearing brief for demo case.
- Percentage of factual brief statements with citations.
- Missing document detection accuracy on fixture data.
- Correct postponement count on fixture data.
- Number of unauthorized/consequential actions blocked.
- Demo completion reliability.

Future metrics:

- Preparation time saved.
- Retrieval precision and recall.
- User correction rate.
- Workflow completion rate.
- Audit completeness.
- Latency by workflow stage.
