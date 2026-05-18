import type { BaseCgRetraiteContract } from '@/data/base-cg-retraite';
import {
  hasBaseCgRetraiteValue,
  normalizeBaseCgRetraiteGestionFees,
} from '@/data/base-cg-retraite';

const INCOMPLETE_THRESHOLD = 3;

export function isRetraiteContractIncomplete(contract: BaseCgRetraiteContract): boolean {
  const gestionFees = normalizeBaseCgRetraiteGestionFees(contract.phaseEpargne);
  const criticalValues = [
    contract.phaseEpargne.dateCommercialisation,
    hasBaseCgRetraiteValue(gestionFees.fraisGestionFondsEuro) ||
    hasBaseCgRetraiteValue(gestionFees.fraisGestionUc)
      ? 'renseigné'
      : null,
    contract.phaseEpargne.clauseBeneficiaire,
    contract.phaseLiquidation.ageLimiteLiquidation,
    contract.phaseLiquidation.sortieCapitalRetraite,
    contract.phaseLiquidation.tableConversionRente,
    contract.phaseLiquidation.tauxTechnique,
    contract.phaseLiquidation.reversionPossible,
  ];

  const emptyCount = criticalValues.filter((value) => !hasBaseCgRetraiteValue(value)).length;
  return emptyCount >= INCOMPLETE_THRESHOLD;
}
