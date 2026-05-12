import type {
  AssociateRevenuePhaseInputV6,
  AssociateRevenuePhaseSource,
} from '@/engine/tresorerie/types';

export type SubPhaseKey = 'remuneration' | 'distribution' | 'ccaContribution' | 'ccaRepayment';

export const SUB_PHASE_NAV: Array<{ key: SubPhaseKey; label: string }> = [
  { key: 'remuneration', label: 'Rémunération' },
  { key: 'distribution', label: 'Distribution' },
  { key: 'ccaContribution', label: 'Constitution CCA' },
  { key: 'ccaRepayment', label: 'Remboursement CCA' },
];

export function fmtEuro(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR')} €`;
}

export function normalizeSourcePatch(
  source: AssociateRevenuePhaseSource,
): Partial<AssociateRevenuePhaseInputV6['remuneration']> {
  if (source === 'none') {
    return {
      enabled: false,
      source,
      subsidiaryId: undefined,
      loadedAnnualCost: 0,
      socialChargeRate: 0,
    };
  }
  return { enabled: true, source };
}

function rangesOverlap(
  first: { startYear: number; endYear: number },
  second: { startYear: number; endYear: number },
): boolean {
  return first.startYear <= second.endYear && second.startYear <= first.endYear;
}

export function isSubPhaseActive(phase: AssociateRevenuePhaseInputV6, key: SubPhaseKey): boolean {
  if (key === 'remuneration') return phase.remuneration.enabled && phase.remuneration.source !== 'none';
  if (key === 'distribution') return phase.distribution.enabled;
  if (key === 'ccaContribution') return phase.ccaContribution.enabled;
  return phase.ccaRepayment.enabled;
}

function subPhaseLabel(key: SubPhaseKey): string {
  return SUB_PHASE_NAV.find(item => item.key === key)?.label ?? key;
}

export function findOverlappingPaliers(
  draft: AssociateRevenuePhaseInputV6,
  phases: AssociateRevenuePhaseInputV6[],
): string[] {
  return SUB_PHASE_NAV.flatMap(({ key }) => {
    if (!isSubPhaseActive(draft, key)) return [];
    const conflict = phases.find(phase =>
      phase.id !== draft.id &&
      isSubPhaseActive(phase, key) &&
      rangesOverlap(draft, phase),
    );
    if (!conflict) return [];
    return [
      `Conflit avec ${conflict.label?.trim() || `le palier ${conflict.startYear}-${conflict.endYear}`} sur la sous-phase ${subPhaseLabel(key)}.`,
    ];
  });
}
