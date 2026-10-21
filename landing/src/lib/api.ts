export interface BriefCitation {
  doc_title: string;
  para: string;
}

export interface BriefMatter {
  id?: string;
  court_hall: string;
  cause_list_item: string | number;
  title: string;
  next_hearing_purpose: string;
  last_order_excerpt?: string;
  citation: BriefCitation;
}

export interface DailyBriefResponse {
  date?: string;
  spoken_summary: string;
  matters: BriefMatter[];
}

export interface DailyBriefResult {
  data: DailyBriefResponse;
  isLive: boolean;
}

const rawApiUrl = import.meta.env.VITE_API_URL || 'https://jolly-backend-poqc.onrender.com';
const rawConsoleUrl = import.meta.env.VITE_CONSOLE_URL || 'https://jolly-console.onrender.com';

export const API_BASE_URL = String(rawApiUrl).replace(/\/+$/, '');
export const CONSOLE_BASE_URL = String(rawConsoleUrl).replace(/\/+$/, '');

export function getConsoleUrl(path: string = '/'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${CONSOLE_BASE_URL}${cleanPath}`;
}

export const FALLBACK_DAILY_BRIEF: DailyBriefResponse = {
  date: 'Today · 8:00 AM IST',
  spoken_summary:
    'Good morning, Counsel. You have two matters listed at the Madras High Court today. First is WP 1042 of 2025 in Court Hall 4 at item 12 for counter-affidavit filing. Second is OSA 88 of 2024 in Court Hall 11 at item 27 for interim stay arguments.',
  matters: [
    {
      id: 'wp-1042-2025',
      court_hall: 'Court Hall 4',
      cause_list_item: 12,
      title: 'K. Sundaram vs. State of Tamil Nadu & Ors. (WP 1042/2025)',
      next_hearing_purpose: 'Filing of Respondent No. 2 Counter-Affidavit & Rejoinder',
      last_order_excerpt:
        'Three weeks granted as last chance to Respondent No. 2 to file counter-affidavit; interim status quo extended till next hearing.',
      citation: {
        doc_title: 'Order dt. 14 Mar 2025',
        para: 'para 4',
      },
    },
    {
      id: 'osa-88-2024',
      court_hall: 'Court Hall 11',
      cause_list_item: 27,
      title: 'Meenakshi Textiles Pvt. Ltd. vs. Southern Power Distribution (OSA 88/2024)',
      next_hearing_purpose: 'Arguments on CMP 4190/2025 for Continuation of Interim Stay',
      last_order_excerpt:
        'Appellant directed to deposit 25% of disputed tariff demand within four weeks; matter posted for stay petition hearing.',
      citation: {
        doc_title: 'Affidavit of Compliance',
        para: 'para 7',
      },
    },
  ],
};

function normalizeMatter(raw: Record<string, unknown>, index: number): BriefMatter {
  const fallback = FALLBACK_DAILY_BRIEF.matters[index % FALLBACK_DAILY_BRIEF.matters.length];

  const rawCitation =
    raw.citation && typeof raw.citation === 'object'
      ? (raw.citation as Record<string, unknown>)
      : Array.isArray(raw.citations) && raw.citations.length > 0 && typeof raw.citations[0] === 'object'
      ? (raw.citations[0] as Record<string, unknown>)
      : null;

  const docTitle =
    (rawCitation?.doc_title as string) ||
    (rawCitation?.document_title as string) ||
    (rawCitation?.source as string) ||
    (raw.doc_title as string) ||
    fallback.citation.doc_title;

  const rawPara =
    rawCitation?.para ??
    rawCitation?.paragraph ??
    rawCitation?.page ??
    raw.para ??
    fallback.citation.para;

  const paraStr = String(rawPara).toLowerCase().startsWith('para') || String(rawPara).toLowerCase().startsWith('p.')
    ? String(rawPara)
    : `para ${rawPara}`;

  const rawCourtHall =
    (raw.court_hall as string | number) ??
    (raw.courtHall as string | number) ??
    fallback.court_hall;

  const courtHallStr = String(rawCourtHall).toLowerCase().includes('court') || String(rawCourtHall).toLowerCase().includes('hall') || String(rawCourtHall).toLowerCase().includes('ch')
    ? String(rawCourtHall)
    : `Court Hall ${rawCourtHall}`;

  return {
    id: String(raw.id ?? raw.matter_id ?? `matter-${index}`),
    court_hall: courtHallStr,
    cause_list_item: (raw.cause_list_item as string | number) ?? (raw.item_number as string | number) ?? (raw.item as string | number) ?? fallback.cause_list_item,
    title: String(raw.title ?? raw.case_title ?? raw.matter_title ?? fallback.title),
    next_hearing_purpose: String(
      raw.next_hearing_purpose ??
        raw.purpose ??
        raw.stage ??
        raw.hearing_purpose ??
        fallback.next_hearing_purpose
    ),
    last_order_excerpt:
      typeof raw.last_order_excerpt === 'string'
        ? raw.last_order_excerpt
        : typeof raw.summary === 'string'
        ? raw.summary
        : fallback.last_order_excerpt,
    citation: {
      doc_title: docTitle,
      para: paraStr,
    },
  };
}

export async function fetchDailyBrief(timeoutMs: number = 8000): Promise<DailyBriefResult> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}/briefs/daily`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = (await response.json()) as Record<string, unknown>;
    const payload =
      json.data && typeof json.data === 'object' ? (json.data as Record<string, unknown>) : json;

    const spokenSummary =
      typeof payload.spoken_summary === 'string' && payload.spoken_summary.trim().length > 0
        ? payload.spoken_summary.trim()
        : typeof payload.summary === 'string' && payload.summary.trim().length > 0
        ? payload.summary.trim()
        : FALLBACK_DAILY_BRIEF.spoken_summary;

    const rawMatters = Array.isArray(payload.matters)
      ? payload.matters
      : Array.isArray(payload.items)
      ? payload.items
      : [];

    const normalizedMatters =
      rawMatters.length > 0
        ? rawMatters.map((item, idx) =>
            normalizeMatter((item ?? {}) as Record<string, unknown>, idx)
          )
        : FALLBACK_DAILY_BRIEF.matters;

    return {
      data: {
        date: typeof payload.date === 'string' ? payload.date : 'Today · 8:00 AM',
        spoken_summary: spokenSummary,
        matters: normalizedMatters,
      },
      isLive: true,
    };
  } catch {
    return {
      data: FALLBACK_DAILY_BRIEF,
      isLive: false,
    };
  } finally {
    window.clearTimeout(timer);
  }
}
