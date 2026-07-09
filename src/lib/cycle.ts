import { addDays, differenceInDays, format } from "date-fns";

export type CyclePhase = "period" | "follicular" | "ovulation" | "luteal" | "pms" | "unknown";

export interface CycleInfo {
  cycleDay: number;
  phase: CyclePhase;
  phaseLabel: string;
  nextPeriodDate: Date;
  daysUntilNextPeriod: number;
  ovulationDate: Date;
  fertileStart: Date;
  fertileEnd: Date;
  cycleLength: number;
  periodLength: number;
}

export function computeCycle(
  lastPeriodStart: Date | null,
  avgCycleLength = 28,
  avgPeriodLength = 5,
  today: Date = new Date(),
): CycleInfo | null {
  if (!lastPeriodStart) return null;
  const cycleLength = Math.max(20, Math.min(45, avgCycleLength));
  const periodLength = Math.max(2, Math.min(10, avgPeriodLength));

  // Roll last period forward until it's the most recent one <= today
  let start = new Date(lastPeriodStart);
  while (differenceInDays(today, start) >= cycleLength) {
    start = addDays(start, cycleLength);
  }
  const cycleDay = differenceInDays(today, start) + 1;
  const nextPeriodDate = addDays(start, cycleLength);
  const daysUntilNextPeriod = differenceInDays(nextPeriodDate, today);
  const ovulationDate = addDays(start, cycleLength - 14);
  const fertileStart = addDays(ovulationDate, -5);
  const fertileEnd = addDays(ovulationDate, 1);

  let phase: CyclePhase;
  let phaseLabel: string;
  if (cycleDay <= periodLength) {
    phase = "period";
    phaseLabel = "Period";
  } else if (today >= fertileStart && today < ovulationDate) {
    phase = "follicular";
    phaseLabel = "Fertile window";
  } else if (
    Math.abs(differenceInDays(today, ovulationDate)) <= 0
  ) {
    phase = "ovulation";
    phaseLabel = "Ovulation";
  } else if (daysUntilNextPeriod <= 5) {
    phase = "pms";
    phaseLabel = "PMS window";
  } else {
    phase = "luteal";
    phaseLabel = "Luteal phase";
  }

  return {
    cycleDay,
    phase,
    phaseLabel,
    nextPeriodDate,
    daysUntilNextPeriod,
    ovulationDate,
    fertileStart,
    fertileEnd,
    cycleLength,
    periodLength,
  };
}

export function phaseColor(phase: CyclePhase): string {
  switch (phase) {
    case "period": return "var(--period)";
    case "ovulation": return "var(--ovulation)";
    case "follicular": return "var(--fertile)";
    case "pms": return "var(--pms)";
    case "luteal": return "var(--lavender)";
    default: return "var(--muted)";
  }
}

export function friendlyDate(d: Date) {
  return format(d, "EEE, MMM d");
}
