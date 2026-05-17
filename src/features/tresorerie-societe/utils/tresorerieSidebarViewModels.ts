import { getAssociateAnnualIncomeNeedForYear } from '@/engine/tresorerie/revenuePhases';
import type { TresoInputsRuntime, TresoProjectionRow } from '@/engine/tresorerie/types';
import {
  getAssociateProfile,
  getSelectedAssociate,
  getSelectedAssociateId,
} from './tresorerieSocieteModel';
import { getTresoRevenueSourceLabel } from './tresorerieRevenueLabels';

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
  periodLabel: string;
  analysisYearsCount: number;
  analysisMode: 'needs' | 'target';
  annualNeed: number;
  needTotal: number;
  netIncome: number;
  deltaNeed: number;
  segments: TresoAssociateInsightSegment[];
  /** Apport CCA cumulé sur toute la projection (versements vers la société). */
  ccaTotalContribution: number;
  /** Total des revenus récupérés sur la période analysée. */
  revenusTotalRecupere: number;
  /** Moyenne annuelle des revenus récupérés sur la période analysée. */
  revenusMoyenAnnuel: number;
}

function positive(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(0, value ?? 0) : 0;
}

function emptyViewModel(
  status: TresoAssociateInsightViewModel['status'],
  associateLabel: string,
  targetYear: number,
): TresoAssociateInsightViewModel {
  return {
    status,
    associateLabel,
    targetYear,
    targetAge: null,
    periodLabel: String(targetYear),
    analysisYearsCount: 0,
    analysisMode: 'target',
    annualNeed: 0,
    needTotal: 0,
    netIncome: 0,
    deltaNeed: 0,
    segments: [],
    ccaTotalContribution: 0,
    revenusTotalRecupere: 0,
    revenusMoyenAnnuel: 0,
  };
}

function sumSegments(
  rows: TresoProjectionRow[],
  associateId: string,
  divisor: number,
): TresoAssociateInsightSegment[] {
  const associateRows = rows.flatMap((row) =>
    row.revenusParAssocie.filter((item) => item.associateId === associateId),
  );
  const remuneration = associateRows
    .filter((item) => item.source === 'remuneration')
    .reduce((sum, item) => sum + positive(item.netRevenue), 0);
  const cca = associateRows
    .filter((item) => item.source === 'cca')
    .reduce((sum, item) => sum + positive(item.ccaRepaid), 0);
  const dividendes = associateRows
    .filter((item) => item.source === 'dividendes')
    .reduce((sum, item) => sum + positive(item.netRevenue), 0);
  const annualDivisor = Math.max(1, divisor);

  const segments: TresoAssociateInsightSegment[] = [
    {
      key: 'remuneration',
      label: getTresoRevenueSourceLabel('remuneration'),
      value: remuneration / annualDivisor,
    },
    { key: 'cca', label: getTresoRevenueSourceLabel('cca'), value: cca / annualDivisor },
    {
      key: 'dividendes',
      label: getTresoRevenueSourceLabel('dividendes'),
      value: dividendes / annualDivisor,
    },
  ];

  return segments.filter((segment) => segment.value > 0);
}

function sumNetIncome(rows: TresoProjectionRow[], associateId: string): number {
  return rows.reduce((total, row) => {
    const associateRows = row.revenusParAssocie.filter((item) => item.associateId === associateId);
    return total + associateRows.reduce((sum, item) => sum + positive(item.netRevenue), 0);
  }, 0);
}

function formatPeriodLabel(firstYear: number, lastYear: number): string {
  return firstYear === lastYear ? String(firstYear) : `${firstYear} → ${lastYear}`;
}

export function buildTresoAssociateInsightViewModel(
  inputs: TresoInputsRuntime,
  rows: TresoProjectionRow[],
): TresoAssociateInsightViewModel {
  const selectedAssociate = getSelectedAssociate(inputs);
  const profile = getAssociateProfile(inputs, selectedAssociate);
  const targetFallbackYear = profile.projectionStartYear;

  if (!selectedAssociate) {
    return emptyViewModel('empty', 'Associé sélectionné', targetFallbackYear);
  }

  if (selectedAssociate.kind === 'pm') {
    return emptyViewModel('pm', selectedAssociate.label, targetFallbackYear);
  }

  const selectedAssociateId = getSelectedAssociateId(inputs);
  let ccaTotalContribution = 0;
  rows.forEach((row) => {
    // L'apport CCA est porté au niveau du row (associé sélectionné = celui qui apporte).
    if (selectedAssociate.id === selectedAssociateId) {
      ccaTotalContribution += positive(row.apportCCA);
    }
  });

  const rowsWithContext = rows.map((row) => {
    const year = profile.projectionStartYear + row.year - 1;
    return {
      row,
      year,
      annualNeed: getAssociateAnnualIncomeNeedForYear(
        selectedAssociate,
        profile.annualIncomeNeed,
        year,
      ),
    };
  });
  const retirementIndex = Math.max(0, profile.retirementAge - profile.currentAge);
  const targetContext =
    rowsWithContext.find((item) => item.annualNeed > 0) ??
    rowsWithContext[retirementIndex] ??
    rowsWithContext[0];
  const needContexts = rowsWithContext.filter((item) => item.annualNeed > 0);
  const analysisContexts =
    needContexts.length > 0 ? needContexts : targetContext ? [targetContext] : [];

  const firstContext = analysisContexts[0] ?? targetContext;
  const lastContext = analysisContexts[analysisContexts.length - 1] ?? targetContext;
  const analysisYearsCount = analysisContexts.length;
  const analysisRows = analysisContexts.map((item) => item.row);
  const targetYear = firstContext ? firstContext.year : targetFallbackYear;
  const needTotal = analysisContexts.reduce((sum, item) => sum + positive(item.annualNeed), 0);
  const revenusTotalRecupere = sumNetIncome(analysisRows, selectedAssociate.id);
  const divisor = Math.max(1, analysisYearsCount);
  const annualNeed = needTotal / divisor;
  const revenusMoyenAnnuel = revenusTotalRecupere / divisor;
  const netIncome = revenusMoyenAnnuel;
  const deltaNeed = netIncome - annualNeed;
  const segments = sumSegments(analysisRows, selectedAssociate.id, divisor);

  return {
    status: netIncome > 0 || annualNeed > 0 ? 'ready' : 'empty',
    associateLabel: selectedAssociate.label,
    targetYear,
    targetAge:
      firstContext && profile.currentAge > 0
        ? profile.currentAge + firstContext.row.year - 1
        : null,
    periodLabel:
      firstContext && lastContext
        ? formatPeriodLabel(firstContext.year, lastContext.year)
        : String(targetYear),
    analysisYearsCount,
    analysisMode: needContexts.length > 0 ? 'needs' : 'target',
    annualNeed,
    needTotal,
    netIncome,
    deltaNeed,
    segments,
    ccaTotalContribution,
    revenusTotalRecupere,
    revenusMoyenAnnuel,
  };
}
