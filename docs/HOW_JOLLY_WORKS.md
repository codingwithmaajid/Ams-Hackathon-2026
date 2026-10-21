# How Jolly works

Jolly is a voice clerk for Indian litigation advocates. It has three jobs and one rule.

| When | What the advocate does | What Jolly does |
| --- | --- | --- |
| Before court (8 AM) | Picks up a call | Reads today's matters: court, hall, item number, purpose, open tasks |
| Anytime | Asks "what did the court say last time in 1042?" | Answers only from the case file, and says which document it came from |
| After the hearing | Says what happened, in the corridor | Drafts the timeline entry, tasks and a client message |
| **The rule** | Taps Approve | Nothing is saved to the case or sent to a client before that tap |

## The pieces

```
 Advocate's phone
      |  (voice)
      v
 Bolna agent  --- Deepgram (hears) -> GPT-4.1-mini (decides) -> ElevenLabs (speaks)
      |  custom functions (HTTPS + shared secret)
      v
 Jolly backend (FastAPI on Render)
   /bolna/tools/get-daily-brief      -> services/cases.py   (deterministic brief, every line cited)
   /bolna/tools/get-case-brief       -> services/cases.py
   /bolna/tools/ask-case-question    -> services/qa.py      (retrieve paragraphs -> Gemini rephrases -> citations checked)
   /bolna/tools/log-hearing-update   -> services/dictation.py (Gemini or rules -> pending draft)
      |
      v
 Case store (SQLite now, Postgres later): Case, Document, Chunk, HearingEvent, Task, HearingUpdate
      ^
      |  REST
 Jolly console (React on Render): Today, Matters, Approvals, Call
```

Bolna is only the voice. It never knows legal facts; it asks the backend. That keeps the facts
testable and the guardrails (no outcome predictions, case files treated as data) in our code.

## The dictation -> approval loop

1. Advocate dictates ("Adjourned to 14 November for cross of PW1. Prepare cross questions...").
2. `services/dictation.py` extracts: outcome, next date, purpose, tasks, client message.
   Gemini if `LLM_API_KEY` is set; regex rules otherwise, so it never dead-ends.
3. A `HearingUpdate` row is stored with `status=pending`. The case is untouched.
4. The advocate opens **Approvals** in the console, edits if needed, taps Approve.
5. Approval writes a `HearingEvent`, the `Task`s, moves `next_hearing`, and returns a
   `wa.me` link with the client message. The advocate sends it from their own WhatsApp.
6. `/updates/metrics` tracks the share approved without edits: the product's quality number.

## Recreating the voice agent

`scripts/bolna_agent.py` builds the whole Bolna agent (prompt, voices, four tools) from code:

```
BOLNA_API_KEY=... BOLNA_WEBHOOK_SECRET=... JOLLY_BACKEND_URL=https://jolly-backend-poqc.onrender.com \
  uv run python scripts/bolna_agent.py            # create; prints agent_id
  uv run python scripts/bolna_agent.py --agent-id <id>   # update after prompt changes
```

Backend env needed for calls: `BOLNA_API_KEY`, `BOLNA_AGENT_ID`, `BOLNA_WEBHOOK_SECRET` (same value as in the agent's tool URLs).
