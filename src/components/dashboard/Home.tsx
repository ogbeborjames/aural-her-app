 import CycleCard from "@/components/dashboard/CycleCard";
import TodayCard from "@/components/dashboard/TodayCard";
import InsightCard from "@/components/dashboard/InsightCard";
import QuickActions from "@/components/dashboard/QuickActions";

export default function Home() {
  return (
    <div className="grid gap-6">

      <CycleCard
        cycleDay={12}
        phase="Follicular Phase"
      />

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">

        <TodayCard
          mood="😊 Happy"
          energy="High"
          sleep={8}
        />

        <InsightCard
          title="Cycle Insight"
          description="Your fertile window begins in approximately 3 days. Stay hydrated and keep tracking your symptoms."
        />

      </div>

      <QuickActions />

    </div>
  );
}