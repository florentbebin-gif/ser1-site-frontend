import { BASECG_CATALOG, BASECG_VERSION } from '@/data/basecg';
import type { BaseCgRetraiteContract } from '@/data/basecg';

const STORAGE_KEY = 'ser1:basecg-retraite:v1';

interface BaseCgRetraiteOverlay {
  version: string;
  updatedAt: string;
  upserts: Record<string, BaseCgRetraiteContract>;
  deletedIds: string[];
}

function emptyOverlay(): BaseCgRetraiteOverlay {
  return {
    version: BASECG_VERSION,
    updatedAt: new Date(0).toISOString(),
    upserts: {},
    deletedIds: [],
  };
}

function readOverlay(): BaseCgRetraiteOverlay {
  if (typeof localStorage === 'undefined') return emptyOverlay();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyOverlay();
    const parsed = JSON.parse(raw) as Partial<BaseCgRetraiteOverlay>;
    return {
      version: parsed.version ?? BASECG_VERSION,
      updatedAt: parsed.updatedAt ?? new Date(0).toISOString(),
      upserts: parsed.upserts ?? {},
      deletedIds: parsed.deletedIds ?? [],
    };
  } catch {
    return emptyOverlay();
  }
}

function writeOverlay(overlay: BaseCgRetraiteOverlay): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...overlay,
    updatedAt: new Date().toISOString(),
  }));
}

function mergeOverlay(overlay: BaseCgRetraiteOverlay): BaseCgRetraiteContract[] {
  const deletedIds = new Set(overlay.deletedIds);
  const base = BASECG_CATALOG
    .filter((contract) => !deletedIds.has(contract.id))
    .map((contract) => overlay.upserts[contract.id] ?? contract);
  const baseIds = new Set(BASECG_CATALOG.map((contract) => contract.id));
  const created = Object.values(overlay.upserts)
    .filter((contract) => !baseIds.has(contract.id) && !deletedIds.has(contract.id));

  return [...base, ...created].sort((left, right) => (
    `${left.compagnie} ${left.nomContrat}`.localeCompare(`${right.compagnie} ${right.nomContrat}`, 'fr-FR')
  ));
}

export async function getBaseCgRetraiteCatalog(): Promise<BaseCgRetraiteContract[]> {
  return mergeOverlay(readOverlay());
}

export async function getBaseCgRetraiteOverlay(): Promise<BaseCgRetraiteOverlay> {
  return readOverlay();
}

export async function upsertBaseCgRetraiteContract(contract: BaseCgRetraiteContract): Promise<void> {
  const overlay = readOverlay();
  const deletedIds = overlay.deletedIds.filter((id) => id !== contract.id);
  writeOverlay({
    ...overlay,
    deletedIds,
    upserts: {
      ...overlay.upserts,
      [contract.id]: contract,
    },
  });
}

export async function deleteBaseCgRetraiteContract(id: string): Promise<void> {
  const overlay = readOverlay();
  const upserts = { ...overlay.upserts };
  delete upserts[id];
  writeOverlay({
    ...overlay,
    upserts,
    deletedIds: Array.from(new Set([...overlay.deletedIds, id])),
  });
}

export async function resetBaseCgRetraiteOverlay(): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
