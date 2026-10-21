import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { DailyBriefResponse } from '../lib/api';
import { JollyGlyph } from './JollyGlyph';

interface MorningBriefWindowProps {
  brief: DailyBriefResponse;
  isLoading: boolean;
  isLive: boolean;
  compact?: boolean;
}

export const MorningBriefWindow: React.FC<MorningBriefWindowProps> = ({
  brief,
  isLoading,
  isLive,
  compact = false,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeech = () => {
    if (typeof window === 'undefined') return;

    if (isSpeaking) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(brief.spoken_summary);
        utterance.lang = 'en-IN';
        utterance.rate = 0.98;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
        return;
      } catch {
        // Fallback timer if browser speech synthesis is blocked
      }
    }

    setIsSpeaking(true);
    window.setTimeout(() => setIsSpeaking(false), 5000);
  };

  return (
    <div className="w-full rounded-2xl border border-[#111827]/12 bg-[#FBF9F4]/95 shadow-[0_24px_60px_-15px_rgba(17,24,39,0.16)] backdrop-blur-md transition-all duration-200">
      {/* Window Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#111827]/10 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          {isSpeaking ? (
            <img
              src="/brand/jolly-glyph-live.gif"
              alt="Jolly speaking"
              className="h-5 w-5 rounded-full shrink-0"
            />
          ) : (
            <JollyGlyph state="brief" size={20} />
          )}
          <span className="text-xs font-medium tracking-tight text-[#111827]">
            Today · 8:00 AM brief
          </span>
        </div>

        <div className="flex items-center gap-3">
          {!isLoading && isLive && (
            <div
              className="flex items-center gap-1.5 text-[11px] font-medium text-[#111827]/70"
              title="Connected to live GET /briefs/daily endpoint"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#2E6F40]" />
              <span>live from the Jolly backend</span>
            </div>
          )}

          {!isLoading && (
            <button
              type="button"
              onClick={handleToggleSpeech}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#111827]/15 bg-white px-2.5 py-1 text-xs font-medium text-[#111827] transition-colors hover:bg-[#F3EFE6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] whitespace-nowrap shrink-0"
              aria-pressed={isSpeaking}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-[#B4833E]" />
                  <span>Stop audio</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-[#B4833E]" />
                  <span>Listen to brief</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Window Content */}
      <div className={compact ? 'p-5' : 'p-6 sm:p-7'}>
        {isLoading ? (
          <div className="space-y-6 animate-soft-shimmer" aria-busy="true" aria-label="Loading daily brief">
            <div className="space-y-2.5 rounded-xl bg-[#111827]/[0.04] p-4">
              <div className="h-3 w-28 rounded bg-[#111827]/15" />
              <div className="h-3.5 w-full rounded bg-[#111827]/12" />
              <div className="h-3.5 w-11/12 rounded bg-[#111827]/12" />
              <div className="h-3.5 w-3/4 rounded bg-[#111827]/12" />
            </div>

            <div className="space-y-3">
              {[0, 1].map((skeletonIdx) => (
                <div
                  key={skeletonIdx}
                  className="rounded-xl border border-[#111827]/10 bg-white/70 p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-36 rounded bg-[#111827]/15" />
                    <div className="h-4 w-32 rounded bg-[#B4833E]/20" />
                  </div>
                  <div className="h-4 w-4/5 rounded bg-[#111827]/15" />
                  <div className="h-3 w-2/3 rounded bg-[#111827]/10" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Spoken Summary Block */}
            <div className="rounded-xl border border-[#111827]/10 bg-[#F4EFE6]/80 p-4">
              <div className="mb-1.5 flex items-center justify-between text-xs text-[#111827]/60">
                <span>Spoken summary · Outbound phone call</span>
                <span className="font-mono tabular-nums">08:00 IST</span>
              </div>
              <p className="font-editorial text-[16px] leading-relaxed text-[#111827]">
                “{brief.spoken_summary}”
              </p>
            </div>

            {/* Matters List */}
            <div>
              <div className="mb-2.5 flex items-center justify-between text-xs font-medium text-[#111827]/60">
                <span>Today’s Cause List ({brief.matters.length} matters)</span>
                <span>Source citation</span>
              </div>

              <div className="divide-y divide-[#111827]/10 rounded-xl border border-[#111827]/10 bg-white">
                {brief.matters.map((matter, idx) => {
                  const isExpanded = expandedIndex === idx;
                  const itemLabel = String(matter.cause_list_item)
                    .toLowerCase()
                    .startsWith('item')
                    ? String(matter.cause_list_item)
                    : `item ${matter.cause_list_item}`;

                  return (
                    <div key={matter.id || idx} className="p-4 transition-colors hover:bg-[#FBF9F4]/60">
                      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-[#111827]/70">
                            <span className="text-[#111827] font-semibold">{matter.court_hall}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums text-[#9A6B26] font-medium">
                              {itemLabel}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-[#111827] leading-snug">
                            {matter.title}
                          </h3>
                          <p className="text-xs text-[#111827]/70 leading-relaxed">
                            Next purpose: {matter.next_hearing_purpose}
                          </p>
                        </div>

                        {/* Citation Chip (Interactive to inspect source excerpt) */}
                        <div className="shrink-0 self-start">
                          <button
                            type="button"
                            onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-[#B4833E]/35 bg-[#FBF6EC] px-2.5 py-1 text-[11px] font-mono text-[#7C5318] transition-colors hover:bg-[#F5E9D3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] whitespace-nowrap shrink-0"
                            title="View cited record excerpt"
                          >
                            <FileText className="h-3 w-3 text-[#B4833E] shrink-0" />
                            <span>
                              {matter.citation.doc_title}, {matter.citation.para}
                            </span>
                            {matter.last_order_excerpt &&
                              (isExpanded ? (
                                <ChevronUp className="h-3 w-3 opacity-70" />
                              ) : (
                                <ChevronDown className="h-3 w-3 opacity-70" />
                              ))}
                          </button>
                        </div>
                      </div>

                      {isExpanded && matter.last_order_excerpt && (
                        <div className="mt-3 rounded-lg bg-[#FBF9F4] p-3 text-xs text-[#111827]/80 border border-[#111827]/10">
                          <div className="mb-1 font-mono text-[11px] text-[#9A6B26]">
                            Excerpt · {matter.citation.doc_title} ({matter.citation.para})
                          </div>
                          <p className="leading-relaxed">“{matter.last_order_excerpt}”</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
