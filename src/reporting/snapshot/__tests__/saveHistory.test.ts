// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearSnapshotHistory,
  readSnapshotHistory,
  recordSnapshotHistory,
  SNAPSHOT_SAVE_HISTORY_KEY,
} from '../saveHistory';

describe('saveHistory', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('conserve seulement les 5 dernières actions sans filename ni contenu dossier', () => {
    for (let index = 0; index < 6; index += 1) {
      recordSnapshotHistory(index % 2 === 0 ? 'save' : 'load', new Date(`2026-06-0${index + 1}`));
    }

    const entries = readSnapshotHistory();
    expect(entries).toHaveLength(5);
    expect(entries[0]).toEqual({ action: 'load', savedAt: '2026-06-06T00:00:00.000Z' });
    expect(entries[entries.length - 1]).toEqual({
      action: 'load',
      savedAt: '2026-06-02T00:00:00.000Z',
    });
    expect(Object.keys(entries[0] ?? {}).sort()).toEqual(['action', 'savedAt']);

    const raw = window.localStorage.getItem(SNAPSHOT_SAVE_HISTORY_KEY) ?? '';
    expect(raw).not.toMatch(/filename|famille|Martin|payload|sims/i);
  });

  it('reste silencieux quand window ou localStorage sont indisponibles', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage indisponible');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage indisponible');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Storage indisponible');
    });

    expect(() => recordSnapshotHistory('save', new Date('2026-06-09T10:00:00.000Z'))).not.toThrow();
    expect(readSnapshotHistory()).toEqual([]);
    expect(() => clearSnapshotHistory()).not.toThrow();
  });
});
