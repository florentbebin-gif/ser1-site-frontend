import type {
  AssociateInputV5,
  TresoInputsV5,
} from '@/engine/tresorerie/types';
import {
  getAssociateProfile,
  getSelectedAssociateId,
  updateAssociateOwnershipLot,
} from './tresorerieSocieteModel';

export function buildDefaultAssociate(index: number, inputs: TresoInputsV5): AssociateInputV5 {
  const profile = getAssociateProfile(inputs);
  return {
    id: `associe-${Date.now()}-${index + 1}`,
    label: `Associé ${index + 1}`,
    kind: 'pp',
    profile,
    ownershipLots: [{ right: 'pleine_propriete', capitalPct: 0, economicRightsPct: 0 }],
    roles: ['associe_sans_statut'],
    cca: {
      currentBalance: 0,
      exceptionalContributions: [],
      annualContribution: {
        amount: 0,
        startYear: profile.projectionStartYear,
        endYear: profile.projectionStartYear,
      },
      remunerationRate: 0,
    },
    revenuePhases: [{
      id: `phase-associe-${Date.now()}-${index + 1}`,
      startYear: profile.projectionStartYear,
      source: 'none',
      loadedAnnualCost: 0,
      socialChargeRate: 0,
      annualNetIncomeNeed: 0,
      useCcaForCompletion: true,
    }],
  };
}

export function syncSelectedProfile(
  associateId: string,
  associates: AssociateInputV5[],
  nextInputs: TresoInputsV5,
): TresoInputsV5 {
  const associate = associates.find(item => item.id === associateId);
  const nextProjectionStartYear = associate?.kind === 'pp' && associate.profile
    ? nextInputs.company.projectionStartYear ?? associate.profile.projectionStartYear
    : nextInputs.company.projectionStartYear;

  return {
    ...nextInputs,
    selectedAssociateId: associateId,
    foyer: {
      ...nextInputs.foyer,
      selectedAssociateId: associateId,
    },
    company: {
      ...nextInputs.company,
      projectionStartYear: nextProjectionStartYear,
    },
  };
}

export function useTresorerieAssociateHandlers(
  inputs: TresoInputsV5,
  onChange: (nextInputs: TresoInputsV5) => void,
) {
  const { company } = inputs;
  const selectedAssociateId = getSelectedAssociateId(inputs);

  const setSelectedAssociate = (associateId: string) => {
    onChange(syncSelectedProfile(associateId, company.associates, inputs));
  };

  const updateAssociate = (associateId: string, patch: Partial<AssociateInputV5>) => {
    const patchedAssociates: AssociateInputV5[] = company.associates.map(associate =>
      associate.id === associateId
        ? { ...associate, ...patch, ownershipLots: associate.ownershipLots }
        : associate,
    );
    const associates = patch.ownershipLots?.[0]
      ? updateAssociateOwnershipLot(patchedAssociates, associateId, patch.ownershipLots[0]) as AssociateInputV5[]
      : patchedAssociates;
    const nextInputs = {
      ...inputs,
      company: { ...company, associates },
    };
    onChange(syncSelectedProfile(selectedAssociateId, associates, nextInputs));
  };

  const addAssociate = () => {
    onChange({
      ...inputs,
      company: {
        ...company,
        associates: [
          ...company.associates,
          buildDefaultAssociate(company.associates.length, inputs),
        ],
      },
    });
  };

  const removeAssociate = (associateId: string) => {
    if (company.associates.length <= 1) return;
    const associates = company.associates.filter(associate => associate.id !== associateId);
    const nextSelectedId = associates.some(associate => associate.id === selectedAssociateId)
      ? selectedAssociateId
      : associates[0].id;
    const nextInputs = {
      ...inputs,
      company: { ...company, associates },
    };
    onChange(syncSelectedProfile(nextSelectedId, associates, nextInputs));
  };

  return {
    selectedAssociateId,
    setSelectedAssociate,
    updateAssociate,
    addAssociate,
    removeAssociate,
  };
}
