import { format } from "date-fns";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, HeartPulse, CalendarDays, Droplet } from "lucide-react";
import GreetingCard from "@/components/dashboard/GreetingCard";
import CycleOverview from "@/components/dashboard/CycleOverview";
import { supabase } from "@/integrations/supabase/client";
import { computeCycle } from "@/lib/cycle";
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
      <GreetingCard
        greeting={greeting}
        name={data.profile?.nickname ?? data.profile?.name ?? "Bestie"}
        avatarUrl={(data.profile as any)?.avatar_url ?? null}
      />

      {cycle && <CycleOverview cycle={cycle} />}

      <Link
        to="/app/checkin"
        className="bb-card block rounded-[28px] p-6 transition-transform hover:-translate-y-0.5"
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
        className="bb-card block overflow-hidden rounded-[28px] p-6 transition-transform hover:-translate-y-0.5"
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

function greetingFor(name: string) {
  const h = new Date().getHours();
  const g = h < 12 ? "Good morning" : h < 18 ? "Hi" : "Good evening";
  return `${g}, ${name} 🌸`;
}

function aiInsight(
  cycle: ReturnType<typeof computeCycle>,
  log: { moods?: string[] | null; symptoms?: string[] | null } | null,
) {
  if (!cycle) {
    return "Log your first cycle so I can start personalizing insights just for you.";
  }

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
