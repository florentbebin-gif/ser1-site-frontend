import type { RuntimeAssociateInput, TresoInputsRuntime } from '@/engine/tresorerie/types';
import { getOwnershipTotals, getSelectedAssociate } from './tresorerieSocieteModel';

export interface TresoReadiness {
  selectedAssociate?: RuntimeAssociateInput;
  companyReady: boolean;
  personalTimelineReady: boolean;
  synthesisReady: boolean;
  ownershipCapitalOverflow: boolean;
  ownershipEconomicOverflow: boolean;
}

type AssociateWithRevenuePhases = RuntimeAssociateInput & {
  revenuePhases?: unknown[];
};

export function getTresoReadiness(inputs: TresoInputsRuntime): TresoReadiness {
  const { company } = inputs;
  const selectedAssociate = getSelectedAssociate(inputs);
  const ownershipTotals = getOwnershipTotals(company.associates);
  const ownershipCapitalOverflow = ownershipTotals.capitalPct > 100;
  const ownershipEconomicOverflow = ownershipTotals.economicRightsPct > 100;
  const hasCompanyIdentity = Boolean(
    company.label?.trim() && company.legalForm && company.projectionStartYear,
  );
  const companyReady = Boolean(
    hasCompanyIdentity &&
    selectedAssociate &&
    !ownershipCapitalOverflow &&
    !ownershipEconomicOverflow,
  );
  const personalTimelineReady = Boolean(
    companyReady &&
    selectedAssociate?.kind === 'pp' &&
    (selectedAssociate.profile?.currentAge ?? 0) > 0,
  );
  const revenuePhases = (selectedAssociate as AssociateWithRevenuePhases | undefined)
    ?.revenuePhases;
  const synthesisReady = Boolean(personalTimelineReady && (revenuePhases?.length ?? 0) > 0);

  return {
    selectedAssociate,
    companyReady,
    personalTimelineReady,
    synthesisReady,
    ownershipCapitalOverflow,
    ownershipEconomicOverflow,
  };
}
