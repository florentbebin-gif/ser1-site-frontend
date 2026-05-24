import { PREVOYANCE_MAX_ARRET_DURATION_DAYS } from './constants';
import type {
  PrevoyanceArretSettings,
  PrevoyanceContractDraft,
  PrevoyanceRegimeSettings,
} from './types';
import {
  buildMaintienSegment,
  clampPct,
  computeMaintienEmployeurEuro,
  dailyValueFromAmountRule,
  maintienRanges,
  normalizeRegimeStack,
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
  roSegments: Array<{ code: string; label: string; euro: number }>;
  roEuro: number;
  maintienEuro: number;
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

function collectiveArretPaliers(contract: Extract<PrevoyanceContractDraft, { kind: 'collectif' }>) {
  return contract.arret.paliers?.length
    ? contract.arret.paliers
    : [
        {
          fromDay: 0,
          toDay: PREVOYANCE_MAX_ARRET_DURATION_DAYS,
          salairePct: contract.arret.salairePct,
        },
      ];
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
  regimeStack: PrevoyanceRegimeSettings[],
  contracts: PrevoyanceContractDraft[],
  maintienPalier: ArretCoverageInput['maintienPalier'],
  kind: ArretCoverageInput['kind'],
): Array<[number, number]> {
  const max = capArretDay(
    Math.max(
      ...regimeStack.map((regime) => regime.data.arret.maxDurationDays),
      PREVOYANCE_MAX_ARRET_DURATION_DAYS,
    ),
  );
  const regimePaliers = regimeStack.flatMap((regime) => regime.data.arret.paliers);
  const maintienRangeList = kind === 'collectif' ? maintienRanges(maintienPalier) : [];
  if (regimePaliers.length === 0 && maintienRangeList.length === 0) return [[0, max]];

  const ranges = new Map<string, [number, number]>();
  const addRange = (fromDay: number, toDay: number | null) => {
    const from = capArretDay(fromDay);
    const to = capArretDay(toDay ?? max);
    if (from > max || to < 0 || from > to) return;
    const range: [number, number] = [Math.max(0, from), Math.min(max, to)];
    ranges.set(`${range[0]}-${range[1]}`, range);
  };

  if (regimeStack.length === 1 && regimePaliers.length === 1) {
    buildSinglePalierArretWindows(regimeStack[0] as PrevoyanceRegimeSettings).forEach(
      ([fromDay, toDay]) => addRange(fromDay, toDay),
    );
  } else {
    regimeStack.forEach((regime) => {
      regime.data.arret.paliers.forEach((palier) => addRange(palier.fromDay, palier.toDay));
      const carence = regime.data.arret.carences.maladie;
      if (carence > 0) addRange(0, carence);
    });
  }
  contracts.forEach((contract) => {
    if (contract.kind === 'individuel') {
      contract.arret.paliers.forEach((palier) => addRange(palier.fromDay, palier.toDay));
    } else {
      collectiveArretPaliers(contract).forEach((palier) => addRange(palier.fromDay, palier.toDay));
    }
  });
  maintienRangeList.forEach((range) =>
    addRange(Number(range.fromDay ?? range.from ?? 0), Number(range.toDay ?? range.to ?? max)),
  );

  const windows = Array.from(ranges.values()).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return windows.length ? windows : [[0, max]];
}

export function buildArretCoverageBars({
  regimeStack: inputRegimeStack,
  contracts,
  kind,
  contractAggregationMode = 'compare',
  maintienPalier,
  referenceAnnual,
  salaireBrutAnnuel,
}: ArretCoverageInput): PrevoyanceCoverageBar[] {
  const regimeStack = normalizeRegimeStack(inputRegimeStack);
  const bars: PrevoyanceCoverageBar[] = [
    {
      key: 'net-percu',
      label: 'Net perçu',
      totalPct: 100,
      segments: [{ kind: 'reference', label: 'Net perçu', valuePct: 100 }],
    },
  ];

  const windows = buildArretWindows(regimeStack, contracts, maintienPalier, kind);
  windows.forEach(([fromDay, toDay]) => {
    const roSegments = buildRegimeArretSegments({
      regimeStack,
      from: fromDay,
      to: toDay,
      referenceAnnual,
      salaireBrutAnnuel,
    });
    const roPct = roSegments.reduce((sum, segment) => sum + segment.valuePct, 0);
    const contratPct =
      kind === 'collectif'
        ? buildCollectiveArretPct(contracts, fromDay, toDay, salaireBrutAnnuel, referenceAnnual)
        : buildIndividualArretPct({
            contracts,
            fromDay,
            toDay,
            referenceAnnual,
            salaireBrutAnnuel,
            roEuro: (referenceAnnual / 365) * (roPct / 100),
            contractAggregationMode,
          });
    const roEuro = roSegments.reduce((sum, segment) => sum + segment.euro, 0);
    const maintienSegment =
      kind === 'collectif'
        ? buildMaintienSegment({
            fromDay,
            maintienPalier,
            roEuro,
            referenceAnnual,
            salaireBrutAnnuel,
          })
        : null;
    const segments: PrevoyanceCoverageSegment[] = roSegments.map((segment) => ({
      kind: 'ro',
      label: segment.label,
      valuePct: segment.valuePct,
    }));
    if (segments.length === 0) {
      segments.push({ kind: 'ro', label: 'Régime obligatoire', valuePct: 0 });
    }
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
  fromDay: number,
  toDay: number,
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
        (sum, contract) =>
          sum +
          Math.max(0, salaireBrutAnnuel) *
            (findCollectiveArretPctForRange(contract, fromDay, toDay) / 100),
        0,
      ),
    referenceAnnual,
  );
}

function findCollectiveArretPctForRange(
  contract: Extract<PrevoyanceContractDraft, { kind: 'collectif' }>,
  fromDay: number,
  toDay: number,
): number {
  const from = capArretDay(fromDay);
  const to = capArretDay(toDay);
  const palier = collectiveArretPaliers(contract).find((item) => {
    const palierTo = capArretDay(item.toDay ?? PREVOYANCE_MAX_ARRET_DURATION_DAYS);
    return item.fromDay <= to && palierTo >= from;
  });
  return palier?.salairePct ?? contract.arret.salairePct;
}

function buildIndividualArretPct(input: {
  contracts: PrevoyanceContractDraft[];
  fromDay: number;
  toDay: number;
  referenceAnnual: number;
  salaireBrutAnnuel: number;
  roEuro: number;
  contractAggregationMode: NonNullable<ArretCoverageInput['contractAggregationMode']>;
}): number {
  return percentOfReference(buildIndividualArretEuro(input) * 365, input.referenceAnnual);
}

export function buildArretEuroChart({
  regimeStack: inputRegimeStack,
  contracts,
  kind,
  contractAggregationMode = 'compare',
  maintienPalier,
  referenceAnnual,
  salaireBrutAnnuel,
}: ArretCoverageInput): PrevoyanceArretEuroChart {
  const regimeStack = normalizeRegimeStack(inputRegimeStack);
  const rangePaliers: PrevoyanceRangeLike[] = [
    ...regimeStack.flatMap((regime) => [
      ...regime.data.arret.paliers.map((palier) => ({
        fromDay: palier.fromDay,
        toDay: palier.toDay,
      })),
      ...(regime.data.arret.carences.maladie > 0
        ? [{ fromDay: 0, toDay: regime.data.arret.carences.maladie }]
        : []),
    ]),
    ...contracts.flatMap((contract) =>
      contract.kind === 'individuel'
        ? contract.arret.paliers.map((palier) => ({
            fromDay: palier.fromDay,
            toDay: palier.toDay,
          }))
        : collectiveArretPaliers(contract).map((palier) => ({
            fromDay: palier.fromDay,
            toDay: palier.toDay,
          })),
    ),
    ...(kind === 'collectif' ? maintienRanges(maintienPalier) : []),
  ];
  const periods = splitIntoSubPeriods(rangePaliers, unionBoundaries(rangePaliers));
  const reference = Math.max(0, referenceAnnual) / 365;

  return {
    reference,
    periods: periods.map(({ from, to }) =>
      buildArretEuroPeriod({
        from,
        to,
        regimeStack,
        contracts,
        kind,
        contractAggregationMode,
        maintienPalier,
        referenceAnnual,
        salaireBrutAnnuel,
      }),
    ),
  };
}

function buildArretEuroPeriod({
  from,
  to,
  regimeStack: inputRegimeStack,
  contracts,
  kind,
  contractAggregationMode = 'compare',
  maintienPalier,
  referenceAnnual,
  salaireBrutAnnuel,
}: ArretCoverageInput & {
  from: number;
  to: number;
}): PrevoyanceArretEuroPeriod {
  const regimeStack = normalizeRegimeStack(inputRegimeStack);
  const roSegments = buildRegimeArretSegments({
    regimeStack,
    from,
    to,
    referenceAnnual,
    salaireBrutAnnuel,
  });
  const roEuro = roSegments.reduce((sum, segment) => sum + segment.euro, 0);
  const maintienEuro =
    kind === 'collectif'
      ? computeMaintienEmployeurEuro({
          fromDay: from,
          maintienPalier,
          roEuro,
          salaireBrutAnnuel,
        })
      : 0;
  const contratEuro =
    kind === 'collectif'
      ? contracts.reduce((sum, contract) => {
          if (contract.kind !== 'collectif') return sum;
          return (
            sum +
            (Math.max(0, salaireBrutAnnuel) *
              (findCollectiveArretPctForRange(contract, from, to) / 100)) /
              365
          );
        }, 0)
      : buildIndividualArretEuro({
          contracts,
          fromDay: from,
          toDay: to,
          referenceAnnual,
          salaireBrutAnnuel,
          roEuro,
          contractAggregationMode,
        });

  return {
    from,
    to,
    roSegments: roSegments.map((segment) => ({
      code: segment.code,
      label: segment.label,
      euro: Math.round(segment.euro),
    })),
    roEuro: Math.round(roEuro),
    maintienEuro: Math.round(maintienEuro),
    contratEuro: Math.round(contratEuro),
    totalEuro: Math.round(roEuro + maintienEuro + contratEuro),
  };
}

function buildRegimeArretSegments({
  regimeStack,
  from,
  to,
  referenceAnnual,
  salaireBrutAnnuel,
}: {
  regimeStack: PrevoyanceRegimeSettings[];
  from: number;
  to: number;
  referenceAnnual: number;
  salaireBrutAnnuel: number;
}): Array<{ code: string; label: string; euro: number; valuePct: number }> {
  return regimeStack.map((regime) => {
    const roPalier = findArretPalierForRange(regime.data.arret.paliers, from, to);
    const euro = dailyValueFromAmountRule(roPalier?.amount, referenceAnnual, salaireBrutAnnuel);
    return {
      code: regime.code,
      label: roPalier?.amount.label ?? regime.caisse,
      euro,
      valuePct: percentOfReference(euro * 365, referenceAnnual),
    };
  });
}

function buildIndividualArretEuro({
  contracts,
  fromDay,
  toDay,
  referenceAnnual,
  salaireBrutAnnuel,
  roEuro,
  contractAggregationMode,
}: {
  contracts: PrevoyanceContractDraft[];
  fromDay: number;
  toDay: number;
  referenceAnnual: number;
  salaireBrutAnnuel: number;
  roEuro: number;
  contractAggregationMode: NonNullable<ArretCoverageInput['contractAggregationMode']>;
}): number {
  const individualContracts = contracts.filter(
    (contract): contract is Extract<PrevoyanceContractDraft, { kind: 'individuel' }> =>
      contract.kind === 'individuel',
  );
  const selectedContracts =
    contractAggregationMode === 'compare' ? individualContracts.slice(0, 1) : individualContracts;
  const values = selectedContracts.map((contract) => {
    const palier = findArretPalierForRange(contractArretPaliers(contract), fromDay, toDay);
    const daily = dailyValueFromAmountRule(palier?.amount, referenceAnnual, salaireBrutAnnuel);
    return { indemnisation: contract.indemnisation, daily };
  });
  const forfaitaireEuro = values
    .filter((value) => value.indemnisation === 'forfaitaire')
    .reduce((sum, value) => sum + value.daily, 0);
  const indemnitaireEuro = Math.max(
    0,
    ...values.filter((value) => value.indemnisation === 'indemnitaire').map((value) => value.daily),
  );
  const referenceDaily = Math.max(0, referenceAnnual) / 365;
  const indemnitaireRelais = Math.min(indemnitaireEuro, Math.max(0, referenceDaily - roEuro));

  return forfaitaireEuro + indemnitaireRelais;
}
