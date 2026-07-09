import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  BookHeart,
  Check,
  ChevronRight,
  Loader2,
  Save,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { JournalEntry } from "@/lib/journal";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface PremiumJournalProps {
  today: string;
  value: string;
  entries: JournalEntry[];
  moods: string[];
  stress: number;
  onChange: (value: string) => void;
  onAutoSave: () => Promise<void>;
  onManualSave: () => Promise<void>;
  onDeleteEntry: (entry: JournalEntry) => Promise<void>;
  onToggleFavorite: (entryId: string) => void;
  saving: boolean;
}

const QUOTES = [
  "What are you grateful for today?",
  "Your body deserves kindness.",
  "Small reflections create big changes.",
  "There is no wrong way to feel today.",
  "A gentle note can become tomorrow's clarity.",
  "Your inner world is worth listening to.",
  "Soft honesty is still powerful.",
];

const MOOD_EMOJI: Record<string, string> = {
  Happy: "😊",
  Calm: "🌿",
  Energetic: "✨",
  Tired: "🌙",
  Anxious: "🫧",
  Emotional: "💗",
  Irritated: "🌶️",
  Sad: "☁️",
};

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getQuote(date: string) {
  const score = date.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return QUOTES[score % QUOTES.length];
}

function getMoodEmoji(entry: JournalEntry) {
  const mood = entry.moods?.[0];
  return mood ? (MOOD_EMOJI[mood] ?? "🌸") : "🌸";
}

function formatEntryDate(date: string) {
  return format(parseISO(date), "MMM d, yyyy");
}

function getPreview(text: string) {
  return text.length > 132 ? `${text.slice(0, 132).trim()}...` : text;
}

function getInsight(value: string, moods: string[], stress: number, entries: JournalEntry[]) {
  const words = countWords(value);
  const recentStress = entries
    .slice(0, 7)
    .map((entry) => entry.stress)
    .filter((item): item is number => typeof item === "number");
  const stressAverage = recentStress.length
    ? recentStress.reduce((total, item) => total + item, 0) / recentStress.length
    : stress;
  const moodSummary = moods.length
    ? moods.join(", ")
    : words > 20
      ? "Reflective"
      : "Still unfolding";
  const trend =
    stressAverage <= 2.5
      ? "Your recent entries sound gentler and more grounded."
      : stressAverage >= 4
        ? "Your words suggest your nervous system may need extra care."
        : "Your emotional rhythm looks steady with small waves.";

  return {
    moodSummary,
    emotionalTrend: trend,
    stressTrend:
      stressAverage <= 2.5 ? "Low stress" : stressAverage >= 4 ? "High stress" : "Balanced stress",
    message:
      words > 80
        ? "You gave yourself real space today. Keep prioritizing rest, water, and small honest check-ins."
        : "A few honest lines still count. Let this be light, kind, and yours.",
  };
}

function getStreaks(entries: JournalEntry[], today: string) {
  const dates = [...new Set(entries.map((entry) => entry.date))].sort((a, b) => b.localeCompare(a));
  if (!dates.includes(today) && entries.some((entry) => entry.date === today)) dates.unshift(today);

  let longest = 0;
  let run = 0;
  let previous: Date | null = null;

  dates
    .map((date) => parseISO(date))
    .sort((a, b) => a.getTime() - b.getTime())
    .forEach((date) => {
      if (!previous) {
        run = 1;
      } else {
        const days = Math.round((date.getTime() - previous.getTime()) / 86_400_000);
        run = days === 1 ? run + 1 : 1;
      }
      longest = Math.max(longest, run);
      previous = date;
    });

  let current = 0;
  let cursor = parseISO(today);
  const dateSet = new Set(dates);
  while (dateSet.has(format(cursor, "yyyy-MM-dd"))) {
    current += 1;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }

  return { current, longest };
}

function getMonthlyWords(entries: JournalEntry[], today: string) {
  const month = today.slice(0, 7);
  return entries
    .filter((entry) => entry.date.startsWith(month))
    .reduce((total, entry) => total + countWords(entry.text), 0);
}

function getAverageMood(entries: JournalEntry[]) {
  const mood = entries.find((entry) => entry.moods?.length)?.moods?.[0];
  return mood ? `${MOOD_EMOJI[mood] ?? "🌸"} ${mood}` : "🌸 Tender";
}

function getMonthlyGraph(entries: JournalEntry[], today: string) {
  const monthEntries = entries.filter((entry) => entry.date.startsWith(today.slice(0, 7)));
  const maxWords = Math.max(1, ...monthEntries.map((entry) => countWords(entry.text)));
  return monthEntries
    .slice(0, 8)
    .reverse()
    .map((entry) => ({
      date: format(parseISO(entry.date), "d"),
      words: countWords(entry.text),
      height: Math.max(16, (countWords(entry.text) / maxWords) * 72),
    }));
}

export function PremiumJournal({
  today,
  value,
  entries,
  moods,
  stress,
  onChange,
  onAutoSave,
  onManualSave,
  onDeleteEntry,
  onToggleFavorite,
  saving,
}: PremiumJournalProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lastSavedRef = useRef(value.trim());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [query, setQuery] = useState("");
  const [viewerEntry, setViewerEntry] = useState<JournalEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<JournalEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [shakingId, setShakingId] = useState<string | null>(null);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort(
        (a, b) =>
          Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || b.date.localeCompare(a.date),
      ),
    [entries],
  );
  const todaysSavedEntry = useMemo(
    () => sortedEntries.find((entry) => entry.date === today) ?? null,
    [sortedEntries, today],
  );

  const filteredEntries = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return sortedEntries;
    return sortedEntries.filter((entry) => {
      const date = formatEntryDate(entry.date).toLowerCase();
      const moodsText = (entry.moods ?? []).join(" ").toLowerCase();
      return (
        date.includes(search) ||
        moodsText.includes(search) ||
        entry.text.toLowerCase().includes(search)
      );
    });
  }, [query, sortedEntries]);

  const insight = useMemo(
    () => getInsight(value, moods, stress, entries),
    [entries, moods, stress, value],
  );
  const words = countWords(value);
  const stats = useMemo(() => {
    const streaks = getStreaks(entries, today);
    return {
      total: entries.length,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      averageMood: getAverageMood(entries),
      monthlyWords: getMonthlyWords(entries, today),
      graph: getMonthlyGraph(entries, today),
    };
  }, [entries, today]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [value]);

  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === lastSavedRef.current) {
      if (!trimmed) setSaveStatus("idle");
      return;
    }

    setSaveStatus("idle");
    const timeout = window.setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await onAutoSave();
        lastSavedRef.current = trimmed;
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [onAutoSave, value]);

  async function handleManualSave() {
    setSaveStatus("saving");
    await onManualSave();
    lastSavedRef.current = value.trim();
    setSaveStatus("saved");
  }

  async function confirmDelete() {
    if (!deleteEntry) return;
    setDeleting(true);
    try {
      await onDeleteEntry(deleteEntry);
      setDeleteEntry(null);
      toast.success("Journal deleted successfully 🗑️");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      className="relative overflow-hidden rounded-[24px] border border-white/70 bg-white/70 p-4 shadow-[0_24px_80px_-38px_oklch(0.54_0.12_330_/_0.55)] backdrop-blur-2xl sm:p-6"
      aria-labelledby="journal-title"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,oklch(0.88_0.08_15_/_0.42),transparent_34%),radial-gradient(circle_at_100%_16%,oklch(0.82_0.09_305_/_0.34),transparent_30%),linear-gradient(135deg,oklch(1_0_0_/_0.72),oklch(0.97_0.02_85_/_0.52))]" />

      <div className="relative space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <motion.div
              animate={{ rotate: [0, -5, 4, 0], scale: [1, 1.04, 1] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
              className="grid size-14 place-items-center rounded-[20px] bg-gradient-to-br from-pink/80 via-white to-lavender/70 text-primary shadow-[0_16px_34px_-20px_oklch(0.58_0.16_330_/_0.75)]"
              aria-hidden="true"
            >
              <BookHeart className="size-7" />
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                {format(parseISO(today), "EEEE, MMMM d")}
              </p>
              <h2
                id="journal-title"
                className="mt-1 font-display text-3xl font-semibold text-foreground"
              >
                Today's Journal
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                "{getQuote(today)}"
              </p>
            </div>
          </div>

          <SavePill status={saveStatus} />
        </div>

        <div className="rounded-[24px] border border-white/80 bg-white/60 p-3 shadow-inner backdrop-blur-xl transition focus-within:border-primary/50 focus-within:shadow-[0_0_0_4px_oklch(0.82_0.09_305_/_0.18),0_24px_70px_-42px_oklch(0.54_0.12_330_/_0.75)]">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="How are you feeling today? Tell Body Bestie anything that's on your mind..."
            aria-label="Today's journal entry"
            className="max-h-[520px] min-h-48 resize-none border-0 bg-transparent px-2 py-3 text-base leading-7 shadow-none outline-none placeholder:text-muted-foreground/75 focus-visible:ring-0 sm:px-4"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/70 px-2 pt-3 text-xs font-semibold text-muted-foreground sm:px-4">
            <span>{value.length.toLocaleString()} characters</span>
            <span>{words.toLocaleString()} words</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            size="lg"
            onClick={handleManualSave}
            disabled={saving || saveStatus === "saving"}
            className="relative h-14 overflow-hidden rounded-full bg-gradient-to-r from-pink via-primary to-lavender px-8 text-base font-bold text-white shadow-[0_18px_42px_-20px_oklch(0.58_0.16_330_/_0.9)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_56px_-22px_oklch(0.58_0.16_330_/_0.95)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Save Today's Journal"
          >
            <motion.span
              className="absolute inset-0 bg-white/20"
              initial={{ x: "-110%" }}
              whileHover={{ x: "110%" }}
              transition={{ duration: 0.6 }}
              aria-hidden="true"
            />
            {saving || saveStatus === "saving" ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Save className="size-5" />
            )}
            Save Today's Journal
          </Button>
          <p className="text-sm leading-6 text-muted-foreground">
            Auto-save runs quietly after you pause typing.
          </p>
        </div>

        <AnimatePresence mode="popLayout">
          {todaysSavedEntry ? (
            <motion.div
              key={todaysSavedEntry.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96, height: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className="rounded-[24px] border border-primary/20 bg-white/70 p-4 shadow-[0_18px_46px_-34px_oklch(0.4_0.12_305_/_0.75)] backdrop-blur-xl"
              aria-label="Saved journal for today"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    Saved Today's Journal
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {getMoodEmoji(todaysSavedEntry)} {formatEntryDate(todaysSavedEntry.date)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {getPreview(todaysSavedEntry.text)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setViewerEntry(todaysSavedEntry)}
                    className="h-10 rounded-full px-4 text-primary hover:bg-white/70"
                  >
                    Read
                  </Button>
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(todaysSavedEntry.id)}
                    className="grid size-10 place-items-center rounded-full bg-white/75 text-primary transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={
                      todaysSavedEntry.favorite
                        ? "Remove today's journal from favorites"
                        : "Favorite today's journal"
                    }
                  >
                    <Star className={cn("size-5", todaysSavedEntry.favorite && "fill-primary")} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShakingId(todaysSavedEntry.id);
                      window.setTimeout(() => {
                        setShakingId(null);
                        setDeleteEntry(todaysSavedEntry);
                      }, 260);
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-rose-200/80 bg-white/60 px-4 text-sm font-semibold text-rose-600 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                    aria-label="Delete today's saved journal"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <InsightCard insight={insight} />
        <JournalStats stats={stats} />

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="font-display text-2xl font-semibold">Journal Timeline</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Search by date, mood, or keyword.
              </p>
            </div>
            <label className="relative block sm:w-72">
              <span className="sr-only">Search journal timeline</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search entries"
                className="h-12 rounded-full border-white/80 bg-white/70 pl-11 shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredEntries.length ? (
              <motion.div layout className="grid gap-3 sm:grid-cols-2">
                {filteredEntries.map((entry) => (
                  <TimelineCard
                    key={entry.id}
                    entry={entry}
                    shaking={shakingId === entry.id}
                    onRead={() => setViewerEntry(entry)}
                    onFavorite={() => onToggleFavorite(entry.id)}
                    onDelete={() => {
                      setShakingId(entry.id);
                      window.setTimeout(() => {
                        setShakingId(null);
                        setDeleteEntry(entry);
                      }, 260);
                    }}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-[24px] border border-dashed border-primary/30 bg-white/45 p-6 text-center text-sm text-muted-foreground"
              >
                Your saved journal notes will bloom here by date.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <JournalViewer entry={viewerEntry} onOpenChange={(open) => !open && setViewerEntry(null)} />

      <Dialog open={Boolean(deleteEntry)} onOpenChange={(open) => !open && setDeleteEntry(null)}>
        <DialogContent className="rounded-[24px] border-white/70 bg-white/90 shadow-[0_30px_90px_-42px_oklch(0.5_0.14_25_/_0.7)] backdrop-blur-2xl">
          <DialogHeader>
            <div className="mb-2 grid size-12 place-items-center rounded-[18px] bg-rose-50 text-rose-500">
              <Trash2 className="size-6" />
            </div>
            <DialogTitle className="font-display text-2xl">Delete Today's Journal?</DialogTitle>
            <DialogDescription className="text-base leading-7">
              Are you sure you want to permanently remove today's journal?
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteEntry(null)}
              className="h-12 rounded-full border-white/80 bg-white/75 px-6"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="h-12 rounded-full bg-gradient-to-r from-rose-400 to-pink px-6 font-bold text-white shadow-[0_14px_36px_-18px_oklch(0.62_0.2_20_/_0.8)]"
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.section>
  );
}

function SavePill({ status }: { status: SaveStatus }) {
  return (
    <div className="inline-flex h-11 items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 text-sm font-semibold text-muted-foreground shadow-sm backdrop-blur">
      <AnimatePresence mode="wait" initial={false}>
        {status === "saving" ? (
          <motion.span
            key="saving"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="inline-flex items-center gap-2"
          >
            <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
            Saving...
          </motion.span>
        ) : status === "saved" ? (
          <motion.span
            key="saved"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="inline-flex items-center gap-2 text-emerald-700"
          >
            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              className="grid size-6 place-items-center rounded-full bg-emerald-100"
              aria-hidden="true"
            >
              <Check className="size-4" />
            </motion.span>
            Saved just now
          </motion.span>
        ) : status === "error" ? (
          <motion.span
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-2 text-rose-600"
          >
            <X className="size-4" />
            Save paused
          </motion.span>
        ) : (
          <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            Ready when you are
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function InsightCard({ insight }: { insight: ReturnType<typeof getInsight> }) {
  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className="rounded-[24px] border border-white/75 bg-gradient-to-br from-white/78 via-pink/30 to-sage/35 p-5 shadow-[0_18px_46px_-34px_oklch(0.4_0.12_305_/_0.65)]"
    >
      <div className="flex items-start gap-3">
        <div
          className="grid size-11 place-items-center rounded-[16px] bg-white/75 text-primary shadow-sm"
          aria-hidden="true"
        >
          <Sparkles className="size-5" />
        </div>
        <div className="space-y-2">
          <h3 className="font-display text-xl font-semibold">🌸 Body Bestie Insight</h3>
          <p className="text-sm font-semibold text-foreground">
            Mood summary: {insight.moodSummary}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">{insight.emotionalTrend}</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Stress trend:{" "}
            <span className="font-semibold text-foreground">{insight.stressTrend}</span>.{" "}
            {insight.message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function JournalStats({
  stats,
}: {
  stats: {
    total: number;
    currentStreak: number;
    longestStreak: number;
    averageMood: string;
    monthlyWords: number;
    graph: ReturnType<typeof getMonthlyGraph>;
  };
}) {
  const items = [
    ["Total entries", stats.total.toLocaleString()],
    ["Current streak", `${stats.currentStreak} days`],
    ["Longest streak", `${stats.longestStreak} days`],
    ["Average mood", stats.averageMood],
    ["Words this month", stats.monthlyWords.toLocaleString()],
  ];

  return (
    <div className="rounded-[24px] border border-white/75 bg-white/55 p-5 shadow-sm backdrop-blur">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="size-5 text-primary" aria-hidden="true" />
        <h3 className="font-display text-xl font-semibold">Reflection Statistics</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-5">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-[18px] bg-white/65 p-3">
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>
      <div
        className="mt-4 flex h-24 items-end gap-2 rounded-[18px] bg-white/55 px-3 py-2"
        aria-label="Monthly reflection graph"
      >
        {stats.graph.length ? (
          stats.graph.map((bar) => (
            <div
              key={`${bar.date}-${bar.words}`}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <motion.div
                initial={{ height: 8 }}
                animate={{ height: bar.height }}
                className="w-full max-w-8 rounded-full bg-gradient-to-t from-primary to-pink shadow-sm"
                title={`${bar.words} words`}
              />
              <span className="text-[10px] font-semibold text-muted-foreground">{bar.date}</span>
            </div>
          ))
        ) : (
          <p className="m-auto text-sm text-muted-foreground">
            Your monthly reflection graph appears after your first entry.
          </p>
        )}
      </div>
    </div>
  );
}

function TimelineCard({
  entry,
  shaking,
  onRead,
  onFavorite,
  onDelete,
}: {
  entry: JournalEntry;
  shaking: boolean;
  onRead: () => void;
  onFavorite: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: shaking ? [0, -5, 5, -4, 4, 0] : 0 }}
      exit={{ opacity: 0, scale: 0.92, height: 0, margin: 0 }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className="rounded-[24px] border border-white/75 bg-white/65 p-4 shadow-[0_16px_44px_-34px_oklch(0.4_0.12_305_/_0.75)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-foreground">
            <span aria-hidden="true">{getMoodEmoji(entry)} </span>
            {formatEntryDate(entry.date)}
          </p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {entry.moods?.join(", ") || "Tender reflection"}
          </p>
        </div>
        <button
          type="button"
          onClick={onFavorite}
          className="grid size-10 place-items-center rounded-full bg-white/70 text-primary transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={entry.favorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star className={cn("size-5", entry.favorite && "fill-primary")} />
        </button>
      </div>
      <p className="mt-4 min-h-16 text-sm leading-6 text-muted-foreground">
        {getPreview(entry.text)}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onRead}
          className="rounded-full px-0 text-primary hover:bg-transparent"
        >
          Read More <ChevronRight className="size-4" />
        </Button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-rose-200/80 bg-white/55 px-4 text-sm font-semibold text-rose-600 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
          aria-label={`Delete journal entry from ${formatEntryDate(entry.date)}`}
        >
          <Trash2 className="size-4" />
          Delete
        </button>
      </div>
    </motion.article>
  );
}

function JournalViewer({
  entry,
  onOpenChange,
}: {
  entry: JournalEntry | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(entry)} onOpenChange={onOpenChange}>
      <DialogContent className="h-[100dvh] max-h-none w-screen max-w-none overflow-y-auto rounded-none border-0 bg-[linear-gradient(135deg,oklch(0.99_0.01_80),oklch(0.95_0.04_15),oklch(0.94_0.04_305))] p-5 shadow-none sm:p-8">
        {entry ? (
          <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center py-10">
            <DialogHeader>
              <p className="text-sm font-bold text-primary">
                {getMoodEmoji(entry)} {entry.moods?.join(", ") || "Journal reflection"}
              </p>
              <DialogTitle className="font-display text-4xl">
                {formatEntryDate(entry.date)}
              </DialogTitle>
              <DialogDescription>
                Saved {format(parseISO(entry.updatedAt ?? entry.createdAt), "h:mm a")}
              </DialogDescription>
            </DialogHeader>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-[24px] border border-white/75 bg-white/65 p-6 text-lg leading-9 shadow-[0_24px_70px_-42px_oklch(0.4_0.12_305_/_0.7)] backdrop-blur-xl"
            >
              {entry.text}
            </motion.div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
