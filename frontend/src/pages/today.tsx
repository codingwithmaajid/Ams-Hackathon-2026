import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, ListChecks, Mic, PhoneCall } from "lucide-react";
import { BackendGate, Empty, ErrorNote, LoadingRows, PageHeader, Panel } from "@/components/jolly/common";
import { CitationChip } from "@/components/jolly/citations";
import { HowItWorks } from "@/components/jolly/how-it-works";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useApi } from "@/lib/backend";
import { fmtLongDate } from "@/lib/format";
import type { CaseBrief } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function TodayPage() {
  const [date, setDate] = useState<string>("");
  const { data, error, loading, reload } = useApi(() => api.dailyBrief(date || undefined), [date]);

  return (
    <BackendGate>
      <PageHeader eyebrow="Morning brief" title={data ? fmtLongDate(data.date) : "Today"}>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          <Input
            type="date"
            value={date || data?.date || ""}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 w-44 bg-card"
            aria-label="Brief date"
          />
        </label>
      </PageHeader>

      {error && <ErrorNote error={error} onRetry={reload} />}
      {!data && loading && <LoadingRows rows={4} />}

      {data && (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            <Stat label="Matters listed" value={data.matters.length} />
            <Stat label="Open tasks across them" value={data.matters.reduce((n, m) => n + m.open_tasks.length, 0)} />
            <Stat label="Courts" value={new Set(data.matters.map((m) => m.court)).size} />
          </div>

          <Panel
            eyebrow="What Jolly says on the 8 AM call"
            title={
              <span className="flex items-center gap-2">
                <Mic className="size-5 text-brass" /> Spoken brief
              </span>
            }
            action={
              <Link to="/call" className={cn(buttonVariants({ variant: "default" }), "h-9 px-3")}>
                <PhoneCall /> Call me with this
              </Link>
            }
            className="border-l-4 border-l-brass"
          >
            <blockquote className="font-serif text-lg leading-relaxed text-navy-deep md:text-xl">“{data.spoken_summary}”</blockquote>
          </Panel>

          <div>
            <h2 className="mb-4 font-serif text-2xl text-navy">Matters for the day</h2>
            {data.matters.length === 0 ? (
              <Empty>No matters are listed for {fmtLongDate(data.date)}.</Empty>
            ) : (
              <div className="space-y-4">
                {data.matters.map((m) => (
                  <MatterCard key={m.case_id} m={m} />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-4 font-serif text-xl text-navy">How it works</h2>
            <HowItWorks compact />
          </div>
        </div>
      )}
    </BackendGate>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-card px-5 py-4">
      <div className="font-serif text-4xl text-navy">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function MatterCard({ m }: { m: CaseBrief }) {
  return (
    <article className="grid overflow-hidden rounded-2xl border border-navy/10 bg-card md:grid-cols-[150px_1fr]">
      <div className="flex flex-row items-center gap-4 bg-navy px-5 py-4 text-ivory md:flex-col md:items-start md:justify-center md:gap-1">
        <div className="text-[11px] uppercase tracking-[0.16em] text-ivory/60">Item no.</div>
        <div className="font-serif text-4xl leading-none text-brass-light">{m.cause_list_item ?? "—"}</div>
        <div className="text-sm text-ivory/80">{m.court_hall ?? "Hall not set"}</div>
      </div>
      <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-muted-foreground">{m.court}</div>
            <Link to={`/matters/${encodeURIComponent(m.case_id)}`} className="group mt-1 inline-flex items-start gap-1">
              <h3 className="font-serif text-xl leading-snug text-navy group-hover:underline">{m.title}</h3>
              <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
            </Link>
            <div className="mt-0.5 font-mono text-xs text-muted-foreground">{m.case_number}</div>
          </div>
        </div>

        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brass">Listed for</dt>
            <dd className="mt-0.5 text-navy-deep">{m.next_hearing_purpose ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brass">Stage</dt>
            <dd className="mt-0.5 text-navy-deep">{m.stage}</dd>
          </div>
        </dl>

        {m.lines.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-navy/10 pt-4">
            {m.lines.map((l, i) => (
              <li key={i} className="text-sm leading-relaxed">
                <span className="text-navy-deep">{l.text}</span>{" "}
                {l.citation && <CitationChip caseId={m.case_id} citation={l.citation} className="ml-1 align-middle" />}
              </li>
            ))}
          </ul>
        )}

        {m.open_tasks.length > 0 && (
          <div className="mt-4 rounded-xl bg-secondary/70 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy">
              <ListChecks className="size-3.5" /> Next steps
            </div>
            <ul className="list-disc space-y-1 pl-5 text-sm text-navy-deep">
              {m.open_tasks.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
