import { HowItWorks } from "@/components/jolly/how-it-works";
import { PageHeader, Panel } from "@/components/jolly/common";
import { API_URL } from "@/lib/api";

const ENDPOINTS: [string, string][] = [
  ["GET /briefs/daily", "Today's matters, each line cited (the 8 AM brief)"],
  ["POST /cases/{id}/ask", "Cited answer, or a guardrail refusal"],
  ["POST /bolna/tools/*", "Custom functions the Bolna agent calls mid-call"],
  ["POST /bolna/webhook", "Call events and transcripts from Bolna"],
  ["POST /call", "Place an outbound call through Bolna"],
];

export default function HowPage() {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Architecture" title="How Jolly works" />
      <HowItWorks />
      <Panel eyebrow="Thin client" title="This console only reads the Jolly API">
        <p className="mb-4 text-sm text-muted-foreground">
          Connected to <span className="font-mono text-navy">{API_URL}</span>. The same endpoints serve the voice agent and this screen.
        </p>
        <dl className="divide-y divide-navy/10">
          {ENDPOINTS.map(([k, v]) => (
            <div key={k} className="grid gap-1 py-2.5 md:grid-cols-[240px_1fr]">
              <dt className="font-mono text-sm text-navy">{k}</dt>
              <dd className="text-sm text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
}
