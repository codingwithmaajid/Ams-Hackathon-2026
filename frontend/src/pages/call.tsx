import { useEffect, useRef, useState, type FormEvent } from "react";
import { Activity, Loader2, PhoneCall, PhoneOff, Radio, Wrench } from "lucide-react";
import { BackendGate, Empty, ErrorNote, PageHeader, Panel } from "@/components/jolly/common";
import { HowItWorks } from "@/components/jolly/how-it-works";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, API_URL, ApiError } from "@/lib/api";
import { useApi } from "@/lib/backend";
import { humanize } from "@/lib/format";
import type { CallResponse, CallStatus, ExecutionEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const POLL_MS = 3000;
const FEED_MS = 4000;
const CALL_KEY = "jolly.lastCallId";

export default function CallPage() {
  return (
    <BackendGate>
      <PageHeader eyebrow="Voice · Bolna" title="Call the advocate" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-6">
          <Dialer />
        </div>
        <LiveFeed />
      </div>
      <div className="mt-10">
        <HowItWorks compact />
      </div>
    </BackendGate>
  );
}

// ---------------------------------------------------------------------------

function Dialer() {
  const cases = useApi(() => api.cases(), []);
  const [cc, setCc] = useState("+91");
  const [num, setNum] = useState("");
  const [caseId, setCaseId] = useState("");
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState<CallResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [callId, setCallId] = useState<string | null>(() => sessionStorage.getItem(CALL_KEY));

  const phone = `${cc.trim()}${num.replace(/[\s()-]/g, "")}`;
  const valid = /^\+[1-9]\d{6,14}$/.test(phone);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError(null);
    setPlaced(null);
    try {
      const r = await api.call(phone, caseId ? { case_id: caseId } : undefined);
      setPlaced(r);
      if (r.call_id) {
        setCallId(r.call_id);
        sessionStorage.setItem(CALL_KEY, r.call_id);
      }
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setBusy(false);
    }
  }

  const field =
    "h-11 rounded-lg border border-input bg-ivory px-3 text-base text-navy-deep outline-none focus-visible:ring-3 focus-visible:ring-ring/40";

  return (
    <>
      <Panel eyebrow="Outbound call" title="Have Jolly ring you">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Phone number</label>
            <div className="flex gap-2">
              <Input value={cc} onChange={(e) => setCc(e.target.value)} className="h-11 w-20 bg-ivory text-center font-mono text-base" aria-label="Country code" />
              <Input
                value={num}
                onChange={(e) => setNum(e.target.value)}
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="98765 43210"
                className="h-11 flex-1 bg-ivory font-mono text-base"
                aria-label="Number"
              />
            </div>
            {num && !valid && <p className="mt-1.5 text-xs text-red-700">Enter a full number; it is sent as {phone || "E.164"}.</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Brief me on</label>
            <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className={cn(field, "w-full")}>
              <option value="">Today's matters (morning brief)</option>
              {(cases.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.case_number})
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="h-11 w-full text-base" disabled={!valid || busy}>
            {busy ? <Loader2 className="animate-spin" /> : <PhoneCall />} Call me
          </Button>
        </form>
        {error && (
          <div className="mt-4">
            <ErrorNote
              error={error}
              title={error.kind === "http" ? `The call was not placed (HTTP ${error.status})` : "The call was not placed"}
            />
            {error.kind === "http" && /BOLNA|agent_id/i.test(error.message) && (
              <p className="mt-2 text-xs text-muted-foreground">
                Bolna isn't configured on this backend. Set BOLNA_API_KEY and BOLNA_AGENT_ID on the server to place calls.
              </p>
            )}
          </div>
        )}
        {placed && (
          <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
            {placed.message} · status <strong>{placed.status}</strong>
            {placed.call_id && <span className="ml-1 font-mono text-xs">({placed.call_id})</span>}
          </div>
        )}
      </Panel>
      {callId && (
        <CallTracker
          callId={callId}
          onClear={() => {
            sessionStorage.removeItem(CALL_KEY);
            setCallId(null);
            setPlaced(null);
          }}
        />
      )}
    </>
  );
}

function CallTracker({ callId, onClear }: { callId: string; onClear: () => void }) {
  const [status, setStatus] = useState<CallStatus | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [polling, setPolling] = useState(true);
  const fails = useRef(0);

  useEffect(() => {
    setStatus(null);
    setError(null);
    setPolling(true);
    fails.current = 0;
  }, [callId]);

  useEffect(() => {
    if (!polling) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const s = await api.callStatus(callId);
        if (cancelled) return;
        setStatus(s);
        setError(null);
        fails.current = 0;
        if (s.is_terminal) {
          setPolling(false);
          return;
        }
      } catch (e) {
        if (cancelled) return;
        setError(e as ApiError);
        if (++fails.current >= 3) {
          setPolling(false);
          return;
        }
      }
      timer = setTimeout(tick, POLL_MS);
    };
    void tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [callId, polling]);

  return (
    <Panel
      eyebrow="Execution status"
      title={
        <span className="flex items-center gap-2">
          {polling ? <Activity className="size-5 animate-pulse text-brass" /> : <PhoneOff className="size-5 text-navy/60" />}
          {status ? humanize(status.status) : "Checking…"}
        </span>
      }
      action={
        <div className="flex gap-2">
          {!polling && (
            <Button size="sm" variant="outline" onClick={() => setPolling(true)}>
              Refresh
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onClear}>
            Clear
          </Button>
        </div>
      }
    >
      <div className="mb-3 font-mono text-xs text-muted-foreground">execution {callId}</div>
      {error && <ErrorNote error={error} title={polling ? "Status check failed, retrying" : "Status check failed"} />}
      {status && (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={status.status} />
            {status.duration_seconds != null && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-navy">{Math.round(status.duration_seconds)}s</span>
            )}
          </div>
          {status.error_message && <div className="rounded-md bg-red-50 p-2.5 text-red-900">{status.error_message}</div>}
          {status.summary && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brass">Summary</div>
              <p className="mt-1 leading-relaxed text-navy-deep">{status.summary}</p>
            </div>
          )}
          {status.transcript && <Transcript text={status.transcript} />}
          {status.recording_url && <audio controls src={status.recording_url} className="w-full" />}
        </div>
      )}
    </Panel>
  );
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = (status ?? "unknown").toLowerCase();
  const tone =
    s === "completed"
      ? "bg-emerald-50 text-emerald-800"
      : ["failed", "error", "no-answer", "busy", "canceled", "stopped", "balance-low"].includes(s)
        ? "bg-red-50 text-red-800"
        : "bg-amber-50 text-amber-900";
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", tone)}>{humanize(s)}</span>;
}

/** Bolna transcripts are "assistant: …\nuser: …" lines. */
function Transcript({ text, maxLines }: { text: string; maxLines?: number }) {
  let lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const hidden = maxLines && lines.length > maxLines ? lines.length - maxLines : 0;
  if (hidden) lines = lines.slice(-maxLines!);
  return (
    <div className="space-y-1.5 rounded-lg bg-secondary/50 p-3">
      {hidden > 0 && <div className="text-[11px] text-muted-foreground">… {hidden} earlier lines</div>}
      {lines.map((l, i) => {
        const m = /^(assistant|agent|bot|user|human|customer)\s*:\s*(.*)$/i.exec(l);
        const who = m?.[1].toLowerCase();
        const isAgent = who === "assistant" || who === "agent" || who === "bot";
        return (
          <div key={i} className="flex gap-2 text-sm leading-relaxed">
            {m && (
              <span className={cn("w-14 shrink-0 text-[11px] font-semibold uppercase tracking-wide", isAgent ? "text-brass" : "text-navy/60")}>
                {isAgent ? "Jolly" : "Advocate"}
              </span>
            )}
            <span className="text-navy-deep">{m ? m[2] : l}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------

function LiveFeed() {
  const { data, error, reload } = useApi(() => api.recentExecutions(), [], { intervalMs: FEED_MS });
  return (
    <Panel
      eyebrow={`Bolna webhook · refreshes every ${FEED_MS / 1000}s`}
      title={
        <span className="flex items-center gap-2">
          <Radio className="size-5 text-red-600" /> Live call events
        </span>
      }
    >
      {error && <ErrorNote error={error} onRetry={reload} />}
      {data && data.length === 0 && (
        <Empty>
          No call events yet. Events appear here when Bolna posts to{" "}
          <span className="break-all font-mono text-xs text-navy">{API_URL}/bolna/webhook</span> (set it as the agent's webhook URL).
        </Empty>
      )}
      {data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((ev, i) => (
            <EventCard key={`${ev.id ?? "ev"}-${i}`} ev={ev} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

const KNOWN = new Set(["id", "agent_id", "status", "transcript", "summary", "extracted_data", "context_details"]);

/** Pull anything that looks like a tool / function call out of a Bolna payload, wherever it sits. */
function findToolCalls(value: unknown, path = "", out: { path: string; value: unknown }[] = [], depth = 0) {
  if (depth > 4 || value == null || typeof value !== "object") return out;
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const p = path ? `${path}.${k}` : k;
    if (/tool|function/i.test(k) && v != null && !(Array.isArray(v) && v.length === 0)) out.push({ path: p, value: v });
    else findToolCalls(v, p, out, depth + 1);
  }
  return out;
}

function EventCard({ ev }: { ev: ExecutionEvent }) {
  const tools = findToolCalls(ev);
  const extra = Object.fromEntries(Object.entries(ev).filter(([k]) => !KNOWN.has(k)));
  return (
    <li className="rounded-xl border border-navy/10 bg-ivory p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={ev.status} />
        <span className="font-mono text-xs text-muted-foreground">{ev.id ?? "no id"}</span>
      </div>
      {ev.summary && <p className="mt-2 text-sm leading-relaxed text-navy-deep">{ev.summary}</p>}
      {ev.transcript && (
        <div className="mt-2">
          <Transcript text={ev.transcript} maxLines={6} />
        </div>
      )}
      {tools.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {tools.map((t, i) => (
            <div key={i} className="rounded-md border border-navy/10 bg-card p-2">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-navy">
                <Wrench className="size-3" /> {t.path}
              </div>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] text-navy-deep">
                {typeof t.value === "string" ? t.value : JSON.stringify(t.value, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
      {ev.extracted_data && Object.keys(ev.extracted_data).length > 0 && (
        <KeyValues title="Extracted data" data={ev.extracted_data} />
      )}
      {Object.keys(extra).length > 0 && (
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer text-muted-foreground">Raw event fields</summary>
          <pre className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-md bg-card p-2 font-mono text-[11px] text-navy-deep">
            {JSON.stringify(extra, null, 2)}
          </pre>
        </details>
      )}
    </li>
  );
}

function KeyValues({ title, data }: { title: string; data: Record<string, unknown> }) {
  return (
    <div className="mt-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brass">{title}</div>
      <dl className="mt-1 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-[auto_1fr]">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-mono text-muted-foreground">{k}</dt>
            <dd className="break-words text-navy-deep">{typeof v === "string" ? v : JSON.stringify(v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
