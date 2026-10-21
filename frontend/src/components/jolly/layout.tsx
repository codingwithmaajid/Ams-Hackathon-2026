import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusPill } from "./common";

const NAV = [
  { to: "/", label: "Today", end: true },
  { to: "/matters", label: "Matters", end: false },
  { to: "/approvals", label: "Approvals", end: false },
  { to: "/call", label: "Call", end: false },
  { to: "/how", label: "How it works", end: false },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-ivory text-navy-deep">
      <header className="sticky top-0 z-40 bg-navy text-ivory shadow-[0_1px_0_rgba(0,0,0,0.2)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 md:px-8">
          <NavLink to="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md bg-brass text-navy-deep">
              <Scale className="size-4" />
            </span>
            <span className="leading-none">
              <span className="block font-serif text-xl tracking-tight">Jolly</span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-ivory/60">Voice clerk for advocates</span>
            </span>
          </NavLink>
          <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive ? "bg-white/12 text-ivory" : "text-ivory/65 hover:bg-white/6 hover:text-ivory",
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <StatusPill className="ml-auto" />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">{children}</main>
      <footer className="mx-auto max-w-7xl px-4 pb-10 text-xs text-muted-foreground md:px-8">
        Every item on this console is read live from the Jolly API. Jolly cites the record and does not predict outcomes.
      </footer>
    </div>
  );
}
