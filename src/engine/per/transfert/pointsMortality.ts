import type { PrefonPointsParams } from '@/data/basecg';

interface PrefonRenteInput {
  params: PrefonPointsParams;
  points: number;
  capitalNet: number;
  acquisitionAge: number;
  liquidationAge: number;
  reversionRate: number;
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

export function computePrefonRente(input: PrefonRenteInput): PrefonRenteOutput {
  const liquidationCoef = pickAgeCoefficient(input.params.coefLiquidationByAge, input.liquidationAge);
  const pointsFromCapital = input.params.valeurAcquisition > 0
    ? input.capitalNet / input.params.valeurAcquisition
    : 0;
  const pointsRetenus = input.points > 0 ? input.points : pointsFromCapital;
  const reversionCoef = Math.max(0, 1 - Math.max(0, input.reversionRate));
  const renteAnnuelleBrute =
    pointsRetenus
    * input.params.valeurService
    * liquidationCoef
    * reversionCoef
    * 12;

  return {
    pointsRetenus,
    renteAnnuelleBrute,
    renteMensuelleBrute: renteAnnuelleBrute / 12,
  };
}
