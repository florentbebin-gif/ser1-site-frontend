import { describe, expect, it } from 'vitest';

import { SIMULATOR_DEFINITIONS } from '@/domain/simulators/registry';
import {
  LEGAL_REFERENCE_BY_ID,
  LEGAL_REFERENCES,
  getLegalReference,
  getOptionalLegalReference,
  listLegalReferencesForProduct,
  listLegalReferencesForSetting,
  listLegalReferencesForSimulator,
} from '../index';

describe('références juridiques', () => {
  it('déclare des ids uniques', () => {
    const ids = LEGAL_REFERENCES.map((reference) => reference.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

    expect(duplicates, `Références juridiques dupliquées : ${duplicates.join(', ')}`).toEqual([]);
    expect(LEGAL_REFERENCE_BY_ID.size).toBe(LEGAL_REFERENCES.length);
  });

  it('expose un lookup par id', () => {
    expect(getLegalReference('cgi-200-a').label).toContain('200 A');
    expect(() => getLegalReference('reference-inconnue')).toThrow(
      'Référence juridique introuvable',
    );
    expect(getOptionalLegalReference('cgi-200-a')?.label).toContain('200 A');
    expect(getOptionalLegalReference('reference-inconnue')).toBeNull();
  });

  it('liste les références par simulateur', () => {
    const successionRefs = listLegalReferencesForSimulator('succession').map(
      (reference) => reference.id,
    );

    expect(successionRefs).toEqual(
      expect.arrayContaining(['code-civil-720', 'cgi-669', 'cgi-777', 'cgi-779', 'cgi-990-i']),
    );
  });

  it('liste les références par setting', () => {
    const references = listLegalReferencesForSetting('dmtg', [
      {
        id: 'ref-dmtg-demo',
        label: 'Référence DMTG de test',
        sourceType: 'Code civil',
        officialUrl: 'https://www.legifrance.gouv.fr/codes/article_lc/DEMO',
        scope: 'DMTG',
        volatility: 'stable',
        relatedSettings: ['dmtg'],
      },
    ]);

    expect(references.map((reference) => reference.id)).toEqual(['ref-dmtg-demo']);
  });

  it('couvre les articles DMTG affichés dans les settings', () => {
    const expectedReferenceIds = [
      'code-civil-578',
      'code-civil-757',
      'code-civil-843',
      'code-civil-894',
      'code-civil-912',
      'code-civil-913',
      'code-civil-920',
      'code-civil-922',
      'code-civil-1002',
      'code-civil-1003',
      'code-civil-1010',
      'code-civil-1048',
      'code-civil-1057',
      'code-civil-1075',
      'code-civil-1078',
      'code-civil-1094-1',
      'code-civil-1515',
      'code-civil-1516',
      'code-civil-1518',
      'code-civil-1519',
      'code-civil-1520',
      'code-civil-1521',
      'code-civil-1524',
      'code-civil-1525',
      'code-civil-1527',
      'code-civil-265',
      'cgi-784',
    ];
    const dmtgReferenceIds = listLegalReferencesForSetting('dmtg').map((reference) => reference.id);

    expect(dmtgReferenceIds).toEqual(expect.arrayContaining(expectedReferenceIds));

    for (const referenceId of expectedReferenceIds) {
      expect(getLegalReference(referenceId).relatedSettings).toEqual(['dmtg']);
    }
  });

  it('liste les références par produit catalogue', () => {
    const references = listLegalReferencesForProduct('assurance_vie', [
      {
        id: 'ref-catalogue-demo',
        label: 'Référence catalogue de test',
        sourceType: 'CGI',
        officialUrl: 'https://www.legifrance.gouv.fr/codes/article_lc/DEMO',
        scope: 'Assurance-vie',
        volatility: 'lawChange',
        relatedCatalogProducts: ['assurance_vie'],
      },
    ]);

    expect(references.map((reference) => reference.id)).toEqual(['ref-catalogue-demo']);
  });

  it('référence uniquement des SimulatorDefinition.id connus', () => {
    const simulatorIds = new Set(SIMULATOR_DEFINITIONS.map((definition) => definition.id));
    const invalidSimulatorLinks = LEGAL_REFERENCES.flatMap((reference) =>
      (reference.relatedSimulatorIds ?? [])
        .filter((simulatorId) => !simulatorIds.has(simulatorId))
        .map((simulatorId) => `${reference.id}:${simulatorId}`),
    );

    expect(
      invalidSimulatorLinks,
      `Liens simulateurs inconnus : ${invalidSimulatorLinks.join(', ')}`,
    ).toEqual([]);
  });
});
