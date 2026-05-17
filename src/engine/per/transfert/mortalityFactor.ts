import { MORTALITY_TABLES, type MortalityTable, type MortalityTableCode } from '@/data/mortality';
import type {
  PerTransfertGuaranteedInput,
  PerTransfertInsuredInput,
  PerTransfertPaymentTiming,
  PerTransfertReversionInput,
  PerTransfertTemporaryIncreaseInput,
} from './types';

interface ComputeAnnuityFactorInput {
  insured: PerTransfertInsuredInput;
  mortalityTable: MortalityTableCode;
  technicalRate: number;
  frequency: number;
  paymentTiming: PerTransfertPaymentTiming;
  reversion: PerTransfertReversionInput;
  guaranteedAnnuities: PerTransfertGuaranteedInput;
  temporaryIncrease: PerTransfertTemporaryIncreaseInput;
}

interface MortalitySeries {
  minAge: number;
  maxAge: number;
  lx: number[];
}

function getGenerationKey(table: MortalityTable, birthYear: number): string {
  if (table.type !== 'generation') return '';
  const key = String(birthYear);
  if (table.generations[key]) return key;
  const generations = Object.keys(table.generations)
    .map(Number)
    .sort((left, right) => left - right);
  const firstGeneration = generations[0];
  if (firstGeneration === undefined) {
    throw new Error('Table de mortalité générationnelle vide.');
  }
  const closest = generations.reduce(
    (best, candidate) =>
      Math.abs(candidate - birthYear) < Math.abs(best - birthYear) ? candidate : best,
    firstGeneration,
  );
  return String(closest);
}

function resolveSeries(code: MortalityTableCode, birthYear: number): MortalitySeries {
  const table = MORTALITY_TABLES[code];
  if (!table) {
    throw new Error(`Table de mortalite inconnue : ${code}`);
  }

  if (table.type === 'single') {
    return {
      minAge: table.minAge,
      maxAge: table.maxAge,
      lx: table.lx,
    };
  }

  const generationKey = getGenerationKey(table, birthYear);
  const lx = table.generations[generationKey];
  if (!lx) {
    throw new Error(`Generation ${birthYear} absente de la table ${code}`);
  }

  return {
    minAge: table.minAge,
    maxAge: table.maxAge,
    lx,
  };
}

function lxAt(series: MortalitySeries, age: number): number {
  if (age <= series.minAge) return series.lx[0] ?? 0;
  if (age >= series.maxAge) return series.lx[series.lx.length - 1] ?? 0;
  const lowerAge = Math.floor(age);
  const upperAge = Math.ceil(age);
  const lower = series.lx[lowerAge - series.minAge] ?? 0;
  const upper = series.lx[upperAge - series.minAge] ?? lower;
  if (lowerAge === upperAge) return lower;
  const weight = age - lowerAge;
  return lower + (upper - lower) * weight;
}

function survival(series: MortalitySeries, startAge: number, years: number): number {
  const startLx = lxAt(series, startAge);
  if (startLx <= 0) return 0;
  return Math.max(0, lxAt(series, startAge + years) / startLx);
}

function paymentProbability(
  periodYears: number,
  insuredSeries: MortalitySeries,
  insuredAge: number,
  reversion: PerTransfertReversionInput,
): number {
  const principalAlive = survival(insuredSeries, insuredAge, periodYears);
  if (!reversion.enabled || reversion.rate <= 0) return principalAlive;

  const spouseSeries = resolveSeries(reversion.spouseMortalityTable, reversion.spouseBirthYear);
  const spouseAlive = survival(spouseSeries, reversion.spouseAgeAtLiquidation, periodYears);
  return principalAlive + reversion.rate * (1 - principalAlive) * spouseAlive;
}

export function computeAnnuityFactor(input: ComputeAnnuityFactorInput): number {
  const frequency = Math.max(1, Math.floor(input.frequency));
  const insuredSeries = resolveSeries(input.mortalityTable, input.insured.birthYear);
  const maxYears = Math.max(0, insuredSeries.maxAge - input.insured.liquidationAge);
  const periods = Math.floor(maxYears * frequency);
  const discountBase = 1 + input.technicalRate;
  let factor = 0;

  for (let period = 1; period <= periods; period += 1) {
    const timingOffset = input.paymentTiming === 'advance' ? 1 : 0;
    const periodYears = Math.max(0, (period - timingOffset) / frequency);
    const guaranteed =
      input.guaranteedAnnuities.enabled && periodYears <= input.guaranteedAnnuities.years;
    const probability = guaranteed
      ? 1
      : paymentProbability(
          periodYears,
          insuredSeries,
          input.insured.liquidationAge,
          input.reversion,
        );
    const temporaryMultiplier =
      input.temporaryIncrease.enabled && periodYears <= input.temporaryIncrease.years
        ? 1 + input.temporaryIncrease.increaseRate
        : 1;
    const discount = discountBase > 0 ? discountBase ** -periodYears : 1;
    factor += (discount * probability * temporaryMultiplier) / frequency;
  }

  return factor;
}

export function resolveMortalityTableFromContractLabel(
  contractLabel: string | null | undefined,
  sex: PerTransfertInsuredInput['sex'],
): MortalityTableCode {
  const label = contractLabel?.toUpperCase() ?? '';
  if (label.includes('TPG93')) return 'TPG93';
  if (label.includes('TPRV93')) return 'TPRV93';
  if (label.includes('TGH05')) return 'TGH05';
  if (label.includes('TGF05')) return 'TGF05';
  return sex === 'F' ? 'TGF05' : 'TGH05';
}
