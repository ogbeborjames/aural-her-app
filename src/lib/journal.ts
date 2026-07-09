export interface JournalEntry {
  id: string;
  date: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  moods?: string[];
  stress?: number | null;
  favorite?: boolean;
}

const JOURNAL_STORAGE_KEY_PREFIX = "aural-her-journal-archive";
const MAX_JOURNAL_ENTRIES = 100;

function getJournalStorageKey(userId?: string | null) {
  return `${JOURNAL_STORAGE_KEY_PREFIX}:${userId ?? "anonymous"}`;
}

function getStoredEntries(userId?: string | null): JournalEntry[] {
  if (typeof window === "undefined" || !userId) return [];

  try {
    const raw = window.localStorage.getItem(getJournalStorageKey(userId));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredEntries(entries: JournalEntry[], userId?: string | null) {
  if (typeof window === "undefined" || !userId) return;

  try {
    window.localStorage.setItem(getJournalStorageKey(userId), JSON.stringify(entries));
  } catch {
    // Ignore storage failures so the app still works gracefully.
  }
}

export function readJournalEntries(userId?: string | null) {
  return getStoredEntries(userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function readStoredJournal(date: string, userId?: string | null) {
  const entries = readJournalEntries(userId);
  return entries.find((entry) => entry.date === date)?.text ?? "";
}

export function persistJournal(
  date: string,
  value: string,
  metadata: Pick<JournalEntry, "moods" | "stress"> = {},
  userId?: string | null,
) {
  const trimmedValue = value.trim();
  if (!trimmedValue || !userId) return readJournalEntries(userId);

  const entries = getStoredEntries(userId);
  const existingIndex = entries.findIndex((entry) => entry.date === date);
  const existingEntry = existingIndex >= 0 ? entries[existingIndex] : undefined;

  if (
    existingEntry?.text === trimmedValue &&
    JSON.stringify(existingEntry.moods ?? []) === JSON.stringify(metadata.moods ?? []) &&
    existingEntry.stress === metadata.stress
  ) {
    return readJournalEntries(userId);
  }

  const now = new Date().toISOString();
  const nextEntry: JournalEntry = existingEntry
    ? {
        ...existingEntry,
        text: trimmedValue,
        moods: metadata.moods ?? existingEntry.moods,
        stress: metadata.stress ?? existingEntry.stress,
        updatedAt: now,
      }
    : {
        id: `${date}-${Date.now()}`,
        date,
        text: trimmedValue,
        moods: metadata.moods ?? [],
        stress: metadata.stress ?? null,
        favorite: false,
        createdAt: now,
        updatedAt: now,
      };

  const withoutExisting =
    existingIndex >= 0 ? entries.filter((entry) => entry.id !== nextEntry.id) : entries;
  const nextEntries = [nextEntry, ...withoutExisting].slice(0, MAX_JOURNAL_ENTRIES);
  saveStoredEntries(nextEntries, userId);
  return readJournalEntries(userId);
}

export function deleteJournalEntry(entryId: string, userId?: string | null) {
  const entries = getStoredEntries(userId).filter((entry) => entry.id !== entryId);
  saveStoredEntries(entries, userId);
  return readJournalEntries(userId);
}

export function toggleJournalFavorite(entryId: string, userId?: string | null) {
  const entries = getStoredEntries(userId).map((entry) =>
    entry.id === entryId ? { ...entry, favorite: !entry.favorite } : entry,
  );
  saveStoredEntries(entries, userId);
  return readJournalEntries(userId);
}
