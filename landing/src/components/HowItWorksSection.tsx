import React, { useState, useRef } from 'react';
import { FileText, ShieldAlert, Check, CheckCircle2 } from 'lucide-react';
import { DailyBriefResponse } from '../lib/api';
import { EditorialBackdrop } from './EditorialBackdrop';
import { MorningBriefWindow } from './MorningBriefWindow';
import { JollyGlyph, JollyGlyphState } from './JollyGlyph';

interface HowItWorksSectionProps {
  brief: DailyBriefResponse;
  isLoading: boolean;
  isLive: boolean;
}

type WorkflowStage = 'before' | 'at' | 'after';

interface StageConfig {
  id: WorkflowStage;
  tabLabel: string;
  glyphState: JollyGlyphState;
  headline: string;
  summary: string;
}

const STAGES: StageConfig[] = [
  {
    id: 'before',
    tabLabel: 'Before the hearing',
    glyphState: 'brief',
    headline: 'Start the day prepared.',
    summary:
      "Jolly calls at 8 AM with today's matters, court hall, item number, and what is due.",
  },
  {
    id: 'at',
    tabLabel: 'At court',
    glyphState: 'speak',
    headline: 'Ask in the corridor.',
    summary:
      'Call Jolly and ask "What did the last order in 1042 say?" for a cited answer from your files.',
  },
  {
    id: 'after',
    tabLabel: 'After the hearing',
    glyphState: 'approve',
    headline: 'Dictate, approve, done.',
    summary:
      'Speak for 30 seconds after the hearing; Jolly logs tasks and drafts the client update for one-tap approval.',
  },
];

const CLIENT_DRAFTS: Record<'en' | 'ta' | 'hi', { label: string; text: string }> = {
  en: {
    label: 'English',
    text: 'Dear Mr. Sundaram, WP 1042/2025 was heard in Court Hall 4 today. Respondent No. 2 filed their counter-affidavit. Next hearing is 4 Nov 2025 for our rejoinder.',
  },
  ta: {
    label: 'தமிழ்',
    text: 'வணக்கம் திரு. சுந்தரம், WP 1042/2025 இன்று நீதிமன்ற அறை 4-ல் விசாரணைக்கு வந்தது. எதிர்மனுதாரர் பதில் மனு தாக்கல் செய்தார். அடுத்த விசாரணை நவம்பர் 4, 2025.',
  },
  hi: {
    label: 'हिन्दी',
    text: 'नमस्ते श्री सुंदरम, WP 1042/2025 की आज कोर्ट हॉल 4 में सुनवाई हुई। प्रतिवादी संख्या 2 ने जवाबी हलफनामा दायर किया। अगली सुनवाई 4 नवंबर 2025 को है।',
  },
};

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  brief,
  isLoading,
  isLive,
}) => {
  const [activeTab, setActiveTab] = useState<WorkflowStage>('before');
  const [draftLang, setDraftLang] = useState<'en' | 'ta' | 'hi'>('ta');
  const [isApproved, setIsApproved] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = (idx + 1) % STAGES.length;
      setActiveTab(STAGES[nextIdx].id);
      tabRefs.current[nextIdx]?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = (idx - 1 + STAGES.length) % STAGES.length;
      setActiveTab(STAGES[prevIdx].id);
      tabRefs.current[prevIdx]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveTab(STAGES[0].id);
      tabRefs.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const lastIdx = STAGES.length - 1;
      setActiveTab(STAGES[lastIdx].id);
      tabRefs.current[lastIdx]?.focus();
    }
  };

  const currentStage = STAGES.find((s) => s.id === activeTab) || STAGES[0];

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="mx-auto max-w-[1160px] px-5 py-20 sm:px-8 sm:py-28"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="how-it-works-heading"
          className="font-editorial text-3xl font-normal tracking-tight text-[#111827] sm:text-5xl [text-wrap:balance]"
        >
          Built around a hearing day.
        </h2>
      </div>

      {/* Accessible Keyboard-Focusable Segmented Tabs */}
      <div className="mt-8 flex justify-center">
        <div
          role="tablist"
          aria-label="Hearing day stages"
          className="inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-[#111827]/12 bg-[#F2EDE2] p-1.5"
        >
          {STAGES.map((stage, idx) => {
            const selected = activeTab === stage.id;
            return (
              <button
                key={stage.id}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                id={`tab-${stage.id}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`panel-${stage.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(stage.id)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
                  selected
                    ? 'bg-[#111827] text-[#FBF9F4] shadow-sm'
                    : 'text-[#111827]/70 hover:text-[#111827]'
                }`}
              >
                <JollyGlyph
                  variant={selected ? 'white' : 'black'}
                  state={stage.glyphState}
                  size={18}
                />
                <span>{stage.tabLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panel Container */}
      <div
        id={`panel-${currentStage.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${currentStage.id}`}
        className="mt-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12"
      >
        <div className="lg:col-span-5 space-y-3">
          <h3 className="font-editorial text-3xl text-[#111827] sm:text-4xl [text-wrap:balance]">
            {currentStage.headline}
          </h3>
          <p className="text-base leading-relaxed text-[#111827]/75">
            {currentStage.summary}
          </p>
        </div>

        <div className="lg:col-span-7">
          <EditorialBackdrop variant="archival-paper" className="p-4 sm:p-8">
            {activeTab === 'before' && (
              <MorningBriefWindow
                brief={brief}
                isLoading={isLoading}
                isLive={isLive}
                compact
              />
            )}

            {activeTab === 'at' && (
              <div className="w-full rounded-2xl border border-[#111827]/12 bg-[#FBF9F4]/95 shadow-[0_24px_60px_-15px_rgba(17,24,39,0.16)] backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-[#111827]/10 px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <JollyGlyph state="speak" size={20} />
                    <span className="text-xs font-medium text-[#111827]">
                      Corridor Call · WP 1042/2025
                    </span>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-[#111827]/60">
                    00:42
                  </span>
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#111827] px-4 py-2.5 text-sm text-[#FBF9F4]">
                        “What did the last order in 1042 say?”
                      </div>
                    </div>

                    <div className="flex justify-start">
                      <div className="max-w-[92%] space-y-2.5 rounded-2xl rounded-tl-sm border border-[#111827]/10 bg-white p-4 text-sm text-[#111827]">
                        <p className="leading-relaxed">
                          “Respondent No. 2 was granted three final weeks to file their
                          counter-affidavit. Interim status quo continues today.”
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-[#B4833E]/35 bg-[#FBF6EC] px-2.5 py-1 font-mono text-[11px] text-[#7C5318]">
                            <FileText className="h-3 w-3 text-[#B4833E]" />
                            Order dt. 14 Mar 2025, para 4
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#111827]/10" />

                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#111827] px-4 py-2.5 text-sm text-[#FBF9F4]">
                        “Will we win?”
                      </div>
                    </div>

                    <div className="flex justify-start">
                      <div className="max-w-[92%] space-y-2 rounded-2xl rounded-tl-sm border border-[#B4833E]/45 bg-[#FDF8EE] p-4 text-sm text-[#111827]">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9A6B26]">
                          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                          <span>Guardrail</span>
                        </div>
                        <p className="font-medium text-[#111827]">
                          “I can’t predict outcomes. Here’s what the record shows…”
                        </p>
                        <p className="text-xs leading-relaxed text-[#111827]/80">
                          Interim stay was extended three times; Respondent No. 2 has not filed a
                          counter-affidavit yet.
                        </p>
                        <div className="pt-0.5">
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-[#B4833E]/35 bg-white px-2.5 py-0.5 font-mono text-[11px] text-[#7C5318]">
                            <FileText className="h-3 w-3 text-[#B4833E]" />
                            Docket Sheet WP 1042/2025, para 2
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'after' && (
              <div className="w-full rounded-2xl border border-[#111827]/12 bg-[#FBF9F4]/95 shadow-[0_24px_60px_-15px_rgba(17,24,39,0.16)] backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-[#111827]/10 px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <JollyGlyph state="approve" size={20} />
                    <span className="text-xs font-medium text-[#111827]">
                      Post-Hearing Note · WP 1042/2025
                    </span>
                  </div>
                  <span className="font-mono text-xs text-[#111827]/60">0:30 voice note</span>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  <div className="rounded-xl border border-[#111827]/10 bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#111827]/60">
                      <span className="font-medium text-[#111827]">Timeline & Task Added</span>
                      <span className="font-mono tabular-nums">Next: 04 Nov 2025</span>
                    </div>
                    <p className="text-xs leading-relaxed text-[#111827]/80">
                      Counter-affidavit served in Court Hall 4; file petitioner rejoinder by 30 Oct.
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#111827]/10 bg-[#F4EFE6]/80 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-medium text-[#111827]">
                        Draft WhatsApp · K. Sundaram
                      </div>
                      <div
                        className="inline-flex items-center gap-1 rounded-lg bg-white/80 p-0.5 border border-[#111827]/10"
                        role="group"
                        aria-label="Client message language"
                      >
                        {(['ta', 'en', 'hi'] as const).map((langKey) => (
                          <button
                            key={langKey}
                            type="button"
                            onClick={() => {
                              setDraftLang(langKey);
                              setIsApproved(false);
                            }}
                            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                              draftLang === langKey
                                ? 'bg-[#111827] text-[#FBF9F4]'
                                : 'text-[#111827]/70 hover:text-[#111827]'
                            }`}
                          >
                            {CLIENT_DRAFTS[langKey].label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="rounded-lg bg-white p-3 text-xs leading-relaxed text-[#111827] border border-[#111827]/8">
                      {CLIENT_DRAFTS[draftLang].text}
                    </p>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <span className="text-[11px] text-[#111827]/65">
                        {isApproved ? 'Approved by advocate' : 'Waiting for your approval'}
                      </span>

                      <button
                        type="button"
                        onClick={() => setIsApproved((prev) => !prev)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
                          isApproved
                            ? 'bg-[#2E6F40] text-white'
                            : 'bg-[#111827] text-[#FBF9F4] hover:bg-[#1E293B]'
                        }`}
                      >
                        {isApproved ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Approved</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </EditorialBackdrop>
        </div>
      </div>
    </section>
  );
};
