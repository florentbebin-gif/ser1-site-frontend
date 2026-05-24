import type { PrevoyanceContractDraft } from './types';
import {
  annualValueFromAmountRule,
  clampPct,
  computeInvaliditePalierAmount,
  findInvaliditePalier,
  normalizeRegimeStack,
  percentOfReference,
  type InvaliditeCoverageInput,
  type PrevoyanceCoverageBar,
  type PrevoyanceCoverageSegment,
} from './coverageShared';
import type { PrevoyanceRegimeSettings } from './types';

export interface PrevoyanceInvaliditePctPalier {
  rate: number;
  roSegments: Array<{ code: string; label: string; pct: number }>;
  roPct: number;
  contratPct: number;
  totalPct: number;
}

export interface PrevoyanceInvaliditePctChart {
  reference: number;
  paliers: PrevoyanceInvaliditePctPalier[];
}

function invaliditeThresholds({
  regimeStack: inputRegimeStack,
  contracts,
}: Pick<InvaliditeCoverageInput, 'regimeStack' | 'contracts'>): number[] {
  const regimeStack = normalizeRegimeStack(inputRegimeStack);
  const thresholds = new Set<number>();
  regimeStack.forEach((regime) => {
    regime.data.invalidite.paliers.forEach((palier) => thresholds.add(palier.fromRate));
  });
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
  roPct: number,
  contractAggregationMode: NonNullable<InvaliditeCoverageInput['contractAggregationMode']>,
): number {
  const individualContracts = contracts.filter(
    (contract): contract is Extract<PrevoyanceContractDraft, { kind: 'individuel' }> =>
      contract.kind === 'individuel',
  );
  const selectedContracts =
    contractAggregationMode === 'compare' ? individualContracts.slice(0, 1) : individualContracts;
  const values = selectedContracts.map((contract) => {
    const palier = findInvaliditePalier(contract.invalidite.paliers, threshold);
    const amount = palier ? computeInvaliditePalierAmount(palier, threshold) : 0;
    return {
      indemnisation: contract.invalidite.indemnisation,
      pct: percentOfReference(amount, referenceAnnual),
    };
  });
  const forfaitairePct = values
    .filter((value) => value.indemnisation === 'forfaitaire')
    .reduce((sum, value) => sum + value.pct, 0);
  const indemnitairePct = Math.max(
    0,
    ...values.filter((value) => value.indemnisation === 'indemnitaire').map((value) => value.pct),
  );
  const indemnitaireRelais = Math.min(indemnitairePct, Math.max(0, 100 - roPct));

  return forfaitairePct + indemnitaireRelais;
}

function invaliditeContratPct({
  contracts,
  kind,
  contractAggregationMode = 'compare',
  threshold,
  referenceAnnual,
  salaireBrutAnnuel,
  roPct,
}: InvaliditeCoverageInput & { threshold: number; roPct: number }): number {
  if (kind === 'collectif') {
    return collectiveInvaliditePct(contracts, threshold, salaireBrutAnnuel, referenceAnnual);
  }
  return individualInvaliditePct(
    contracts,
    threshold,
    referenceAnnual,
    roPct,
    contractAggregationMode,
  );
}

export function buildInvaliditeCoverageBars({
  regimeStack: inputRegimeStack,
  contracts,
  kind,
  contractAggregationMode = 'compare',
  referenceAnnual,
  salaireBrutAnnuel,
}: InvaliditeCoverageInput): PrevoyanceCoverageBar[] {
  const regimeStack = normalizeRegimeStack(inputRegimeStack);
  const bars: PrevoyanceCoverageBar[] = [
    {
      key: 'net-percu',
      label: 'Net perçu',
      totalPct: 100,
      segments: [{ kind: 'reference', label: 'Net perçu', valuePct: 100 }],
    },
  ];

  invaliditeThresholds({ regimeStack, contracts }).forEach((threshold) => {
    const roSegments = buildRegimeInvaliditeSegments({
      regimeStack,
      threshold,
      referenceAnnual,
      salaireBrutAnnuel,
    });
    const roPct = roSegments.reduce((sum, segment) => sum + segment.pct, 0);
    const contratPct = invaliditeContratPct({
      regimeStack,
      contracts,
      kind,
      contractAggregationMode,
      referenceAnnual,
      salaireBrutAnnuel,
      threshold,
      roPct,
    });
    const segments: PrevoyanceCoverageSegment[] = roSegments.map((segment) => ({
      kind: 'ro',
      label: segment.label,
      valuePct: segment.pct,
    }));
    if (segments.length === 0) {
      segments.push({ kind: 'ro', label: 'Régime obligatoire', valuePct: 0 });
    }
    segments.push({ kind: 'contrat', label: 'Contrats de prévoyance', valuePct: contratPct });
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
  regimeStack: inputRegimeStack,
  contracts,
  kind,
  contractAggregationMode = 'compare',
  referenceAnnual,
  salaireBrutAnnuel,
}: InvaliditeCoverageInput): PrevoyanceInvaliditePctChart {
  const regimeStack = normalizeRegimeStack(inputRegimeStack);
  return {
    reference: 100,
    paliers: invaliditeThresholds({ regimeStack, contracts }).map((rate) => {
      const roSegments = buildRegimeInvaliditeSegments({
        regimeStack,
        threshold: rate,
        referenceAnnual,
        salaireBrutAnnuel,
      });
      const roPct = roSegments.reduce((sum, segment) => sum + segment.pct, 0);
      const contratPct = invaliditeContratPct({
        regimeStack,
        contracts,
        kind,
        contractAggregationMode,
        referenceAnnual,
        salaireBrutAnnuel,
        threshold: rate,
        roPct,
      });

      return {
        rate,
        roSegments,
        roPct,
        contratPct,
        totalPct: clampPct(roPct + contratPct),
      };
    }),
  };
}

function buildRegimeInvaliditeSegments({
  regimeStack,
  threshold,
  referenceAnnual,
  salaireBrutAnnuel,
}: {
  regimeStack: PrevoyanceRegimeSettings[];
  threshold: number;
  referenceAnnual: number;
  salaireBrutAnnuel: number;
}): Array<{ code: string; label: string; pct: number }> {
  return regimeStack.map((regime) => {
    const roPalier = findInvaliditePalier(regime.data.invalidite.paliers, threshold);
    return {
      code: regime.code,
      label: roPalier?.amount.label ?? regime.caisse,
      pct: percentOfReference(
        annualValueFromAmountRule(roPalier?.amount, referenceAnnual, salaireBrutAnnuel),
        referenceAnnual,
      ),
    };
  });
}
