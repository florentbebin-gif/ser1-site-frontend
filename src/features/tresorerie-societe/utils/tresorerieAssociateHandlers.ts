import { useCallback } from 'react';
import type {
  AssociateInputV6,
  TresoInputsV6,
} from '@/engine/tresorerie/types';
import {
  getAssociateProfile,
  getSelectedAssociateId,
  updateAssociateOwnershipLot,
  updateAssociateOwnershipLots,
} from './tresorerieSocieteModel';

export function buildDefaultAssociate(index: number, inputs: TresoInputsV6): AssociateInputV6 {
  const profile = getAssociateProfile(inputs);
  const phaseId = `phase-associe-${Date.now()}-${index + 1}`;
  return {
    id: `associe-${Date.now()}-${index + 1}`,
    label: `Associé ${index + 1}`,
    kind: 'pp',
    profile,
    ownershipLots: [{ right: 'pleine_propriete', capitalPct: 0, economicRightsPct: 0 }],
    roles: ['associe_sans_statut'],
    cca: {
      currentBalance: 0,
      remunerationRate: 0,
    },
    revenuePhases: [{
      id: phaseId,
      startYear: profile.projectionStartYear,
      endYear: profile.projectionStartYear + 14,
      remuneration: {
        enabled: false,
        source: 'none',
        loadedAnnualCost: 0,
        socialChargeRate: 0,
      },
      distribution: {
        enabled: false,
        annualNetIncomeNeed: 0,
        dividendsStrategy: 'max_treso',
      },
      ccaContribution: {
        enabled: false,
      },
      ccaRepayment: {
        enabled: true,
        strategy: 'max_treso',
      },
    }],
  };
}

export function syncSelectedProfile(
  associateId: string,
  associates: AssociateInputV6[],
  nextInputs: TresoInputsV6,
): TresoInputsV6 {
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
  inputs: TresoInputsV6,
  onChange: (nextInputs: TresoInputsV6) => void,
) {
  const { company } = inputs;
  const selectedAssociateId = getSelectedAssociateId(inputs);

  const setSelectedAssociate = useCallback((associateId: string) => {
    onChange(syncSelectedProfile(associateId, company.associates, inputs));
  }, [company.associates, inputs, onChange]);

  const updateAssociate = useCallback((associateId: string, patch: Partial<AssociateInputV6>) => {
    const patchedAssociates: AssociateInputV6[] = company.associates.map(associate =>
      associate.id === associateId
        ? { ...associate, ...patch, ownershipLots: associate.ownershipLots }
        : associate,
    );
    // Multi-lots : si le patch fournit un tableau complet de lots, on remplace l'ensemble
    // (refonte démembrement PP/US/NP). Sinon, ancien chemin compatibilité 1 lot.
    let associates: AssociateInputV6[] = patchedAssociates;
    if (patch.ownershipLots) {
      associates = patch.ownershipLots.length > 1
        ? updateAssociateOwnershipLots(patchedAssociates, associateId, patch.ownershipLots)
        : patch.ownershipLots[0]
          ? updateAssociateOwnershipLot(patchedAssociates, associateId, patch.ownershipLots[0])
          : updateAssociateOwnershipLots(patchedAssociates, associateId, patch.ownershipLots);
    }
    const nextInputs = {
      ...inputs,
      company: { ...company, associates },
    };
    onChange(syncSelectedProfile(selectedAssociateId, associates, nextInputs));
  }, [company, inputs, onChange, selectedAssociateId]);

  const addAssociate = useCallback(() => {
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
  }, [company, inputs, onChange]);

  const removeAssociate = useCallback((associateId: string) => {
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
  }, [company, inputs, onChange, selectedAssociateId]);

  return {
    selectedAssociateId,
    setSelectedAssociate,
    updateAssociate,
    addAssociate,
    removeAssociate,
  };
}
