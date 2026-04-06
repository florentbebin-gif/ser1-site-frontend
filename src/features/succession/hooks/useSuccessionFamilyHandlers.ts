import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
  type FamilyBranch,
  type FamilyMember,
  type FamilyMemberType,
  type SituationMatrimoniale,
  type SuccessionDonationEntry,
  type SuccessionEnfant,
  type DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
} from '../successionDraft';
import {
  EMPTY_ADD_FAMILY_MEMBER_FORM,
  applySuccessionDonationFieldUpdate,
  createDonationId,
  createEnfantId,
  createMemberId,
  isCoupleSituation,
  type AddFamilyMemberFormState,
} from '../successionSimulator.helpers';
import { MEMBER_TYPE_NEEDS_BRANCH } from '../successionSimulator.constants';
import type { SuccessionChainOrder } from '../successionChainage';

interface UseSuccessionFamilyHandlersArgs {
  enfantRattachementOptions: { value: 'commun' | 'epoux1' | 'epoux2'; label: string }[];
  addMemberForm: AddFamilyMemberFormState;
  setCivilContext: Dispatch<SetStateAction<typeof DEFAULT_SUCCESSION_CIVIL_CONTEXT>>;
  setPatrimonialContext: Dispatch<SetStateAction<typeof DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT>>;
  setChainOrder: Dispatch<SetStateAction<SuccessionChainOrder>>;
  setEnfantsContext: Dispatch<SetStateAction<SuccessionEnfant[]>>;
  setFamilyMembers: Dispatch<SetStateAction<FamilyMember[]>>;
  setDonationsContext: Dispatch<SetStateAction<SuccessionDonationEntry[]>>;
  setAddMemberForm: Dispatch<SetStateAction<AddFamilyMemberFormState>>;
  setShowAddMemberPanel: Dispatch<SetStateAction<boolean>>;
}

export function useSuccessionFamilyHandlers({
  enfantRattachementOptions,
  addMemberForm,
  setCivilContext,
  setPatrimonialContext,
  setChainOrder,
  setEnfantsContext,
  setFamilyMembers,
  setDonationsContext,
  setAddMemberForm,
  setShowAddMemberPanel,
}: UseSuccessionFamilyHandlersArgs) {
  const handleSituationChange = useCallback((situationMatrimoniale: SituationMatrimoniale) => {
    setCivilContext((prev) => ({
      situationMatrimoniale,
      regimeMatrimonial: situationMatrimoniale === 'marie'
        ? (prev.regimeMatrimonial ?? 'communaute_legale')
        : null,
      pacsConvention: situationMatrimoniale === 'pacse'
        ? prev.pacsConvention
        : DEFAULT_SUCCESSION_CIVIL_CONTEXT.pacsConvention,
      dateNaissanceEpoux1: prev.dateNaissanceEpoux1,
      dateNaissanceEpoux2: isCoupleSituation(situationMatrimoniale) ? prev.dateNaissanceEpoux2 : undefined,
    }));
    if (situationMatrimoniale !== 'marie') {
      setPatrimonialContext((prev) => ({
        ...prev,
        donationEntreEpouxActive: false,
        societeAcquets: {
          ...prev.societeAcquets,
          active: false,
          liquidationMode: 'quotes',
          quoteEpoux1Pct: 50,
          quoteEpoux2Pct: 50,
          attributionSurvivantPct: 0,
        },
        preciputMode: 'global',
        preciputSelections: [],
        preciputMontant: 0,
        attributionIntegrale: false,
      }));
    }
    if (!isCoupleSituation(situationMatrimoniale)) {
      setChainOrder('epoux1');
    }
  }, [setChainOrder, setCivilContext, setPatrimonialContext]);

  const addEnfant = useCallback(() => {
    setEnfantsContext((prev) => ([
      ...prev,
      { id: createEnfantId(), rattachement: enfantRattachementOptions[0].value as 'commun' | 'epoux1' | 'epoux2' },
    ]));
  }, [enfantRattachementOptions, setEnfantsContext]);

  const updateEnfantRattachement = useCallback((id: string, rattachement: 'commun' | 'epoux1' | 'epoux2') => {
    setEnfantsContext((prev) => prev.map((enfant) => (
      enfant.id === id
        ? { ...enfant, rattachement }
        : enfant
    )));
  }, [setEnfantsContext]);

  const toggleEnfantDeceased = useCallback((id: string, deceased: boolean) => {
    setEnfantsContext((prev) => prev.map((enfant) => (
      enfant.id === id
        ? { ...enfant, deceased: deceased || undefined }
        : enfant
    )));
  }, [setEnfantsContext]);

  const removeEnfant = useCallback((id: string) => {
    setEnfantsContext((prev) => prev.filter((enfant) => enfant.id !== id));
  }, [setEnfantsContext]);

  const addFamilyMember = useCallback(() => {
    const { type, branch, parentEnfantId } = addMemberForm;
    if (!type) return;
    const needsBranch = MEMBER_TYPE_NEEDS_BRANCH.includes(type as FamilyMemberType);
    if (needsBranch && !branch) return;
    if (type === 'petit_enfant' && !parentEnfantId) return;
    const member: FamilyMember = {
      id: createMemberId(),
      type: type as FamilyMemberType,
      branch: branch ? (branch as FamilyBranch) : undefined,
      parentEnfantId: type === 'petit_enfant' ? parentEnfantId : undefined,
    };
    setFamilyMembers((prev) => [...prev, member]);
    setAddMemberForm(EMPTY_ADD_FAMILY_MEMBER_FORM);
    setShowAddMemberPanel(false);
  }, [addMemberForm, setAddMemberForm, setFamilyMembers, setShowAddMemberPanel]);

  const removeFamilyMember = useCallback((id: string) => {
    setFamilyMembers((prev) => prev.filter((member) => member.id !== id));
  }, [setFamilyMembers]);

  const addDonationEntry = useCallback(() => {
    setDonationsContext((prev) => ([
      ...prev,
      {
        id: createDonationId(),
        type: 'rapportable',
        montant: 0,
      },
    ]));
  }, [setDonationsContext]);

  const updateDonationEntry = useCallback((
    id: string,
    field: keyof SuccessionDonationEntry,
    value: string | number | boolean,
  ) => {
    setDonationsContext((prev) => prev.map((entry) => (
      entry.id === id
        ? applySuccessionDonationFieldUpdate(entry, field, value)
        : entry
    )));
  }, [setDonationsContext]);

  const removeDonationEntry = useCallback((id: string) => {
    setDonationsContext((prev) => prev.filter((entry) => entry.id !== id));
  }, [setDonationsContext]);

  return {
    handleSituationChange,
    addEnfant,
    updateEnfantRattachement,
    toggleEnfantDeceased,
    removeEnfant,
    addFamilyMember,
    removeFamilyMember,
    addDonationEntry,
    updateDonationEntry,
    removeDonationEntry,
  };
}
