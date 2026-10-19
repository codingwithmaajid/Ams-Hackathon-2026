import { Link } from "react-router-dom";
import { PageHeader } from "@/components/jolly/common";

export default function NotFoundPage() {
  return (
    <div>
      <PageHeader eyebrow="404" title="Nothing on this page" />
      <Link to="/" className="text-sm font-medium text-navy underline underline-offset-4">
        Back to today's brief
      </Link>
    </div>
  );
}
