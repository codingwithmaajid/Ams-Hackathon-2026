import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  Command,
  FileText,
  Mail,
  Phone,
  Settings,
  Terminal,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
  { label: "Console", href: "/", icon: Terminal },
  { label: "Knowledge", href: "/knowledge", icon: BookOpen },
  { label: "Calls", href: "/calls", icon: Phone },
  { label: "Emails", href: "/emails", icon: Mail },
  { label: "Reports", href: "/reports", icon: FileText },
] as const;

export function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar px-3 py-5 lg:flex">
      <div className="px-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Command className="size-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-heading text-base font-semibold tracking-tight">
              aira
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              agentic rag · v0.4.2
            </span>
          </div>
        </div>
      </div>

      <nav className="mt-6 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                buttonVariants({
                  variant: active ? "secondary" : "ghost",
                }),
                "w-full justify-start gap-2.5"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
              {active && (
                <span className="ml-auto size-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 pt-4">
        <Link
          to="/reports"
          className="mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
          mesh healthy
        </Link>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start gap-2.5")}
        >
          <Settings className="size-4" />
          Settings
        </button>
        <Separator className="my-2 bg-sidebar-border" />
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-xs font-semibold text-accent-foreground">
            MK
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium">Maya Kade</span>
            <span className="truncate text-xs text-muted-foreground">
              @maya · admin
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4 md:px-6 lg:hidden">
      <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Command className="size-3.5" />
      </div>
      <span className="font-heading text-base font-semibold tracking-tight">
        aira
      </span>
      <span className="ml-auto flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
        <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
        mesh healthy
      </span>
    </header>
  );
}
