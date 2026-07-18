import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Home, CalendarDays, HeartPulse, Sparkles, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const nav = [
  { to: "/app", label: "Today", icon: Home },
  { to: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/app/checkin", label: "Check-in", icon: HeartPulse },
  { to: "/app/chat", label: "Aural Her", icon: Sparkles },
  { to: "/app/profile", label: "You", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useRouterState({ select: (s) => s.location });
  const router = useRouter();
  const { user } = useAuth();

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-8">
      <header className="bb-responsive flex flex-wrap items-center justify-between gap-3 pt-5 pb-4">
        <Link to="/app" className="flex items-center gap-2">
          <span className="bb-gradient-primary flex h-9 w-9 items-center justify-center rounded-2xl text-lg">
            🌸
          </span>
          <span className="font-display text-xl font-semibold">Aural Her</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && (
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sign out
            </Button>
          )}
        </div>
      </header>
      <main className="bb-responsive pb-6 pt-4 md:pt-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 h-16 border-t border-border bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:bottom-4 md:left-1/2 md:h-auto md:w-[min(92vw,42rem)] md:-translate-x-1/2 md:rounded-full md:border md:border-border/70 md:bg-card/95 md:pb-0 md:shadow-lg">
        <div className="mx-auto flex h-full items-stretch justify-evenly gap-0 px-1 md:max-w-5xl md:gap-1 md:px-2 md:py-2">
          {nav.map((n) => {
            const active = pathname === n.to || (n.to !== "/app" && pathname.startsWith(n.to));
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] leading-none whitespace-nowrap transition-colors md:min-w-18 md:px-3",
                  active ? "bg-primary/15 text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.4 : 1.8} />
                <span className={cn("truncate", active ? "font-semibold" : "font-medium")}>{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
