import type { LegalReferenceId } from '@/domain/legal-references';

export type MementoReferenceValueUnit = 'EUR' | '%' | null;

export interface MementoReferenceValue {
  key: string;
  domain: string;
  subdomain: string;
  label: string;
  value_numeric: number | null;
  value_text: string | null;
  unit: MementoReferenceValueUnit;
  year: number;
  data: Readonly<Record<string, string | number | boolean | null>>;
  ref_ids: readonly LegalReferenceId[];
  display_order: number;
  note: string | null;
  updated_at: string | null;
}

export type MementoReferenceValueDraft = Omit<MementoReferenceValue, 'updated_at'>;

export interface MementoReferenceValueGroup {
  id: string;
  label: string;
  rows: readonly MementoReferenceValue[];
}

export const MEMENTO_REFERENCE_SUBDOMAIN_LABELS: Record<string, string> = {
  'epargne-logement': 'Épargne logement',
  livrets: 'Livrets réglementés',
  pea: 'PEA et PEA-PME',
};

export const DEFAULT_MEMENTO_REFERENCE_VALUES: readonly MementoReferenceValue[] = [
  {
    key: 'livret-a-plafond',
    domain: 'chiffres-cles',
    subdomain: 'livrets',
    label: 'Livret A — plafond',
    value_numeric: 22950,
    value_text: null,
    unit: 'EUR',
    year: 2026,
    data: { product: 'livret_a', kind: 'ceiling' },
    ref_ids: ['service-public-comptes-livrets-comparatif-2026', 'cmf-l221-1'],
    display_order: 10,
    note: 'Plafond de versement pour une personne physique, hors intérêts capitalisés.',
    updated_at: null,
  },
  {
    key: 'livret-a-taux',
    domain: 'chiffres-cles',
    subdomain: 'livrets',
    label: 'Livret A — taux annuel',
    value_numeric: 1.5,
    value_text: null,
    unit: '%',
    year: 2026,
    data: { product: 'livret_a', kind: 'rate', effectiveFrom: '2026-02-01' },
    ref_ids: ['service-public-livrets-taux-2026', 'cmf-l221-1'],
    display_order: 20,
    note: 'Taux en vigueur à compter du 1er février 2026.',
    updated_at: null,
  },
  {
    key: 'ldds-plafond',
    domain: 'chiffres-cles',
    subdomain: 'livrets',
    label: 'LDDS — plafond',
    value_numeric: 12000,
    value_text: null,
    unit: 'EUR',
    year: 2026,
    data: { product: 'ldds', kind: 'ceiling' },
    ref_ids: ['service-public-comptes-livrets-comparatif-2026', 'cmf-l221-27'],
    display_order: 30,
    note: 'Plafond de versement, hors intérêts capitalisés.',
    updated_at: null,
  },
  {
    key: 'ldds-taux',
    domain: 'chiffres-cles',
    subdomain: 'livrets',
    label: 'LDDS — taux annuel',
    value_numeric: 1.5,
    value_text: null,
    unit: '%',
    year: 2026,
    data: { product: 'ldds', kind: 'rate', effectiveFrom: '2026-02-01' },
    ref_ids: ['service-public-livrets-taux-2026', 'cmf-l221-27'],
    display_order: 40,
    note: 'Taux en vigueur à compter du 1er février 2026.',
    updated_at: null,
  },
  {
    key: 'lep-plafond',
    domain: 'chiffres-cles',
    subdomain: 'livrets',
    label: 'LEP — plafond',
    value_numeric: 10000,
    value_text: null,
    unit: 'EUR',
    year: 2026,
    data: { product: 'lep', kind: 'ceiling' },
    ref_ids: ['service-public-comptes-livrets-comparatif-2026', 'cmf-l221-13'],
    display_order: 50,
    note: 'Plafond de versement, hors intérêts capitalisés.',
    updated_at: null,
  },
  {
    key: 'lep-taux',
    domain: 'chiffres-cles',
    subdomain: 'livrets',
    label: 'LEP — taux annuel',
    value_numeric: 2.5,
    value_text: null,
    unit: '%',
    year: 2026,
    data: { product: 'lep', kind: 'rate', effectiveFrom: '2026-02-01' },
    ref_ids: ['service-public-livrets-taux-2026', 'cmf-l221-13'],
    display_order: 60,
    note: 'Taux en vigueur à compter du 1er février 2026.',
    updated_at: null,
  },
  {
    key: 'cel-plafond',
    domain: 'chiffres-cles',
    subdomain: 'epargne-logement',
    label: 'CEL — plafond',
    value_numeric: 15300,
    value_text: null,
    unit: 'EUR',
    year: 2026,
    data: { product: 'cel', kind: 'ceiling' },
    ref_ids: ['service-public-cel'],
    display_order: 70,
    note: 'Plafond de versement, hors intérêts capitalisés.',
    updated_at: null,
  },
  {
    key: 'cel-taux',
    domain: 'chiffres-cles',
    subdomain: 'epargne-logement',
    label: 'CEL — taux annuel',
    value_numeric: 1,
    value_text: null,
    unit: '%',
    year: 2026,
    data: { product: 'cel', kind: 'rate', effectiveFrom: '2026-02-01' },
    ref_ids: ['service-public-cel', 'service-public-livrets-taux-2026'],
    display_order: 80,
    note: 'Taux en vigueur à compter du 1er février 2026.',
    updated_at: null,
  },
  {
    key: 'pel-plafond',
    domain: 'chiffres-cles',
    subdomain: 'epargne-logement',
    label: 'PEL — plafond',
    value_numeric: 61200,
    value_text: null,
    unit: 'EUR',
    year: 2026,
    data: { product: 'pel', kind: 'ceiling' },
    ref_ids: ['base-source-service-public-fr-plan-epargne-logement-pel'],
    display_order: 90,
    note: 'Plafond de versement, hors intérêts capitalisés.',
    updated_at: null,
  },
  {
    key: 'pel-taux',
    domain: 'chiffres-cles',
    subdomain: 'epargne-logement',
    label: 'PEL — taux annuel',
    value_numeric: 2,
    value_text: null,
    unit: '%',
    year: 2026,
    data: { product: 'pel', kind: 'rate', effectiveFrom: '2026-01-01' },
    ref_ids: [
      'service-public-pel-taux-2026',
      'base-source-service-public-fr-plan-epargne-logement-pel',
    ],
    display_order: 100,
    note: 'Taux applicable aux plans ouverts à compter du 1er janvier 2026.',
    updated_at: null,
  },
  {
    key: 'pea-plafond',
    domain: 'chiffres-cles',
    subdomain: 'pea',
    label: 'PEA — plafond de versement',
    value_numeric: 150000,
    value_text: null,
    unit: 'EUR',
    year: 2026,
    data: { product: 'pea', kind: 'ceiling' },
    ref_ids: ['service-public-pea', 'base-source-art-l221-30-code-monetaire-et-financier-pea'],
    display_order: 110,
    note: 'Plafond du PEA classique, hors gains réalisés dans le plan.',
    updated_at: null,
  },
  {
    key: 'pea-pme-plafond',
    domain: 'chiffres-cles',
    subdomain: 'pea',
    label: 'PEA-PME — plafond de versement',
    value_numeric: 225000,
    value_text: null,
    unit: 'EUR',
    year: 2026,
    data: { product: 'pea_pme', kind: 'ceiling' },
    ref_ids: [
      'service-public-pea',
      'base-source-art-l221-32-1-code-monetaire-et-financier-pea-pme',
    ],
    display_order: 120,
    note: 'Plafond propre au PEA-PME, avec plafond global de cumul mentionné par Service-Public.',
    updated_at: null,
  },
];

export function sortMementoReferenceValues(
  values: readonly MementoReferenceValue[],
): MementoReferenceValue[] {
  return [...values].sort(
    (left, right) =>
      left.display_order - right.display_order ||
      left.subdomain.localeCompare(right.subdomain, 'fr') ||
      left.label.localeCompare(right.label, 'fr'),
  );
}

export function groupMementoReferenceValuesBySubdomain(
  values: readonly MementoReferenceValue[],
): MementoReferenceValueGroup[] {
  const groups = new Map<string, MementoReferenceValue[]>();

  for (const value of sortMementoReferenceValues(values)) {
    const group = groups.get(value.subdomain) ?? [];
    group.push(value);
    groups.set(value.subdomain, group);
  }

  return [...groups.entries()].map(([id, rows]) => ({
    id,
    label: MEMENTO_REFERENCE_SUBDOMAIN_LABELS[id] ?? id,
    rows,
  }));
}
