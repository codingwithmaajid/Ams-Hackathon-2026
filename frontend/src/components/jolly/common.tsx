import type { ReactNode } from "react";
import { AlertTriangle, Loader2, RefreshCw, Server, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_URL, type ApiError } from "@/lib/api";
import { useBackend } from "@/lib/backend";
import { cn } from "@/lib/utils";

export function StatusPill({ className }: { className?: string }) {
  const { state, waitingSeconds, retry } = useBackend();
  const map = {
    online: { dot: "bg-emerald-400", label: "Backend online" },
    checking: { dot: "bg-amber-300 animate-pulse", label: "Connecting…" },
    waking: { dot: "bg-amber-300 animate-pulse", label: `Waking up · ${waitingSeconds}s` },
    offline: { dot: "bg-red-400", label: "Backend offline" },
  } as const;
  const s = map[state];
  return (
    <button
      type="button"
      onClick={state === "offline" ? retry : undefined}
      title={`API: ${API_URL}`}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-ivory/90",
        state === "offline" && "cursor-pointer hover:bg-white/10",
        className,
      )}
    >
      <span className={cn("size-2 rounded-full", s.dot)} />
      {s.label}
      {state === "offline" && <RefreshCw className="size-3" />}
    </button>
  );
}

/** Renders children only when the backend is reachable; otherwise a clear waking/offline panel. */
export function BackendGate({ children }: { children: ReactNode }) {
  const { state, waitingSeconds, retry, lastError } = useBackend();
  if (state === "online") return <>{children}</>;
  const offline = state === "offline";
  return (
    <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-navy/10 bg-card p-8 text-center shadow-sm">
      <div
        className={cn(
          "mx-auto mb-4 flex size-12 items-center justify-center rounded-full",
          offline ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700",
        )}
      >
        {offline ? <WifiOff className="size-6" /> : <Server className="size-6 animate-pulse" />}
      </div>
      <h2 className="font-serif text-2xl text-navy">
        {offline ? "Backend offline" : state === "checking" ? "Connecting to Jolly…" : "Waking up the backend"}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {offline
          ? "The Jolly API did not answer within two minutes. It may be redeploying or the URL may be wrong."
          : "The API runs on Render's free plan, which sleeps when idle. A cold start takes about a minute; this page fills in on its own once it answers."}
      </p>
      {state !== "offline" && state !== "checking" && (
        <p className="mt-4 font-mono text-sm text-navy/70">
          <Loader2 className="mr-2 inline size-4 animate-spin" />
          waiting {waitingSeconds}s
        </p>
      )}
      <p className="mt-4 break-all font-mono text-xs text-muted-foreground">{API_URL}</p>
      {offline && lastError && <p className="mt-2 text-xs text-red-700">{lastError}</p>}
      <Button className="mt-6" variant={offline ? "default" : "outline"} onClick={retry}>
        <RefreshCw /> Retry now
      </Button>
    </div>
  );
}

export function ErrorNote({ error, onRetry, title }: { error: ApiError | Error; onRetry?: () => void; title?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-900">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="font-medium">{title ?? "The backend returned an error"}</div>
        <div className="mt-0.5 break-words text-red-800/90">{error.message}</div>
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function Panel({
  title,
  eyebrow,
  action,
  children,
  className,
}: {
  title?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-navy/10 bg-card p-5 shadow-[0_1px_0_rgba(15,23,42,0.03)] md:p-6", className)}>
      {(title || action || eyebrow) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            {eyebrow && <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brass">{eyebrow}</div>}
            {title && <h2 className="font-serif text-xl text-navy">{title}</h2>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-navy/[0.06]", className)} />;
}

export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-navy/15 p-5 text-sm text-muted-foreground">{children}</p>;
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brass">{eyebrow}</div>}
        <h1 className="font-serif text-3xl leading-tight text-navy md:text-4xl">{title}</h1>
      </div>
      {children}
    </div>
  );
}
