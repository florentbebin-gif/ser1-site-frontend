import type {
  PrevoyanceContractDraft,
  PrevoyanceContractKind,
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
  PrevoyanceAmountRule,
  PrevoyanceArretSettings,
  PrevoyanceTranches,
} from './types';

export const PREVOYANCE_MAX_ARRET_DURATION_DAYS = 1095;
export const SALAIRE_NET_BRUT_ESTIMATION_RATE = 0.8;

const TB_PASS_MULTIPLE = 4;
const TC_PASS_MULTIPLE = 8;

export function estimateSalaireNetFromBrut(salaireBrutAnnuel: number): number {
  return Math.round(Math.max(0, salaireBrutAnnuel) * SALAIRE_NET_BRUT_ESTIMATION_RATE);
}

export function deriveContractKindFromRegime(
  regime: Pick<PrevoyanceRegimeSettings, 'population' | 'defaultContractKind'> | null | undefined,
): PrevoyanceContractKind {
  if (!regime) return 'individuel';
  if (regime.defaultContractKind) return regime.defaultContractKind;
  return regime.population === 'salarie' ? 'collectif' : 'individuel';
}

export function resolveContractKind(
  regime: Pick<PrevoyanceRegimeSettings, 'population' | 'defaultContractKind'> | null | undefined,
  override?: PrevoyanceContractKind | null,
): PrevoyanceContractKind {
  return override ?? deriveContractKindFromRegime(regime);
}

export function computeTranchesFromPass(
  salaireBrutAnnuel: number,
  pass: number,
): PrevoyanceTranches {
  const salaire = Math.max(0, salaireBrutAnnuel);
  const plafond = Math.max(0, pass);
  const trancheA = Math.min(salaire, plafond);
  const trancheB = Math.max(0, Math.min(salaire, plafond * TB_PASS_MULTIPLE) - plafond);
  const trancheC = Math.max(
    0,
    Math.min(salaire, plafond * TC_PASS_MULTIPLE) - plafond * TB_PASS_MULTIPLE,
  );

  return {
    ta: trancheA,
    tb: trancheB,
    tc: trancheC,
    totalRetenu: trancheA + trancheB + trancheC,
  };
}

export function capArretDuration(days: number): number {
  return Math.min(Math.max(0, days), PREVOYANCE_MAX_ARRET_DURATION_DAYS);
}

export function selectMaintienEmployeurPalier(
  ancienneteYears: number,
  settings: PrevoyanceMaintienEmployeurSettings | null | undefined,
) {
  const maintien = settings?.data.maintienEmployeur;
  if (!maintien || ancienneteYears < maintien.minAncienneteYears) return null;

  return (
    maintien.paliers.find((palier) => {
      const afterStart = ancienneteYears >= palier.fromAncienneteYears;
      const beforeEnd =
        palier.toAncienneteYears === null || ancienneteYears <= palier.toAncienneteYears;
      return afterStart && beforeEnd;
    }) ?? null
  );
}

export function computeCollectiveAssietteBase(
  assiette: 'TA' | 'TA-TB' | 'TA-TB-TC',
  tranches: PrevoyanceTranches,
): number {
  if (assiette === 'TA') return tranches.ta;
  if (assiette === 'TA-TB') return tranches.ta + tranches.tb;
  return tranches.ta + tranches.tb + tranches.tc;
}

export function computeDecesCapitalFromContract(
  contract: PrevoyanceContractDraft,
  annualBase: number,
): number {
  if (contract.kind === 'individuel') return contract.deces.capital;
  return Math.round(Math.max(0, annualBase) * (Math.max(0, contract.deces.salairePct) / 100));
}

export function clampContractCount<T>(contracts: T[]): T[] {
  return contracts.slice(0, 3);
}

export type PrevoyanceCoverageSegmentKind = 'reference' | 'ro' | 'maintien' | 'contrat';

export interface PrevoyanceCoverageSegment {
  kind: PrevoyanceCoverageSegmentKind;
  label: string;
  valuePct: number;
}

export interface PrevoyanceCoverageBar {
  key: string;
  label: string;
  totalPct: number;
  segments: PrevoyanceCoverageSegment[];
}

interface ArretCoverageInput {
  regime: PrevoyanceRegimeSettings | null;
  contracts: PrevoyanceContractDraft[];
  kind: PrevoyanceContractKind;
  maintienPalier: ReturnType<typeof selectMaintienEmployeurPalier>;
  referenceAnnual: number;
  salaireBrutAnnuel: number;
}

interface InvaliditeCoverageInput {
  regime: PrevoyanceRegimeSettings | null;
  contracts: PrevoyanceContractDraft[];
  kind: PrevoyanceContractKind;
  referenceAnnual: number;
  salaireBrutAnnuel: number;
}

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function annualValueFromAmountRule(
  amount: PrevoyanceAmountRule | null | undefined,
  referenceAnnual: number,
  salaireBrutAnnuel: number,
): number {
  if (!amount || amount.value === null) return 0;
  const value = Math.max(0, amount.value);
  if (amount.mode === 'fixed_eur_day') return value * 365;
  if (amount.mode === 'fixed_eur_month') return value * 12;
  if (amount.mode === 'fixed_eur_year') return value;
  if (amount.mode === 'percent_salary') return Math.max(0, salaireBrutAnnuel) * (value / 100);
  if (amount.mode === 'percent_income') return Math.max(0, referenceAnnual) * (value / 100);
  return 0;
}

function percentOfReference(valueAnnual: number, referenceAnnual: number): number {
  if (referenceAnnual <= 0) return 0;
  return clampPct((valueAnnual / referenceAnnual) * 100);
}

export function findArretPalierForRange(
  paliers: PrevoyanceArretSettings['paliers'],
  fromDay: number,
  toDay: number,
) {
  const from = capArretDuration(fromDay);
  const to = capArretDuration(toDay);
  return (
    paliers.find((palier) => {
      const palierTo = capArretDuration(palier.toDay ?? PREVOYANCE_MAX_ARRET_DURATION_DAYS);
      return palier.fromDay <= to && palierTo >= from;
    }) ?? null
  );
}

function buildSinglePalierArretWindows(regime: PrevoyanceRegimeSettings): Array<[number, number]> {
  const max = capArretDuration(regime.data.arret.maxDurationDays);
  const carence = capArretDuration(regime.data.arret.carences.maladie);
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
  const max = capArretDuration(
    regime?.data.arret.maxDurationDays ?? PREVOYANCE_MAX_ARRET_DURATION_DAYS,
  );
  const regimePaliers = regime?.data.arret.paliers ?? [];
  if (regimePaliers.length === 0) return [[0, max]];
  if (regime && regimePaliers.length === 1) return buildSinglePalierArretWindows(regime);

  const ranges = new Map<string, [number, number]>();
  const addRange = (fromDay: number, toDay: number | null) => {
    const from = capArretDuration(fromDay);
    const to = capArretDuration(toDay ?? max);
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

function buildMaintienSegment(
  fromDay: number,
  maintienPalier: ReturnType<typeof selectMaintienEmployeurPalier>,
): PrevoyanceCoverageSegment | null {
  if (!maintienPalier) return null;
  const firstEnd = maintienPalier.firstPeriodDays;
  const secondEnd = maintienPalier.firstPeriodDays + maintienPalier.secondPeriodDays;
  if (fromDay <= firstEnd) {
    return {
      kind: 'maintien',
      label: 'Maintien employeur',
      valuePct: clampPct(maintienPalier.firstPeriodRate),
    };
  }
  if (fromDay <= secondEnd) {
    return {
      kind: 'maintien',
      label: 'Maintien employeur',
      valuePct: clampPct(maintienPalier.secondPeriodRate),
    };
  }
  return null;
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
        ? percentOfReference(
            contracts
              .filter(
                (contract): contract is Extract<PrevoyanceContractDraft, { kind: 'collectif' }> =>
                  contract.kind === 'collectif',
              )
              .reduce(
                (sum, contract) =>
                  sum + Math.max(0, salaireBrutAnnuel) * (contract.arret.salairePct / 100),
                0,
              ),
            referenceAnnual,
          )
        : percentOfReference(
            contracts
              .filter(
                (contract): contract is Extract<PrevoyanceContractDraft, { kind: 'individuel' }> =>
                  contract.kind === 'individuel',
              )
              .reduce((sum, contract) => {
                const palier = findArretPalierForRange(
                  contract.arret.paliers.map((item) => ({
                    ...item,
                    label: '',
                    amount: {
                      mode: 'fixed_eur_day' as const,
                      value: item.amount,
                      label: `${item.amount}`,
                    },
                  })),
                  fromDay,
                  toDay,
                );
                return (
                  sum +
                  annualValueFromAmountRule(palier?.amount, referenceAnnual, salaireBrutAnnuel)
                );
              }, 0),
            referenceAnnual,
          );
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

function findInvaliditePalier<T extends { fromRate: number; toRate?: number | null }>(
  paliers: T[],
  rate: number,
): T | null {
  return (
    paliers.find(
      (palier) =>
        rate >= palier.fromRate &&
        (palier.toRate === null || palier.toRate === undefined || rate <= palier.toRate),
    ) ??
    [...paliers].reverse().find((palier) => rate >= palier.fromRate) ??
    null
  );
}

export function computeInvaliditePalierAmount(
  palier: PrevoyanceContractDraft['invalidite']['paliers'][number],
  rate: number,
): number {
  if ('amount' in palier) {
    if (palier.mode === 'proportional_66') {
      return Math.round(Math.max(0, palier.referenceAmount) * (Math.max(0, rate) / 66));
    }
    return palier.amount;
  }

  if (palier.mode === 'proportional_66') {
    return Math.max(0, palier.referencePct ?? palier.salairePct) * (Math.max(0, rate) / 66);
  }
  return palier.salairePct;
}

export function buildInvaliditeCoverageBars({
  regime,
  contracts,
  kind,
  referenceAnnual,
  salaireBrutAnnuel,
}: InvaliditeCoverageInput): PrevoyanceCoverageBar[] {
  const thresholds = new Set<number>();
  (regime?.data.invalidite.paliers ?? []).forEach((palier) => thresholds.add(palier.fromRate));
  contracts.forEach((contract) => {
    contract.invalidite.paliers.forEach((palier) => thresholds.add(palier.fromRate));
  });
  if (thresholds.size === 0) thresholds.add(0);

  const bars: PrevoyanceCoverageBar[] = [
    {
      key: 'net-percu',
      label: 'Net perçu',
      totalPct: 100,
      segments: [{ kind: 'reference', label: 'Net perçu', valuePct: 100 }],
    },
  ];

  Array.from(thresholds)
    .sort((a, b) => a - b)
    .forEach((threshold) => {
      const roPalier = findInvaliditePalier(regime?.data.invalidite.paliers ?? [], threshold);
      const roPct = percentOfReference(
        annualValueFromAmountRule(roPalier?.amount, referenceAnnual, salaireBrutAnnuel),
        referenceAnnual,
      );
      const contratPct =
        kind === 'collectif'
          ? percentOfReference(
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
            )
          : percentOfReference(
              contracts
                .filter(
                  (
                    contract,
                  ): contract is Extract<PrevoyanceContractDraft, { kind: 'individuel' }> =>
                    contract.kind === 'individuel',
                )
                .reduce((sum, contract) => {
                  const palier = findInvaliditePalier(contract.invalidite.paliers, threshold);
                  return sum + (palier ? computeInvaliditePalierAmount(palier, threshold) : 0);
                }, 0),
              referenceAnnual,
            );
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
