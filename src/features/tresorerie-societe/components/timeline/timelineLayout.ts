import type {
  AssociateInputV5,
  AssociateProfileInput,
  AssociateRevenuePhaseInput,
  CompanyInputV5,
} from '@/engine/tresorerie/types';
import {
  computeComplement,
  computeNetRevenue,
  getPhaseEndYear,
  sortPhases,
} from '../../utils/revenuePhases';

export interface TimelinePhaseLayout {
  phase: AssociateRevenuePhaseInput;
  startYear: number;
  endYear: number;
  x: number;
  width: number;
  netRevenue: number;
  complement: number;
}

export interface TimelineMilestoneLayout {
  id: string;
  label: 'S' | 'R' | 'C';
  year: number;
  x: number;
  dotY: number;
  description: string;
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
  phases: TimelinePhaseLayout[];
  milestones: TimelineMilestoneLayout[];
}

const MIN_SVG_WIDTH = 1000;
const SVG_HEIGHT = 190;
const TRACK_LEFT = 64;
const TRACK_RIGHT_PADDING = 64;
const MIN_YEAR_PX = 56;
const MILESTONE_X_GAP = 28;
const MILESTONE_DOT_Y = 76;
const MILESTONE_STACK_Y = 58;
const MILESTONE_STACK_GAP = 26;

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

function getPhaseX(startYear: number, rangeStartYear: number, rangeEndYear: number, trackRight: number): number {
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
  return Math.max(24, (visibleEnd - visibleStart + 1) * slotWidth);
}

function deriveRetirementYear(
  phases: AssociateRevenuePhaseInput[],
  profile: AssociateProfileInput | undefined,
  projectionStartYear: number,
  horizonYear: number,
): number | undefined {
  const sorted = sortPhases(phases);
  const firstNeedOnlyPhase = sorted.find(phase =>
    phase.source === 'none' && phase.annualNetIncomeNeed > 0,
  );
  if (firstNeedOnlyPhase) return firstNeedOnlyPhase.startYear;

  if (!profile) return undefined;
  const ageGap = profile.retirementAge - profile.currentAge;
  if (!Number.isFinite(ageGap) || ageGap < 0) return undefined;
  return Math.min(projectionStartYear + ageGap, horizonYear);
}

function resolveMilestonePositions(milestones: TimelineMilestoneLayout[]): TimelineMilestoneLayout[] {
  const byYear = new Map<number, TimelineMilestoneLayout[]>();
  for (const milestone of milestones) {
    byYear.set(milestone.year, [...(byYear.get(milestone.year) ?? []), milestone]);
  }

  return milestones.map(milestone => {
    const sameYear = byYear.get(milestone.year) ?? [milestone];
    const index = sameYear.findIndex(item => item.id === milestone.id);
    if (sameYear.length <= 1 || index < 0) return milestone;

    const centeredOffset = index - (sameYear.length - 1) / 2;
    return {
      ...milestone,
      x: milestone.x + centeredOffset * MILESTONE_X_GAP,
      dotY: MILESTONE_STACK_Y + index * MILESTONE_STACK_GAP,
    };
  });
}

export function computeTimelineRange(
  company: CompanyInputV5,
  associate: AssociateInputV5,
  fallbackHorizonYears = 15,
): TresoTimelineLayout {
  const projectionStartYear =
    company.projectionStartYear ??
    associate.profile?.projectionStartYear ??
    new Date().getFullYear();
  const sortedPhases = sortPhases(associate.revenuePhases);
  const baseEndYear = projectionStartYear + fallbackHorizonYears - 1;
  const lastPhaseStartYear = sortedPhases[sortedPhases.length - 1]?.startYear ?? projectionStartYear;
  const disposalYears = company.subsidiaries
    .map(subsidiary => subsidiary.disposal?.year)
    .filter((year): year is number => Number.isFinite(year));
  const endYear = Math.max(baseEndYear, lastPhaseStartYear + 2, ...disposalYears);
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
  const phases = sortedPhases.map(phase => {
    const phaseEndYear = getPhaseEndYear(phase, sortedPhases, endYear);
    return {
      phase,
      startYear: phase.startYear,
      endYear: phaseEndYear,
      x: getPhaseX(phase.startYear, projectionStartYear, endYear, trackRight),
      width: getPhaseWidth(phase.startYear, phaseEndYear, projectionStartYear, endYear, trackRight),
      netRevenue: computeNetRevenue(phase),
      complement: computeComplement(phase),
    };
  });
  const milestones: TimelineMilestoneLayout[] = [{
    id: 'start',
    label: 'S',
    year: projectionStartYear,
    x: getYearX(projectionStartYear, projectionStartYear, endYear, trackRight),
    dotY: MILESTONE_DOT_Y,
    description: 'Début de projection',
  }];
  const retirementYear = deriveRetirementYear(sortedPhases, associate.profile, projectionStartYear, endYear);
  if (retirementYear != null) {
    milestones.push({
      id: 'retirement',
      label: 'R',
      year: retirementYear,
      x: getYearX(retirementYear, projectionStartYear, endYear, trackRight),
      dotY: MILESTONE_DOT_Y,
      description: 'Début du besoin complémentaire',
    });
  }
  for (const subsidiary of company.subsidiaries) {
    const year = subsidiary.disposal?.year;
    if (year == null) continue;
    milestones.push({
      id: `cession-${subsidiary.id}`,
      label: 'C',
      year,
      x: getYearX(year, projectionStartYear, endYear, trackRight),
      dotY: MILESTONE_DOT_Y,
      description: `Cession ${subsidiary.label}`,
    });
  }

  return {
    startYear: projectionStartYear,
    endYear,
    svgWidth,
    svgHeight: SVG_HEIGHT,
    trackLeft: TRACK_LEFT,
    trackRight,
    ticks,
    phases,
    milestones: resolveMilestonePositions(milestones),
  };
}
