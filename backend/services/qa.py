"""Answer a question about one case, with citations, or decline honestly.

Pipeline: outcome guard -> retrieve screened paragraphs -> (Gemini rephrase
with citation validation | extractive fallback). Untrusted passages (e.g. the
other side's counter affidavit) are attributed, never stated as fact.
"""

import logging
from datetime import date

from pydantic import BaseModel
from sqlmodel import Session

from backend.models.cases import Case
from backend.services.embeddings import Embedder
from backend.services.guard import OUTCOME_REFUSAL, asks_for_outcome, looks_like_injection
from backend.services.retrieval import Hit, search, with_neighbours

logger = logging.getLogger(__name__)


class AnswerCitation(BaseModel):
    doc_id: str
    doc_title: str
    para: str | None
    doc_date: date | None
    quote: str
    trusted: bool


class CaseAnswer(BaseModel):
    case_id: str
    question: str
    answer: str
    answerable: bool
    mode: str  # llm | extractive | refused | not_found
    citations: list[AnswerCitation]


def _spoken_date(d: date | None) -> str:
    return d.strftime("%-d %B %Y") if d else "an undated document"


def _source_label(h: Hit) -> str:
    return f"{h.doc_title}, {h.para}, {_spoken_date(h.doc_date)}"


def _cite(h: Hit) -> AnswerCitation:
    return AnswerCitation(doc_id=h.doc_id, doc_title=h.doc_title, para=h.para, doc_date=h.doc_date,
                          quote=h.text, trusted=h.trusted)


def _extractive(case: Case, question: str, hits: list[Hit]) -> CaseAnswer:
    """No-LLM fallback: quote the best passages, grouped by document, in record order."""
    best = hits[0].score
    top = [h for h in hits[:4] if h.score >= best * 0.6]
    top.sort(key=lambda h: (h.doc_id, h.para or ""))
    groups: dict[str, list[Hit]] = {}
    for h in top:
        groups.setdefault(h.doc_id, []).append(h)
    parts = []
    for doc_hits in groups.values():
        h0 = doc_hits[0]
        quoted = " ".join(h.text for h in doc_hits)
        if h0.trusted:
            parts.append(f"The {h0.doc_title} of {_spoken_date(h0.doc_date)} records: {quoted}")
        else:
            parts.append(f"The opposing party's {h0.doc_title} claims: {quoted}")
    return CaseAnswer(case_id=case.id, question=question, answer=" ".join(parts), answerable=True,
                      mode="extractive", citations=[_cite(h) for h in top])


def answer_question(
    session: Session, case: Case, question: str, *, embedder: Embedder, llm=None, k: int = 5,
) -> CaseAnswer:
    question = question.strip()
    if asks_for_outcome(question):
        return CaseAnswer(case_id=case.id, question=question, answer=OUTCOME_REFUSAL, answerable=False,
                          mode="refused", citations=[])
    hits = with_neighbours(session, search(session, embedder, question, case_id=case.id, k=k))
    if not hits:
        return CaseAnswer(case_id=case.id, question=question, answerable=False, mode="not_found", citations=[],
                          answer="I couldn't find that in the case file. You may want to check the physical file.")
    if llm is not None:
        passages = [
            {"id": h.chunk_id,
             "source": _source_label(h) + ("" if h.trusted else " (filed by the opposing party; their claim, not a finding)"),
             "text": h.text}
            for h in hits
        ]
        try:
            out = llm.grounded_answer(question, passages)
            by_id = {h.chunk_id: h for h in hits}
            cited = [by_id[c] for c in out.get("citations", []) if c in by_id]
            answer = str(out.get("answer", "")).strip()
            answerable = bool(out.get("answerable", True))
            if answerable and (not cited or not answer or looks_like_injection(answer)):
                raise ValueError("ungrounded or unsafe model output")
            if not answerable:
                return CaseAnswer(case_id=case.id, question=question, answer=answer or
                                  "The case file doesn't say.", answerable=False, mode="llm", citations=[])
            return CaseAnswer(case_id=case.id, question=question, answer=answer, answerable=True, mode="llm",
                              citations=[_cite(h) for h in cited])
        except Exception as exc:  # network, quota, bad JSON, failed validation
            logger.warning("LLM answer rejected, falling back to extractive: %s", exc)
    return _extractive(case, question, hits)
