import {
  FileSpreadsheet,
  FileType,
  Globe,
  HelpCircle,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

import type { SourceKind } from "@/store";

export const KIND_LABELS: Record<SourceKind, string> = {
  file: "File",
  text: "Text",
  qa: "Q&A",
  url: "Website",
};

export function SourceIcon({
  kind,
  name,
  className,
}: {
  kind: SourceKind;
  name: string;
  className?: string;
}) {
  let Icon: LucideIcon = ScrollText;
  if (kind === "qa") Icon = HelpCircle;
  else if (kind === "url") Icon = Globe;
  else if (/\.(csv|xlsx|sheet)$/i.test(name)) Icon = FileSpreadsheet;
  else if (/\.(pdf|docx?|rtf)$/i.test(name)) Icon = FileType;

  return (
    <span
      className={`flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground ${className ?? ""}`}
    >
      <Icon className="size-4" />
    </span>
  );
}
