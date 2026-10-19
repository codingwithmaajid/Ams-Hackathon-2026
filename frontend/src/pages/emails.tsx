import { useState } from "react";
import { CheckCircle2, Loader2, Mail, Send, Sparkles } from "lucide-react";

import { useStore } from "@/store";
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

const fieldClass =
  "w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

export default function EmailsPage() {
  const { emails, queueEmail, instructions } = useStore();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim()) return;
    queueEmail(to.trim(), subject.trim(), body.trim());
    setTo("");
    setSubject("");
    setBody("");
  };

  const draftWithAgent = () => {
    if (!to.trim()) return;
    const name = to.split("@")[0];
    setSubject((s) => s || "Quick follow-up from Maya");
    setBody(
      (b) =>
        b ||
        `Hi ${name.charAt(0).toUpperCase() + name.slice(1)},\n\nFollowing up with a short note grounded in our latest materials. Let me know a good time to connect.\n\nBest,\nJolly (on behalf of Maya)`
    );
  };

  const inputClass = `${fieldClass} h-9`;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 md:gap-6 md:p-6">
        <PageHeader
          title="Emails"
          description="Let Jolly draft from your knowledge base, review, then send. Every send is logged."
        />

        <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card>
            <CardHeader>
              <CardTitle>Compose</CardTitle>
              <CardDescription>
                Write it yourself or have the agent draft it.
              </CardDescription>
              <CardAction>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={draftWithAgent}
                  disabled={!to.trim()}
                  title={instructions ? "Uses your saved context" : undefined}
                >
                  <Sparkles className="size-3.5" />
                  Agent draft
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <form onSubmit={send} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5 text-sm sm:flex-row sm:items-center">
                  <span className="w-16 shrink-0 font-medium text-muted-foreground">
                    To
                  </span>
                  <input
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    type="email"
                    placeholder="sara@lumenworks.io"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5 text-sm sm:flex-row sm:items-center">
                  <span className="w-16 shrink-0 font-medium text-muted-foreground">
                    Subject
                  </span>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Revised quote + onboarding timeline"
                    className={inputClass}
                  />
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  placeholder="Write your message…"
                  className={`${fieldClass} resize-y leading-relaxed`}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Sent as Maya · reply watch enabled
                  </p>
                  <Button type="submit" disabled={!to.trim() || !subject.trim()}>
                    <Send className="size-4" />
                    Send
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sent</CardTitle>
              <CardDescription>Newest first</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {emails.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-border/70 bg-background p-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <Mail className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-mono text-sm">{m.to}</p>
                        {m.status === "sent" ? (
                          <Badge className="gap-1 border-transparent bg-emerald-100 pl-1.5 text-emerald-800">
                            <CheckCircle2 className="size-3" />
                            sent
                          </Badge>
                        ) : (
                          <Badge className="gap-1 border-transparent bg-stone-200 pl-1.5 text-stone-700">
                            <Loader2 className="size-3 animate-spin" />
                            sending
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-sm font-medium">
                        {m.subject}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {m.body}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {m.sentAt}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
