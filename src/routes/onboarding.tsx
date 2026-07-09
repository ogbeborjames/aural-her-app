import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

const GOALS = [
  { id: "cycle", label: "Track my cycle", emoji: "🌸" },
  { id: "fertility", label: "Understand fertility", emoji: "🌱" },
  { id: "wellness", label: "Wellness & mood", emoji: "💛" },
  { id: "learn", label: "Learn about my body", emoji: "📖" },
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-4 py-2 text-sm font-medium transition-all"
      style={{
        borderColor: active ? "var(--primary)" : "var(--border)",
        backgroundColor: active ? "oklch(0.82 0.09 305 / 0.2)" : "var(--card)",
        color: active ? "var(--primary)" : "var(--foreground)",
      }}
    >
      {children}
    </button>
  );
}

function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [dob, setDob] = useState("");
  const [lastPeriod, setLastPeriod] = useState(format(new Date(), "yyyy-MM-dd"));
  const [cycleLen, setCycleLen] = useState(28);
  const [periodLen, setPeriodLen] = useState(5);
  const [goals, setGoals] = useState<string[]>(["cycle"]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        toast.error(error.message);
        router.navigate({ to: "/auth" });
        return;
      }

      if (!data.session) {
        router.navigate({ to: "/auth" });
        return;
      }

      setLoading(false);
    })();
  }, [router]);

  async function finish() {
    setSaving(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session!.user.id;
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: uid,
          nickname,
          date_of_birth: dob || null,
          last_period_date: lastPeriod,
          avg_cycle_length: cycleLen,
          avg_period_length: periodLen,
          goals,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          onboarded: true,
        });
      if (error) throw error;
      await supabase.from("period_logs").insert({
        user_id: uid,
        start_date: lastPeriod,
      });
      toast.success("You're all set, bestie! 🌸");
      router.navigate({ to: "/app" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  const steps = [
    {
      title: "What should I call you?",
      subtitle: "A nickname makes chats feel like home.",
      body: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nickname</Label>
            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. Maya" />
          </div>
          <div className="space-y-1.5">
            <Label>Date of birth (optional)</Label>
            <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
        </div>
      ),
      canNext: nickname.trim().length > 0,
    },
    {
      title: "When did your last period start?",
      subtitle: "We'll use this to predict your cycle.",
      body: (
        <div className="space-y-1.5">
          <Label>Last period start date</Label>
          <Input type="date" value={lastPeriod} onChange={(e) => setLastPeriod(e.target.value)} />
        </div>
      ),
      canNext: !!lastPeriod,
    },
    {
      title: "Your usual cycle",
      subtitle: "Don't worry if you're not sure — you can update this any time.",
      body: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Average cycle length: {cycleLen} days</Label>
            <input
              type="range"
              min={20}
              max={40}
              value={cycleLen}
              onChange={(e) => setCycleLen(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Average period length: {periodLen} days</Label>
            <input
              type="range"
              min={2}
              max={10}
              value={periodLen}
              onChange={(e) => setPeriodLen(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>
      ),
      canNext: true,
    },
    {
      title: "What brings you here?",
      subtitle: "Pick any that fit — no wrong answers.",
      body: (
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <Chip
              key={g.id}
              active={goals.includes(g.id)}
              onClick={() =>
                setGoals((cur) =>
                  cur.includes(g.id) ? cur.filter((x) => x !== g.id) : [...cur, g.id],
                )
              }
            >
              <span className="mr-1.5">{g.emoji}</span>
              {g.label}
            </Chip>
          ))}
        </div>
      ),
      canNext: goals.length > 0,
    },
  ];

  const s = steps[step];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{ backgroundColor: i <= step ? "var(--primary)" : "var(--border)" }}
          />
        ))}
      </div>

      <div className="bb-card mx-auto w-full max-w-md p-6 sm:p-7">
        <h1 className="font-display text-2xl font-semibold">{s.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{s.subtitle}</p>
        <div className="mt-6">{s.body}</div>
      </div>

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <Button variant="ghost" className="flex-1 rounded-full" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
        {step < steps.length - 1 ? (
          <Button
            className="flex-1 rounded-full"
            disabled={!s.canNext}
            onClick={() => setStep(step + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button
            className="flex-1 rounded-full"
            disabled={!s.canNext || saving}
            onClick={finish}
          >
            {saving ? "Saving…" : "Meet Aural Her"}
          </Button>
        )}
      </div>
    </div>
  );
}
