import type { MementoSaveResult } from '@/hooks/settings/mementoSaveRegistry';
import {
  getPrevoyanceMaintienEmployeurSettings,
  getPrevoyanceRegimeSettings,
  upsertPrevoyanceMaintienEmployeurSettings,
  upsertPrevoyanceRegimeSettings,
} from '@/utils/cache/prevoyanceSettingsCache';
import type {
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
} from '@/domain/prevoyance/types';

export interface PrevoyanceDraft {
  regimes: PrevoyanceRegimeSettings[];
  maintien: PrevoyanceMaintienEmployeurSettings[];
  dirtyRegimeCodes: string[];
  dirtyMaintienCodes: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isPrevoyanceDraft(value: unknown): value is PrevoyanceDraft {
  return (
    isRecord(value) &&
    Array.isArray(value.regimes) &&
    Array.isArray(value.maintien) &&
    Array.isArray(value.dirtyRegimeCodes) &&
    Array.isArray(value.dirtyMaintienCodes)
  );
}

export function createPrevoyanceDraft(
  regimes: PrevoyanceRegimeSettings[],
  maintien: PrevoyanceMaintienEmployeurSettings[],
  dirtyRegimeCodes: readonly string[] = [],
  dirtyMaintienCodes: readonly string[] = [],
): PrevoyanceDraft {
  return {
    regimes,
    maintien,
    dirtyRegimeCodes: Array.from(new Set(dirtyRegimeCodes)),
    dirtyMaintienCodes: Array.from(new Set(dirtyMaintienCodes)),
  };
}

export async function loadPrevoyanceDraft(): Promise<PrevoyanceDraft> {
  const [regimes, maintien] = await Promise.all([
    getPrevoyanceRegimeSettings(),
    getPrevoyanceMaintienEmployeurSettings(),
  ]);

  return createPrevoyanceDraft(regimes, maintien);
}

export async function savePrevoyanceDraft(
  draft: PrevoyanceDraft,
  isAdmin: boolean,
): Promise<MementoSaveResult> {
  if (!isAdmin) return { ok: true };

  try {
    const dirtyRegimeCodes = new Set(draft.dirtyRegimeCodes);
    const dirtyMaintienCodes = new Set(draft.dirtyMaintienCodes);

    const regimesToSave = draft.regimes.filter((regime) => dirtyRegimeCodes.has(regime.code));
    const maintienToSave = draft.maintien.filter((item) => dirtyMaintienCodes.has(item.code));

    await Promise.all([
      ...regimesToSave.map((regime) => upsertPrevoyanceRegimeSettings(regime)),
      ...maintienToSave.map((maintien) => upsertPrevoyanceMaintienEmployeurSettings(maintien)),
    ]);

    return { ok: true, message: 'Paramètres prévoyance enregistrés.' };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Erreur lors de l'enregistrement de la prévoyance." };
  }
}
