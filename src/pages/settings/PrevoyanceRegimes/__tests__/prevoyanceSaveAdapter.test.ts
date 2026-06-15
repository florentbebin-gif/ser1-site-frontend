import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
} from '@/domain/prevoyance/types';
import {
  createPrevoyanceDraft,
  loadPrevoyanceDraft,
  savePrevoyanceDraft,
} from '../prevoyanceSaveAdapter';
import {
  getPrevoyanceMaintienEmployeurSettings,
  getPrevoyanceRegimeSettings,
  upsertPrevoyanceMaintienEmployeurSettings,
  upsertPrevoyanceRegimeSettings,
} from '@/utils/cache/prevoyanceSettingsCache';

vi.mock('@/utils/cache/prevoyanceSettingsCache', () => ({
  getPrevoyanceRegimeSettings: vi.fn(),
  getPrevoyanceMaintienEmployeurSettings: vi.fn(),
  upsertPrevoyanceRegimeSettings: vi.fn(),
  upsertPrevoyanceMaintienEmployeurSettings: vi.fn(),
}));

const regimeBase: PrevoyanceRegimeSettings = {
  code: 'salarie-cpam',
  label: 'Salarié secteur privé — CPAM',
  caisse: 'CPAM',
  population: 'salarie',
  defaultContractKind: 'collectif',
  year: 2026,
  data: {
    arret: {
      carences: { maladie: 3, accident: 0, hospitalisation: 0 },
      maxDurationDays: 1095,
      paliers: [
        {
          fromDay: 4,
          toDay: 1095,
          label: 'IJSS',
          amount: { mode: 'formula', value: null, label: 'Formule régime' },
        },
      ],
    },
    invalidite: { paliers: [] },
    deces: {
      capital: { mode: 'formula', value: null, label: 'Capital décès' },
      doublementAccident: false,
      doubleEffet: false,
      renteConjoint: null,
      renteEducation: null,
    },
    cotisations: { mode: 'none', value: null },
  },
  sources: {
    references: [],
    noRefReason:
      'Sources absentes dans cette fixture unitaire ; les références réelles sont portées par les seeds.',
  },
};

const maintienBase: PrevoyanceMaintienEmployeurSettings = {
  code: 'code-travail-minimum-legal',
  label: 'Code du travail',
  year: 2026,
  data: {
    maintienEmployeur: {
      carenceDays: 7,
      minAncienneteYears: 1,
      paliers: [],
    },
  },
  sources: {
    references: [],
    noRefReason:
      'Sources absentes dans cette fixture unitaire ; les références réelles sont portées par les seeds.',
  },
};

describe('prevoyanceSaveAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPrevoyanceRegimeSettings).mockResolvedValue([regimeBase]);
    vi.mocked(getPrevoyanceMaintienEmployeurSettings).mockResolvedValue([maintienBase]);
    vi.mocked(upsertPrevoyanceRegimeSettings).mockResolvedValue(undefined);
    vi.mocked(upsertPrevoyanceMaintienEmployeurSettings).mockResolvedValue(undefined);
  });

  it('charge les régimes et le maintien depuis le cache existant', async () => {
    const draft = await loadPrevoyanceDraft();

    expect(draft.regimes).toEqual([regimeBase]);
    expect(draft.maintien).toEqual([maintienBase]);
    expect(draft.dirtyRegimeCodes).toEqual([]);
    expect(draft.dirtyMaintienCodes).toEqual([]);
  });

  it('sauvegarde uniquement les lignes marquées comme modifiées', async () => {
    const untouchedRegime = { ...regimeBase, code: 'cnavpl', label: 'CNAVPL' };
    const dirtyMaintien = { ...maintienBase, label: 'Maintien modifié' };
    const draft = createPrevoyanceDraft(
      [regimeBase, untouchedRegime],
      [dirtyMaintien],
      ['salarie-cpam'],
      ['code-travail-minimum-legal'],
    );

    const result = await savePrevoyanceDraft(draft, true);

    expect(result).toEqual({ ok: true, message: 'Paramètres prévoyance enregistrés.' });
    expect(upsertPrevoyanceRegimeSettings).toHaveBeenCalledTimes(1);
    expect(upsertPrevoyanceRegimeSettings).toHaveBeenCalledWith(regimeBase);
    expect(upsertPrevoyanceMaintienEmployeurSettings).toHaveBeenCalledTimes(1);
    expect(upsertPrevoyanceMaintienEmployeurSettings).toHaveBeenCalledWith(dirtyMaintien);
  });

  it("ignore les sauvegardes lorsqu'il ne s'agit pas d'un admin", async () => {
    const draft = createPrevoyanceDraft([regimeBase], [maintienBase], ['salarie-cpam'], []);

    await expect(savePrevoyanceDraft(draft, false)).resolves.toEqual({ ok: true });
    expect(upsertPrevoyanceRegimeSettings).not.toHaveBeenCalled();
    expect(upsertPrevoyanceMaintienEmployeurSettings).not.toHaveBeenCalled();
  });
});
