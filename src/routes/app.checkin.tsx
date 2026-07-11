import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";

import { PremiumJournal } from "@/components/journal/premium-journal";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteJournalEntry,
  persistJournal,
  readJournalEntries,
  readStoredJournal,
  toggleJournalFavorite,
} from "@/lib/journal";
import type { JournalEntry } from "@/lib/journal";

export const Route = createFileRoute("/app/checkin")({
  component: CheckIn,
});

type SelectionOption = {
  label: string;
  emoji: string;
};

const MOODS: SelectionOption[] = [
  { label: "Happy", emoji: "😊" },
  { label: "Calm", emoji: "😌" },
  { label: "Energetic", emoji: "⚡" },
  { label: "Tired", emoji: "😴" },
  { label: "Anxious", emoji: "😰" },
  { label: "Emotional", emoji: "🥹" },
  { label: "Irritated", emoji: "😤" },
  { label: "Sad", emoji: "😔" },
];

const SYMPTOMS: SelectionOption[] = [
  { label: "Cramps", emoji: "💥" },
  { label: "Bloating", emoji: "🎈" },
  { label: "Headache", emoji: "🤕" },
  { label: "Fatigue", emoji: "🥱" },
  { label: "Nausea", emoji: "🤢" },
  { label: "Acne", emoji: "🫧" },
  { label: "Breast tenderness", emoji: "💗" },
  { label: "Back pain", emoji: "🩹" },
  { label: "Cravings", emoji: "🍫" },
  { label: "Spotting", emoji: "🩸" },
  { label: "Heavy flow", emoji: "🩸🩸" },
];

function SelectionLabel({ option }: { option: SelectionOption }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden="true" className="text-lg leading-none">
        {option.emoji}
      </span>
      <span>{option.label}</span>
    </span>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        active ? "shadow-sm" : "shadow-none"
      }`}
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

function CheckIn() {
  const qc = useQueryClient();
  const router = useRouter();
  const today = format(new Date(), "yyyy-MM-dd");
  const [moods, setMoods] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [sleep, setSleep] = useState(7);
  const [water, setWater] = useState(0);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [journal, setJournal] = useState("");
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [periodStart, setPeriodStart] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const loadJournalData = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id ?? null;

    if (!userId) {
      setActiveUserId(null);
      setJournal("");
      setJournalEntries([]);
      setMoods([]);
      setSymptoms([]);
      setSleep(7);
      setWater(0);
      setEnergy(3);
      setStress(3);
      setPeriodStart(false);
      router.navigate({ to: "/auth" });
      return;
    }

    setActiveUserId(userId);

    const storedJournal = readStoredJournal(today, userId);
    setJournalEntries(readJournalEntries(userId));

    if (storedJournal) {
      setJournal(storedJournal);
    }

    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("log_date", today)
      .maybeSingle();

    if (error) {
      console.error("[journal] failed to load today's entry", error);
      toast.error("We couldn't load your journal right now.");
      return;
    }

    if (!data) {
      return;
    }

    setMoods(data.moods ?? []);
    setSymptoms(data.symptoms ?? []);
    setSleep(data.sleep_hours ?? 7);
    setWater(data.water_ml ?? 0);
    setEnergy(data.energy ?? 3);
    setStress(data.stress ?? 3);

    const resolvedJournal = (data.journal ?? "") || storedJournal || "";
    setJournal(resolvedJournal);

    if (resolvedJournal.trim()) {
      setJournalEntries(
        persistJournal(today, resolvedJournal, {
          moods: data.moods ?? [],
          stress: data.stress ?? 3,
        }, userId),
      );
    }
  }, [router, today]);

  useEffect(() => {
    void loadJournalData();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id ?? null;
      if (!nextUserId) {
        setActiveUserId(null);
        setJournal("");
        setJournalEntries([]);
        setMoods([]);
        setSymptoms([]);
        setSleep(7);
        setWater(0);
        setEnergy(3);
        setStress(3);
        setPeriodStart(false);
        return;
      }

      void loadJournalData();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadJournalData]);

  function toggle(list: string[], value: string, set: (next: string[]) => void) {
    set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  const saveJournalOnly = useCallback(async () => {
    const trimmedJournal = journal.trim();
    if (!trimmedJournal) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id ?? null;
    if (!userId) {
      throw new Error("You need to be signed in to save your journal.");
    }

    setJournalEntries(persistJournal(today, trimmedJournal, { moods, stress }, userId));

    const { error } = await supabase.from("daily_logs").upsert(
      {
        user_id: userId,
        log_date: today,
        moods,
        symptoms,
        sleep_hours: sleep,
        water_ml: water,
        energy,
        stress,
        journal: trimmedJournal,
      },
      { onConflict: "user_id,log_date" },
    );

    if (error) {
      console.error("[journal] failed to auto-save entry", error);
      throw error;
    }
    qc.invalidateQueries();
  }, [energy, journal, moods, qc, sleep, stress, symptoms, today, water]);

  async function save() {
    setSaving(true);
    try {
      const trimmedJournal = journal.trim();
      if (!trimmedJournal) {
        toast.error("Please write a journal note before saving.");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id ?? null;
      if (!userId) {
        toast.error("Please sign in to save your journal.");
        return;
      }

      setJournalEntries(persistJournal(today, trimmedJournal, { moods, stress }, userId));

      const { error } = await supabase.from("daily_logs").upsert(
        {
          user_id: userId,
          log_date: today,
          moods,
          symptoms,
          sleep_hours: sleep,
          water_ml: water,
          energy,
          stress,
          journal: trimmedJournal,
        },
        { onConflict: "user_id,log_date" },
      );

      if (error) {
        console.error("[journal] failed to save entry", error);
        throw error;
      }
      if (periodStart) {
        await supabase.from("period_logs").insert({ user_id: userId, start_date: today });
        await supabase.from("profiles").update({ last_period_date: today }).eq("user_id", userId);
      }
      qc.invalidateQueries();
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function deleteJournal(entry: JournalEntry) {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id ?? null;
    if (!userId) {
      toast.error("Please sign in to delete your journal entries.");
      return;
    }

    setJournalEntries(deleteJournalEntry(entry.id, userId));

    if (entry.date === today) {
      setJournal("");
    }

    const { error } = await supabase
      .from("daily_logs")
      .update({ journal: null })
      .eq("user_id", userId)
      .eq("log_date", entry.date);

    if (error) {
      console.error("[journal] failed to delete entry", error);
      throw error;
    }
    qc.invalidateQueries();
  }

  function favoriteJournal(entryId: string) {
    const userId = activeUserId;
    setJournalEntries(toggleJournalFavorite(entryId, userId));
  }

  return (
    <div className="space-y-5 pb-8 md:space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
        <h1 className="font-display text-2xl font-semibold">Daily check-in</h1>
      </div>

      <Section title="Mood">
        <div className="flex flex-wrap gap-2">
          {MOODS.map((mood) => (
            <Chip
              key={mood.label}
              active={moods.includes(mood.label)}
              onClick={() => toggle(moods, mood.label, setMoods)}
            >
              <SelectionLabel option={mood} />
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Symptoms">
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS.map((symptom) => (
            <Chip
              key={symptom.label}
              active={symptoms.includes(symptom.label)}
              onClick={() => toggle(symptoms, symptom.label, setSymptoms)}
            >
              <SelectionLabel option={symptom} />
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Lifestyle">
        <div className="space-y-4">
          <Slider
            label="Sleep"
            value={sleep}
            min={0}
            max={12}
            step={0.5}
            onChange={setSleep}
            suffix="h"
          />
          <Slider
            label="Water"
            value={water}
            min={0}
            max={4000}
            step={250}
            onChange={setWater}
            suffix="ml"
          />
          <Slider
            label="Energy"
            value={energy}
            min={1}
            max={5}
            step={1}
            onChange={setEnergy}
            suffix=" / 5"
          />
          <Slider
            label="Stress"
            value={stress}
            min={1}
            max={5}
            step={1}
            onChange={setStress}
            suffix=" / 5"
          />
        </div>
      </Section>

      <Section title="Period">
        <label className="flex items-center gap-3 rounded-2xl border border-border p-3">
          <input
            type="checkbox"
            checked={periodStart}
            onChange={(event) => setPeriodStart(event.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm">My period started today</span>
        </label>
      </Section>

      <PremiumJournal
        today={today}
        value={journal}
        entries={journalEntries}
        moods={moods}
        stress={stress}
        onChange={setJournal}
        onAutoSave={saveJournalOnly}
        onManualSave={save}
        onDeleteEntry={deleteJournal}
        onToggleFavorite={favoriteJournal}
        saving={saving}
      />

      <Button onClick={save} disabled={saving} size="lg" className="w-full rounded-full md:mx-auto md:max-w-sm">
        {saving ? "Saving..." : "Save check-in"}
      </Button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bb-card p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  suffix: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}
