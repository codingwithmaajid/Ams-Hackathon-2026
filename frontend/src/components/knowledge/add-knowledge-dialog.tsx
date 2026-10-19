import { useRef, useState } from "react";
import {
  FileText,
  Globe,
  HelpCircle,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

import {
  countWords,
  estimateChunks,
  useStore,
  type NewSourceInput,
  type SourceKind,
} from "@/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type Method = SourceKind;

type PendingFile = {
  name: string;
  size: number;
  content: string;
  words: number;
};

const METHODS: { value: Method; label: string; hint: string }[] = [
  { value: "file", label: "Upload files", hint: "PDF, docs, CSV, markdown…" },
  { value: "text", label: "Paste text", hint: "Whole documents, notes, policies" },
  { value: "qa", label: "Q&A pairs", hint: "Train exact answers" },
  { value: "url", label: "Website", hint: "Import from a public URL" },
];

const READABLE = /\.(txt|md|markdown|csv|json|log|ya?ml)$/i;

function urlContent(url: string) {
  return `Simulated crawl of ${url}. Extracted readable page content for indexing: headings, paragraphs, and link text were cleaned and split into chunks. The agent can now cite this page when answering questions about it.`.repeat(
    6
  );
}

export function AddKnowledgeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addSources } = useStore();
  const [method, setMethod] = useState<Method>("file");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [pairs, setPairs] = useState([{ q: "", a: "" }]);
  const [urls, setUrls] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setMethod("file");
    setPendingFiles([]);
    setDragging(false);
    setTextTitle("");
    setTextContent("");
    setPairs([{ q: "", a: "" }]);
    setUrls("");
  };

  const ingestFiles = async (files: FileList | File[]) => {
    const read = await Promise.all(
      Array.from(files).map(async (f) => {
        if (READABLE.test(f.name)) {
          const content = await f.text();
          return {
            name: f.name,
            size: f.size,
            content,
            words: countWords(content),
          };
        }
        return {
          name: f.name,
          size: f.size,
          content: "",
          words: Math.max(50, Math.round(f.size / 7)),
        };
      })
    );
    setPendingFiles((prev) => [...prev, ...read]);
  };

  const buildInputs = (): NewSourceInput[] => {
    if (method === "file")
      return pendingFiles.map((f) => ({
        kind: "file" as const,
        name: f.name,
        content: f.content || `[Binary file · ${Math.round(f.size / 1024)} KB]`,
      }));
    if (method === "text")
      return [{ kind: "text", name: textTitle.trim() || "Untitled note", content: textContent }];
    if (method === "qa")
      return pairs
        .filter((p) => p.q.trim() && p.a.trim())
        .map((p) => ({ kind: "qa" as const, name: p.q.trim(), content: p.a.trim() }));
    return urls
      .split(/\s+/)
      .filter((u) => u.trim().startsWith("http"))
      .map((u) => ({
        kind: "url" as const,
        name: u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""),
        content: urlContent(u),
      }));
  };

  const itemCount = buildInputs().length;

  const submit = () => {
    const inputs = buildInputs();
    if (!inputs.length) return;
    addSources(inputs);
    onOpenChange(false);
    setTimeout(reset, 200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add knowledge</DialogTitle>
          <DialogDescription>
            Feed Jolly whole data. Everything added here is chunked, embedded,
            and used to answer — usually within seconds.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        {METHODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMethod(m.value)}
            className={`rounded-xl border p-3 text-left transition-colors ${
              method === m.value
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-ring hover:bg-accent/50"
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              {m.value === "file" && <Upload className="size-3.5" />}
              {m.value === "text" && <FileText className="size-3.5" />}
              {m.value === "qa" && <HelpCircle className="size-3.5" />}
              {m.value === "url" && <Globe className="size-3.5" />}
              {m.label}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {m.hint}
            </span>
          </button>
        ))}
      </div>

      <Separator />

      {method === "file" && (
        <div className="flex flex-col gap-3">
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload files"
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files.length) void ingestFiles(e.dataTransfer.files);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              dragging ? "border-primary bg-primary/5" : "border-border hover:border-ring hover:bg-accent/40"
            }`}
          >
            <Upload className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">Drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground">
              .txt .md .csv .json are read in-browser · pdf/docx import as metadata
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".txt,.md,.markdown,.csv,.json,.log,.yml,.yaml,.pdf,.doc,.docx,.rtf,.xlsx"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) void ingestFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {pendingFiles.map((f, i) => (
            <div key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium">{f.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  ~{f.words.toLocaleString()} words · ~
                  {estimateChunks(f.content)} chunk
                  {estimateChunks(f.content) === 1 ? "" : "s"}
                  {!READABLE.test(f.name) && " (metadata only)"}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {method === "text" && (
        <div className="flex flex-col gap-2">
          <Input
            value={textTitle}
            onChange={(e) => setTextTitle(e.target.value)}
            placeholder="Title (e.g. Refund policy v2)"
          />
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            rows={9}
            placeholder="Paste the whole document — policies, notes, transcripts…"
            className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
          <p className="font-mono text-xs text-muted-foreground">
            {countWords(textContent).toLocaleString()} words ·{" "}
            {estimateChunks(textContent).toLocaleString()} estimated chunks
          </p>
        </div>
      )}

      {method === "qa" && (
        <div className="flex flex-col gap-3">
          {pairs.map((pair, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl border p-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  Q{i + 1}
                </span>
                <Input
                  value={pair.q}
                  onChange={(e) =>
                    setPairs((prev) =>
                      prev.map((p, j) => (j === i ? { ...p, q: e.target.value } : p))
                    )
                  }
                  placeholder="Question customers will ask…"
                />
                {pairs.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove pair ${i + 1}`}
                    onClick={() => setPairs((prev) => prev.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
              <textarea
                value={pair.a}
                onChange={(e) =>
                  setPairs((prev) =>
                    prev.map((p, j) => (j === i ? { ...p, a: e.target.value } : p))
                  )
                }
                rows={2}
                placeholder="The exact answer the agent should give…"
                className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              />
            </div>
          ))}
          <Button variant="outline" onClick={() => setPairs((prev) => [...prev, { q: "", a: "" }])}>
            <Plus className="size-4" />
            Add another pair
          </Button>
        </div>
      )}

      {method === "url" && (
        <div className="flex flex-col gap-2">
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            rows={4}
            placeholder={"https://northwind.com/pricing\nhttps://help.lumenworks.io/sla"}
            className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 font-mono text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe className="size-3" />
            One URL per line · pages are crawled, cleaned, and re-synced weekly.
          </p>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-2">
        <p className="font-mono text-xs text-muted-foreground">
          {itemCount > 0 ? `${itemCount} item${itemCount > 1 ? "s" : ""} ready to train` : "nothing queued yet"}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!itemCount}>
            <Loader2 className="hidden" />
            Add & train
          </Button>
        </div>
      </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
