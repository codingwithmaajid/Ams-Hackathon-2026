import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { FileText, ShieldAlert, X } from "lucide-react";
import { api } from "@/lib/api";
import { citationLabel, fmtDate, humanize, paragraphs } from "@/lib/format";
import type { CaseDocument, Citation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ErrorNote, LoadingRows } from "./common";

interface Target {
  caseId: string;
  docId: string;
  para: string | null;
}

const ViewerContext = createContext<(t: Target) => void>(() => {});

export function useOpenDocument() {
  return useContext(ViewerContext);
}

/** A source chip: document · paragraph · date. Clicking opens the document at that paragraph. */
export function CitationChip({
  caseId,
  citation,
  trusted,
  className,
}: {
  caseId: string;
  citation: Citation;
  trusted?: boolean;
  className?: string;
}) {
  const open = useOpenDocument();
  const untrusted = trusted === false;
  return (
    <button
      type="button"
      onClick={() => open({ caseId, docId: citation.doc_id, para: citation.para })}
      title={`Open ${citation.doc_id}${citation.para ? ` at ${citation.para}` : ""}`}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-0.5 text-left text-xs font-medium transition-colors",
        untrusted
          ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
          : "border-navy/15 bg-navy/[0.04] text-navy hover:bg-navy/10",
        className,
      )}
    >
      {untrusted ? <ShieldAlert className="size-3 shrink-0" /> : <FileText className="size-3 shrink-0" />}
      <span className="truncate">{citationLabel(citation)}</span>
      {untrusted && <span className="shrink-0 text-[10px] uppercase tracking-wide">other side</span>}
    </button>
  );
}

export function DocumentViewerProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<Target | null>(null);
  return (
    <ViewerContext.Provider value={setTarget}>
      {children}
      {target && <DocumentViewer target={target} onClose={() => setTarget(null)} />}
    </ViewerContext.Provider>
  );
}

function DocumentViewer({ target, onClose }: { target: Target; onClose: () => void }) {
  const [doc, setDoc] = useState<CaseDocument | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const hl = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDoc(null);
    setError(null);
    api
      .documents(target.caseId)
      .then((docs) => {
        if (cancelled) return;
        const d = docs.find((x) => x.id === target.docId);
        if (d) setDoc(d);
        else setError(new Error(`Document ${target.docId} is not in this case file.`));
      })
      .catch((e: Error) => !cancelled && setError(e));
    return () => {
      cancelled = true;
    };
  }, [target.caseId, target.docId]);

  useEffect(() => {
    hl.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [doc]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-navy-deep/50 backdrop-blur-[2px]" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        className="flex h-full w-full max-w-2xl flex-col bg-ivory shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-navy/10 bg-navy px-6 py-5 text-ivory">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass-light">
              Source document{target.para ? ` · ${target.para}` : ""}
            </div>
            <h2 className="mt-1 font-serif text-2xl leading-tight">{doc?.title ?? target.docId}</h2>
            {doc && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ivory/70">
                <span className="font-mono">{doc.id}</span>
                <span>{humanize(doc.kind)}</span>
                <span>{fmtDate(doc.doc_date)}</span>
                <span className={doc.trusted ? "text-emerald-300" : "text-amber-300"}>
                  {doc.trusted ? "Court record / firm file" : "Untrusted: uploaded or filed by the other side"}
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-ivory/80 hover:bg-white/10" aria-label="Close">
            <X className="size-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && <ErrorNote error={error} title="Couldn't open the source" />}
          {!doc && !error && <LoadingRows rows={4} />}
          {doc && (
            <div className="space-y-3">
              {paragraphs(doc.text).map((p, i) => {
                const active = target.para != null && p.para === target.para;
                return (
                  <div
                    key={i}
                    ref={active ? hl : undefined}
                    className={cn(
                      "flex gap-3 rounded-lg p-3 font-serif text-[17px] leading-relaxed text-navy-deep",
                      active && "bg-brass/15 ring-1 ring-brass/60",
                    )}
                  >
                    <span className="w-8 shrink-0 pt-1 font-mono text-xs text-muted-foreground">{p.para}</span>
                    <p>{p.text}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
