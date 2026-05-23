import type { PrevoyanceContractDraft } from './types';
import {
  annualValueFromAmountRule,
  clampPct,
  computeInvaliditePalierAmount,
  findInvaliditePalier,
  percentOfReference,
  type InvaliditeCoverageInput,
  type PrevoyanceCoverageBar,
  type PrevoyanceCoverageSegment,
} from './coverageShared';

export interface PrevoyanceInvaliditePctPalier {
  rate: number;
  roPct: number;
  contratPct: number;
  totalPct: number;
}

export interface PrevoyanceInvaliditePctChart {
  reference: number;
  paliers: PrevoyanceInvaliditePctPalier[];
}

function invaliditeThresholds({
  regime,
  contracts,
}: Pick<InvaliditeCoverageInput, 'regime' | 'contracts'>): number[] {
  const thresholds = new Set<number>();
  (regime?.data.invalidite.paliers ?? []).forEach((palier) => thresholds.add(palier.fromRate));
  contracts.forEach((contract) => {
    contract.invalidite.paliers.forEach((palier) => thresholds.add(palier.fromRate));
  });
  if (thresholds.size === 0) thresholds.add(0);
  return Array.from(thresholds).sort((a, b) => a - b);
}

function collectiveInvaliditePct(
  contracts: PrevoyanceContractDraft[],
  threshold: number,
  salaireBrutAnnuel: number,
  referenceAnnual: number,
): number {
  return percentOfReference(
    contracts
      .filter(
        (contract): contract is Extract<PrevoyanceContractDraft, { kind: 'collectif' }> =>
          contract.kind === 'collectif',
      )
      .reduce((sum, contract) => {
        const palier = findInvaliditePalier(contract.invalidite.paliers, threshold);
        const salairePct = palier ? computeInvaliditePalierAmount(palier, threshold) : 0;
        return sum + Math.max(0, salaireBrutAnnuel) * (salairePct / 100);
      }, 0),
    referenceAnnual,
  );
}

function individualInvaliditePct(
  contracts: PrevoyanceContractDraft[],
  threshold: number,
  referenceAnnual: number,
): number {
  return percentOfReference(
    contracts
      .filter(
        (contract): contract is Extract<PrevoyanceContractDraft, { kind: 'individuel' }> =>
          contract.kind === 'individuel',
      )
      .reduce((sum, contract) => {
        const palier = findInvaliditePalier(contract.invalidite.paliers, threshold);
        return sum + (palier ? computeInvaliditePalierAmount(palier, threshold) : 0);
      }, 0),
    referenceAnnual,
  );
}

function invaliditeContratPct({
  contracts,
  kind,
  threshold,
  referenceAnnual,
  salaireBrutAnnuel,
}: InvaliditeCoverageInput & { threshold: number }): number {
  if (kind === 'collectif') {
    return collectiveInvaliditePct(contracts, threshold, salaireBrutAnnuel, referenceAnnual);
  }
  return individualInvaliditePct(contracts, threshold, referenceAnnual);
}

export function buildInvaliditeCoverageBars({
  regime,
  contracts,
  kind,
  referenceAnnual,
  salaireBrutAnnuel,
}: InvaliditeCoverageInput): PrevoyanceCoverageBar[] {
  const bars: PrevoyanceCoverageBar[] = [
    {
      key: 'net-percu',
      label: 'Net perçu',
      totalPct: 100,
      segments: [{ kind: 'reference', label: 'Net perçu', valuePct: 100 }],
    },
  ];

  invaliditeThresholds({ regime, contracts }).forEach((threshold) => {
    const roPalier = findInvaliditePalier(regime?.data.invalidite.paliers ?? [], threshold);
    const roPct = percentOfReference(
      annualValueFromAmountRule(roPalier?.amount, referenceAnnual, salaireBrutAnnuel),
      referenceAnnual,
    );
    const contratPct = invaliditeContratPct({
      regime,
      contracts,
      kind,
      referenceAnnual,
      salaireBrutAnnuel,
      threshold,
    });
    const segments: PrevoyanceCoverageSegment[] = [
      { kind: 'ro', label: roPalier?.amount.label ?? 'Régime obligatoire', valuePct: roPct },
      { kind: 'contrat', label: 'Contrats de prévoyance', valuePct: contratPct },
    ];
    bars.push({
      key: `${threshold}`,
      label: `${threshold} %`,
      totalPct: clampPct(segments.reduce((sum, segment) => sum + segment.valuePct, 0)),
      segments,
    });
  });

  return bars;
}

export function buildInvaliditePctChart({
  regime,
  contracts,
  kind,
  referenceAnnual,
  salaireBrutAnnuel,
}: InvaliditeCoverageInput): PrevoyanceInvaliditePctChart {
  return {
    reference: 100,
    paliers: invaliditeThresholds({ regime, contracts }).map((rate) => {
      const roPalier = findInvaliditePalier(regime?.data.invalidite.paliers ?? [], rate);
      const roPct = percentOfReference(
        annualValueFromAmountRule(roPalier?.amount, referenceAnnual, salaireBrutAnnuel),
        referenceAnnual,
      );
      const contratPct = invaliditeContratPct({
        regime,
        contracts,
        kind,
        referenceAnnual,
        salaireBrutAnnuel,
        threshold: rate,
      });

      return {
        rate,
        roPct,
        contratPct,
        totalPct: clampPct(roPct + contratPct),
      };
    }),
  };
}
