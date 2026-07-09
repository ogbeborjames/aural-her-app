import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeCycle, phaseColor, friendlyDate } from "@/lib/cycle";
import { Sparkles, HeartPulse, CalendarDays, Droplet } from "lucide-react";
import { format, subDays } from "date-fns";
import { readStoredJournal } from "@/lib/journal";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function Dashboard() {
  const today = format(new Date(), "yyyy-MM-dd");
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id ?? null;
      const storedJournal = uid ? readStoredJournal(today, uid) : "";
      if (!uid) {
        return { profile: null, todayLog: null, lastPeriod: null, journal: "" };
      }

      const [profileRes, todayRes, recentPeriods] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", uid).single(),
        supabase
          .from("daily_logs")
          .select("*")
          .eq("user_id", uid)
          .eq("log_date", format(new Date(), "yyyy-MM-dd"))
          .maybeSingle(),
        supabase
          .from("period_logs")
          .select("start_date")
          .eq("user_id", uid)
          .order("start_date", { ascending: false })
          .limit(1),
      ]);
      return {
        profile: profileRes.data,
        todayLog: todayRes.data,
        lastPeriod: recentPeriods.data?.[0]?.start_date ?? profileRes.data?.last_period_date,
        journal: (todayRes.data?.journal ?? storedJournal ?? "").trim(),
      };
    },
  });

  if (!data) {
    return <div className="mt-20 text-center text-muted-foreground">Loading your day…</div>;
  }

  const cycle = computeCycle(
    data.lastPeriod ? new Date(data.lastPeriod) : null,
    data.profile?.avg_cycle_length ?? 28,
    data.profile?.avg_period_length ?? 5,
  );
  const greeting = greetingFor(data.profile?.nickname ?? data.profile?.name ?? "bestie");

  return (
    <div className="space-y-5 pb-8 md:space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
        <h1 className="font-display text-3xl font-semibold">{greeting}</h1>
      </div>

      {cycle && (
        <section
          className="bb-card overflow-hidden p-5 sm:p-6 md:p-7"
          style={{
            backgroundImage: `linear-gradient(135deg, ${phaseColor(cycle.phase)} 0%, var(--cream) 130%)`,
            color: "var(--foreground)",
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
                {cycle.phaseLabel}
              </p>
              <h2 className="mt-1 font-display text-3xl font-semibold">Day {cycle.cycleDay}</h2>
              <p className="mt-1 text-sm opacity-80">of your cycle</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
                Next period
              </p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {cycle.daysUntilNextPeriod <= 0 ? "Any day" : `${cycle.daysUntilNextPeriod}d`}
              </p>
              <p className="mt-1 text-xs opacity-80">{friendlyDate(cycle.nextPeriodDate)}</p>
            </div>
          </div>
        </section>
      )}

      {cycle && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MiniCard
            label="Ovulation"
            value={friendlyDate(cycle.ovulationDate)}
            hint={`Fertile ${format(cycle.fertileStart, "MMM d")} – ${format(cycle.fertileEnd, "MMM d")}`}
            tint="var(--ovulation)"
          />
          <MiniCard
            label="Cycle length"
            value={`${cycle.cycleLength} days`}
            hint={`Period ~${cycle.periodLength} days`}
            tint="var(--lavender)"
          />
        </div>
      )}

      <Link
        to="/app/checkin"
        className="bb-card block p-5 transition-transform hover:-translate-y-0.5 md:p-6"
      >
        <div className="flex items-center gap-4">
          <div className="bb-gradient-primary flex h-12 w-12 items-center justify-center rounded-2xl">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">
              {data.todayLog ? "Update today's check-in" : "How are you feeling today?"}
            </p>
            <p className="text-sm text-muted-foreground">
              {data.journal
                ? `Journal saved: ${data.journal}`
                : "Log mood, symptoms, sleep & more — takes 30 seconds."}
            </p>
          </div>
        </div>
      </Link>

      <Link
        to="/app/chat"
        className="bb-card block overflow-hidden p-5 transition-transform hover:-translate-y-0.5 md:p-6"
      >
        <div className="flex items-center gap-3">
          <div className="bb-gradient-sage flex h-11 w-11 items-center justify-center rounded-2xl">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold">Ask Aural Her</p>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {aiInsight(cycle, data.todayLog)}
        </p>
        <p className="mt-3 text-xs font-medium text-primary">Chat now →</p>
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/app/calendar"
          className="bb-card flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5"
        >
          <CalendarDays className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">Calendar</span>
        </Link>
        <div className="bb-card flex items-center gap-3 p-4">
          <Droplet className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {data.todayLog?.water_ml ? `${data.todayLog.water_ml}ml` : "Log water"}
            </p>
            <p className="text-xs text-muted-foreground">Hydration today</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniCard({ label, value, hint, tint }: { label: string; value: string; hint: string; tint: string }) {
  return (
    <div className="bb-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tint }} />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="font-display text-lg font-semibold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function greetingFor(name: string) {
  const h = new Date().getHours();
  const g = h < 12 ? "Good morning" : h < 18 ? "Hi" : "Good evening";
  return `${g}, ${name} 🌸`;
}

function aiInsight(cycle: ReturnType<typeof computeCycle>, log: { moods?: string[] | null; symptoms?: string[] | null } | null) {
  if (!cycle) return "Log your first cycle so I can start personalizing insights just for you.";
  const base: Record<string, string> = {
    period: "Your body is working hard. Warm baths, iron-rich foods, and gentle stretching can be so kind right now.",
    follicular: "Estrogen is rising — energy tends to climb. A great week for new routines and cardio if it feels good.",
    ovulation: "You may notice extra energy, clearer skin, and higher libido. Stay hydrated and enjoy the boost.",
    luteal: "Progesterone is up — slow strength work, magnesium-rich foods, and calm sleep routines feel supportive now.",
    pms: "PMS often means cravings and mood shifts. Balanced meals, less caffeine, and early nights help most people.",
    unknown: "Tell me a little more about your cycle so I can tailor tips just for you.",
  };
  return base[cycle.phase] ?? base.unknown;
}
// avoid unused import warning
export const _u = subDays;
