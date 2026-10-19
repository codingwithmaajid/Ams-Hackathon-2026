// Backend dates are plain ISO dates ("2026-10-19"). Parse them as local
// calendar dates so they never shift a day across time zones.
export function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function fmtDate(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  const d = parseDate(iso);
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

export function fmtLongDate(iso: string | null | undefined): string {
  return fmtDate(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function humanize(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function citationLabel(c: { doc_title: string; para: string | null; doc_date: string | null }): string {
  const parts = [c.doc_title];
  if (c.para) parts.push(c.para);
  if (c.doc_date) parts.push(fmtDate(c.doc_date, { day: "numeric", month: "short", year: "numeric" }));
  return parts.join(" · ");
}

/**
 * Split a document into cited paragraphs exactly like backend/services/ingest.py
 * (split_paragraphs): blank-line blocks, "[P3]" markers, else P<position>.
 */
export function paragraphs(text: string): { para: string; text: string }[] {
  const out: { para: string; text: string }[] = [];
  text
    .trim()
    .split(/\n\s*\n/)
    .forEach((raw, i) => {
      const block = raw.split(/\s+/).filter(Boolean).join(" ");
      if (!block) return;
      const m = /^\[(P\d+)\]\s*/.exec(block);
      const body = m ? block.slice(m[0].length) : block;
      if (body) out.push({ para: m ? m[1] : `P${i + 1}`, text: body });
    });
  return out;
}
