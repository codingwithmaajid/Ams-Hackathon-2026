import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

import { useStore, type Source } from "@/store";

type Role = "user" | "assistant";

type Message = {
  id: number;
  role: Role;
  text: string;
};

const STOP_WORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "her",
  "was", "one", "our", "out", "how", "what", "when", "who", "why", "does",
  "did", "with", "have", "this", "that", "from", "your", "about", "into",
  "tell", "know", "much",
]);

function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9%$.]+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function answerFromKnowledge(
  question: string,
  trained: Source[]
): { source: string; answer: string } | null {
  const tokens = tokenize(question);
  if (!tokens.length || trained.length === 0) return null;

  let best: { source: Source; score: number } | null = null;
  for (const s of trained) {
    const haystack =
      s.kind === "qa"
        ? s.name.toLowerCase()
        : `${s.name} ${s.content}`.toLowerCase();
    const score = tokens.filter((t) => haystack.includes(t)).length;
    const weighted = s.kind === "qa" ? score * 3 : score;
    if (weighted > 0 && (!best || weighted > best.score)) best = { source: s, score: weighted };
  }
  if (!best || best.score < (tokens.length > 1 ? 2 : 1)) return null;

  const { source } = best;
  if (source.kind === "qa") return { source: source.name, answer: source.content };

  const hit = tokens
    .map((t) => source.content.toLowerCase().indexOf(t))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)[0];
  if (hit === undefined) return null;

  const start = Math.max(0, hit - 80);
  const excerpt = source.content.slice(start, start + 320).replace(/\s+/g, " ").trim();
  return {
    source: source.name,
    answer: `${start > 0 ? "…" : ""}${excerpt}${hit + 320 < source.content.length ? "…" : ""}`,
  };
}

const GREETING =
  "Hi, I'm Aira — your demo console. I can answer from the local knowledge base here, but I do not place real SnapServe calls from this chat.\nFor real calling, open the Calls page. Try: help · sources · status";

const SUGGESTIONS = ["help", "call john", "email sara@lumenworks.io", "status"] as const;

function clock() {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AgentConsole() {
  const { startCall, queueEmail, sources } = useStore();
  const idRef = useRef(1);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: "assistant", text: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [streamingId, setStreamingId] = useState<number | null>(null);

  const busy = streamingId !== null;

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const stream = (full: string) => {
    const id = idRef.current++;
    setMessages((prev) => [...prev, { id, role: "assistant", text: "" }]);
    setStreamingId(id);
    let i = 0;
    const tick = () => {
      i += 2 + Math.floor(Math.random() * 4);
      const text = full.slice(0, i);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, text } : m))
      );
      if (i < full.length) {
        timerRef.current = setTimeout(tick, 14);
      } else {
        setStreamingId(null);
      }
    };
    timerRef.current = setTimeout(tick, 400);
  };

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: idRef.current++, role: "user", text },
    ]);

    const [cmd, ...rest] = text.toLowerCase().split(/\s+/);
    const arg = rest.join(" ");
    let replyText: string;

    const trained = sources.filter((s) => s.enabled && s.status === "ready");
    const chunksTotal = trained.reduce((sum, s) => sum + s.chunks, 0);

    switch (cmd) {
      case "help":
        replyText = [
          "Here's what I can do:",
          "",
          "  call <name>          demo-only console action (not a real phone call)",
          "  email <address>      draft + send an email, log it",
          "  status               mesh health overview",
          "  sources              what's in the knowledge base",
          "",
          "Or just ask me anything — I answer from your trained knowledge.",
        ].join("\n");
        break;
      case "status":
        replyText =
          `Mesh healthy · knowledge base synced (${trained.length} sources, ~${chunksTotal.toLocaleString()} chunks)\n2 calls completed today · 1 email sent · reports up to date.`;
        break;
      case "sources":
        replyText = trained.length
          ? `Knowledge base:\n${trained
              .map((s) => `· ${s.name} (${s.chunks} chunk${s.chunks === 1 ? "" : "s"})`)
              .join("\n")}`
          : "Knowledge base is empty. Add files, text, Q&As, or websites on the Knowledge page so I can ground my answers.";
        break;
      case "call": {
        if (!arg) {
          replyText = "Call who? Try 'call john'.";
          break;
        }
        const contact = arg.charAt(0).toUpperCase() + arg.slice(1);
        startCall(
          `${contact} · from console`,
          "+1 555 01xx",
          `Follow-up requested via console at ${clock()}`
        );
        replyText = `This console only simulates a call for ${contact}. For a real SnapServe phone call, open the Calls page and enter the actual phone number there.`;
        break;
      }
      case "email": {
        if (!arg || !arg.includes("@")) {
          replyText = "Email who? Try 'email sara@lumenworks.io'.";
          break;
        }
        queueEmail(
          arg,
          "Quick follow-up from Maya",
          `Hi,\n\nFollowing up with a short note grounded in our latest materials. Let me know a good time to connect.\n\nBest,\nAira (on behalf of Maya)`
        );
        replyText = `Drafted an email to ${arg} grounded in your context — sending now. It'll be logged on the Reports page.`;
        break;
      }
      case "hi":
      case "hello":
      case "hey":
        replyText = "Hey. Who should I call or email?";
        break;
      default: {
        const grounded = answerFromKnowledge(text, trained);
        if (grounded) {
          replyText = `From my training data (${grounded.source}):\n\n"${grounded.answer}"`;
          break;
        }
        replyText = `I don't know '${text.trim()}' yet. Type 'help' to see my commands — or add data in Knowledge so I can do more.`;
      }
    }

    stream(replyText);
  };

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4 md:px-6">
        <div className="flex flex-col gap-5">
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[80%] whitespace-pre-wrap rounded-3xl bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
                  {m.text}
                </div>
              </div>
            ) : (
              <div
                key={m.id}
                className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground"
              >
                {m.text}
                {m.id === streamingId && (
                  <span className="ml-0.5 animate-pulse text-primary">▍</span>
                )}
              </div>
            )
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="px-4 pb-4 md:px-6 md:pb-6">
        {messages.length <= 1 && (
          <div className="mb-3 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                disabled={busy}
                className="rounded-full border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:border-ring hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 rounded-3xl border border-input bg-card p-2 shadow-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30"
        >
          <textarea
            rows={1}
            value={input}
            onChange={onChange}
            onKeyDown={onKeyDown}
            autoFocus
            spellCheck={false}
            aria-label="Message Aira"
            placeholder={busy ? "Aira is typing…" : "Message Aira…"}
            className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-30"
          >
            <ArrowUp className="size-4" />
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          aira can make mistakes. enter to send · shift+enter for a new line.
        </p>
      </div>
    </div>
  );
}
