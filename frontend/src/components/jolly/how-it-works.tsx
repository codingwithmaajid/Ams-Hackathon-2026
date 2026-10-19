import { ArrowRight, FolderOpen, PhoneCall, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: PhoneCall,
    title: "Phone · Bolna",
    body: "8 AM brief call, voice questions, post-hearing dictation. Bolna handles speech, telephony and turn-taking.",
  },
  {
    icon: ShieldCheck,
    title: "Jolly middleware",
    body: "Finds the matter, answers only from cited paragraphs, refuses outcome predictions, and screens uploaded text for prompt injection.",
  },
  {
    icon: FolderOpen,
    title: "Case files",
    body: "Order sheets, pleadings, hearing history and tasks. Every spoken fact points back to a document and paragraph.",
  },
];

export function HowItWorks({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]", className)}>
      {STEPS.map((s, i) => (
        <div key={s.title} className="contents">
          <div className="rounded-xl border border-navy/10 bg-card p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-md bg-navy text-brass-light">
                <s.icon className="size-4" />
              </span>
              <span className="font-serif text-lg text-navy">{s.title}</span>
            </div>
            {!compact && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>}
          </div>
          {i < STEPS.length - 1 && (
            <div className="hidden items-center justify-center text-brass md:flex">
              <ArrowRight className="size-5" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
