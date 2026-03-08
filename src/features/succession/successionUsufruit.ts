export interface SuccessionUsufruitBracket {
  maxExclusiveAge: number;
  tauxUsufruit: number;
}

// CGI art. 669 — barème fiscal de valorisation usufruit / nue-propriété.
export const BAREME_USUFRUIT_669: SuccessionUsufruitBracket[] = [
  { maxExclusiveAge: 21, tauxUsufruit: 0.9 },
  { maxExclusiveAge: 31, tauxUsufruit: 0.8 },
  { maxExclusiveAge: 41, tauxUsufruit: 0.7 },
  { maxExclusiveAge: 51, tauxUsufruit: 0.6 },
  { maxExclusiveAge: 61, tauxUsufruit: 0.5 },
  { maxExclusiveAge: 71, tauxUsufruit: 0.4 },
  { maxExclusiveAge: 81, tauxUsufruit: 0.3 },
  { maxExclusiveAge: 91, tauxUsufruit: 0.2 },
  { maxExclusiveAge: Number.POSITIVE_INFINITY, tauxUsufruit: 0.1 },
];

export interface SuccessionUsufruitValuation {
  age: number;
  tauxUsufruit: number;
  tauxNuePropriete: number;
  valeurUsufruit: number;
  valeurNuePropriete: number;
}

function asAmount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function getUsufruitRateFromAge(age: number): number {
  const safeAge = Number.isFinite(age) ? Math.max(0, Math.floor(age)) : 0;
  return BAREME_USUFRUIT_669.find((bracket) => safeAge < bracket.maxExclusiveAge)?.tauxUsufruit ?? 0.1;
}

export function getBareOwnershipRateFromAge(age: number): number {
  return 1 - getUsufruitRateFromAge(age);
}

export function getAgeAtReferenceDate(
  dateNaissance?: string,
  referenceDate = new Date(),
): number | null {
  if (!dateNaissance) return null;
  const birthDate = new Date(dateNaissance);
  if (Number.isNaN(birthDate.getTime())) return null;

  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDelta = referenceDate.getMonth() - birthDate.getMonth();
  const dayDelta = referenceDate.getDate() - birthDate.getDate();
  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function getUsufruitValuationFromAge(
  age: number,
  baseAmount: number,
): SuccessionUsufruitValuation {
  const montant = asAmount(baseAmount);
  const tauxUsufruit = getUsufruitRateFromAge(age);
  const tauxNuePropriete = 1 - tauxUsufruit;
  return {
    age: Math.max(0, Math.floor(age)),
    tauxUsufruit,
    tauxNuePropriete,
    valeurUsufruit: montant * tauxUsufruit,
    valeurNuePropriete: montant * tauxNuePropriete,
  };
}

export function getUsufruitValuationFromBirthDate(
  dateNaissance: string | undefined,
  baseAmount: number,
  referenceDate = new Date(),
): SuccessionUsufruitValuation | null {
  const age = getAgeAtReferenceDate(dateNaissance, referenceDate);
  if (age == null) return null;
  return getUsufruitValuationFromAge(age, baseAmount);
}
