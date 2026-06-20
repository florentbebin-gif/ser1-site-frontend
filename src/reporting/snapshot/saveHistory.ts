export const SNAPSHOT_SAVE_HISTORY_KEY = 'ser1:snapshot:saveHistory';

export type SnapshotHistoryAction = 'save' | 'load';

export interface SnapshotHistoryEntry {
  action: SnapshotHistoryAction;
  savedAt: string;
}

const MAX_HISTORY_ENTRIES = 5;

export function readSnapshotHistory(): SnapshotHistoryEntry[] {
  const storage = getLocalStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(SNAPSHOT_SAVE_HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSnapshotHistoryEntry).slice(0, MAX_HISTORY_ENTRIES);
  } catch {
    return [];
  }
}

export function recordSnapshotHistory(action: SnapshotHistoryAction, now = new Date()): void {
  const storage = getLocalStorage();
  if (!storage) return;

  try {
    const entry: SnapshotHistoryEntry = {
      action,
      savedAt: now.toISOString(),
    };
    const entries = [entry, ...readSnapshotHistory()].slice(0, MAX_HISTORY_ENTRIES);
    storage.setItem(SNAPSHOT_SAVE_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // Historique indicatif : ne bloque jamais sauvegarde ou chargement.
  }
}

export function clearSnapshotHistory(): void {
  const storage = getLocalStorage();
  if (!storage) return;

  try {
    storage.removeItem(SNAPSHOT_SAVE_HISTORY_KEY);
  } catch {
    // ignore
  }
}

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function isSnapshotHistoryEntry(value: unknown): value is SnapshotHistoryEntry {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { action?: unknown; savedAt?: unknown };
  return (
    (candidate.action === 'save' || candidate.action === 'load') &&
    typeof candidate.savedAt === 'string'
  );
}
