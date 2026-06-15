import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_MEMENTO_REFERENCE_VALUES,
  type MementoReferenceValue,
} from '@/domain/settings-memento/referenceValues';

import {
  isMementoReferenceValuesDraft,
  loadMementoReferenceValuesDraft,
  normalizeMementoReferenceValuesDraft,
  saveMementoReferenceValuesDraft,
} from './mementoReferenceValuesSaveAdapter';

const getMementoReferenceValuesMock = vi.hoisted(() => vi.fn());
const upsertMementoReferenceValuesMock = vi.hoisted(() => vi.fn());
const broadcastMementoReferenceValuesInvalidationMock = vi.hoisted(() => vi.fn());

vi.mock('@/utils/cache/mementoReferenceValuesCache', () => ({
  getMementoReferenceValues: getMementoReferenceValuesMock,
  upsertMementoReferenceValues: upsertMementoReferenceValuesMock,
  broadcastMementoReferenceValuesInvalidation: broadcastMementoReferenceValuesInvalidationMock,
}));

function cloneReferenceValue(value: MementoReferenceValue): MementoReferenceValue {
  return {
    ...value,
    data: { ...value.data },
    ref_ids: [...value.ref_ids],
  };
}

describe('mementoReferenceValuesSaveAdapter', () => {
  const livretAPlafond = cloneReferenceValue(
    DEFAULT_MEMENTO_REFERENCE_VALUES.find((row) => row.key === 'livret-a-plafond')!,
  );
  const agircArrco = cloneReferenceValue(
    DEFAULT_MEMENTO_REFERENCE_VALUES.find((row) => row.key === 'agirc-arrco-t1')!,
  );

  beforeEach(() => {
    getMementoReferenceValuesMock.mockReset();
    upsertMementoReferenceValuesMock.mockReset();
    broadcastMementoReferenceValuesInvalidationMock.mockReset();
  });

  it('charge uniquement le domaine demandé', async () => {
    getMementoReferenceValuesMock.mockResolvedValue([livretAPlafond, agircArrco]);

    const rows = await loadMementoReferenceValuesDraft({ domain: 'chiffres-cles' });

    expect(rows).toEqual([livretAPlafond]);
    expect(getMementoReferenceValuesMock).toHaveBeenCalledWith({ force: undefined });
  });

  it('normalise les drafts persistés sans accepter une forme invalide', () => {
    expect(isMementoReferenceValuesDraft([livretAPlafond])).toBe(true);
    expect(normalizeMementoReferenceValuesDraft({ key: 'livret-a-plafond' }, [agircArrco])).toEqual(
      [agircArrco],
    );
  });

  it('enregistre un draft admin puis diffuse l’invalidation', async () => {
    upsertMementoReferenceValuesMock.mockResolvedValue(undefined);

    const result = await saveMementoReferenceValuesDraft([livretAPlafond], {
      isAdmin: true,
      domain: 'chiffres-cles',
    });

    expect(result).toEqual({ ok: true, message: 'Valeurs de référence enregistrées.' });
    expect(upsertMementoReferenceValuesMock).toHaveBeenCalledWith([livretAPlafond], {
      domain: 'chiffres-cles',
    });
    expect(broadcastMementoReferenceValuesInvalidationMock).toHaveBeenCalledTimes(1);
  });

  it('bloque une valeur vide avant tout upsert', async () => {
    const rowWithoutValue: MementoReferenceValue = {
      ...livretAPlafond,
      value_numeric: null,
      value_text: null,
    };

    const result = await saveMementoReferenceValuesDraft([rowWithoutValue], {
      isAdmin: true,
      domain: 'chiffres-cles',
    });

    expect(result).toEqual({
      ok: false,
      message: 'La valeur "Livret A — plafond" est obligatoire.',
    });
    expect(upsertMementoReferenceValuesMock).not.toHaveBeenCalled();
  });

  it('ne sauvegarde rien pour un non-admin', async () => {
    const result = await saveMementoReferenceValuesDraft([livretAPlafond], {
      isAdmin: false,
      domain: 'chiffres-cles',
    });

    expect(result).toEqual({ ok: true });
    expect(upsertMementoReferenceValuesMock).not.toHaveBeenCalled();
  });
});
