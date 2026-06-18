import type { LegalReferenceId } from '@/domain/legal-references';

import { MEMENTO_DEMEMBREMENT_REFERENCE_VALUES } from './referenceValuesDemembrement';
import { MEMENTO_INTERNATIONAL_REFERENCE_VALUES } from './referenceValuesInternational';

export type MementoReferenceValueUnit = 'EUR' | '%' | null;
export type MementoReferenceValueDomain =
  | 'chiffres-cles'
  | 'demembrement'
  | 'fiscalite-internationale'
  | 'social-protection';

export interface MementoReferenceValue {
  key: string;
  domain: MementoReferenceValueDomain;
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
  'epargne-salariale': 'Épargne salariale et forfait social',
  livrets: 'Livrets réglementés',
  'non-residents-ifi': 'IFI des non-résidents',
  'non-residents-immobilier': 'Immobilier des non-résidents',
  'non-residents-ir': 'IR des non-résidents',
  'non-residents-transmission': 'Transmission et assurance-vie des non-résidents',
  pea: 'PEA et PEA-PME',
  'puma-csm': 'PUMA / CSM',
  'retraite-complementaire': 'Retraite complémentaire AGIRC-ARRCO',
  'usufruit-temporaire': 'Usufruit temporaire',
  'usufruit-viager': 'Usufruit viager',
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
  ...MEMENTO_DEMEMBREMENT_REFERENCE_VALUES,
  ...MEMENTO_INTERNATIONAL_REFERENCE_VALUES,
  {
    key: 'csm-taux-maximum',
    domain: 'social-protection',
    subdomain: 'puma-csm',
    label: 'CSM — taux maximal',
    value_numeric: 6.5,
    value_text: null,
    unit: '%',
    year: 2026,
    data: { kind: 'rate', base: 'assiette_csm' },
    ref_ids: ['urssaf-puma-csm'],
    display_order: 1000,
    note: 'Taux appliqué à l’assiette CSM avant dégressivité selon les revenus d’activité.',
    updated_at: null,
  },
  {
    key: 'csm-seuil-revenus-activite-pass',
    domain: 'social-protection',
    subdomain: 'puma-csm',
    label: 'CSM — seuil de revenus d’activité',
    value_numeric: 20,
    value_text: null,
    unit: '%',
    year: 2026,
    data: { kind: 'threshold', base: 'PASS' },
    ref_ids: ['urssaf-puma-csm', 'urssaf-pass-2026'],
    display_order: 1010,
    note: 'Seuil exprimé en pourcentage du PASS pour apprécier l’assujettissement.',
    updated_at: null,
  },
  {
    key: 'csm-abattement-assiette-pass',
    domain: 'social-protection',
    subdomain: 'puma-csm',
    label: 'CSM — abattement d’assiette',
    value_numeric: 50,
    value_text: null,
    unit: '%',
    year: 2026,
    data: { kind: 'abatement', base: 'PASS' },
    ref_ids: ['urssaf-puma-csm', 'urssaf-pass-2026'],
    display_order: 1020,
    note: 'Abattement exprimé en pourcentage du PASS dans la formule CSM.',
    updated_at: null,
  },
  {
    key: 'csm-plafond-assiette-pass',
    domain: 'social-protection',
    subdomain: 'puma-csm',
    label: 'CSM — plafond d’assiette',
    value_numeric: 800,
    value_text: null,
    unit: '%',
    year: 2026,
    data: { kind: 'ceiling', base: 'PASS' },
    ref_ids: ['urssaf-puma-csm', 'urssaf-pass-2026'],
    display_order: 1030,
    note: 'Plafond exprimé en pourcentage du PASS.',
    updated_at: null,
  },
  {
    key: 'agirc-arrco-t1',
    domain: 'social-protection',
    subdomain: 'retraite-complementaire',
    label: 'AGIRC-ARRCO — tranche T1',
    value_numeric: null,
    value_text: 'Employeur 4,72 % · salarié 3,15 % · total 7,87 %',
    unit: null,
    year: 2026,
    data: { employerRate: 4.72, employeeRate: 3.15, totalRate: 7.87, tranche: 'T1' },
    ref_ids: ['agirc-arrco-parametres-2026', 'urssaf-pass-2026'],
    display_order: 1100,
    note: 'Cotisation appelée incluant le pourcentage d’appel.',
    updated_at: null,
  },
  {
    key: 'agirc-arrco-t2',
    domain: 'social-protection',
    subdomain: 'retraite-complementaire',
    label: 'AGIRC-ARRCO — tranche T2',
    value_numeric: null,
    value_text: 'Employeur 12,95 % · salarié 8,64 % · total 21,59 %',
    unit: null,
    year: 2026,
    data: { employerRate: 12.95, employeeRate: 8.64, totalRate: 21.59, tranche: 'T2' },
    ref_ids: ['agirc-arrco-parametres-2026', 'urssaf-pass-2026'],
    display_order: 1110,
    note: 'Cotisation appelée incluant le pourcentage d’appel.',
    updated_at: null,
  },
  {
    key: 'agirc-arrco-ceg-t1',
    domain: 'social-protection',
    subdomain: 'retraite-complementaire',
    label: 'CEG — tranche T1',
    value_numeric: null,
    value_text: 'Employeur 1,29 % · salarié 0,86 % · total 2,15 %',
    unit: null,
    year: 2026,
    data: { employerRate: 1.29, employeeRate: 0.86, totalRate: 2.15, tranche: 'T1' },
    ref_ids: ['agirc-arrco-parametres-2026'],
    display_order: 1120,
    note: 'Contribution d’équilibre général.',
    updated_at: null,
  },
  {
    key: 'agirc-arrco-ceg-t2',
    domain: 'social-protection',
    subdomain: 'retraite-complementaire',
    label: 'CEG — tranche T2',
    value_numeric: null,
    value_text: 'Employeur 1,62 % · salarié 1,08 % · total 2,70 %',
    unit: null,
    year: 2026,
    data: { employerRate: 1.62, employeeRate: 1.08, totalRate: 2.7, tranche: 'T2' },
    ref_ids: ['agirc-arrco-parametres-2026'],
    display_order: 1130,
    note: 'Contribution d’équilibre général.',
    updated_at: null,
  },
  {
    key: 'agirc-arrco-cet',
    domain: 'social-protection',
    subdomain: 'retraite-complementaire',
    label: 'CET — tranches T1 et T2',
    value_numeric: null,
    value_text: 'Employeur 0,21 % · salarié 0,14 % · total 0,35 %',
    unit: null,
    year: 2026,
    data: { employerRate: 0.21, employeeRate: 0.14, totalRate: 0.35, tranche: 'T1+T2' },
    ref_ids: ['agirc-arrco-parametres-2026'],
    display_order: 1140,
    note: 'Due si la rémunération dépasse la tranche T1.',
    updated_at: null,
  },
  {
    key: 'forfait-social-prevoyance',
    domain: 'social-protection',
    subdomain: 'epargne-salariale',
    label: 'Forfait social — prévoyance',
    value_numeric: 8,
    value_text: null,
    unit: '%',
    year: 2026,
    data: { kind: 'rate', scope: 'prevoyance' },
    ref_ids: ['urssaf-forfait-social', 'boss-protection-sociale-complementaire'],
    display_order: 1200,
    note: 'Taux applicable aux contributions patronales de prévoyance dans le périmètre prévu.',
    updated_at: null,
  },
  {
    key: 'forfait-social-retraite',
    domain: 'social-protection',
    subdomain: 'epargne-salariale',
    label: 'Forfait social — retraite',
    value_numeric: 20,
    value_text: null,
    unit: '%',
    year: 2026,
    data: { kind: 'rate', scope: 'retraite' },
    ref_ids: ['urssaf-forfait-social', 'boss-protection-sociale-complementaire'],
    display_order: 1210,
    note: 'Taux de droit commun pour les contributions entrant dans le forfait social.',
    updated_at: null,
  },
  {
    key: 'pee-abondement-plafond',
    domain: 'social-protection',
    subdomain: 'epargne-salariale',
    label: 'PEE — plafond d’abondement',
    value_numeric: 3845,
    value_text: null,
    unit: 'EUR',
    year: 2026,
    data: { kind: 'ceiling', product: 'pee', base: 'PASS' },
    ref_ids: ['urssaf-plans-epargne-salariale-2026', 'urssaf-pass-2026'],
    display_order: 1220,
    note: 'Plafond annuel d’abondement employeur sur un PEE.',
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

/**
 * Sélectionne le millésime courant de chaque repère : pour chaque clé, la ligne d'année la plus
 * récente disponible. La base conserve l'historique en append-only (clé `(key, year)`) ; l'affichage
 * et l'édition portent sur un seul millésime. La lecture « à une date donnée » pour rejouer un
 * dossier ancien viendra avec l'épinglage côté dossier client.
 */
export function selectCurrentMementoMillesime(
  values: readonly MementoReferenceValue[],
): MementoReferenceValue[] {
  const latestByKey = new Map<string, MementoReferenceValue>();
  for (const value of values) {
    const current = latestByKey.get(value.key);
    if (!current || value.year > current.year) {
      latestByKey.set(value.key, value);
    }
  }
  return sortMementoReferenceValues([...latestByKey.values()]);
}

export function getReferenceValuesForProduct(
  values: readonly MementoReferenceValue[],
  productId: string,
  domain: MementoReferenceValueDomain = 'chiffres-cles',
): MementoReferenceValue[] {
  return sortMementoReferenceValues(
    values.filter((value) => value.domain === domain && value.data.product === productId),
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
