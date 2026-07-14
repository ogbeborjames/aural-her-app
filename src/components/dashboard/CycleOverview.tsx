import { phaseColor, friendlyDate, type CycleInfo } from "@/lib/cycle";
import { format } from "date-fns";

interface CycleOverviewProps {
  cycle: CycleInfo;
}

export default function CycleOverview({
  cycle,
}: CycleOverviewProps) {
  return (
    <>
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

            <h2 className="mt-1 font-display text-3xl font-semibold">
              Day {cycle.cycleDay}
            </h2>

            <p className="mt-1 text-sm opacity-80">
              of your cycle
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
              Next Period
            </p>

            <p className="mt-1 font-display text-2xl font-semibold">
              {cycle.daysUntilNextPeriod <= 0
                ? "Any day"
                : `${cycle.daysUntilNextPeriod} days`}
            </p>

            <p className="mt-1 text-xs opacity-80">
              {friendlyDate(cycle.nextPeriodDate)}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniCard
          label="Ovulation"
          value={friendlyDate(cycle.ovulationDate)}
          hint={`Fertile ${format(
            cycle.fertileStart,
            "MMM d"
          )} – ${format(cycle.fertileEnd, "MMM d")}`}
          tint="var(--ovulation)"
        />

        <MiniCard
          label="Cycle Length"
          value={`${cycle.cycleLength} days`}
          hint={`Period ~${cycle.periodLength} days`}
          tint="var(--lavender)"
        />
      </div>
    </>
  );
}

function MiniCard({
  label,
  value,
  hint,
  tint,
}: {
  label: string;
  value: string;
  hint: string;
  tint: string;
}) {
  return (
    <div className="bb-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: tint }}
        />

        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>

      <p className="font-display text-lg font-semibold">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {hint}
      </p>
    </div>
  );
}