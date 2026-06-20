import { storageKeyFor } from '../../utils/reset';
import type { SnapshotSims } from './snapshotSchema';

type SnapshotContractScope = 'active-simulator' | 'workflow' | 'compat';

type SnapshotStorageContract = {
  simId: string;
  label: string;
  scope: SnapshotContractScope;
  mode: 'storage';
  storageKey: string;
};

type SnapshotNoSnapshotContract = {
  simId: string;
  label: string;
  scope: SnapshotContractScope;
  mode: 'noSnapshot';
  reason: string;
};

export type SimSnapshotContract = SnapshotStorageContract | SnapshotNoSnapshotContract;

const PER_POTENTIEL_SESSION_KEY = 'ser1:sim:per:potentiel:v4';

export const SIM_SNAPSHOT_CONTRACTS: readonly SimSnapshotContract[] = [
  {
    simId: 'placement',
    label: 'Placement',
    scope: 'active-simulator',
    mode: 'storage',
    storageKey: storageKeyFor('placement'),
  },
  {
    simId: 'credit',
    label: 'Crédit',
    scope: 'active-simulator',
    mode: 'storage',
    storageKey: storageKeyFor('credit'),
  },
  {
    simId: 'succession',
    label: 'Succession',
    scope: 'active-simulator',
    mode: 'storage',
    storageKey: storageKeyFor('succession'),
  },
  {
    simId: 'per-potentiel',
    label: 'PER — Potentiel',
    scope: 'active-simulator',
    mode: 'storage',
    storageKey: PER_POTENTIEL_SESSION_KEY,
  },
  {
    simId: 'per-transfert',
    label: 'PER — Transfert',
    scope: 'active-simulator',
    mode: 'storage',
    storageKey: storageKeyFor('per-transfert'),
  },
  {
    simId: 'tresorerie-societe',
    label: 'Trésorerie société',
    scope: 'active-simulator',
    mode: 'storage',
    storageKey: storageKeyFor('tresorerie-societe'),
  },
  {
    simId: 'prevoyance',
    label: 'Prévoyance',
    scope: 'active-simulator',
    mode: 'storage',
    storageKey: storageKeyFor('prevoyance'),
  },
  {
    simId: 'ir',
    label: 'Impôt sur le revenu',
    scope: 'active-simulator',
    mode: 'storage',
    storageKey: storageKeyFor('ir'),
  },
  {
    simId: 'audit',
    label: 'Audit patrimonial',
    scope: 'workflow',
    mode: 'storage',
    storageKey: 'ser1_audit_draft',
  },
  {
    simId: 'strategy',
    label: 'Stratégie',
    scope: 'workflow',
    mode: 'storage',
    storageKey: storageKeyFor('strategy'),
  },
  {
    simId: 'per',
    label: 'Hub PER',
    scope: 'compat',
    mode: 'storage',
    storageKey: storageKeyFor('per'),
  },
];

export const ACTIVE_SIM_SNAPSHOT_CONTRACTS = SIM_SNAPSHOT_CONTRACTS.filter(
  (contract) => contract.scope === 'active-simulator',
);

function isStorageContract(contract: SimSnapshotContract): contract is SnapshotStorageContract {
  return contract.mode === 'storage';
}

function parseStoredState(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }
  return parsed as Record<string, unknown>;
}

export function collectSnapshotSimsFromSession(): SnapshotSims {
  const sims: Record<string, Record<string, unknown> | null> = {};
  for (const contract of SIM_SNAPSHOT_CONTRACTS) {
    if (!isStorageContract(contract)) {
      sims[contract.simId] = null;
      continue;
    }
    try {
      sims[contract.simId] = parseStoredState(sessionStorage.getItem(contract.storageKey));
    } catch {
      sims[contract.simId] = null;
    }
  }
  return sims as SnapshotSims;
}

export function restoreSnapshotSimsToSession(sims: SnapshotSims): number {
  const storedSims = sims as Record<string, unknown>;
  let restoredCount = 0;

  for (const contract of SIM_SNAPSHOT_CONTRACTS) {
    if (!isStorageContract(contract)) continue;
    const value = storedSims[contract.simId] ?? null;
    try {
      if (value !== null && value !== undefined) {
        sessionStorage.setItem(contract.storageKey, JSON.stringify(value));
      } else {
        sessionStorage.removeItem(contract.storageKey);
      }
      restoredCount++;
    } catch {
      // sessionStorage plein ou indisponible : on ignore ce simulateur.
    }
  }

  return restoredCount;
}
