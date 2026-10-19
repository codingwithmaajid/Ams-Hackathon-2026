import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

export type CallStatus = "queued" | "in-progress" | "completed" | "failed";

export type Call = {
  id: number;
  contact: string;
  phone: string;
  objective: string;
  status: CallStatus;
  startedAt: string;
  duration?: string;
  summary?: string;
  sentiment?: "positive" | "neutral" | "negative";
};

export type Email = {
  id: number;
  to: string;
  subject: string;
  body: string;
  status: "sending" | "sent";
  sentAt: string;
};

export type ReportKind = "call" | "email";

export type Report = {
  id: number;
  kind: ReportKind;
  title: string;
  contact: string;
  at: string;
  summary: string;
  points: string[];
};

export type SourceKind = "file" | "text" | "qa" | "url";

export type SourceStatus = "queued" | "training" | "ready";

export type Source = {
  id: number;
  kind: SourceKind;
  name: string;
  content: string;
  words: number;
  chunks: number;
  status: SourceStatus;
  progress: number;
  enabled: boolean;
  addedAt: string;
};

export type NewSourceInput = {
  kind: SourceKind;
  name: string;
  content?: string;
};

export function countWords(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function estimateChunks(text: string) {
  return Math.max(1, Math.ceil(text.trim().length / 600));
}

function now() {
  return new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function clock() {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SEED_CALLS: Call[] = [
  {
    id: 1,
    contact: "John Mercer · Northwind",
    phone: "+1 555 0142",
    objective: "Follow up on Q3 pricing proposal",
    status: "completed",
    startedAt: "today 09:12",
    duration: "4m 32s",
    summary:
      "John confirmed budget approval is close, wants a revised quote by Friday.",
    sentiment: "positive",
  },
  {
    id: 2,
    contact: "Priya Nair · Helios Labs",
    phone: "+91 98200 44118",
    objective: "Reschedule onboarding walkthrough",
    status: "completed",
    startedAt: "yesterday 16:48",
    duration: "2m 05s",
    summary:
      "Moved walkthrough to Tuesday 11:00 IST. Priya will invite the platform team.",
    sentiment: "neutral",
  },
];

const SEED_EMAILS: Email[] = [
  {
    id: 1,
    to: "sara@lumenworks.io",
    subject: "Revised quote + onboarding timeline",
    body: "Hi Sara,\n\nAttaching the revised quote we discussed, plus the onboarding timeline for your team. Happy to walk through it on a short call this week.\n\nBest,\nJolly (on behalf of Maya)",
    status: "sent",
    sentAt: "today 08:57",
  },
  {
    id: 2,
    to: "ops@northwind.com",
    subject: "Meeting notes — discovery call",
    body: "Hi team,\n\nThanks for joining yesterday's discovery call. Summary of decisions and next steps is below. Let me know if I missed anything.\n\nBest,\nJolly (on behalf of Maya)",
    status: "sent",
    sentAt: "yesterday 17:30",
  },
];

const SEED_REPORTS: Report[] = [
  {
    id: 1,
    kind: "call",
    title: "Call with John Mercer · Northwind",
    contact: "John Mercer",
    at: "today 09:17",
    summary:
      "Positive follow-up on the Q3 pricing proposal. Budget approval nearly secured.",
    points: [
      "Budget sign-off expected from finance this week",
      "Wants revised quote by Friday — flag to forge",
      "Mentioned competitor undercutting by ~8%",
      "Next step: send quote v2, propose Thursday review call",
    ],
  },
  {
    id: 2,
    kind: "email",
    title: "Emailed sara@lumenworks.io",
    contact: "Sara · LumenWorks",
    at: "today 08:57",
    summary:
      "Sent revised quote and onboarding timeline following Tuesday's request.",
    points: [
      "Quote v2 attached (10% volume discount applied)",
      "Onboarding starts Aug 30, kickoff call booked",
      "Awaiting Sara's confirmation by Wednesday",
    ],
  },
];

const SEED_SOURCE_CONTENTS: Record<string, string> = {
  "q3-pricing-proposal.pdf": `Q3 Pricing Proposal — Northwind Traders
Prepared for: John Mercer, Procurement. Valid until Sep 30.

Tier Structure
Starter: $49/seat/month (billed annually), up to 25 seats. Includes core mesh access, email automation, and 2k knowledge chunks.
Growth: $89/seat/month (billed annually), up to 100 seats. Adds voice dispatch (500 minutes pooled), priority indexing, and API access.
Scale: $139/seat/month, unlimited seats. Adds SSO/SCIM, audit exports, dedicated success manager, and custom retention.

Discounts
Volume: 10% off at 50+ seats, 15% off at 100+ seats, applied to annual plans only.
Multi-year: additional 8% off for 2-year commitments; 12% for 3-year.
Nonprofit and education: flat 20% off all tiers.

Northwind-specific terms discussed in the last call
John indicated budget approval is close but requires the revised quote by Friday. We agreed to apply the 10% volume discount on a Growth-tier rollout of 60 seats, effective Q4 start. Implementation fee waived if signed before quarter end.

Competitive positioning
A competitor recently undercut us by ~8% on list price, but lacks pooled voice minutes and audit-grade reporting. Lead with total cost of ownership and the mesh health guarantees.`,

  "discovery-call-notes.md": `# Discovery call — LumenWorks (Aug 19)

Attendees: Sara Ito (Ops lead), Maya (us).

## Current pain
- Support inbox triage takes ~3h/day across two agents.
- No shared knowledge base; answers vary by who replies.

## Requirements
- Email drafting with approval step before send.
- Knowledge grounded answers from their existing SOPs (Notion export planned).
- Weekly report of top unanswered questions.

## Decisions
- Onboarding starts Aug 30 with kickoff call booked.
- Jolly will run in suggest-mode for week one, then autonomous send for tier-1 replies.

## Follow-ups
- Send revised quote + onboarding timeline (done Aug 23).
- Sara confirms seat count by Wednesday.`,

  "crm-contacts-export.csv": `name,company,role,email,phone,last_touch,tier,status,notes
John Mercer,Northwind Traders,Procurement Lead,john.mercer@northwind.com,+1 555 0142,Aug 21 call,Growth,Active,Budget approval close; wants revised quote Friday
Priya Nair,Helios Labs,Platform Manager,priya@helioslabs.io,+91 98200 44118,Aug 22 reschedule,Growth,Onboarding,Moved walkthrough to Tue 11:00 IST; inviting platform team
Sara Ito,LumenWorks,Operations Lead,sara@lumenworks.io,+81 90 1234 5678,Aug 23 email,Starter,Onboarding,Confirming seat count by Wednesday
Dan Okafor,Fernway Freight,Head of CX,dan@fernway.co,+44 7700 900123,Aug 15 demo,Scale,Evaluating,Wants SSO + audit exports before commit
Lena Fischer,Kettle & Co,Founder,lena@kettleandco.com,+49 151 23456789,Aug 10 intro,Starter,Nurture,Seasonal business; revisit after October`,

  "How do volume discounts work?": "We offer 10% off annual plans at 50+ seats, 15% at 100+ seats. Multi-year commitments add another 8% (2 years) or 12% (3 years). Nonprofits and educators get a flat 20% off every tier.",
};

const SEED_SOURCES: Source[] = [
  {
    id: 1,
    kind: "file",
    name: "q3-pricing-proposal.pdf",
    content: SEED_SOURCE_CONTENTS["q3-pricing-proposal.pdf"],
    words: countWords(SEED_SOURCE_CONTENTS["q3-pricing-proposal.pdf"]),
    chunks: estimateChunks(SEED_SOURCE_CONTENTS["q3-pricing-proposal.pdf"]),
    status: "ready",
    progress: 100,
    enabled: true,
    addedAt: "Aug 20, 10:12",
  },
  {
    id: 2,
    kind: "file",
    name: "discovery-call-notes.md",
    content: SEED_SOURCE_CONTENTS["discovery-call-notes.md"],
    words: countWords(SEED_SOURCE_CONTENTS["discovery-call-notes.md"]),
    chunks: estimateChunks(SEED_SOURCE_CONTENTS["discovery-call-notes.md"]),
    status: "ready",
    progress: 100,
    enabled: true,
    addedAt: "Aug 21, 14:03",
  },
  {
    id: 3,
    kind: "file",
    name: "crm-contacts-export.csv",
    content: SEED_SOURCE_CONTENTS["crm-contacts-export.csv"],
    words: countWords(SEED_SOURCE_CONTENTS["crm-contacts-export.csv"]),
    chunks: estimateChunks(SEED_SOURCE_CONTENTS["crm-contacts-export.csv"]),
    status: "ready",
    progress: 100,
    enabled: true,
    addedAt: "Aug 22, 09:40",
  },
  {
    id: 4,
    kind: "qa",
    name: "How do volume discounts work?",
    content: SEED_SOURCE_CONTENTS["How do volume discounts work?"],
    words: countWords(SEED_SOURCE_CONTENTS["How do volume discounts work?"]),
    chunks: 1,
    status: "ready",
    progress: 100,
    enabled: true,
    addedAt: "Aug 22, 16:20",
  },
];

const DEFAULT_INSTRUCTIONS =
  "You are Jolly, operating on behalf of Maya (sales lead).\nVoice: warm, concise, professional. Always confirm next steps before ending a call.\nGoal: nurture open deals — Northwind pricing, LumenWorks onboarding — and log every touchpoint to Reports.";

type StoreValue = {
  instructions: string;
  setInstructions: (v: string) => void;
  sources: Source[];
  addSources: (inputs: NewSourceInput[]) => void;
  removeSource: (id: number) => void;
  toggleSource: (id: number) => void;
  retrainSource: (id: number) => void;
  calls: Call[];
  startCall: (contact: string, phone: string, objective: string) => void;
  emails: Email[];
  queueEmail: (to: string, subject: string, body: string) => void;
  reports: Report[];
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const idRef = useRef(100);
  const nextId = useCallback(() => ++idRef.current, []);

  const [instructions, setInstructions] = useState(DEFAULT_INSTRUCTIONS);
  const [sources, setSources] = useState<Source[]>(SEED_SOURCES);
  const [calls, setCalls] = useState<Call[]>(SEED_CALLS);
  const [emails, setEmails] = useState<Email[]>(SEED_EMAILS);
  const [reports, setReports] = useState<Report[]>(SEED_REPORTS);

  const pushReport = useCallback((r: Omit<Report, "id">) => {
    setReports((prev) => [{ ...r, id: ++idRef.current }, ...prev]);
  }, []);

  const train = useCallback((id: number) => {
    setSources((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: "training", progress: 0 } : s
      )
    );
    const timer = setInterval(() => {
      setSources((prev) =>
        prev.map((s) => {
          if (s.id !== id || s.status !== "training") return s;
          const next = s.progress + 8 + Math.floor(Math.random() * 14);
          if (next >= 100)
            return { ...s, status: "ready" as const, progress: 100 };
          return { ...s, progress: next };
        })
      );
    }, 350);
    setTimeout(() => clearInterval(timer), 9000);
  }, []);

  const addSources = useCallback(
    (inputs: NewSourceInput[]) => {
      const created = inputs.map((input) => {
        const content = input.content?.trim() ?? "";
        return {
          id: nextId(),
          kind: input.kind,
          name: input.name.trim(),
          content,
          words: countWords(content),
          chunks: estimateChunks(content),
          status: "training" as const,
          progress: 0,
          enabled: true,
          addedAt: now(),
        };
      });
      setSources((prev) => [...created, ...prev]);
      for (const src of created) train(src.id);
    },
    [nextId, train]
  );

  const removeSource = useCallback((id: number) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const toggleSource = useCallback((id: number) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }, []);

  const retrainSource = train;

  const startCall = useCallback(
    (contact: string, phone: string, objective: string) => {
      const id = nextId();
      const startedAt = clock();
      setCalls((prev) => [
        {
          id,
          contact,
          phone,
          objective,
          status: "queued",
          startedAt,
        },
        ...prev,
      ]);
      setTimeout(() => {
        setCalls((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, status: "in-progress" } : c
          )
        );
      }, 1200);
      setTimeout(() => {
        setCalls((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: "completed",
                  duration: `${2 + Math.floor(Math.random() * 4)}m ${Math.floor(Math.random() * 59)}s`,
                  summary: `Call placed with ${contact}. Objective covered, recap filed.`,
                  sentiment: "positive" as const,
                }
              : c
          )
        );
        pushReport({
          kind: "call",
          title: `Call with ${contact}`,
          contact,
          at: now(),
          summary: `Agent called ${phone} regarding: ${objective}.`,
          points: [
            "Objective communicated using knowledge-base context",
            "Contact engaged, agreed to next step",
            "Follow-up drafted and queued",
          ],
        });
      }, 8000);
    },
    [nextId, pushReport]
  );

  const queueEmail = useCallback(
    (to: string, subject: string, body: string) => {
      const id = nextId();
      const sentAt = clock();
      setEmails((prev) => [
        { id, to, subject, body, status: "sending", sentAt },
        ...prev,
      ]);
      setTimeout(() => {
        setEmails((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: "sent" } : e))
        );
        pushReport({
          kind: "email",
          title: `Emailed ${to}`,
          contact: to.split("@")[0],
          at: now(),
          summary: `Sent "${subject}" grounded in knowledge base.`,
          points: [
            "Draft composed from active instructions",
            "Tone matched: warm, concise, professional",
            "Reply watch enabled — will alert on response",
          ],
        });
      }, 2500);
    },
    [nextId, pushReport]
  );

  const value = useMemo(
    () => ({
      instructions,
      setInstructions,
      sources,
      addSources,
      removeSource,
      toggleSource,
      retrainSource,
      calls,
      startCall,
      emails,
      queueEmail,
      reports,
    }),
    [
      instructions,
      sources,
      addSources,
      removeSource,
      toggleSource,
      retrainSource,
      calls,
      startCall,
      emails,
      queueEmail,
      reports,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
