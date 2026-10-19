import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import { BackendGate, Empty, ErrorNote, LoadingRows, PageHeader } from "@/components/jolly/common";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useApi } from "@/lib/backend";
import { fmtDate, parseDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function MattersPage() {
  const { data, error, loading, reload } = useApi(() => api.cases(), []);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!data || !needle) return data ?? [];
    return data.filter((c) =>
      [c.id, c.title, c.case_number, c.client_name, c.opposing_party, c.court, c.advocate]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [data, q]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <BackendGate>
      <PageHeader eyebrow="Case file" title="Matters">
        <div className="relative w-full md:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by party, number, court"
            className="h-9 bg-card pl-9"
          />
        </div>
      </PageHeader>

      {error && <ErrorNote error={error} onRetry={reload} />}
      {!data && loading && <LoadingRows rows={5} />}
      {data && rows.length === 0 && <Empty>{data.length === 0 ? "The case store is empty." : "No matter matches that filter."}</Empty>}

      {rows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-card">
          <div className="hidden grid-cols-[1.6fr_1.2fr_0.8fr_1.2fr_24px] gap-4 border-b border-navy/10 bg-secondary/60 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/70 lg:grid">
            <span>Matter</span>
            <span>Court</span>
            <span>Next hearing</span>
            <span>Stage</span>
            <span />
          </div>
          <ul className="divide-y divide-navy/10">
            {rows.map((c) => {
              const next = parseDate(c.next_hearing);
              const isToday = next?.getTime() === today.getTime();
              return (
                <li key={c.id}>
                  <Link
                    to={`/matters/${encodeURIComponent(c.id)}`}
                    className="grid gap-2 px-5 py-4 transition-colors hover:bg-secondary/50 lg:grid-cols-[1.6fr_1.2fr_0.8fr_1.2fr_24px] lg:items-center lg:gap-4"
                  >
                    <div className="min-w-0">
                      <div className="font-serif text-lg leading-snug text-navy">{c.title}</div>
                      <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {c.case_number} · for {c.our_side.toLowerCase()} · {c.advocate}
                      </div>
                    </div>
                    <div className="text-sm text-navy-deep">
                      {c.court}
                      {c.court_hall && <span className="text-muted-foreground"> · {c.court_hall}</span>}
                    </div>
                    <div className="text-sm">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          isToday ? "bg-brass/20 text-navy" : "bg-secondary text-navy-deep",
                        )}
                      >
                        {isToday ? "Today" : fmtDate(c.next_hearing)}
                      </span>
                      {c.cause_list_item != null && (
                        <span className="ml-2 text-xs text-muted-foreground">item {c.cause_list_item}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{c.stage}</div>
                    <ChevronRight className="hidden size-4 text-muted-foreground lg:block" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </BackendGate>
  );
}
