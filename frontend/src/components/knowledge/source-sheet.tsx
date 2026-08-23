import { CheckCircle2, CircleDashed, Loader2, RefreshCw, Trash2 } from "lucide-react";

import { useStore, type Source } from "@/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { KIND_LABELS, SourceIcon } from "@/components/knowledge/source-icon";

function chunkList(content: string) {
  if (!content.trim()) return [];
  const chunks: string[] = [];
  for (let i = 0; i < content.length; i += 600)
    chunks.push(content.slice(i, i + 600));
  return chunks;
}

export function SourceSheet({
  source,
  onOpenChange,
}: {
  source: Source | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { retrainSource, removeSource } = useStore();
  const chunks = source ? chunkList(source.content) : [];

  const stage = source?.status === "ready" ? 3 : Math.floor((source?.progress ?? 0) / 34);

  return (
    <Sheet open={source !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {source && (
          <>
            <SheetHeader className="pr-10">
              <div className="flex items-start gap-3">
                <SourceIcon kind={source.kind} name={source.name} />
                <div className="min-w-0">
                  <SheetTitle className="break-words">{source.name}</SheetTitle>
                  <SheetDescription>
                    {KIND_LABELS[source.kind]} · added {source.addedAt}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-5 px-4 pb-6">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ["words", source.words.toLocaleString()],
                  ["chunks", String(source.chunks)],
                  ["status", source.status],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-muted/60 px-2 py-2">
                    <p className="font-mono text-sm font-semibold tabular-nums">{v}</p>
                    <p className="text-[11px] text-muted-foreground">{k}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">Training pipeline</p>
                <ol className="flex flex-col gap-1.5 text-sm">
                  {["Ingest & clean", "Chunk content", "Embed & index"].map((s, i) => (
                    <li key={s} className="flex items-center gap-2">
                      {stage > i || source.status === "ready" ? (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      ) : stage === i ? (
                        <Loader2 className="size-4 animate-spin text-primary" />
                      ) : (
                        <CircleDashed className="size-4 text-muted-foreground" />
                      )}
                      {s}
                      {(stage > i || source.status === "ready") && (
                        <Badge variant="secondary" className="ml-auto font-mono text-[10px]">
                          done
                        </Badge>
                      )}
                    </li>
                  ))}
                </ol>
                {source.status === "training" && (
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${source.progress}%` }}
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">Content preview</p>
                {source.content.trim() ? (
                  <pre className="max-h-48 overflow-y-auto rounded-lg border bg-background p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                    {source.content.slice(0, 2000)}
                    {source.content.length > 2000 && "\n…"}
                  </pre>
                ) : (
                  <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                    No readable preview — binary file imported as metadata.
                  </p>
                )}
              </div>

              {chunks.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Generated chunks ({chunks.length})
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {chunks.slice(0, 6).map((c, i) => (
                      <li key={i} className="rounded-lg bg-muted/60 px-3 py-2 text-xs leading-relaxed">
                        <span className="mr-1.5 font-mono font-semibold text-primary">
                          #{i + 1}
                        </span>
                        {c.slice(0, 140).replace(/\s+/g, " ")}…
                      </li>
                    ))}
                    {chunks.length > 6 && (
                      <li className="px-3 font-mono text-xs text-muted-foreground">
                        +{chunks.length - 6} more chunks in the vector store
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <Separator />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => retrainSource(source.id)}
                >
                  <RefreshCw className="size-4" />
                  Retrain
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    removeSource(source.id);
                    onOpenChange(false);
                  }}
                >
                  <Trash2 className="size-4" />
                  Remove
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
