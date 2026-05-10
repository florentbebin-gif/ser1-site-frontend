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
  ticks: TimelineYearTick[];
  phases: TimelinePhaseLayout[];
  milestones: TimelineMilestoneLayout[];
}

const SVG_WIDTH = 1000;
const SVG_HEIGHT = 190;
const TRACK_LEFT = 64;
const TRACK_RIGHT = 936;

function clampYear(year: number, startYear: number, endYear: number): number {
  return Math.min(Math.max(year, startYear), endYear);
}

function getYearX(year: number, startYear: number, endYear: number): number {
  const totalYears = Math.max(1, endYear - startYear + 1);
  const slotWidth = (TRACK_RIGHT - TRACK_LEFT) / totalYears;
  return TRACK_LEFT + (clampYear(year, startYear, endYear) - startYear + 0.5) * slotWidth;
}

function getPhaseX(startYear: number, rangeStartYear: number, rangeEndYear: number): number {
  const totalYears = Math.max(1, rangeEndYear - rangeStartYear + 1);
  const slotWidth = (TRACK_RIGHT - TRACK_LEFT) / totalYears;
  return TRACK_LEFT + Math.max(0, startYear - rangeStartYear) * slotWidth;
}

function getPhaseWidth(startYear: number, endYear: number, rangeStartYear: number, rangeEndYear: number): number {
  const totalYears = Math.max(1, rangeEndYear - rangeStartYear + 1);
  const slotWidth = (TRACK_RIGHT - TRACK_LEFT) / totalYears;
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
  const ticks = Array.from({ length: endYear - projectionStartYear + 1 }, (_, index) => {
    const year = projectionStartYear + index;
    return {
      year,
      age: associate.profile ? associate.profile.currentAge + index : null,
      x: getYearX(year, projectionStartYear, endYear),
    };
  });
  const phases = sortedPhases.map(phase => {
    const phaseEndYear = getPhaseEndYear(phase, sortedPhases, endYear);
    return {
      phase,
      startYear: phase.startYear,
      endYear: phaseEndYear,
      x: getPhaseX(phase.startYear, projectionStartYear, endYear),
      width: getPhaseWidth(phase.startYear, phaseEndYear, projectionStartYear, endYear),
      netRevenue: computeNetRevenue(phase),
      complement: computeComplement(phase),
    };
  });
  const milestones: TimelineMilestoneLayout[] = [{
    id: 'start',
    label: 'S',
    year: projectionStartYear,
    x: getYearX(projectionStartYear, projectionStartYear, endYear),
    description: 'Début de projection',
  }];
  const retirementYear = deriveRetirementYear(sortedPhases, associate.profile, projectionStartYear, endYear);
  if (retirementYear != null) {
    milestones.push({
      id: 'retirement',
      label: 'R',
      year: retirementYear,
      x: getYearX(retirementYear, projectionStartYear, endYear),
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
      x: getYearX(year, projectionStartYear, endYear),
      description: `Cession ${subsidiary.label}`,
    });
  }

  return {
    startYear: projectionStartYear,
    endYear,
    svgWidth: SVG_WIDTH,
    svgHeight: SVG_HEIGHT,
    ticks,
    phases,
    milestones,
  };
}
