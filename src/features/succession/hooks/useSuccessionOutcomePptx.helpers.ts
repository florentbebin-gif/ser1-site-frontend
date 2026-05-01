import { REGIMES_MATRIMONIAUX } from '../../../engine/civil';
import {
  CHOIX_LEGAL_CONJOINT_OPTIONS,
  DISPOSITION_TESTAMENTAIRE_OPTIONS,
  DONATION_ENTRE_EPOUX_OPTIONS,
  PACS_CONVENTION_OPTIONS,
  SITUATION_OPTIONS,
} from '../successionSimulator.constants';
import {
  computeFiliationOrgchartLayout,
  type FiliationOrgLayout,
} from '../filiationOrgchartLayout';
import type {
  FamilyMember,
  SituationMatrimoniale,
  SuccessionAssetDetailEntry,
  SuccessionAssuranceVieEntry,
  SuccessionCivilContext,
  SuccessionDevolutionContext,
  SuccessionDonationEntry,
  SuccessionEnfant,
  SuccessionGroupementFoncierEntry,
  SuccessionPatrimonialContext,
  SuccessionPerEntry,
  SuccessionPrevoyanceDecesEntry,
  SuccessionPrimarySide,
} from '../successionDraft.types';
import type { InsuranceBeneficiaryLine } from './useSuccessionOutcomeDerivedValues.helpers';

export interface SuccessionAnnexExportBeneficiaryRow {
  label: string;
  capitauxDecesNets: number;
  droitsAssuranceVie990I: number;
  droitsSuccession: number;
  transmissionNetteSuccession: number;
  exonerated?: boolean;
  isTotal?: boolean;
}

export interface SuccessionAnnexExportStep {
  title: string;
  beneficiaries: SuccessionAnnexExportBeneficiaryRow[];
}

export interface SuccessionFamilyContextExport {
  situationLabel: string;
  regimeLabel?: string;
  pacsConventionLabel?: string;
  dispositions: string[];
  filiation: FiliationOrgLayout;
}

export interface SuccessionAssetAnnexExportColumn {
  key: string;
  label: string;
}

export interface SuccessionAssetAnnexExportRow {
  label: string;
  values: number[];
}

export interface SuccessionAssetAnnexExport {
  columns: SuccessionAssetAnnexExportColumn[];
  rows: SuccessionAssetAnnexExportRow[];
}

type TransmissionRowForPptx = {
  id: string;
  label: string;
  brut: number;
  droits: number;
  exonerated?: boolean;
  step1Brut?: number;
  step1Droits?: number;
  step2Brut?: number;
  step2Droits?: number;
};

interface BuildSuccessionAnnexBeneficiaryStepsInput {
  transmissionRows: TransmissionRowForPptx[];
  insurance990IStep1: InsuranceBeneficiaryLine[];
  insurance757BStep1: InsuranceBeneficiaryLine[];
  insurance990IStep2: InsuranceBeneficiaryLine[];
  insurance757BStep2: InsuranceBeneficiaryLine[];
  displayUsesChainage: boolean;
  firstDecedeLabel?: string;
  secondDecedeLabel?: string;
}

interface BuildSuccessionAssetAnnexInput {
  assetEntries: SuccessionAssetDetailEntry[];
  groupementFoncierEntries: SuccessionGroupementFoncierEntry[];
  assuranceVieEntries: SuccessionAssuranceVieEntry[];
  perEntries: SuccessionPerEntry[];
  prevoyanceDecesEntries: SuccessionPrevoyanceDecesEntry[];
  assetPocketOptions: Array<{ value: string; label: string }>;
  assuranceViePartyOptions: Array<{ value: 'epoux1' | 'epoux2'; label: string }>;
}

const fmtCurrency = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

function optionLabel<T extends string>(
  options: Array<{ value: T | string; label: string }>,
  value: T | string | null | undefined,
): string | undefined {
  return options.find((option) => option.value === value)?.label;
}

function normalizeExportLabel(label: string): string {
  return label
    .replace(/^Epoux /, 'Époux ')
    .replace(/^Communaute$/, 'Communauté')
    .replace(/^Societe d'acquets$/, "Société d'acquêts");
}

function sideLabel(
  side: SuccessionPrimarySide,
  situationMatrimoniale: SituationMatrimoniale,
): string {
  if (situationMatrimoniale === 'pacse') {
    return side === 'epoux1' ? 'Partenaire 1' : 'Partenaire 2';
  }
  if (situationMatrimoniale === 'concubinage') {
    return side === 'epoux1' ? 'Personne 1' : 'Personne 2';
  }
  return side === 'epoux1' ? 'Époux 1' : 'Époux 2';
}

function getDonationDisplayAmount(entry: SuccessionDonationEntry): number {
  return entry.valeurActuelle ?? entry.valeurDonation ?? entry.montant ?? 0;
}

function buildDonationSummary(donationsContext: SuccessionDonationEntry[]): string | null {
  const totals = new Map<SuccessionDonationEntry['type'], { count: number; total: number }>();

  for (const entry of donationsContext) {
    const amount = getDonationDisplayAmount(entry);
    const hasMeaningfulData = amount > 0 || Boolean(entry.date || entry.donateur || entry.donataire);
    if (!hasMeaningfulData) continue;

    const current = totals.get(entry.type) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += amount;
    totals.set(entry.type, current);
  }

  const parts = (['rapportable', 'hors_part', 'legs_particulier'] as const)
    .map((type) => {
      const current = totals.get(type);
      if (!current) return null;

      const baseLabel = type === 'rapportable'
        ? `${current.count} avance${current.count > 1 ? 's' : ''} de part successorale`
        : type === 'hors_part'
          ? `${current.count} donation${current.count > 1 ? 's' : ''} hors part`
          : `${current.count} legs particulier${current.count > 1 ? 's' : ''}`;

      return current.total > 0 ? `${baseLabel} (${fmtCurrency(current.total)})` : baseLabel;
    })
    .filter((value): value is string => value !== null);

  return parts.length > 0 ? `Donations antérieures : ${parts.join(' ; ')}` : null;
}

function buildDispositionSummaries(
  civilContext: SuccessionCivilContext,
  devolutionContext: SuccessionDevolutionContext,
  patrimonialContext: SuccessionPatrimonialContext,
  donationsContext: SuccessionDonationEntry[],
): string[] {
  const dispositions: string[] = [];
  const conjointDetails: string[] = [];

  if (patrimonialContext.donationEntreEpouxActive) {
    conjointDetails.push(`donation entre époux : ${optionLabel(DONATION_ENTRE_EPOUX_OPTIONS, patrimonialContext.donationEntreEpouxOption) ?? patrimonialContext.donationEntreEpouxOption}`);
  }

  const choixLegal = devolutionContext.choixLegalConjointSansDDV;
  if (choixLegal) {
    conjointDetails.push(`choix du conjoint survivant : ${optionLabel(CHOIX_LEGAL_CONJOINT_OPTIONS, choixLegal) ?? choixLegal}`);
  }

  if (conjointDetails.length > 0) {
    dispositions.push(`Protection du conjoint : ${conjointDetails.join(' ; ')}`);
  }

  const testaments: string[] = [];
  for (const side of ['epoux1', 'epoux2'] as const) {
    const testament = devolutionContext.testamentsBySide[side];
    if (!testament.active) continue;
    const label = optionLabel(DISPOSITION_TESTAMENTAIRE_OPTIONS, testament.dispositionType);
    testaments.push(`${sideLabel(side, civilContext.situationMatrimoniale)} : ${label ?? 'Disposition active'}`);
  }

  if (testaments.length > 0) {
    dispositions.push(`Testament${testaments.length > 1 ? 's' : ''} : ${testaments.join(' ; ')}`);
  }

  const clauses: string[] = [];
  if (patrimonialContext.attributionIntegrale) {
    clauses.push('attribution intégrale au conjoint survivant');
  }
  if (
    patrimonialContext.preciputMontant > 0
    || patrimonialContext.preciputSelections.some((selection) => selection.enabled)
  ) {
    const enabledSelections = patrimonialContext.preciputSelections.filter((selection) => selection.enabled).length;
    if (patrimonialContext.preciputMontant > 0) {
      clauses.push(`clause de préciput à hauteur de ${fmtCurrency(patrimonialContext.preciputMontant)}`);
    } else if (enabledSelections > 0) {
      clauses.push(`clause de préciput sur ${enabledSelections} bien${enabledSelections > 1 ? 's' : ''}`);
    }
  }
  if (patrimonialContext.stipulationContraireCU) {
    clauses.push('stipulation contraire en communauté universelle');
  }

  if (clauses.length > 0) {
    dispositions.push(`Clauses matrimoniales : ${clauses.join(' ; ')}`);
  }

  const donationSummary = buildDonationSummary(donationsContext);
  if (donationSummary) {
    dispositions.push(donationSummary);
  }

  return dispositions;
}

function totalAnnexRow(rows: SuccessionAnnexExportBeneficiaryRow[]): SuccessionAnnexExportBeneficiaryRow {
  return {
    label: 'Total',
    capitauxDecesNets: rows.reduce((sum, row) => sum + row.capitauxDecesNets, 0),
    droitsAssuranceVie990I: rows.reduce((sum, row) => sum + row.droitsAssuranceVie990I, 0),
    droitsSuccession: rows.reduce((sum, row) => sum + row.droitsSuccession, 0),
    transmissionNetteSuccession: rows.reduce((sum, row) => sum + row.transmissionNetteSuccession, 0),
    isTotal: true,
  };
}

function buildAnnexRowsForStep(
  transmissionRows: TransmissionRowForPptx[],
  insurance990I: InsuranceBeneficiaryLine[],
  insurance757B: InsuranceBeneficiaryLine[],
  step: 'direct' | 'step1' | 'step2',
): SuccessionAnnexExportBeneficiaryRow[] {
  const ids = new Map<string, { label: string; exonerated?: boolean }>();

  for (const row of transmissionRows) {
    const brut = step === 'step1'
      ? (row.step1Brut ?? 0)
      : step === 'step2'
        ? (row.step2Brut ?? 0)
        : row.brut;
    const droits = step === 'step1'
      ? (row.step1Droits ?? 0)
      : step === 'step2'
        ? (row.step2Droits ?? 0)
        : row.droits;
    if (brut > 0 || droits > 0) ids.set(row.id, { label: row.label, exonerated: row.exonerated });
  }
  for (const line of [...insurance990I, ...insurance757B]) {
    if (!ids.has(line.id)) ids.set(line.id, { label: line.label });
  }

  const rows: SuccessionAnnexExportBeneficiaryRow[] = [];
  for (const [id, { label, exonerated }] of ids.entries()) {
    const row = transmissionRows.find((candidate) => candidate.id === id);
    const ins990I = insurance990I.find((line) => line.id === id);
    const ins757B = insurance757B.find((line) => line.id === id);
    const brut = step === 'step1'
      ? (row?.step1Brut ?? 0)
      : step === 'step2'
        ? (row?.step2Brut ?? 0)
        : (row?.brut ?? 0);
    const droitsDmtg = step === 'step1'
      ? (row?.step1Droits ?? 0)
      : step === 'step2'
        ? (row?.step2Droits ?? 0)
        : (row?.droits ?? 0);
    const capitauxDecesNets = (ins990I?.netTransmis ?? 0) + (ins757B?.capitalTransmis ?? 0);
    const droitsAssuranceVie990I = ins990I?.totalDroits ?? 0;
    const droitsSuccession = droitsDmtg + (ins757B?.totalDroits ?? 0);
    const transmissionNetteSuccession = brut + capitauxDecesNets - droitsSuccession;

    if (brut === 0 && capitauxDecesNets === 0 && droitsAssuranceVie990I === 0 && droitsSuccession === 0) continue;
    rows.push({
      label,
      capitauxDecesNets,
      droitsAssuranceVie990I,
      droitsSuccession,
      transmissionNetteSuccession,
      exonerated,
    });
  }

  rows.sort((a, b) => (a.label === 'Conjoint survivant' ? -1 : b.label === 'Conjoint survivant' ? 1 : 0));
  return rows;
}

function buildIndexedLabel(label: string, seen: Map<string, number>): string {
  const baseLabel = label.trim() || 'Actif';
  const nextCount = (seen.get(baseLabel) ?? 0) + 1;
  seen.set(baseLabel, nextCount);
  return nextCount === 1 ? baseLabel : `${baseLabel} (${nextCount})`;
}

function getPartyLabel(
  options: Array<{ value: 'epoux1' | 'epoux2'; label: string }>,
  party: 'epoux1' | 'epoux2',
): string {
  const fallback = party === 'epoux1' ? 'Époux 1' : 'Époux 2';
  return normalizeExportLabel(optionLabel(options, party) ?? fallback);
}

function buildValues(columnCount: number, columnIndex: number, amount: number): number[] {
  const values = Array.from({ length: columnCount }, () => 0);
  values[columnIndex] = amount;
  return values;
}

export function buildSuccessionAnnexBeneficiarySteps({
  transmissionRows,
  insurance990IStep1,
  insurance757BStep1,
  insurance990IStep2,
  insurance757BStep2,
  displayUsesChainage,
  firstDecedeLabel,
  secondDecedeLabel,
}: BuildSuccessionAnnexBeneficiaryStepsInput): SuccessionAnnexExportStep[] {
  if (displayUsesChainage) {
    const step1Rows = buildAnnexRowsForStep(transmissionRows, insurance990IStep1, insurance757BStep1, 'step1');
    const step2Rows = buildAnnexRowsForStep(transmissionRows, insurance990IStep2, insurance757BStep2, 'step2');
    return [
      {
        title: `1er décès — ${firstDecedeLabel ?? 'Défunt 1'}`,
        beneficiaries: [...step1Rows, totalAnnexRow(step1Rows)],
      },
      {
        title: `2e décès — ${secondDecedeLabel ?? 'Défunt 2'}`,
        beneficiaries: [...step2Rows, totalAnnexRow(step2Rows)],
      },
    ];
  }

  const rows = buildAnnexRowsForStep(transmissionRows, insurance990IStep1, insurance757BStep1, 'direct');
  return [{
    title: 'Succession directe simulée',
    beneficiaries: [...rows, totalAnnexRow(rows)],
  }];
}

export function buildSuccessionFamilyContextExport({
  civilContext,
  devolutionContext,
  patrimonialContext,
  donationsContext,
  enfantsContext,
  familyMembers,
}: {
  civilContext: SuccessionCivilContext;
  devolutionContext: SuccessionDevolutionContext;
  patrimonialContext: SuccessionPatrimonialContext;
  donationsContext: SuccessionDonationEntry[];
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
}): SuccessionFamilyContextExport {
  return {
    situationLabel: optionLabel(SITUATION_OPTIONS, civilContext.situationMatrimoniale)
      ?? civilContext.situationMatrimoniale,
    regimeLabel: civilContext.regimeMatrimonial
      ? REGIMES_MATRIMONIAUX[civilContext.regimeMatrimonial]?.label
      : undefined,
    pacsConventionLabel: civilContext.situationMatrimoniale === 'pacse'
      ? optionLabel(PACS_CONVENTION_OPTIONS, civilContext.pacsConvention)
      : undefined,
    dispositions: buildDispositionSummaries(civilContext, devolutionContext, patrimonialContext, donationsContext),
    filiation: computeFiliationOrgchartLayout(civilContext, enfantsContext, familyMembers),
  };
}

export function buildSuccessionAssetAnnexExport({
  assetEntries,
  groupementFoncierEntries,
  assuranceVieEntries,
  perEntries,
  prevoyanceDecesEntries,
  assetPocketOptions,
  assuranceViePartyOptions,
}: BuildSuccessionAssetAnnexInput): SuccessionAssetAnnexExport | null {
  if (assetPocketOptions.length === 0) return null;

  const columns = assetPocketOptions.map((option) => ({
    key: option.value,
    label: normalizeExportLabel(option.label),
  }));
  const columnIndexes = new Map(columns.map((column, index) => [column.key, index]));
  const seenLabels = new Map<string, number>();
  const rows: SuccessionAssetAnnexExportRow[] = [];

  const pushRow = (label: string, columnKey: string, amount: number): void => {
    if (amount <= 0) return;
    const columnIndex = columnIndexes.get(columnKey);
    if (columnIndex === undefined) return;

    rows.push({
      label: buildIndexedLabel(label, seenLabels),
      values: buildValues(columns.length, columnIndex, amount),
    });
  };

  (['immobilier', 'financier', 'professionnel', 'divers'] as const).forEach((category) => {
    assetEntries
      .filter((entry) => entry.category === category)
      .forEach((entry) => {
        pushRow(entry.label?.trim() || entry.subCategory, entry.pocket, entry.amount);
      });

    if (category === 'immobilier') {
      groupementFoncierEntries.forEach((entry) => {
        pushRow(entry.label?.trim() || entry.type, entry.pocket, entry.valeurTotale);
      });
    }

    if (category === 'financier') {
      assuranceVieEntries.forEach((entry) => {
        pushRow(
          `Assurance-vie (${getPartyLabel(assuranceViePartyOptions, entry.assure)})`,
          entry.assure,
          entry.capitauxDeces,
        );
      });
      perEntries.forEach((entry) => {
        pushRow(
          `PER assurance (${getPartyLabel(assuranceViePartyOptions, entry.assure)})`,
          entry.assure,
          entry.capitauxDeces,
        );
      });
    }

    if (category === 'divers') {
      prevoyanceDecesEntries.forEach((entry) => {
        pushRow(
          `Prévoyance décès (${getPartyLabel(assuranceViePartyOptions, entry.assure)})`,
          entry.assure,
          entry.capitalDeces,
        );
      });
    }
  });

  return rows.length > 0 ? { columns, rows } : null;
}
