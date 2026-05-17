import type { PrefonPointsParams } from '@/data/basecg';

interface PrefonRenteInput {
  params: PrefonPointsParams;
  points: number;
  capitalNet: number;
  acquisitionAge: number;
  liquidationAge: number;
  reversionRate: number;
  spouseAgeAtLiquidation?: number | null;
  serviceValue?: number | null;
}

export interface PrefonRenteOutput {
  pointsRetenus: number;
  renteAnnuelleBrute: number;
  renteMensuelleBrute: number;
}

function pickAgeCoefficient(table: Record<number, number>, age: number): number {
  const roundedAge = Math.floor(age);
  if (table[roundedAge] !== undefined) return table[roundedAge];
  const ages = Object.keys(table).map(Number).sort((left, right) => left - right);
  const firstAge = ages[0];
  const lastAge = ages[ages.length - 1];
  if (roundedAge <= firstAge) return table[firstAge];
  if (roundedAge >= lastAge) return table[lastAge];

  const lowerAges = ages.filter((candidate) => candidate < roundedAge);
  const previousAge = lowerAges.length > 0 ? lowerAges[lowerAges.length - 1] : firstAge;
  const nextAge = ages.find((candidate) => candidate > roundedAge) ?? lastAge;
  const span = nextAge - previousAge;
  if (span <= 0) return table[previousAge];
  const weight = (roundedAge - previousAge) / span;
  return table[previousAge] + (table[nextAge] - table[previousAge]) * weight;
}

function pickPrefonReversionCoefficient(input: PrefonRenteInput): number {
  if (input.reversionRate <= 0 || !input.spouseAgeAtLiquidation) return 1;
  const table = input.params.coefReversionByAgeGap;
  if (!table || table.length === 0) return 1;
  const ageGap = Math.floor(input.spouseAgeAtLiquidation - input.liquidationAge);
  const row = table.find((candidate) => {
    const min = candidate.minGapInclusive ?? Number.NEGATIVE_INFINITY;
    const max = candidate.maxGapInclusive ?? Number.POSITIVE_INFINITY;
    return ageGap >= min && ageGap <= max;
  });
  if (!row) return 1;
  if (input.reversionRate >= 0.99) return row.coefficients.rate100;
  if (input.reversionRate >= 0.79) return row.coefficients.rate80;
  return row.coefficients.rate60;
}

export function computePrefonRente(input: PrefonRenteInput): PrefonRenteOutput {
  const liquidationCoef = pickAgeCoefficient(input.params.coefLiquidationByAge, input.liquidationAge);
  const pointsFromCapital = input.params.valeurAcquisition > 0
    ? input.capitalNet / input.params.valeurAcquisition
    : 0;
  const pointsRetenus = input.points > 0 ? input.points : pointsFromCapital;
  const reversionCoef = pickPrefonReversionCoefficient(input);
  const valeurService = input.serviceValue && input.serviceValue > 0
    ? input.serviceValue
    : input.params.valeurService;
  const renteAnnuelleBrute =
    pointsRetenus
    * valeurService
    * liquidationCoef
    * reversionCoef;

  return {
    pointsRetenus,
    renteAnnuelleBrute,
    renteMensuelleBrute: renteAnnuelleBrute / 12,
  };
}
