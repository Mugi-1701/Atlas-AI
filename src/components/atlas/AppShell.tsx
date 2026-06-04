import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, History, Compass } from "lucide-react";
import { type ReactNode } from "react";

const nav = [
  { to: "/", label: "Idea Analyzer", icon: Sparkles },
  { to: "/history", label: "Previous Analyses", icon: History },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar/60 backdrop-blur-xl sticky top-0 h-screen">
        <div className="px-5 py-5 flex items-center gap-2.5">
          <div className="size-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-elegant)" }}>
            <Compass className="size-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight">Atlas AI</div>
            <div className="text-[11px] text-muted-foreground">Your AI Co-Founder</div>
          </div>
        </div>

        <nav className="px-3 py-2 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-sidebar-accent border border-border"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="size-4 relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-14 px-4 md:px-8 flex items-center justify-between border-b border-border bg-background/60 backdrop-blur-xl">
          <div className="md:hidden flex items-center gap-2">
            <div className="size-7 rounded-lg" style={{ background: "var(--gradient-primary)" }} />
            <span className="font-semibold">Atlas AI</span>
          </div>
          <div className="hidden md:block text-sm text-muted-foreground">
            {nav.find((n) => n.to === pathname)?.label ?? "Workspace"}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-border bg-card/60">
              <span className="size-1.5 rounded-full bg-[oklch(var(--success))]" style={{ background: "var(--success)" }} />
              All systems nominal
            </span>
            <div className="size-8 rounded-full border border-border" style={{ background: "var(--gradient-primary)" }} />
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}