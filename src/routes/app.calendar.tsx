import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeCycle } from "@/lib/cycle";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/app/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const { data } = useQuery({
    queryKey: ["calendar-data"],
    queryFn: async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session!.user.id;
      const [profileRes, periodRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", uid).single(),
        supabase
          .from("period_logs")
          .select("start_date, end_date")
          .eq("user_id", uid)
          .order("start_date", { ascending: false })
          .limit(12),
      ]);
      return { profile: profileRes.data, periods: periodRes.data ?? [] };
    },
  });

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });

  const cycle = data
    ? computeCycle(
        data.profile?.last_period_date ? new Date(data.profile.last_period_date) : null,
        data.profile?.avg_cycle_length ?? 28,
        data.profile?.avg_period_length ?? 5,
      )
    : null;

  // build a set of predicted period days for the next 3 cycles
  const predictedPeriodDays = new Set<string>();
  const predictedOvulationDays = new Set<string>();
  const fertileDays = new Set<string>();
  if (data?.profile?.last_period_date) {
    const start = new Date(data.profile.last_period_date);
    const cl = data.profile.avg_cycle_length ?? 28;
    const pl = data.profile.avg_period_length ?? 5;
    for (let c = 0; c < 6; c++) {
      const cs = addDays(start, c * cl);
      for (let i = 0; i < pl; i++) predictedPeriodDays.add(format(addDays(cs, i), "yyyy-MM-dd"));
      const ov = addDays(cs, cl - 14);
      predictedOvulationDays.add(format(ov, "yyyy-MM-dd"));
      for (let i = -5; i <= 1; i++) fertileDays.add(format(addDays(ov, i), "yyyy-MM-dd"));
    }
  }
  const loggedPeriodDays = new Set(
    (data?.periods ?? []).flatMap((p) => {
      const from = new Date(p.start_date);
      const to = p.end_date ? new Date(p.end_date) : addDays(from, (data?.profile?.avg_period_length ?? 5) - 1);
      const list: string[] = [];
      for (let d = from; d <= to; d = addDays(d, 1)) list.push(format(d, "yyyy-MM-dd"));
      return list;
    }),
  );

  return (
    <div className="space-y-5 pb-8 md:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Calendar</h1>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full p-2 hover:bg-muted"
            onClick={() => setMonth(addDays(startOfMonth(month), -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="w-32 text-center text-sm font-semibold">{format(month, "MMMM yyyy")}</p>
          <button
            className="rounded-full p-2 hover:bg-muted"
            onClick={() => setMonth(addDays(endOfMonth(month), 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="bb-card p-4 overflow-x-auto">
        <div className="mb-2 min-w-[20rem] grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:gap-2 sm:text-[11px]">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="min-w-[20rem] grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const inMonth = isSameMonth(d, month);
            const isToday = isSameDay(d, new Date());
            const logged = loggedPeriodDays.has(key);
            const predicted = predictedPeriodDays.has(key) && !logged;
            const ovulation = predictedOvulationDays.has(key);
            const fertile = fertileDays.has(key) && !ovulation;

            let bg = "transparent";
            let color = inMonth ? "var(--foreground)" : "var(--muted-foreground)";
            let border = "1px solid transparent";
            if (logged) {
              bg = "var(--period)";
              color = "white";
            } else if (predicted) {
              border = "1.5px dashed var(--period)";
              color = "var(--period)";
            } else if (ovulation) {
              bg = "var(--ovulation)";
              color = "white";
            } else if (fertile) {
              bg = "oklch(0.78 0.11 155 / 0.35)";
            }

            return (
              <div
                key={key}
                className="relative flex aspect-square items-center justify-center rounded-full text-sm font-medium transition-transform hover:scale-105 sm:text-[15px]"
                style={{ backgroundColor: bg, color, border, opacity: inMonth ? 1 : 0.4 }}
              >
                {isToday && (
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{ boxShadow: "0 0 0 2px var(--primary)" }}
                  />
                )}
                {format(d, "d")}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bb-card space-y-2 p-4 text-sm">
        <p className="font-semibold">Legend</p>
        <LegendRow color="var(--period)" label="Logged period" />
        <LegendRow color="transparent" label="Predicted period" border="1.5px dashed var(--period)" />
        <LegendRow color="oklch(0.78 0.11 155 / 0.6)" label="Fertile window" />
        <LegendRow color="var(--ovulation)" label="Ovulation" />
      </div>

      {cycle && (
        <div className="bb-card p-5">
          <p className="text-sm text-muted-foreground">Cycle summary</p>
          <p className="mt-1 font-display text-xl font-semibold">
            {cycle.cycleLength}-day cycle · {cycle.periodLength}-day period
          </p>
        </div>
      )}
    </div>
  );
}

function LegendRow({ color, label, border }: { color: string; label: string; border?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="h-4 w-4 rounded-full"
        style={{ backgroundColor: color, border: border ?? "none" }}
      />
      <span>{label}</span>
    </div>
  );
}
