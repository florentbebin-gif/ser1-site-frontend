import type {
  AssociateInput,
  AssociateProfileInput,
  TresoInputsRuntime,
} from './types';

export function getSelectedAssociateId(inputs: TresoInputsRuntime): string {
  return 'selectedAssociateId' in inputs
    ? inputs.selectedAssociateId
    : inputs.foyer.selectedAssociateId;
}

export function getSelectedAssociate(inputs: TresoInputsRuntime): AssociateInput | undefined {
  const selectedId = getSelectedAssociateId(inputs);
  return inputs.company.associates.find(associate => associate.id === selectedId)
    ?? inputs.company.associates[0];
}

export function getAssociateProfile(
  inputs: TresoInputsRuntime,
  associate: AssociateInput | undefined = getSelectedAssociate(inputs),
): AssociateProfileInput {
  const projectionStartYear = inputs.company.projectionStartYear ?? inputs.foyer.projectionStartYear;
  if (associate?.kind === 'pp' && associate.profile) {
    return {
      ...associate.profile,
      projectionStartYear,
    };
  }
  return {
    currentAge: inputs.foyer.currentAge,
    retirementAge: inputs.foyer.retirementAge,
    annualIncomeNeed: associate?.kind === 'pm' ? 0 : inputs.foyer.annualIncomeNeed,
    projectionStartYear,
  };
}

export function getCapitalPct(associate: AssociateInput): number {
  return associate.ownershipLots.reduce((sum, lot) => sum + lot.capitalPct, 0);
}

export function getEconomicPct(associate: AssociateInput): number {
  return associate.ownershipLots.reduce((sum, lot) => sum + lot.economicRightsPct, 0);
}
