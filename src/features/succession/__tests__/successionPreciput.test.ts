import { describe, expect, it } from 'vitest';
import {
  buildSuccessionPreciputCandidates,
  resolveSuccessionPreciputApplication,
  syncSuccessionPreciputSelections,
} from '../successionPreciput';

describe('successionPreciput helpers', () => {
  it('keeps only compatible community assets and groupements for targeted preciput', () => {
    const candidates = buildSuccessionPreciputCandidates({
      allowedPocket: 'communaute',
      assetEntries: [
        {
          id: 'asset-1',
          pocket: 'communaute',
          category: 'immobilier',
          subCategory: 'Residence principale',
          amount: 300000,
          label: 'Maison familiale',
        },
        {
          id: 'asset-2',
          pocket: 'communaute',
          category: 'passif',
          subCategory: 'Emprunt',
          amount: 90000,
        },
        {
          id: 'asset-3',
          pocket: 'epoux1',
          category: 'financier',
          subCategory: 'Titres',
          amount: 120000,
        },
      ],
      groupementFoncierEntries: [
        {
          id: 'gf-1',
          pocket: 'communaute',
          type: 'GFA',
          valeurTotale: 180000,
          label: 'Domaine',
        },
        {
          id: 'gf-2',
          pocket: 'epoux2',
          type: 'GFF',
          valeurTotale: 90000,
        },
      ],
    });

    expect(candidates).toEqual([
      expect.objectContaining({
        key: 'asset:asset-1',
        label: 'Maison familiale (Residence principale)',
        maxAmount: 300000,
      }),
      expect.objectContaining({
        key: 'groupement_foncier:gf-1',
        label: 'GFA - Domaine',
        maxAmount: 180000,
      }),
    ]);
  });

  it('syncs, clamps, and deduplicates targeted preciput selections', () => {
    const synced = syncSuccessionPreciputSelections([{
      id: 'prec-1',
      sourceType: 'asset',
      sourceId: 'asset-1',
      labelSnapshot: 'Ancien libelle',
      pocket: 'communaute',
      amount: 500000,
      enabled: true,
    }, {
      id: 'prec-2',
      sourceType: 'asset',
      sourceId: 'asset-1',
      labelSnapshot: 'Doublon',
      pocket: 'communaute',
      amount: 1000,
      enabled: true,
    }, {
      id: 'prec-3',
      sourceType: 'groupement_foncier',
      sourceId: 'gf-inexistant',
      labelSnapshot: 'Stale',
      pocket: 'communaute',
      amount: 1000,
      enabled: true,
    }], [{
      key: 'asset:asset-1',
      sourceType: 'asset',
      sourceId: 'asset-1',
      label: 'Maison familiale',
      pocket: 'communaute',
      maxAmount: 300000,
      isResidencePrincipale: false,
    }]);

    expect(synced).toEqual([{
      id: 'prec-1',
      sourceType: 'asset',
      sourceId: 'asset-1',
      labelSnapshot: 'Maison familiale',
      pocket: 'communaute',
      amount: 300000,
      enabled: true,
    }]);
  });

  it('falls back to the global preciput when no valid targeted selection remains', () => {
    const resolved = resolveSuccessionPreciputApplication({
      patrimonial: {
        preciputMode: 'cible',
        preciputSelections: [{
          id: 'prec-1',
          sourceType: 'asset',
          sourceId: 'asset-inexistant',
          labelSnapshot: 'Stale',
          pocket: 'communaute',
          amount: 50000,
          enabled: true,
        }],
        preciputMontant: 12000,
      },
      candidates: [],
    });

    expect(resolved).toEqual({
      mode: 'global',
      requestedAmount: 12000,
      targetedSelections: [],
      usesGlobalFallback: true,
    });
  });
});
