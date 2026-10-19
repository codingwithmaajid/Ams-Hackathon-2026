import { useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { BackendGate, Empty, ErrorNote, LoadingRows, PageHeader, Panel } from "@/components/jolly/common";
import { CitationChip, useOpenDocument } from "@/components/jolly/citations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/backend";
import { fmtDate, humanize } from "@/lib/format";
import type { CaseAnswer, CaseDocument, DocumentKind, SearchHit, UploadResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function MatterPage() {
  const { caseId = "" } = useParams();
  const kase = useApi(() => api.case(caseId), [caseId]);

  return (
    <BackendGate>
      <Link to="/matters" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-navy">
        <ArrowLeft className="size-4" /> All matters
      </Link>
      {kase.error && <ErrorNote error={kase.error} onRetry={kase.reload} />}
      {!kase.data && kase.loading && <LoadingRows rows={3} />}
      {kase.data && (
        <>
          <PageHeader eyebrow={kase.data.case_number} title={kase.data.title} />
          <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,1.1fr)]">
            <div className="space-y-6">
              <Panel eyebrow="Matter" title="Particulars">
                <p className="mb-4 text-sm leading-relaxed text-navy-deep">{kase.data.summary}</p>
                <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  <Field label="Court" value={`${kase.data.court}${kase.data.court_hall ? ` · ${kase.data.court_hall}` : ""}`} />
                  <Field label="Judge" value={kase.data.judge} />
                  <Field label="Case type" value={kase.data.case_type} />
                  <Field label="We act for" value={`${kase.data.our_side} · ${kase.data.client_name}`} />
                  <Field label="Opposing party" value={kase.data.opposing_party} />
                  <Field label="Advocate" value={kase.data.advocate} />
                  <Field
                    label="Next hearing"
                    value={`${fmtDate(kase.data.next_hearing)}${kase.data.cause_list_item != null ? ` · item ${kase.data.cause_list_item}` : ""}`}
                  />
                  <Field label="Listed for" value={kase.data.next_hearing_purpose} />
                </dl>
              </Panel>
              <BriefPanel caseId={caseId} />
              <TimelinePanel caseId={caseId} />
              <TasksPanel caseId={caseId} />
            </div>
            <div className="space-y-6">
              <AskPanel caseId={caseId} />
              <DocumentsPanel caseId={caseId} />
            </div>
          </div>
        </>
      )}
    </BackendGate>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brass">{label}</dt>
      <dd className="mt-0.5 text-navy-deep">{value || "—"}</dd>
    </div>
  );
}

function BriefPanel({ caseId }: { caseId: string }) {
  const { data, error, reload } = useApi(() => api.brief(caseId), [caseId]);
  return (
    <Panel eyebrow="Cited brief" title="Where the matter stands">
      {error && <ErrorNote error={error} onRetry={reload} />}
      {!data && !error && <LoadingRows rows={2} />}
      {data && (
        <>
          {data.lines.length === 0 ? (
            <Empty>No hearing history yet.</Empty>
          ) : (
            <ul className="space-y-2.5">
              {data.lines.map((l, i) => (
                <li key={i} className="text-sm leading-relaxed text-navy-deep">
                  {l.text} {l.citation && <CitationChip caseId={caseId} citation={l.citation} className="ml-1 align-middle" />}
                </li>
              ))}
            </ul>
          )}
          <details className="mt-4 rounded-lg bg-secondary/60 p-3 text-sm">
            <summary className="cursor-pointer font-medium text-navy">What Jolly says on a call</summary>
            <p className="mt-2 font-serif text-base leading-relaxed text-navy-deep">“{data.spoken_summary}”</p>
          </details>
        </>
      )}
    </Panel>
  );
}

function TimelinePanel({ caseId }: { caseId: string }) {
  const { data, error, reload } = useApi(() => api.timeline(caseId), [caseId]);
  const docs = useApi(() => api.documents(caseId), [caseId]);
  const docById = new Map((docs.data ?? []).map((d) => [d.id, d]));
  return (
    <Panel eyebrow="Hearing timeline" title="Proceedings">
      {error && <ErrorNote error={error} onRetry={reload} />}
      {!data && !error && <LoadingRows rows={3} />}
      {data && data.length === 0 && <Empty>No events recorded.</Empty>}
      {data && data.length > 0 && (
        <ol className="relative ml-2 space-y-5 border-l border-navy/15 pl-6">
          {data.map((e, i) => (
            <li key={e.id ?? i} className="relative">
              <span
                className={cn(
                  "absolute top-1.5 -left-[31px] size-3 rounded-full ring-4 ring-card",
                  e.kind === "filing" ? "bg-brass" : "bg-navy",
                )}
              />
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-xs text-muted-foreground">{fmtDate(e.event_date)}</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brass">{humanize(e.kind)}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-navy-deep">{e.outcome}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {e.source_doc_id && (
                  <CitationChip
                    caseId={caseId}
                    citation={{
                      doc_id: e.source_doc_id,
                      doc_title: docById.get(e.source_doc_id)?.title ?? e.source_doc_id,
                      para: e.source_para,
                      doc_date: docById.get(e.source_doc_id)?.doc_date ?? null,
                    }}
                  />
                )}
                {e.next_date && <span className="text-xs text-muted-foreground">Next date: {fmtDate(e.next_date)}</span>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

function TasksPanel({ caseId }: { caseId: string }) {
  const { data, error, reload } = useApi(() => api.tasks(caseId), [caseId]);
  return (
    <Panel eyebrow="Tasks" title="To do">
      {error && <ErrorNote error={error} onRetry={reload} />}
      {!data && !error && <LoadingRows rows={2} />}
      {data && data.length === 0 && <Empty>No tasks.</Empty>}
      {data && data.length > 0 && (
        <ul className="divide-y divide-navy/10">
          {data.map((t, i) => {
            const done = t.status === "done";
            return (
              <li key={t.id ?? i} className="flex items-start gap-3 py-2.5">
                {done ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-brass" />
                )}
                <div className="min-w-0 flex-1">
                  <div className={cn("text-sm text-navy-deep", done && "text-muted-foreground line-through")}>{t.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {[t.owner, t.due && `due ${fmtDate(t.due)}`].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Ask Jolly
// ---------------------------------------------------------------------------

// Prompts only; every answer comes from POST /cases/{id}/ask.
const PROMPTS = ["What happened on the last date?", "What was ordered last time?", "Will we win this case?"];

interface Turn {
  question: string;
  answer?: CaseAnswer;
  error?: ApiError;
}

function AskPanel({ caseId }: { caseId: string }) {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);

  async function ask(q: string) {
    const text = q.trim();
    if (text.length < 2 || busy) return;
    setBusy(true);
    setQuestion("");
    setTurns((t) => [{ question: text }, ...t]);
    try {
      const answer = await api.ask(caseId, text);
      setTurns((t) => [{ question: text, answer }, ...t.slice(1)]);
    } catch (e) {
      setTurns((t) => [{ question: text, error: e as ApiError }, ...t.slice(1)]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(question);
  }

  return (
    <Panel
      eyebrow="Same pipeline the voice agent uses"
      title={
        <span className="flex items-center gap-2">
          <BookOpenCheck className="size-5 text-brass" /> Ask Jolly
        </span>
      }
      className="border-t-4 border-t-navy"
    >
      <form onSubmit={onSubmit} className="flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about this matter's record…"
          className="h-10 bg-ivory text-base"
          maxLength={1000}
        />
        <Button type="submit" className="h-10 px-4" disabled={busy || question.trim().length < 2}>
          {busy ? <Loader2 className="animate-spin" /> : <Send />} Ask
        </Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            disabled={busy}
            onClick={() => void ask(p)}
            className="rounded-full border border-navy/15 px-3 py-1 text-xs text-navy hover:bg-secondary disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {turns.map((t, i) => (
          <div key={turns.length - i} className="space-y-2">
            <div className="text-sm font-medium text-navy">
              <span className="text-muted-foreground">Q.</span> {t.question}
            </div>
            {!t.answer && !t.error && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Searching the file…
              </div>
            )}
            {t.error && <ErrorNote error={t.error} title="Jolly couldn't answer" />}
            {t.answer && <AnswerCard caseId={caseId} a={t.answer} />}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AnswerCard({ caseId, a }: { caseId: string; a: CaseAnswer }) {
  if (a.mode === "refused") {
    return (
      <div className="rounded-xl border-2 border-amber-400/70 bg-amber-50 p-4">
        <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-900">
          <ShieldAlert className="size-4" /> Guardrail · outcome prediction declined
        </div>
        <p className="text-sm leading-relaxed text-amber-950">{a.answer}</p>
      </div>
    );
  }
  if (!a.answerable) {
    return (
      <div className="rounded-xl border border-dashed border-navy/25 bg-secondary/50 p-4">
        <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-navy/70">
          <Search className="size-4" /> Not in the case file
        </div>
        <p className="text-sm leading-relaxed text-navy-deep">{a.answer}</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-navy/10 bg-ivory p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
          <ShieldCheck className="size-3" /> Cited answer
        </span>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-navy/80">
          {a.mode === "llm" ? "Gemini, citations validated" : a.mode === "extractive" ? "Quoted from the record (no LLM)" : a.mode}
        </span>
      </div>
      <p className="font-serif text-[17px] leading-relaxed text-navy-deep">{a.answer}</p>
      {a.citations.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-navy/10 pt-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brass">Sources</div>
          {a.citations.map((c, i) => (
            <div key={i} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
              <CitationChip caseId={caseId} citation={c} trusted={c.trusted} className="shrink-0" />
              <span className="text-xs leading-relaxed text-muted-foreground">“{c.quote}”</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Documents: list, search, upload
// ---------------------------------------------------------------------------

const KINDS: DocumentKind[] = ["note", "order_sheet", "pleading", "evidence", "correspondence"];

function DocumentsPanel({ caseId }: { caseId: string }) {
  const docs = useApi(() => api.documents(caseId), [caseId]);
  const open = useOpenDocument();
  const [showUpload, setShowUpload] = useState(false);

  return (
    <Panel
      eyebrow="Case file"
      title="Documents"
      action={
        <Button variant="outline" size="sm" onClick={() => setShowUpload((s) => !s)}>
          <Upload /> {showUpload ? "Close" : "Upload"}
        </Button>
      }
    >
      {showUpload && <UploadForm caseId={caseId} onDone={docs.reload} />}
      <SearchBox caseId={caseId} />
      {docs.error && <ErrorNote error={docs.error} onRetry={docs.reload} />}
      {!docs.data && !docs.error && <LoadingRows rows={3} />}
      {docs.data && docs.data.length === 0 && <Empty>No documents yet.</Empty>}
      {docs.data && docs.data.length > 0 && (
        <ul className="mt-2 divide-y divide-navy/10">
          {docs.data.map((d: CaseDocument) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => open({ caseId, docId: d.id, para: null })}
                className="flex w-full items-start gap-3 py-3 text-left hover:bg-secondary/40"
              >
                <FileText className="mt-0.5 size-4 shrink-0 text-navy/60" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-navy">{d.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {humanize(d.kind)} · {fmtDate(d.doc_date)} · <span className="font-mono">{d.id}</span>
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    d.trusted ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900",
                  )}
                >
                  {d.trusted ? "Record" : "Untrusted"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function SearchBox({ caseId }: { caseId: string }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(e: FormEvent) {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setBusy(true);
    setError(null);
    try {
      setHits(await api.search(caseId, q.trim()));
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-3">
      <form onSubmit={run} className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search paragraphs in this file"
          className="h-9 bg-ivory pl-9"
        />
        {busy && <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </form>
      {error && <div className="mt-2"><ErrorNote error={error} /></div>}
      {hits && (
        <div className="mt-2 space-y-2 rounded-lg bg-secondary/50 p-3">
          {hits.length === 0 && <div className="text-sm text-muted-foreground">No matching paragraphs.</div>}
          {hits.map((h, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2">
                <CitationChip caseId={caseId} citation={h} trusted={h.trusted} />
                <span className="font-mono text-[10px] text-muted-foreground">score {h.score.toFixed(3)}</span>
              </div>
              <p className="text-xs leading-relaxed text-navy-deep">{h.text}</p>
            </div>
          ))}
          <button type="button" onClick={() => setHits(null)} className="text-xs text-muted-foreground underline">
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

function UploadForm({ caseId, onDone }: { caseId: string; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<DocumentKind>("note");
  const [docDate, setDocDate] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setText(await f.text());
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await api.upload(caseId, { title: title.trim(), kind, doc_date: docDate || null, text });
      setResult(r);
      setTitle("");
      setText("");
      setDocDate("");
      onDone();
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setBusy(false);
    }
  }

  const field = "h-9 rounded-lg border border-input bg-ivory px-2.5 text-sm text-navy-deep outline-none focus-visible:ring-3 focus-visible:ring-ring/40";

  return (
    <form onSubmit={submit} className="mb-4 space-y-3 rounded-xl border border-navy/10 bg-secondary/40 p-4">
      <div className="grid gap-2 sm:grid-cols-[1fr_150px_150px]">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required className="h-9 bg-ivory" />
        <select value={kind} onChange={(e) => setKind(e.target.value as DocumentKind)} className={field} aria-label="Kind">
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {humanize(k)}
            </option>
          ))}
        </select>
        <input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} className={field} aria-label="Document date" />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        required
        rows={6}
        placeholder={"Paste text. Separate paragraphs with a blank line; optional [P1] markers are kept as citations."}
        className="w-full rounded-lg border border-input bg-ivory p-2.5 font-mono text-xs leading-relaxed text-navy-deep outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      />
      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" accept=".txt,.md,text/plain" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          Load .txt file
        </Button>
        <Button type="submit" size="sm" disabled={busy || !title.trim() || !text.trim()}>
          {busy ? <Loader2 className="animate-spin" /> : <Upload />} Add to file
        </Button>
        <span className="text-xs text-muted-foreground">Uploads are stored as untrusted data.</span>
      </div>
      {error && <ErrorNote error={error} title="Upload failed" />}
      {result && (
        <div className="space-y-2 rounded-lg bg-card p-3 text-sm">
          <div className="text-navy-deep">
            Indexed <strong>{result.chunks}</strong> paragraph{result.chunks === 1 ? "" : "s"} as{" "}
            <span className="font-mono text-xs">{result.doc_id}</span>.
          </div>
          {result.flagged_paragraphs.length > 0 ? (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-red-900">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              <span>
                Quarantined {result.flagged_paragraphs.join(", ")}: reads like instructions to an AI (prompt injection). Kept on
                record, never sent to the model or spoken.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-800">
              <ShieldCheck className="size-4" /> No prompt-injection patterns found.
            </div>
          )}
        </div>
      )}
    </form>
  );
}
