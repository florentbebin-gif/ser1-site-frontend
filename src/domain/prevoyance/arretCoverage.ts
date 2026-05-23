import { PREVOYANCE_MAX_ARRET_DURATION_DAYS } from './constants';
import type {
  PrevoyanceArretSettings,
  PrevoyanceContractDraft,
  PrevoyanceRegimeSettings,
} from './types';
import {
  annualValueFromAmountRule,
  buildMaintienSegment,
  clampPct,
  dailyValueFromAmountRule,
  percentOfReference,
  type ArretCoverageInput,
  type PrevoyanceCoverageBar,
  type PrevoyanceCoverageSegment,
  type PrevoyanceRangeLike,
} from './coverageShared';

export type { PrevoyanceRangeLike } from './coverageShared';

export interface PrevoyanceArretEuroPeriod {
  from: number;
  to: number;
  roEuro: number;
  contratEuro: number;
  totalEuro: number;
}

export interface PrevoyanceArretEuroChart {
  reference: number;
  periods: PrevoyanceArretEuroPeriod[];
}

function capArretDay(days: number): number {
  return Math.min(Math.max(0, days), PREVOYANCE_MAX_ARRET_DURATION_DAYS);
}

function readRangeFrom(range: PrevoyanceRangeLike): number {
  return Math.max(0, Number(range.from ?? range.fromDay ?? 0) || 0);
}

function readRangeTo(range: PrevoyanceRangeLike): number {
  return capArretDay(Number(range.to ?? range.toDay ?? PREVOYANCE_MAX_ARRET_DURATION_DAYS));
}

function contractArretPaliers(contract: Extract<PrevoyanceContractDraft, { kind: 'individuel' }>) {
  return contract.arret.paliers.map((item) => ({
    ...item,
    label: '',
    amount: {
      mode: 'fixed_eur_day' as const,
      value: item.amount,
      label: `${item.amount}`,
    },
  }));
}

export function unionBoundaries(paliers: PrevoyanceRangeLike[]): number[] {
  if (paliers.length === 0) return [0, PREVOYANCE_MAX_ARRET_DURATION_DAYS];
  const boundaries = new Set<number>([0, PREVOYANCE_MAX_ARRET_DURATION_DAYS]);

  paliers.forEach((palier) => {
    const from = capArretDay(readRangeFrom(palier));
    const to = readRangeTo(palier);
    boundaries.add(from);
    boundaries.add(to);
    if (from > 0) boundaries.add(from - 1);
    if (to < PREVOYANCE_MAX_ARRET_DURATION_DAYS) boundaries.add(to + 1);
  });

  return Array.from(boundaries).sort((a, b) => a - b);
}

export function splitIntoSubPeriods(
  paliers: PrevoyanceRangeLike[],
  boundaries: number[] = unionBoundaries(paliers),
): Array<{ from: number; to: number }> {
  if (paliers.length === 0) return [{ from: 0, to: PREVOYANCE_MAX_ARRET_DURATION_DAYS }];

  const starts = new Set<number>([0]);
  paliers.forEach((palier) => {
    const from = capArretDay(readRangeFrom(palier));
    const to = readRangeTo(palier);
    starts.add(from);
    if (to < PREVOYANCE_MAX_ARRET_DURATION_DAYS) starts.add(to + 1);
  });

  const max = Math.max(...boundaries, PREVOYANCE_MAX_ARRET_DURATION_DAYS);
  starts.add(Math.min(PREVOYANCE_MAX_ARRET_DURATION_DAYS + 1, max + 1));
  const sortedStarts = Array.from(starts)
    .filter((value) => value >= 0 && value <= PREVOYANCE_MAX_ARRET_DURATION_DAYS + 1)
    .sort((a, b) => a - b);

  return sortedStarts
    .slice(0, -1)
    .map((from, index) => {
      const nextStart = sortedStarts[index + 1] ?? PREVOYANCE_MAX_ARRET_DURATION_DAYS + 1;
      return {
        from,
        to: Math.min(PREVOYANCE_MAX_ARRET_DURATION_DAYS, nextStart - 1),
      };
    })
    .filter((period) => period.from <= period.to);
}

export function findArretPalierForRange(
  paliers: PrevoyanceArretSettings['paliers'],
  fromDay: number,
  toDay: number,
) {
  const from = capArretDay(fromDay);
  const to = capArretDay(toDay);
  return (
    paliers.find((palier) => {
      const palierTo = capArretDay(palier.toDay ?? PREVOYANCE_MAX_ARRET_DURATION_DAYS);
      return palier.fromDay <= to && palierTo >= from;
    }) ?? null
  );
}

function buildSinglePalierArretWindows(regime: PrevoyanceRegimeSettings): Array<[number, number]> {
  const max = capArretDay(regime.data.arret.maxDurationDays);
  const carence = capArretDay(regime.data.arret.carences.maladie);
  const windows: Array<[number, number]> = [];

  if (carence > 0) windows.push([0, Math.min(carence, max)]);
  if (carence < Math.min(365, max)) windows.push([carence + 1, Math.min(365, max)]);
  if (max > 365) windows.push([366, max]);

  return windows.length ? windows : [[0, max]];
}

function buildArretWindows(
  regime: PrevoyanceRegimeSettings | null,
  contracts: PrevoyanceContractDraft[],
): Array<[number, number]> {
  const max = capArretDay(regime?.data.arret.maxDurationDays ?? PREVOYANCE_MAX_ARRET_DURATION_DAYS);
  const regimePaliers = regime?.data.arret.paliers ?? [];
  if (regimePaliers.length === 0) return [[0, max]];
  if (regime && regimePaliers.length === 1) return buildSinglePalierArretWindows(regime);

  const ranges = new Map<string, [number, number]>();
  const addRange = (fromDay: number, toDay: number | null) => {
    const from = capArretDay(fromDay);
    const to = capArretDay(toDay ?? max);
    if (from > max || to < 0 || from > to) return;
    const range: [number, number] = [Math.max(0, from), Math.min(max, to)];
    ranges.set(`${range[0]}-${range[1]}`, range);
  };

  regimePaliers.forEach((palier) => addRange(palier.fromDay, palier.toDay));
  contracts.forEach((contract) => {
    if (contract.kind === 'individuel') {
      contract.arret.paliers.forEach((palier) => addRange(palier.fromDay, palier.toDay));
    }
  });

  const windows = Array.from(ranges.values()).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return windows.length ? windows : [[0, max]];
}

export function buildArretCoverageBars({
  regime,
  contracts,
  kind,
  maintienPalier,
  referenceAnnual,
  salaireBrutAnnuel,
}: ArretCoverageInput): PrevoyanceCoverageBar[] {
  const bars: PrevoyanceCoverageBar[] = [
    {
      key: 'net-percu',
      label: 'Net perçu',
      totalPct: 100,
      segments: [{ kind: 'reference', label: 'Net perçu', valuePct: 100 }],
    },
  ];

  const windows = buildArretWindows(regime, contracts);
  windows.forEach(([fromDay, toDay]) => {
    const roPalier = regime
      ? findArretPalierForRange(regime.data.arret.paliers, fromDay, toDay)
      : null;
    const roPct = percentOfReference(
      annualValueFromAmountRule(roPalier?.amount, referenceAnnual, salaireBrutAnnuel),
      referenceAnnual,
    );
    const contratPct =
      kind === 'collectif'
        ? buildCollectiveArretPct(contracts, salaireBrutAnnuel, referenceAnnual)
        : buildIndividualArretPct(contracts, fromDay, toDay, referenceAnnual, salaireBrutAnnuel);
    const maintienSegment =
      kind === 'collectif' ? buildMaintienSegment(fromDay, maintienPalier) : null;
    const segments: PrevoyanceCoverageSegment[] = [
      { kind: 'ro', label: roPalier?.amount.label ?? 'Régime obligatoire', valuePct: roPct },
    ];
    if (maintienSegment) segments.push(maintienSegment);
    segments.push({ kind: 'contrat', label: 'Contrats de prévoyance', valuePct: contratPct });
    bars.push({
      key: `${fromDay}-${toDay}`,
      label: `${fromDay} à ${toDay} j`,
      totalPct: clampPct(segments.reduce((sum, segment) => sum + segment.valuePct, 0)),
      segments,
    });
  });

  return bars;
}

function buildCollectiveArretPct(
  contracts: PrevoyanceContractDraft[],
  salaireBrutAnnuel: number,
  referenceAnnual: number,
): number {
  return percentOfReference(
    contracts
      .filter(
        (contract): contract is Extract<PrevoyanceContractDraft, { kind: 'collectif' }> =>
          contract.kind === 'collectif',
      )
      .reduce(
        (sum, contract) => sum + Math.max(0, salaireBrutAnnuel) * (contract.arret.salairePct / 100),
        0,
      ),
    referenceAnnual,
  );
}

function buildIndividualArretPct(
  contracts: PrevoyanceContractDraft[],
  fromDay: number,
  toDay: number,
  referenceAnnual: number,
  salaireBrutAnnuel: number,
): number {
  return percentOfReference(
    contracts
      .filter(
        (contract): contract is Extract<PrevoyanceContractDraft, { kind: 'individuel' }> =>
          contract.kind === 'individuel',
      )
      .reduce((sum, contract) => {
        const palier = findArretPalierForRange(contractArretPaliers(contract), fromDay, toDay);
        return sum + annualValueFromAmountRule(palier?.amount, referenceAnnual, salaireBrutAnnuel);
      }, 0),
    referenceAnnual,
  );
}

export function buildArretEuroChart({
  regime,
  contracts,
  kind,
  maintienPalier,
  referenceAnnual,
  salaireBrutAnnuel,
}: ArretCoverageInput): PrevoyanceArretEuroChart {
  const rangePaliers: PrevoyanceRangeLike[] = [
    ...(regime?.data.arret.paliers ?? []).map((palier) => ({
      fromDay: palier.fromDay,
      toDay: palier.toDay,
    })),
    ...contracts.flatMap((contract) =>
      contract.kind === 'individuel'
        ? contract.arret.paliers.map((palier) => ({
            fromDay: palier.fromDay,
            toDay: palier.toDay,
          }))
        : [],
    ),
  ];
  const periods = splitIntoSubPeriods(rangePaliers, unionBoundaries(rangePaliers));
  const reference = Math.max(0, referenceAnnual) / 365;

  return {
    reference,
    periods: periods.map(({ from, to }) =>
      buildArretEuroPeriod({
        from,
        to,
        regime,
        contracts,
        kind,
        maintienPalier,
        referenceAnnual,
        salaireBrutAnnuel,
        reference,
      }),
    ),
  };
}

function buildArretEuroPeriod({
  from,
  to,
  regime,
  contracts,
  kind,
  maintienPalier,
  referenceAnnual,
  salaireBrutAnnuel,
  reference,
}: ArretCoverageInput & {
  from: number;
  to: number;
  reference: number;
}): PrevoyanceArretEuroPeriod {
  const roPalier = regime ? findArretPalierForRange(regime.data.arret.paliers, from, to) : null;
  const maintienSegment = kind === 'collectif' ? buildMaintienSegment(from, maintienPalier) : null;
  const roEuro =
    dailyValueFromAmountRule(roPalier?.amount, referenceAnnual, salaireBrutAnnuel) +
    (maintienSegment ? reference * (maintienSegment.valuePct / 100) : 0);
  const contratEuro = contracts.reduce((sum, contract) => {
    if (contract.kind === 'collectif') {
      return sum + (Math.max(0, salaireBrutAnnuel) * (contract.arret.salairePct / 100)) / 365;
    }
    const palier = findArretPalierForRange(contractArretPaliers(contract), from, to);
    return sum + dailyValueFromAmountRule(palier?.amount, referenceAnnual, salaireBrutAnnuel);
  }, 0);

  return {
    from,
    to,
    roEuro: Math.round(roEuro),
    contratEuro: Math.round(contratEuro),
    totalEuro: Math.round(roEuro + contratEuro),
  };
}
