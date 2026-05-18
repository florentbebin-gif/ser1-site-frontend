import { BASECG_CATALOG, BASECG_VERSION } from '@/data/base-cg-retraite';
import type { BaseCgRetraiteContract } from '@/data/base-cg-retraite';
import { STORAGE_KEY } from './baseCgRetraiteRepository.constants';

export interface BaseCgRetraiteOverlay {
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

export function readBaseCgRetraiteOverlay(): BaseCgRetraiteOverlay {
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

export function writeBaseCgRetraiteOverlay(overlay: BaseCgRetraiteOverlay): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...overlay,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function mergeBaseCgRetraiteOverlay(
  overlay: BaseCgRetraiteOverlay,
): BaseCgRetraiteContract[] {
  const deletedIds = new Set(overlay.deletedIds);
  const base = BASECG_CATALOG.filter((contract) => !deletedIds.has(contract.id)).map(
    (contract) => overlay.upserts[contract.id] ?? contract,
  );
  const baseIds = new Set(BASECG_CATALOG.map((contract) => contract.id));
  const created = Object.values(overlay.upserts).filter(
    (contract) => !baseIds.has(contract.id) && !deletedIds.has(contract.id),
  );

  return [...base, ...created].sort((left, right) =>
    `${left.compagnie} ${left.nomContrat}`.localeCompare(
      `${right.compagnie} ${right.nomContrat}`,
      'fr-FR',
    ),
  );
}
