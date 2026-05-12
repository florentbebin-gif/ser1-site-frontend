import type {
  AssociateProfileInput,
  RuntimeAssociateInput,
  TresoInputsRuntime,
} from './types';

export function getSelectedAssociateId(inputs: TresoInputsRuntime): string {
  return 'selectedAssociateId' in inputs
    ? inputs.selectedAssociateId
    : inputs.foyer.selectedAssociateId;
}

export function getSelectedAssociate(inputs: TresoInputsRuntime): RuntimeAssociateInput | undefined {
  const selectedId = getSelectedAssociateId(inputs);
  return inputs.company.associates.find(associate => associate.id === selectedId)
    ?? inputs.company.associates[0];
}

export function getAssociateProfile(
  inputs: TresoInputsRuntime,
  associate: RuntimeAssociateInput | undefined = getSelectedAssociate(inputs),
): AssociateProfileInput {
  const projectionStartYear = inputs.company.projectionStartYear ?? new Date().getFullYear();
  if (associate?.kind === 'pp' && associate.profile) {
    return {
      ...associate.profile,
      projectionStartYear,
    };
  }
  return {
    currentAge: 0,
    retirementAge: 0,
    annualIncomeNeed: 0,
    projectionStartYear,
  };
}

export function getCapitalPct(associate: RuntimeAssociateInput): number {
  return associate.ownershipLots.reduce((sum, lot) => sum + lot.capitalPct, 0);
}

export function getEconomicPct(associate: RuntimeAssociateInput): number {
  return associate.ownershipLots.reduce((sum, lot) => sum + lot.economicRightsPct, 0);
}
