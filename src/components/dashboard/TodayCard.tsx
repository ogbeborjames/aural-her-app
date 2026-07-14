 import { Droplets, Moon, Smile, Zap } from "lucide-react";

interface TodayCardProps {
  moods: string[];
  energy: number | null;
  sleepHours: number | null;
  waterMl: number | null;
  journal: string;
}

export default function TodayCard({
  moods,
  energy,
  sleepHours,
  waterMl,
  journal,
}: TodayCardProps) {
  return (
    <div className="bb-card rounded-[28px] p-6 shadow-sm">
      <h3 className="mb-5 text-xl font-semibold sm:text-2xl">
        Today's Summary
      </h3>

      <div className="grid gap-4">

        <div className="flex flex-col gap-3 rounded-[20px] bg-muted/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Smile className="h-5 w-5" />
            Mood
          </span>

          <span className="text-sm font-semibold text-foreground">
            {moods.length ? moods.join(", ") : "Not logged"}
          </span>
        </div>

        <div className="flex flex-col gap-3 rounded-[20px] bg-muted/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-5 w-5" />
            Energy
          </span>

          <span className="text-sm font-semibold text-foreground">
            {energy ?? "--"}
          </span>
        </div>

        <div className="flex flex-col gap-3 rounded-[20px] bg-muted/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Moon className="h-5 w-5" />
            Sleep
          </span>

          <span className="text-sm font-semibold text-foreground">
            {sleepHours ?? "--"} hrs
          </span>
        </div>

        <div className="flex flex-col gap-3 rounded-[20px] bg-muted/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Droplets className="h-5 w-5" />
            Water
          </span>

          <span className="text-sm font-semibold text-foreground">
            {waterMl ?? 0} ml
          </span>
        </div>

        {journal && (
          <div className="rounded-2xl bg-muted/70 p-4 text-sm leading-6 text-foreground">
            {journal}
          </div>
        )}

      </div>
    </div>
  );
}