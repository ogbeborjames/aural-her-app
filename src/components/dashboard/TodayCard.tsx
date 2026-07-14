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
    <div className="rounded-3xl border bg-card p-6 shadow-sm">
      <h3 className="mb-5 text-xl font-semibold">
        Today's Summary
      </h3>

      <div className="space-y-4">

        <div className="flex justify-between">
          <span className="flex items-center gap-2">
            <Smile size={18} />
            Mood
          </span>

          <span>
            {moods.length ? moods.join(", ") : "Not logged"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="flex items-center gap-2">
            <Zap size={18} />
            Energy
          </span>

          <span>
            {energy ?? "--"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="flex items-center gap-2">
            <Moon size={18} />
            Sleep
          </span>

          <span>
            {sleepHours ?? "--"} hrs
          </span>
        </div>

        <div className="flex justify-between">
          <span className="flex items-center gap-2">
            <Droplets size={18} />
            Water
          </span>

          <span>
            {waterMl ?? 0} ml
          </span>
        </div>

        {journal && (
          <div className="rounded-xl bg-muted p-3 text-sm">
            {journal}
          </div>
        )}

      </div>
    </div>
  );
}