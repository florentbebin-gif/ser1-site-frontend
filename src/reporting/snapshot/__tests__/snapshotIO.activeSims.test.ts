// @vitest-environment jsdom

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { ACTIVE_SIM_ROUTE_CONTRACTS, type ActiveSimRouteId } from '@/routes/simRouteContracts';
import { loadGlobalState, saveGlobalState } from '../snapshotIO';
import { SIM_SNAPSHOT_CONTRACTS, type SimSnapshotContract } from '../snapshotSimRegistry';
import { CURRENT_SNAPSHOT_VERSION, SNAPSHOT_APP, SNAPSHOT_KIND } from '../snapshotSchema';

const ACTIVE_SIM_STORAGE_KEYS: Record<ActiveSimRouteId, string> = {
  placement: 'ser1:sim:placement',
  credit: 'ser1:sim:credit',
  succession: 'ser1:sim:succession',
  'per-potentiel': 'ser1:sim:per:potentiel:v4',
  'per-transfert': 'ser1:sim:per-transfert',
  'tresorerie-societe': 'ser1:sim:tresorerie-societe',
  prevoyance: 'ser1:sim:prevoyance',
  ir: 'ser1:sim:ir',
};

type JsonRecord = Record<string, unknown>;

function parseJsonRecord(raw: string | null): JsonRecord | null {
  if (!raw) return null;
  return JSON.parse(raw) as JsonRecord;
}

function getSnapshotSimsFromJson(json: string): Record<string, unknown> {
  const snapshot = JSON.parse(json) as {
    payload?: {
      sims?: Record<string, unknown>;
    };
  };
  return snapshot.payload?.sims ?? {};
}

function installFileSystemSaveMock() {
  let savedText = '';
  const writable = {
    write: vi.fn(async (chunk: unknown) => {
      savedText = chunk instanceof Blob ? await chunk.text() : String(chunk);
    }),
    close: vi.fn(async () => {}),
  };
  const handle = {
    name: 'snapshot-actifs.ser1',
    createWritable: vi.fn(async () => writable),
  } as unknown as FileSystemFileHandle;
  const fsWindow = window as typeof window & {
    showSaveFilePicker?: () => Promise<FileSystemFileHandle>;
    showOpenFilePicker?: () => Promise<FileSystemFileHandle[]>;
  };
  fsWindow.showSaveFilePicker = vi.fn(async () => handle);
  fsWindow.showOpenFilePicker = vi.fn(async () => []);
  return { getSavedText: () => savedText };
}

function buildSnapshotFile(sims: Record<string, unknown>, name = 'snapshot.ser1'): File {
  return new File(
    [
      JSON.stringify({
        app: SNAPSHOT_APP,
        kind: SNAPSHOT_KIND,
        version: CURRENT_SNAPSHOT_VERSION,
        meta: {
          savedAt: '2026-06-20T10:00:00.000Z',
          appVersion: String(CURRENT_SNAPSHOT_VERSION),
          fiscal: null,
        },
        payload: { sims },
      }),
    ],
    name,
    { type: 'application/json' },
  );
}

describe('snapshotIO — simulateurs actifs', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('déclare un contrat snapshot explicite pour chaque route simulateur active', () => {
    const contractsById = new Map<string, SimSnapshotContract>(
      SIM_SNAPSHOT_CONTRACTS.map((contract) => [contract.simId, contract]),
    );

    for (const route of ACTIVE_SIM_ROUTE_CONTRACTS) {
      const contract = contractsById.get(route.id);
      expect(contract, `Contrat snapshot manquant pour ${route.id}`).toBeDefined();
      if (contract?.mode === 'storage') {
        expect(contract.storageKey).toBe(ACTIVE_SIM_STORAGE_KEYS[route.id]);
      } else {
        expect(contract?.reason.trim()).not.toBe('');
      }
    }
  });

  it('sauvegarde toutes les routes simulateur actives dans le .ser1', async () => {
    const saveMock = installFileSystemSaveMock();

    for (const route of ACTIVE_SIM_ROUTE_CONTRACTS) {
      sessionStorage.setItem(
        ACTIVE_SIM_STORAGE_KEYS[route.id],
        JSON.stringify({ source: route.id, persisted: true }),
      );
    }

    const result = await saveGlobalState();

    expect(result.success).toBe(true);
    const sims = getSnapshotSimsFromJson(saveMock.getSavedText());

    for (const route of ACTIVE_SIM_ROUTE_CONTRACTS) {
      expect(sims[route.id]).toEqual({ source: route.id, persisted: true });
    }
  });

  it('restaure toutes les routes simulateur actives depuis un .ser1 courant', async () => {
    const sims = Object.fromEntries(
      ACTIVE_SIM_ROUTE_CONTRACTS.map((route) => [route.id, { source: route.id, restored: true }]),
    );

    const result = await loadGlobalState(buildSnapshotFile(sims));

    expect(result.success).toBe(true);
    for (const route of ACTIVE_SIM_ROUTE_CONTRACTS) {
      expect(parseJsonRecord(sessionStorage.getItem(ACTIVE_SIM_STORAGE_KEYS[route.id]))).toEqual({
        source: route.id,
        restored: true,
      });
    }
  });

  it('charge toujours un snapshot courant existant sans les nouvelles clés actives', async () => {
    const result = await loadGlobalState(
      buildSnapshotFile({ placement: { source: 'placement-compatible' } }, 'snapshot-legacy.ser1'),
    );

    expect(result.success).toBe(true);
    expect(parseJsonRecord(sessionStorage.getItem(ACTIVE_SIM_STORAGE_KEYS.placement))).toEqual({
      source: 'placement-compatible',
    });
    expect(sessionStorage.getItem(ACTIVE_SIM_STORAGE_KEYS.succession)).toBeNull();
    expect(sessionStorage.getItem(ACTIVE_SIM_STORAGE_KEYS['per-potentiel'])).toBeNull();
  });
});
