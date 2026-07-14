interface CycleCardProps {
  cycleDay: number;
  phase: string;
}

export default function CycleCard({
  cycleDay,
  phase,
}: CycleCardProps) {
  return (
    <div className="rounded-3xl bg-pink-500 p-8 text-white shadow-xl">
      <p className="text-sm opacity-80">
        Current Cycle
      </p>

      <h2 className="mt-3 text-6xl font-bold">
        {cycleDay}
      </h2>

      <p className="mt-3 text-lg">
        {phase}
      </p>
    </div>
  );
}