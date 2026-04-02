import type { SuccessionResult, LienParente } from '../../engine/succession';
import type { SuccessionChainBeneficiary, SuccessionChainageAnalysis } from './successionChainage';

interface SuccessionTransmissionRowLike {
  id: string;
  label: string;
  brut: number;
  droits: number;
  net: number;
  exonerated?: boolean;
  step1Brut?: number;
  step1Droits?: number;
  step2Brut?: number;
  step2Droits?: number;
}

interface TransmissionHeirLike {
  id: string;
  label: string;
  lien: LienParente;
  partSuccession: number;
  exonerated?: boolean;
}

export function buildSuccessionDirectTransmissionRows(
  detailedHeirs: TransmissionHeirLike[],
  result: SuccessionResult | null,
): SuccessionTransmissionRowLike[] {
  if (!result) return [];

  return detailedHeirs.map((heir, index) => {
    const detail = result.detailHeritiers[index];
    const brut = heir.partSuccession;
    const droits = detail?.droits ?? 0;

    return {
      id: heir.id,
      label: heir.label,
      brut,
      droits,
      net: brut - droits,
      exonerated: heir.exonerated ?? heir.lien === 'conjoint',
    };
  });
}

function accumulateTransmissionRow(
  rows: Map<string, SuccessionTransmissionRowLike>,
  beneficiary: SuccessionChainBeneficiary,
  step: 1 | 2,
): void {
  const current = rows.get(beneficiary.id) ?? {
    id: beneficiary.id,
    label: beneficiary.label,
    brut: 0,
    droits: 0,
    net: 0,
    exonerated: beneficiary.exonerated ?? false,
  };

  current.brut += beneficiary.brut;
  current.droits += beneficiary.droits;
  current.net += beneficiary.net;
  current.exonerated = current.exonerated || beneficiary.exonerated;
  if (step === 1) {
    current.step1Brut = (current.step1Brut ?? 0) + beneficiary.brut;
    current.step1Droits = (current.step1Droits ?? 0) + beneficiary.droits;
  } else {
    current.step2Brut = (current.step2Brut ?? 0) + beneficiary.brut;
    current.step2Droits = (current.step2Droits ?? 0) + beneficiary.droits;
  }
  rows.set(beneficiary.id, current);
}

export function buildSuccessionChainTransmissionRowsInternal(
  analysis: SuccessionChainageAnalysis,
): SuccessionTransmissionRowLike[] {
  if (!analysis.step1 || !analysis.step2) return [];

  const rows = new Map<string, SuccessionTransmissionRowLike>();
  analysis.step1.beneficiaries.forEach((beneficiary) =>
    accumulateTransmissionRow(rows, beneficiary, 1));
  analysis.step2.beneficiaries.forEach((beneficiary) =>
    accumulateTransmissionRow(rows, beneficiary, 2));

  return Array.from(rows.values()).sort((left, right) => {
    const exoRank = Number(Boolean(left.exonerated)) - Number(Boolean(right.exonerated));
    if (exoRank !== 0) return exoRank;
    return left.label.localeCompare(right.label, 'fr-FR');
  });
}
