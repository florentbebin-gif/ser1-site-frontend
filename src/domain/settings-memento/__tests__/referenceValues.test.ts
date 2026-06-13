import { describe, expect, it } from 'vitest';

import { getOptionalLegalReference } from '@/domain/legal-references';

import {
  DEFAULT_MEMENTO_REFERENCE_VALUES,
  groupMementoReferenceValuesBySubdomain,
  sortMementoReferenceValues,
} from '../referenceValues';

describe('memento reference values', () => {
  it('déclare des valeurs uniques, sourcées et rattachées aux chiffres clés', () => {
    const keys = DEFAULT_MEMENTO_REFERENCE_VALUES.map((value) => value.key);

    expect(new Set(keys).size).toBe(keys.length);
    expect(
      DEFAULT_MEMENTO_REFERENCE_VALUES.every((value) => value.domain === 'chiffres-cles'),
    ).toBe(true);
    expect(
      DEFAULT_MEMENTO_REFERENCE_VALUES.every(
        (value) => value.value_numeric !== null || value.value_text !== null,
      ),
    ).toBe(true);
    expect(DEFAULT_MEMENTO_REFERENCE_VALUES.every((value) => value.ref_ids.length > 0)).toBe(true);
  });

  it('ne référence que des sources juridiques canoniques', () => {
    const missingRefs = DEFAULT_MEMENTO_REFERENCE_VALUES.flatMap((value) =>
      value.ref_ids.filter((refId) => !getOptionalLegalReference(refId)),
    );

    expect(missingRefs).toEqual([]);
  });

  it('présente les produits réglementés dans les familles attendues', () => {
    const groups = groupMementoReferenceValuesBySubdomain(DEFAULT_MEMENTO_REFERENCE_VALUES);

    expect(groups.map((group) => group.label)).toEqual([
      'Livrets réglementés',
      'Épargne logement',
      'PEA et PEA-PME',
    ]);
    expect(groups.flatMap((group) => group.rows.map((row) => row.label))).toEqual([
      'Livret A — plafond',
      'Livret A — taux annuel',
      'LDDS — plafond',
      'LDDS — taux annuel',
      'LEP — plafond',
      'LEP — taux annuel',
      'CEL — plafond',
      'CEL — taux annuel',
      'PEL — plafond',
      'PEL — taux annuel',
      'PEA — plafond de versement',
      'PEA-PME — plafond de versement',
    ]);
  });

  it('conserve un tri stable par ordre de lecture', () => {
    expect(
      sortMementoReferenceValues(DEFAULT_MEMENTO_REFERENCE_VALUES).map((value) => value.key),
    ).toEqual([
      'livret-a-plafond',
      'livret-a-taux',
      'ldds-plafond',
      'ldds-taux',
      'lep-plafond',
      'lep-taux',
      'cel-plafond',
      'cel-taux',
      'pel-plafond',
      'pel-taux',
      'pea-plafond',
      'pea-pme-plafond',
    ]);
  });
});
