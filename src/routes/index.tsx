import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Sparkles, CalendarDays, HeartPulse, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;

    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) throw redirect({ to: "/app" });
  },
  component: Landing,
});

function Feature({ icon: Icon, title, desc }: { icon: typeof Sparkles; title: string; desc: string }) {
  return (
    <div className="bb-card p-5 transition-shadow hover:shadow-lg">
      <div className="bb-gradient-primary mb-3 flex h-10 w-10 items-center justify-center rounded-xl">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-1 text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Landing() {
  return (
    <div className="bb-responsive pb-20 pt-10">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="bb-gradient-primary flex h-10 w-10 items-center justify-center rounded-2xl text-xl">🌸</span>
          <span className="font-display text-2xl font-semibold">Aural Her</span>
        </div>
        <ThemeToggle />
      </header>

      <section className="mt-14 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/60 px-3 py-1 text-xs font-medium text-accent-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Body bestie & wellness companion
        </span>
        <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          Meet the best friend your body's been waiting for.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base text-muted-foreground">
          Track your cycle, log how you feel, and get warm, personalized insights from your AI
          Body bestie — no clinical jargon, just gentle guidance.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/auth">Start free</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="rounded-full">
            <Link to="/auth">I already have an account</Link>
          </Button>
        </div>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-2">
        <Feature icon={CalendarDays} title="Cycle intelligence" desc="Predictions for period, ovulation, fertile window, and PMS — all in one calm view." />
        <Feature icon={HeartPulse} title="Daily check-ins" desc="Log mood, symptoms, sleep, and energy in seconds. See gentle patterns over time." />
        <Feature icon={Sparkles} title="AI Aural Her" desc="Ask anything — cravings, cramps, cycle phase. Warm, educational, never diagnostic." />
        <Feature icon={Shield} title="Private by design" desc="Your data is yours. Encrypted at rest, never sold. Delete anytime." />
      </section>

      <footer className="mt-16 text-center text-xs text-muted-foreground">
        Aural Her is an educational wellness tool — not a substitute for medical care.
      </footer>
    </div>
  );
}
