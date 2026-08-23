import { useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Database,
  FileStack,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Type,
} from "lucide-react";

import { useStore, type Source, type SourceKind } from "@/store";
import { AddKnowledgeDialog } from "@/components/knowledge/add-knowledge-dialog";
import { KIND_LABELS, SourceIcon } from "@/components/knowledge/source-icon";
import { SourceSheet } from "@/components/knowledge/source-sheet";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";

type Filter = "all" | SourceKind;

const FILTERS: { value: Filter; label: string; icon?: typeof Type }[] = [
  { value: "all", label: "All" },
  { value: "file", label: "Files" },
  { value: "text", label: "Text" },
  { value: "qa", label: "Q&A" },
  { value: "url", label: "Websites" },
];

export default function KnowledgePage() {
  const { sources, toggleSource, retrainSource, removeSource } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const counts = useMemo(() => {
    const map = new Map<Filter, number>([["all", sources.length]]);
    for (const s of sources)
      map.set(s.kind, (map.get(s.kind) ?? 0) + 1);
    return map;
  }, [sources]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sources.filter(
      (s) =>
        (filter === "all" || s.kind === filter) &&
        (!q || s.name.toLowerCase().includes(q))
    );
  }, [sources, filter, query]);

  const ready = sources.filter((s) => s.status === "ready");
  const totalChunks = ready.reduce((sum, s) => sum + s.chunks, 0);
  const totalWords = ready.reduce((sum, s) => sum + s.words, 0);
  const enabledCount = ready.filter((s) => s.enabled).length;
  const openSource = sources.find((s) => s.id === openId) ?? null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 md:gap-6 md:p-6">
        <PageHeader
          title="Knowledge"
          description="Feed Aira whole data — files, docs, Q&As, websites — and it trains on everything you add."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              Add knowledge
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { icon: FileStack, label: "Sources", value: String(sources.length), sub: `${enabledCount} active` },
            { icon: Database, label: "Indexed chunks", value: totalChunks.toLocaleString(), sub: "in vector store" },
            { icon: Type, label: "Words trained", value: totalWords.toLocaleString(), sub: "across sources" },
            { icon: CheckCircle2, label: "Ready", value: `${ready.length}/${sources.length}`, sub: "rest training" },
          ].map((stat) => (
            <Card key={stat.label} size="sm" className="py-3.5">
              <CardContent className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <stat.icon className="size-4" />
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate font-mono text-lg font-semibold tabular-nums">
                    {stat.value}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {stat.label} · {stat.sub}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Knowledge sources</CardTitle>
            <CardDescription>
              Everything Aira retrieves from when answering. Toggle a source to
              include or exclude it.
            </CardDescription>
            <CardAction>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search sources…"
                  aria-label="Search sources"
                  className="h-8 w-40 pl-7 sm:w-56"
                />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <TabsList className="w-full sm:w-fit">
                {FILTERS.map((f) => (
                  <TabsTab key={f.value} value={f.value}>
                    {f.label}
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {counts.get(f.value) ?? 0}
                    </Badge>
                  </TabsTab>
                ))}
              </TabsList>
            </Tabs>

            {visible.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
                <BookOpen className="size-5 text-muted-foreground" />
                {sources.length === 0 ? (
                  <>
                    <p className="text-sm font-medium">No knowledge yet</p>
                    <p className="max-w-xs text-xs text-muted-foreground">
                      Upload files, paste documents, or add Q&A pairs — Aira
                      trains on all of it within seconds.
                    </p>
                    <Button size="sm" onClick={() => setAddOpen(true)}>
                      <Plus className="size-4" />
                      Add knowledge
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No sources match this filter.
                  </p>
                )}
              </div>
            ) : (
              <ul className="flex flex-col">
                {visible.map((s) => (
                  <SourceRow
                    key={s.id}
                    source={s}
                    onOpen={() => setOpenId(s.id)}
                    onToggle={() => toggleSource(s.id)}
                    onRetrain={() => retrainSource(s.id)}
                    onRemove={() => removeSource(s.id)}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <GuidelinesCard />
      </div>

      <AddKnowledgeDialog open={addOpen} onOpenChange={setAddOpen} />
      <SourceSheet source={openSource} onOpenChange={(o) => !o && setOpenId(null)} />
    </div>
  );
}

function SourceRow({
  source,
  onOpen,
  onToggle,
  onRetrain,
  onRemove,
}: {
  source: Source;
  onOpen: () => void;
  onToggle: () => void;
  onRetrain: () => void;
  onRemove: () => void;
}) {
  return (
    <li
      className="relative cursor-pointer border-b border-border/70 py-2.5 transition-colors first:pt-0 last:border-b-0 last:pb-0 hover:bg-accent/30"
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center gap-3 pr-1 pl-2">
        <SourceIcon kind={source.kind} name={source.name} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium">{source.name}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {KIND_LABELS[source.kind].toLowerCase()} ·{" "}
            {source.words.toLocaleString()} words ·             {source.chunks} chunk{source.chunks === 1 ? "" : "s"} ·{" "}
            added {source.addedAt}
          </p>
        </div>
        {source.status === "ready" ? (
          <Badge variant="secondary" className="hidden shrink-0 gap-1 sm:flex">
            <CheckCircle2 className="size-3 text-emerald-600" />
            indexed
          </Badge>
        ) : (
          <Badge variant="secondary" className="shrink-0 gap-1 font-mono">
            <Loader2 className="size-3 animate-spin" />
            training {source.progress}%
          </Badge>
        )}
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <Switch
            checked={source.enabled}
            onCheckedChange={onToggle}
            disabled={source.status !== "ready"}
            aria-label={`${source.enabled ? "Disable" : "Enable"} ${source.name}`}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label={`Actions for ${source.name}`}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onOpen}>View details</DropdownMenuItem>
            <DropdownMenuItem onClick={onRetrain}>
              <RefreshCw className="size-3.5" />
              Retrain
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onRemove}>
              <Trash2 className="size-3.5" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {source.status === "training" && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${source.progress}%` }}
          />
        </div>
      )}
    </li>
  );
}

function GuidelinesCard() {
  const { instructions, setInstructions } = useStore();
  const [draft, setDraft] = useState(instructions);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setInstructions(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Agent guidelines</CardTitle>
        <CardDescription>
          Who Aira is and how it should talk — applied on top of trained data.
        </CardDescription>
        <CardAction>
          {saved ? (
            <Badge className="bg-emerald-100 text-emerald-800">saved</Badge>
          ) : undefined}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          aria-label="Agent instructions"
          className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 font-mono text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        />
        <div className="flex justify-end">
          <Button onClick={save} disabled={draft === instructions}>
            Save guidelines
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
