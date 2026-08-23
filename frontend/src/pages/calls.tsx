import { useState } from "react";
import { Phone, PhoneCall, Play } from "lucide-react";

import { useStore, type CallStatus } from "@/store";
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
import { PageHeader } from "@/components/layout/page-header";

const STATUS_BADGE: Record<CallStatus, string> = {
  queued: "bg-stone-200 text-stone-700",
  "in-progress": "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
};

export default function CallsPage() {
  const { calls, startCall } = useStore();
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [objective, setObjective] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim() || !phone.trim()) return;
    startCall(contact.trim(), phone.trim(), objective.trim() || "General check-in");
    setContact("");
    setPhone("");
    setObjective("");
  };

  const active = calls.some(
    (c) => c.status === "queued" || c.status === "in-progress"
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 md:gap-6 md:p-6">
        <PageHeader
          title="Calls"
          description="Dispatch Aira to place calls. Outcomes and recaps are filed to Reports automatically."
        />

        <div className="grid gap-4 md:gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Start a call</CardTitle>
              <CardDescription>
                Aira dials, talks using your knowledge base, then logs the recap.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Contact</span>
                  <input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="John Mercer · Northwind"
                    className="h-9 rounded-lg border border-input bg-transparent px-3 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Phone</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 0142"
                    type="tel"
                    className="h-9 rounded-lg border border-input bg-transparent px-3 font-mono text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Objective</span>
                  <textarea
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    rows={3}
                    placeholder="Follow up on the Q3 pricing proposal…"
                    className="resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                  />
                </label>
                <Button type="submit" size="lg" disabled={!contact.trim() || !phone.trim()}>
                  <Play className="size-4" />
                  Place call
                </Button>
                <p className="text-xs text-muted-foreground">
                  Tone and talking points come from your saved context in
                  Knowledge.
                </p>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Call log</CardTitle>
              <CardAction>
                {active && (
                  <Badge className="gap-1.5 bg-amber-100 pl-1.5 text-amber-800">
                    <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
                    agent on a line
                  </Badge>
                )}
              </CardAction>
              <CardDescription>Newest first · live status</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {calls.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-border/70 bg-background p-3"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                        c.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : c.status === "in-progress" ||
                              c.status === "queued"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-stone-200 text-stone-600"
                      }`}
                    >
                      {c.status === "in-progress" ? (
                        <PhoneCall className="size-4 animate-pulse" />
                      ) : (
                        <Phone className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{c.contact}</p>
                        <Badge className={`border-transparent ${STATUS_BADGE[c.status]}`}>
                          {c.status}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        <span className="font-mono">{c.phone}</span> · {c.objective}
                      </p>
                      {c.status === "completed" && c.summary && (
                        <p className="mt-2 border-l-2 border-border pl-2.5 text-sm leading-relaxed text-muted-foreground">
                          {c.summary}{" "}
                          <span className="font-mono text-xs">
                            ({c.duration}, felt {c.sentiment})
                          </span>
                        </p>
                      )}
                      {(c.status === "queued" || c.status === "in-progress") && (
                        <p className="mt-2 animate-pulse font-mono text-xs text-muted-foreground">
                          ▍agent working — will file report when done…
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {c.startedAt}
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
