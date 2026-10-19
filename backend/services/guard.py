"""Safety rails shared by ingestion, retrieval and answering.

1. Prompt-injection screening: document text is data, never instructions.
   Paragraphs that address an AI or try to change its behaviour are flagged
   at ingestion and excluded from anything the model reads or the agent says.
2. Outcome questions: Jolly does not predict verdicts, liability, sentences
   or who will win. It answers with the record instead.
"""

import re

_INJECTION = [
    r"\bignore (all |any )?(the )?(previous|prior|above|earlier) (instructions|prompts?|rules)",
    r"\bdisregard (all |any )?(the )?(previous|prior|above|system)",
    r"\b(you are|act as|pretend to be) (now )?(an? )?(ai|assistant|chatbot|model|jolly)\b",
    r"\b(system prompt|developer message|jailbreak)\b",
    r"\b(tell|inform|say to) the (advocate|lawyer|user|counsel|client)\b",
    r"\bnew instructions?\b",
    r"\bdo not (cite|mention|disclose)\b",
]
_INJECTION_RE = re.compile("|".join(_INJECTION), re.IGNORECASE)

_OUTCOME = [
    r"\b(will|would|can|could|are|am) (we|i|my client|the client|they|he|she)\b.{0,25}\b(win|lose|succeed|get bail|be convicted|be acquitted)",
    r"\b(chances?|odds|probability|likelihood)\b.{0,30}\b(win|winning|success|bail|conviction|acquittal|decree)",
    r"\b(predict|forecast)\b",
    r"\bwhat (will|would) the (judge|court|bench) (do|decide|rule|order)",
    r"\b(is|was) (he|she|the accused|the defendant|my client|they) (guilty|liable|innocent)",
    r"\bwhat sentence\b",
    r"\bwho (will|would) win\b",
]
_OUTCOME_RE = re.compile("|".join(_OUTCOME), re.IGNORECASE)

OUTCOME_REFUSAL = (
    "I don't predict outcomes, verdicts or what the court will decide. "
    "I can tell you exactly what the record says, what is listed today and what is pending."
)


def looks_like_injection(text: str) -> bool:
    return bool(_INJECTION_RE.search(text))


def asks_for_outcome(question: str) -> bool:
    return bool(_OUTCOME_RE.search(question))
