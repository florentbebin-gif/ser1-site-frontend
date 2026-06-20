// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  SNAPSHOT_LAST_SAVED_FILENAME_KEY,
  SNAPSHOT_LOADED_EVENT,
  SNAPSHOT_LOADED_FILENAME_KEY,
  SNAPSHOT_SAVED_EVENT,
} from '@/reporting/snapshot';
import { recordSnapshotHistory } from '@/reporting/snapshot/saveHistory';

import { useLocalSaveHistory } from './useLocalSaveHistory';

describe('useLocalSaveHistory', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it('lit le fichier courant et réagit aux chargements puis sauvegardes locales', async () => {
    window.sessionStorage.setItem(SNAPSHOT_LOADED_FILENAME_KEY, 'famille-martin.ser1');

    const { result } = renderHook(() => useLocalSaveHistory());

    expect(result.current.currentFilename).toBe('famille-martin');
    expect(result.current.lastSavedFilename).toBeNull();
    expect(result.current.history).toEqual([]);

    act(() => {
      recordSnapshotHistory('load', new Date('2026-06-09T10:00:00.000Z'));
      window.dispatchEvent(new CustomEvent(SNAPSHOT_LOADED_EVENT));
    });

    await waitFor(() => {
      expect(result.current.history[0]).toEqual({
        action: 'load',
        savedAt: '2026-06-09T10:00:00.000Z',
      });
    });

    act(() => {
      window.sessionStorage.setItem(SNAPSHOT_LAST_SAVED_FILENAME_KEY, 'audit-local.ser1');
      recordSnapshotHistory('save', new Date('2026-06-09T10:05:00.000Z'));
      window.dispatchEvent(new CustomEvent(SNAPSHOT_SAVED_EVENT));
    });

    await waitFor(() => {
      expect(result.current.lastSavedFilename).toBe('audit-local');
      expect(result.current.history[0]).toEqual({
        action: 'save',
        savedAt: '2026-06-09T10:05:00.000Z',
      });
    });
  });
});
