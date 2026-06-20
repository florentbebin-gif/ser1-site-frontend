import { useEffect, useState } from 'react';

import {
  readSnapshotHistory,
  SNAPSHOT_LAST_SAVED_FILENAME_KEY,
  SNAPSHOT_LOADED_EVENT,
  SNAPSHOT_LOADED_FILENAME_KEY,
  SNAPSHOT_SAVED_EVENT,
  type SnapshotHistoryEntry,
} from '@/reporting/snapshot';

export interface LocalSaveHistoryState {
  currentFilename: string | null;
  lastSavedFilename: string | null;
  history: SnapshotHistoryEntry[];
}

export function useLocalSaveHistory(): LocalSaveHistoryState {
  const [state, setState] = useState<LocalSaveHistoryState>(() => readLocalSaveHistoryState());

  useEffect(() => {
    const refresh = () => setState(readLocalSaveHistoryState());

    window.addEventListener(SNAPSHOT_LOADED_EVENT, refresh);
    window.addEventListener(SNAPSHOT_SAVED_EVENT, refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener(SNAPSHOT_LOADED_EVENT, refresh);
      window.removeEventListener(SNAPSHOT_SAVED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return state;
}

function readLocalSaveHistoryState(): LocalSaveHistoryState {
  const currentFilename = readSessionFilename(SNAPSHOT_LOADED_FILENAME_KEY);
  const lastSavedFilename = readSessionFilename(SNAPSHOT_LAST_SAVED_FILENAME_KEY);

  return {
    currentFilename,
    lastSavedFilename,
    history: readSnapshotHistory(),
  };
}

function readSessionFilename(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return formatFilename(window.sessionStorage.getItem(key));
  } catch {
    return null;
  }
}

function formatFilename(filename: string | null): string | null {
  const trimmed = filename?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\.(ser1|json)$/i, '');
}
