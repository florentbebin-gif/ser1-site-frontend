import { getAssociateAnnualIncomeNeedForYear } from '@/engine/tresorerie/revenuePhases';
import type { TresoInputsRuntime, TresoProjectionRow } from '@/engine/tresorerie/types';
import { getAssociateProfile, getSelectedAssociate, getSelectedAssociateId } from './tresorerieSocieteModel';

export interface TresoAssociateInsightSegment {
  key: 'remuneration' | 'cca' | 'dividendes';
  label: string;
  value: number;
}

export interface TresoAssociateInsightViewModel {
  status: 'ready' | 'empty' | 'pm';
  associateLabel: string;
  targetYear: number;
  targetAge: number | null;
  annualNeed: number;
  netIncome: number;
  deltaNeed: number;
  segments: TresoAssociateInsightSegment[];
  /** Apport CCA cumulé sur toute la projection (versements vers la société). */
  ccaTotalContribution: number;
  /** Total des revenus récupérés (rémunération + CCA remboursé + dividendes nets) sur toute la projection. */
  revenusTotalRecupere: number;
  /** Moyenne annuelle des revenus récupérés. */
  revenusMoyenAnnuel: number;
}

function positive(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(0, value ?? 0) : 0;
}

function sumSegments(row: TresoProjectionRow, associateId: string): TresoAssociateInsightSegment[] {
  const rows = row.revenusParAssocie.filter(item => item.associateId === associateId);
  const remuneration = rows
    .filter(item => item.source === 'remuneration')
    .reduce((sum, item) => sum + positive(item.netRevenue), 0);
  const cca = rows
    .filter(item => item.source === 'cca')
    .reduce((sum, item) => sum + positive(item.ccaRepaid), 0);
  const dividendes = rows
    .filter(item => item.source === 'dividendes')
    .reduce((sum, item) => sum + positive(item.netRevenue), 0);

  const segments: TresoAssociateInsightSegment[] = [
    { key: 'remuneration', label: 'Rémunération nette', value: remuneration },
    { key: 'cca', label: 'Remboursement CCA', value: cca },
    { key: 'dividendes', label: 'Dividendes nets', value: dividendes },
  ];

  return segments.filter(segment => segment.value > 0);
}

export function buildTresoAssociateInsightViewModel(
  inputs: TresoInputsRuntime,
  rows: TresoProjectionRow[],
): TresoAssociateInsightViewModel {
  const selectedAssociate = getSelectedAssociate(inputs);
  const profile = getAssociateProfile(inputs, selectedAssociate);
  const targetFallbackYear = profile.projectionStartYear;

  if (!selectedAssociate) {
    return {
      status: 'empty',
      associateLabel: 'Associé actif',
      targetYear: targetFallbackYear,
      targetAge: null,
      annualNeed: 0,
      netIncome: 0,
      deltaNeed: 0,
      segments: [],
      ccaTotalContribution: 0,
      revenusTotalRecupere: 0,
      revenusMoyenAnnuel: 0,
    };
  }

  if (selectedAssociate.kind === 'pm') {
    return {
      status: 'pm',
      associateLabel: selectedAssociate.label,
      targetYear: targetFallbackYear,
      targetAge: null,
      annualNeed: 0,
      netIncome: 0,
      deltaNeed: 0,
      segments: [],
      ccaTotalContribution: 0,
      revenusTotalRecupere: 0,
      revenusMoyenAnnuel: 0,
    };
  }

  // Totaux sur toute la projection pour l'associé sélectionné.
  const selectedAssociateId = getSelectedAssociateId(inputs);
  let ccaTotalContribution = 0;
  let revenusTotalRecupere = 0;
  rows.forEach(row => {
    const associateRows = row.revenusParAssocie.filter(r => r.associateId === selectedAssociate.id);
    revenusTotalRecupere += associateRows.reduce((sum, r) => sum + positive(r.netRevenue), 0);
    // L'apport CCA est porté au niveau du row (associé sélectionné = celui qui apporte).
    if (selectedAssociate.id === selectedAssociateId) {
      ccaTotalContribution += positive(row.apportCCA);
    }
  });
  const revenusMoyenAnnuel = rows.length > 0 ? revenusTotalRecupere / rows.length : 0;

  const rowWithNeed = rows.find(row => {
    const year = profile.projectionStartYear + row.year - 1;
    return getAssociateAnnualIncomeNeedForYear(selectedAssociate, profile.annualIncomeNeed, year) > 0;
  });
  const retirementIndex = Math.max(0, profile.retirementAge - profile.currentAge);
  const targetRow = rowWithNeed ?? rows[retirementIndex] ?? rows[0];
  const targetYear = targetRow
    ? profile.projectionStartYear + targetRow.year - 1
    : targetFallbackYear;
  const annualNeed = getAssociateAnnualIncomeNeedForYear(
    selectedAssociate,
    profile.annualIncomeNeed,
    targetYear,
  );
  const segments = targetRow ? sumSegments(targetRow, selectedAssociate.id) : [];
  const netIncome = segments.reduce((sum, segment) => sum + segment.value, 0);
  const deltaNeed = targetRow?.deltaBesoin ?? annualNeed - netIncome;

  return {
    status: netIncome > 0 || annualNeed > 0 ? 'ready' : 'empty',
    associateLabel: selectedAssociate.label,
    targetYear,
    targetAge: targetRow && profile.currentAge > 0 ? profile.currentAge + targetRow.year - 1 : null,
    annualNeed,
    netIncome,
    deltaNeed,
    segments,
    ccaTotalContribution,
    revenusTotalRecupere,
    revenusMoyenAnnuel,
  };
}
