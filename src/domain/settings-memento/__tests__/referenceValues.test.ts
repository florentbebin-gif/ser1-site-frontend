import { describe, expect, it } from 'vitest';

import { getOptionalLegalReference } from '@/domain/legal-references';

import {
  DEFAULT_MEMENTO_REFERENCE_VALUES,
  groupMementoReferenceValuesBySubdomain,
  sortMementoReferenceValues,
} from '../referenceValues';

describe('memento reference values', () => {
  it('déclare des valeurs uniques, sourcées et rattachées aux domaines mémento', () => {
    const keys = DEFAULT_MEMENTO_REFERENCE_VALUES.map((value) => value.key);
    const domains = new Set(DEFAULT_MEMENTO_REFERENCE_VALUES.map((value) => value.domain));

    expect(new Set(keys).size).toBe(keys.length);
    expect(domains).toEqual(
      new Set(['chiffres-cles', 'demembrement', 'fiscalite-internationale', 'social-protection']),
    );
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
    const groups = groupMementoReferenceValuesBySubdomain(
      DEFAULT_MEMENTO_REFERENCE_VALUES.filter((value) => value.domain === 'chiffres-cles'),
    );

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
      sortMementoReferenceValues(
        DEFAULT_MEMENTO_REFERENCE_VALUES.filter((value) => value.domain === 'chiffres-cles'),
      ).map((value) => value.key),
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

  it('présente le barème de démembrement dans les familles attendues', () => {
    const groups = groupMementoReferenceValuesBySubdomain(
      DEFAULT_MEMENTO_REFERENCE_VALUES.filter((value) => value.domain === 'demembrement'),
    );

    expect(groups.map((group) => group.label)).toEqual(['Usufruit viager', 'Usufruit temporaire']);
    expect(groups.flatMap((group) => group.rows.map((row) => row.key))).toEqual([
      'usufruit-viager-moins-21',
      'usufruit-viager-moins-31',
      'usufruit-viager-moins-41',
      'usufruit-viager-moins-51',
      'usufruit-viager-moins-61',
      'usufruit-viager-moins-71',
      'usufruit-viager-moins-81',
      'usufruit-viager-moins-91',
      'usufruit-viager-plus-91',
      'usufruit-temporaire-periode',
    ]);
  });

  it('présente les repères internationaux dans les familles attendues', () => {
    const groups = groupMementoReferenceValuesBySubdomain(
      DEFAULT_MEMENTO_REFERENCE_VALUES.filter(
        (value) => value.domain === 'fiscalite-internationale',
      ),
    );

    expect(groups.map((group) => group.label)).toEqual([
      'IR des non-résidents',
      'IFI des non-résidents',
      'Transmission et assurance-vie des non-résidents',
      'Immobilier des non-résidents',
    ]);
    expect(groups.flatMap((group) => group.rows.map((row) => row.key))).toEqual([
      'non-residents-ir-premiere-fraction',
      'non-residents-ir-fraction-superieure',
      'non-residents-ir-dom-premiere-fraction',
      'non-residents-ir-dom-fraction-superieure',
      'non-residents-ifi-assiette-france',
      'non-residents-dmtg-residence-beneficiaire',
      'non-residents-assurance-vie-residence-beneficiaire',
      'non-residents-pvi-personne-physique',
      'non-residents-pvi-prelevement-solidarite',
    ]);
  });

  it('présente les repères sociaux dans les familles attendues', () => {
    const groups = groupMementoReferenceValuesBySubdomain(
      DEFAULT_MEMENTO_REFERENCE_VALUES.filter((value) => value.domain === 'social-protection'),
    );

    expect(groups.map((group) => group.label)).toEqual([
      'PUMA / CSM',
      'Retraite complémentaire AGIRC-ARRCO',
      'Épargne salariale et forfait social',
    ]);
    expect(groups.flatMap((group) => group.rows.map((row) => row.key))).toEqual([
      'csm-taux-maximum',
      'csm-seuil-revenus-activite-pass',
      'csm-abattement-assiette-pass',
      'csm-plafond-assiette-pass',
      'agirc-arrco-t1',
      'agirc-arrco-t2',
      'agirc-arrco-ceg-t1',
      'agirc-arrco-ceg-t2',
      'agirc-arrco-cet',
      'forfait-social-prevoyance',
      'forfait-social-retraite',
      'pee-abondement-plafond',
    ]);
  });
});
