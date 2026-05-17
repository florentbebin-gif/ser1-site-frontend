import type {
  AssociateInputV6,
  AssociateRevenuePhaseInputV6,
  CompanyInputV6,
  SubsidiaryInput,
} from '@/engine/tresorerie/types';
import { computeNetRevenue, sortPhases } from '../../utils/revenuePhases';

export type TimelineSubPhaseKind =
  | 'remuneration'
  | 'distribution'
  | 'cca_contribution'
  | 'cca_repayment';

export interface TimelineSubPhaseLayout {
  kind: TimelineSubPhaseKind;
  enabled: boolean;
  bandIndex: 0 | 1 | 2 | 3;
  shortLabel: string;
  detail: string;
  modeIcon?: 'target' | 'max' | 'none';
}

export interface TimelinePalierLayout {
  phase: AssociateRevenuePhaseInputV6;
  startYear: number;
  endYear: number;
  x: number;
  width: number;
  netRevenue: number;
  subPhases: TimelineSubPhaseLayout[];
}

export interface TimelineYearTick {
  year: number;
  age: number | null;
  x: number;
}

export interface TresoTimelineLayout {
  startYear: number;
  endYear: number;
  svgWidth: number;
  svgHeight: number;
  trackLeft: number;
  trackRight: number;
  ticks: TimelineYearTick[];
  paliers: TimelinePalierLayout[];
}

const MIN_SVG_WIDTH = 720;
const SVG_HEIGHT = 168;
const TRACK_LEFT = 56;
const TRACK_RIGHT_PADDING = 48;
const MIN_YEAR_PX = 40;

const SUB_PHASE_LABELS: Record<TimelineSubPhaseKind, string> = {
  remuneration: 'Rémunération',
  distribution: 'Distribution',
  cca_contribution: 'Constitution CCA',
  cca_repayment: 'Remboursement CCA',
};

function clampYear(year: number, startYear: number, endYear: number): number {
  return Math.min(Math.max(year, startYear), endYear);
}

function getTrackRight(svgWidth: number): number {
  return svgWidth - TRACK_RIGHT_PADDING;
}

function getYearX(year: number, startYear: number, endYear: number, trackRight: number): number {
  const totalYears = Math.max(1, endYear - startYear + 1);
  const slotWidth = (trackRight - TRACK_LEFT) / totalYears;
  return TRACK_LEFT + (clampYear(year, startYear, endYear) - startYear + 0.5) * slotWidth;
}

function getPhaseX(
  startYear: number,
  rangeStartYear: number,
  rangeEndYear: number,
  trackRight: number,
): number {
  const totalYears = Math.max(1, rangeEndYear - rangeStartYear + 1);
  const slotWidth = (trackRight - TRACK_LEFT) / totalYears;
  return TRACK_LEFT + Math.max(0, startYear - rangeStartYear) * slotWidth;
}

function getPhaseWidth(
  startYear: number,
  endYear: number,
  rangeStartYear: number,
  rangeEndYear: number,
  trackRight: number,
): number {
  const totalYears = Math.max(1, rangeEndYear - rangeStartYear + 1);
  const slotWidth = (trackRight - TRACK_LEFT) / totalYears;
  const visibleStart = clampYear(startYear, rangeStartYear, rangeEndYear);
  const visibleEnd = clampYear(endYear, rangeStartYear, rangeEndYear);
  return Math.max(26, (visibleEnd - visibleStart + 1) * slotWidth);
}

function fmtCompactEuro(value: number): string {
  const amount = Math.max(0, Math.round(value));
  if (amount >= 1000) return `${Math.round(amount / 1000).toLocaleString('fr-FR')} k€`;
  return `${amount.toLocaleString('fr-FR')} €`;
}

function getSubsidiaryLabel(subsidiaries: SubsidiaryInput[], id: string | undefined): string {
  return subsidiaries.find((subsidiary) => subsidiary.id === id)?.label ?? 'Filiale';
}

function getRemunerationLabel(
  phase: AssociateRevenuePhaseInputV6,
  subsidiaries: SubsidiaryInput[],
): string {
  if (!phase.remuneration.enabled || phase.remuneration.source === 'none') return '';
  const source =
    phase.remuneration.source === 'subsidiary'
      ? getSubsidiaryLabel(subsidiaries, phase.remuneration.subsidiaryId)
      : 'Holding';
  return `${fmtCompactEuro(computeNetRevenue(phase))} net · ${source}`;
}

function getDistributionLabel(phase: AssociateRevenuePhaseInputV6): string {
  if (!phase.distribution.enabled) return '';
  if (phase.distribution.dividendsStrategy === 'aucun') return 'aucun dividende';
  if (phase.distribution.dividendsStrategy === 'montant_cible') {
    return `Objectif ${fmtCompactEuro(phase.distribution.dividendsTargetAmountNet ?? 0)} net`;
  }
  return 'dividendes max';
}

function getCcaContributionLabel(phase: AssociateRevenuePhaseInputV6): string {
  if (!phase.ccaContribution.enabled) return '';
  const annual = phase.ccaContribution.annual;
  const exceptional = phase.ccaContribution.exceptional;
  if (annual && annual.amount > 0) return `+${fmtCompactEuro(annual.amount)}/an`;
  if (exceptional && exceptional.amount > 0) return `+${fmtCompactEuro(exceptional.amount)}`;
  return 'Apport CCA';
}

function getCcaRepaymentLabel(phase: AssociateRevenuePhaseInputV6): string {
  if (!phase.ccaRepayment.enabled) return '';
  if (phase.ccaRepayment.strategy === 'aucun') return 'aucun remboursement';
  if (phase.ccaRepayment.strategy === 'montant_cible') {
    return `${fmtCompactEuro(phase.ccaRepayment.targetAmount ?? 0)}/an`;
  }
  return 'max tréso';
}

function getModeIcon(
  kind: TimelineSubPhaseKind,
  phase: AssociateRevenuePhaseInputV6,
): TimelineSubPhaseLayout['modeIcon'] {
  if (kind === 'distribution') {
    if (phase.distribution.dividendsStrategy === 'aucun') return 'none';
    return phase.distribution.dividendsStrategy === 'montant_cible' ? 'target' : 'max';
  }
  if (kind === 'cca_repayment') {
    if (phase.ccaRepayment.strategy === 'aucun') return 'none';
    return phase.ccaRepayment.strategy === 'montant_cible' ? 'target' : 'max';
  }
  return undefined;
}

function subPhaseDetail(kind: TimelineSubPhaseKind, phase: AssociateRevenuePhaseInputV6): string {
  const label = SUB_PHASE_LABELS[kind];
  if (kind === 'remuneration') {
    return phase.remuneration.enabled
      ? `${label} ${fmtCompactEuro(computeNetRevenue(phase))} net`
      : `${label} inactive`;
  }
  if (kind === 'distribution') {
    return phase.distribution.enabled
      ? `${label} ${getDistributionLabel(phase)}`
      : `${label} inactive`;
  }
  if (kind === 'cca_contribution') {
    return phase.ccaContribution.enabled
      ? `${label} ${getCcaContributionLabel(phase)}`
      : `${label} inactive`;
  }
  return phase.ccaRepayment.enabled
    ? `${label} ${getCcaRepaymentLabel(phase)}`
    : `${label} inactive`;
}

function buildSubPhases(
  phase: AssociateRevenuePhaseInputV6,
  subsidiaries: SubsidiaryInput[],
): TimelineSubPhaseLayout[] {
  return [
    {
      kind: 'remuneration',
      enabled: phase.remuneration.enabled && phase.remuneration.source !== 'none',
      bandIndex: 0,
      shortLabel: getRemunerationLabel(phase, subsidiaries),
      detail: subPhaseDetail('remuneration', phase),
    },
    {
      kind: 'distribution',
      enabled: phase.distribution.enabled,
      bandIndex: 1,
      shortLabel: getDistributionLabel(phase),
      detail: subPhaseDetail('distribution', phase),
      modeIcon: getModeIcon('distribution', phase),
    },
    {
      kind: 'cca_contribution',
      enabled: phase.ccaContribution.enabled,
      bandIndex: 2,
      shortLabel: getCcaContributionLabel(phase),
      detail: subPhaseDetail('cca_contribution', phase),
    },
    {
      kind: 'cca_repayment',
      enabled: phase.ccaRepayment.enabled,
      bandIndex: 3,
      shortLabel: getCcaRepaymentLabel(phase),
      detail: subPhaseDetail('cca_repayment', phase),
      modeIcon: getModeIcon('cca_repayment', phase),
    },
  ];
}

export function computeTimelineRange(
  company: CompanyInputV6,
  associate: AssociateInputV6,
  fallbackHorizonYears = 15,
): TresoTimelineLayout {
  const projectionStartYear =
    company.projectionStartYear ??
    associate.profile?.projectionStartYear ??
    new Date().getFullYear();
  const sortedPhases = sortPhases(associate.revenuePhases);
  const baseEndYear = projectionStartYear + fallbackHorizonYears - 1;
  const lastPhaseEndYear = sortedPhases[sortedPhases.length - 1]?.endYear ?? projectionStartYear;
  const disposalYears = company.subsidiaries
    .map((subsidiary) => subsidiary.disposal?.year)
    .filter((year): year is number => Number.isFinite(year));
  const endYear = Math.max(baseEndYear, lastPhaseEndYear, ...disposalYears);
  const totalYears = Math.max(1, endYear - projectionStartYear + 1);
  const svgWidth = Math.max(
    MIN_SVG_WIDTH,
    totalYears * MIN_YEAR_PX + TRACK_LEFT + TRACK_RIGHT_PADDING,
  );
  const trackRight = getTrackRight(svgWidth);
  const ticks = Array.from({ length: endYear - projectionStartYear + 1 }, (_, index) => {
    const year = projectionStartYear + index;
    return {
      year,
      age: associate.profile ? associate.profile.currentAge + index : null,
      x: getYearX(year, projectionStartYear, endYear, trackRight),
    };
  });
  const paliers = sortedPhases.map((phase) => ({
    phase,
    startYear: phase.startYear,
    endYear: phase.endYear,
    x: getPhaseX(phase.startYear, projectionStartYear, endYear, trackRight),
    width: getPhaseWidth(phase.startYear, phase.endYear, projectionStartYear, endYear, trackRight),
    netRevenue: computeNetRevenue(phase),
    subPhases: buildSubPhases(phase, company.subsidiaries),
  }));

  return {
    startYear: projectionStartYear,
    endYear,
    svgWidth,
    svgHeight: SVG_HEIGHT,
    trackLeft: TRACK_LEFT,
    trackRight,
    ticks,
    paliers,
  };
}
