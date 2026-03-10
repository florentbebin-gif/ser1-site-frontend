import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  DEFAULT_SUCCESSION_DONATIONS,
  DEFAULT_SUCCESSION_ENFANTS_CONTEXT,
  DEFAULT_SUCCESSION_FAMILY_MEMBERS,
  DEFAULT_SUCCESSION_ASSET_DETAILS,
  DEFAULT_SUCCESSION_ASSURANCE_VIE,
  DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  type SuccessionAssetCategory,
  type SuccessionAssetDetailEntry,
  type SuccessionAssetOwner,
  type SuccessionAssuranceVieEntry,
  type FamilyBranch,
  type FamilyMember,
  type FamilyMemberType,
  type SuccessionBeneficiaryRef,
  type SuccessionDonationEntry,
  type SuccessionDonationEntryType,
  type SuccessionEnfant,
  type SuccessionPrimarySide,
  type SuccessionTestamentConfig,
  type SituationMatrimoniale,
} from './successionDraft';
import {
  buildTestamentBeneficiaryOptions,
  cloneSuccessionTestamentsBySide,
  createSuccessionParticularLegacyEntry,
} from './successionTestament';
import {
  ASSET_SUBCATEGORY_OPTIONS,
  MEMBER_TYPE_NEEDS_BRANCH,
} from './successionSimulator.constants';
import {
  buildAggregateAssetEntries,
  buildInitialDispositionsDraft,
  cloneAscendantsSurvivantsBySide,
  createAssetId,
  createAssuranceVieId,
  createDonationId,
  createEnfantId,
  createMemberId,
  EMPTY_ADD_FAMILY_MEMBER_FORM,
  isCoupleSituation,
  updateDraftTestament,
  type AddFamilyMemberFormState,
  type DispositionsDraftState,
} from './successionSimulator.helpers';
import type { SuccessionChainOrder } from './successionChainage';

interface UseSuccessionSimulatorHandlersArgs {
  storeKey: string;
  reset: () => void;
  assetBreakdown: {
    actifs: Record<SuccessionAssetOwner, number>;
    passifs: Record<SuccessionAssetOwner, number>;
  };
  enfantRattachementOptions: { value: 'commun' | 'epoux1' | 'epoux2'; label: string }[];
  addMemberForm: AddFamilyMemberFormState;
  assetOwnerOptions: { value: SuccessionAssetOwner; label: string }[];
  assuranceVieEntries: SuccessionAssuranceVieEntry[];
  assuranceVieDraft: SuccessionAssuranceVieEntry[];
  assuranceViePartyOptions: { value: 'epoux1' | 'epoux2'; label: string }[];
  testamentBeneficiaryOptionsBySide: Record<
    SuccessionPrimarySide,
    ReturnType<typeof buildTestamentBeneficiaryOptions>
  >;
  canOpenDispositionsModal: boolean;
  civilContext: typeof DEFAULT_SUCCESSION_CIVIL_CONTEXT;
  devolutionContext: typeof DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT;
  patrimonialContext: typeof DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT;
  dispositionsDraft: DispositionsDraftState;
  setCivilContext: Dispatch<SetStateAction<typeof DEFAULT_SUCCESSION_CIVIL_CONTEXT>>;
  setLiquidationContext: Dispatch<SetStateAction<typeof DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT>>;
  setAssetEntries: Dispatch<SetStateAction<SuccessionAssetDetailEntry[]>>;
  setAssuranceVieEntries: Dispatch<SetStateAction<SuccessionAssuranceVieEntry[]>>;
  setDevolutionContext: Dispatch<SetStateAction<typeof DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT>>;
  setPatrimonialContext: Dispatch<SetStateAction<typeof DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT>>;
  setDonationsContext: Dispatch<SetStateAction<SuccessionDonationEntry[]>>;
  setEnfantsContext: Dispatch<SetStateAction<SuccessionEnfant[]>>;
  setFamilyMembers: Dispatch<SetStateAction<FamilyMember[]>>;
  setShowAddMemberPanel: Dispatch<SetStateAction<boolean>>;
  setShowDispositionsModal: Dispatch<SetStateAction<boolean>>;
  setShowAssuranceVieModal: Dispatch<SetStateAction<boolean>>;
  setAssuranceVieDraft: Dispatch<SetStateAction<SuccessionAssuranceVieEntry[]>>;
  setDispositionsDraft: Dispatch<SetStateAction<DispositionsDraftState>>;
  setAddMemberForm: Dispatch<SetStateAction<AddFamilyMemberFormState>>;
  setChainOrder: Dispatch<SetStateAction<SuccessionChainOrder>>;
  setHypothesesOpen: Dispatch<SetStateAction<boolean>>;
}

export function useSuccessionSimulatorHandlers({
  storeKey,
  reset,
  assetBreakdown,
  enfantRattachementOptions,
  addMemberForm,
  assetOwnerOptions,
  assuranceVieEntries,
  assuranceVieDraft,
  assuranceViePartyOptions,
  testamentBeneficiaryOptionsBySide,
  canOpenDispositionsModal,
  civilContext: _civilContext,
  devolutionContext,
  patrimonialContext,
  dispositionsDraft,
  setCivilContext,
  setLiquidationContext,
  setAssetEntries,
  setAssuranceVieEntries,
  setDevolutionContext,
  setPatrimonialContext,
  setDonationsContext,
  setEnfantsContext,
  setFamilyMembers,
  setShowAddMemberPanel,
  setShowDispositionsModal,
  setShowAssuranceVieModal,
  setAssuranceVieDraft,
  setDispositionsDraft,
  setAddMemberForm,
  setChainOrder,
  setHypothesesOpen,
}: UseSuccessionSimulatorHandlersArgs) {
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
        preciputMontant: 0,
        attributionIntegrale: false,
      }));
    }
  }, [setCivilContext, setPatrimonialContext]);

  const handleReset = useCallback(() => {
    reset();
    setCivilContext(DEFAULT_SUCCESSION_CIVIL_CONTEXT);
    setLiquidationContext(DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT);
    setAssetEntries(DEFAULT_SUCCESSION_ASSET_DETAILS);
    setAssuranceVieEntries(DEFAULT_SUCCESSION_ASSURANCE_VIE);
    setAssuranceVieDraft(DEFAULT_SUCCESSION_ASSURANCE_VIE);
    setDevolutionContext(DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT);
    setPatrimonialContext(DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT);
    setDispositionsDraft(buildInitialDispositionsDraft());
    setDonationsContext(DEFAULT_SUCCESSION_DONATIONS);
    setEnfantsContext(DEFAULT_SUCCESSION_ENFANTS_CONTEXT);
    setFamilyMembers(DEFAULT_SUCCESSION_FAMILY_MEMBERS);
    setShowAddMemberPanel(false);
    setShowAssuranceVieModal(false);
    setAddMemberForm(EMPTY_ADD_FAMILY_MEMBER_FORM);
    setChainOrder('epoux1');
    setHypothesesOpen(false);
    try {
      sessionStorage.removeItem(storeKey);
    } catch {
      // ignore
    }
  }, [
    reset,
    setAddMemberForm,
    setAssetEntries,
    setAssuranceVieDraft,
    setAssuranceVieEntries,
    setChainOrder,
    setCivilContext,
    setDevolutionContext,
    setDispositionsDraft,
    setDonationsContext,
    setEnfantsContext,
    setFamilyMembers,
    setHypothesesOpen,
    setLiquidationContext,
    setPatrimonialContext,
    setShowAddMemberPanel,
    setShowAssuranceVieModal,
    storeKey,
  ]);

  const setSimplifiedBalanceField = useCallback((
    type: 'actifs' | 'passifs',
    owner: SuccessionAssetOwner,
    value: number,
  ) => {
    setAssetEntries(buildAggregateAssetEntries({
      actifs: {
        epoux1: owner === 'epoux1' && type === 'actifs' ? Math.max(0, value) : assetBreakdown.actifs.epoux1,
        epoux2: owner === 'epoux2' && type === 'actifs' ? Math.max(0, value) : assetBreakdown.actifs.epoux2,
        commun: owner === 'commun' && type === 'actifs' ? Math.max(0, value) : assetBreakdown.actifs.commun,
      },
      passifs: {
        epoux1: owner === 'epoux1' && type === 'passifs' ? Math.max(0, value) : assetBreakdown.passifs.epoux1,
        epoux2: owner === 'epoux2' && type === 'passifs' ? Math.max(0, value) : assetBreakdown.passifs.epoux2,
        commun: owner === 'commun' && type === 'passifs' ? Math.max(0, value) : assetBreakdown.passifs.commun,
      },
    }));
  }, [assetBreakdown, setAssetEntries]);

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
    setDonationsContext((prev) => prev.map((entry) => {
      if (entry.id !== id) return entry;
      if (field === 'type') return { ...entry, type: value as SuccessionDonationEntryType };
      if (field === 'montant' || field === 'valeurDonation' || field === 'valeurActuelle') {
        return { ...entry, [field]: Math.max(0, Number(value) || 0) };
      }
      if (field === 'donSommeArgentExonere' || field === 'avecReserveUsufruit') {
        return { ...entry, [field]: Boolean(value) };
      }
      return { ...entry, [field]: typeof value === 'string' ? value : String(value) };
    }));
  }, [setDonationsContext]);

  const removeDonationEntry = useCallback((id: string) => {
    setDonationsContext((prev) => prev.filter((entry) => entry.id !== id));
  }, [setDonationsContext]);

  const addAssetEntry = useCallback((category: SuccessionAssetCategory) => {
    setAssetEntries((prev) => ([
      ...prev,
      {
        id: createAssetId(),
        owner: assetOwnerOptions[0]?.value ?? 'epoux1',
        category,
        subCategory: ASSET_SUBCATEGORY_OPTIONS[category][0] ?? 'Saisie libre',
        amount: 0,
      },
    ]));
  }, [assetOwnerOptions, setAssetEntries]);

  const updateAssetEntry = useCallback((
    id: string,
    field: keyof SuccessionAssetDetailEntry,
    value: string | number,
  ) => {
    setAssetEntries((prev) => prev.map((entry) => {
      if (entry.id !== id) return entry;
      if (field === 'amount') {
        return {
          ...entry,
          amount: Math.max(0, Number(value) || 0),
        };
      }
      if (field === 'category') {
        const category = value as SuccessionAssetCategory;
        return {
          ...entry,
          category,
          subCategory: ASSET_SUBCATEGORY_OPTIONS[category][0] ?? 'Saisie libre',
        };
      }
      return {
        ...entry,
        [field]: value,
      };
    }));
  }, [setAssetEntries]);

  const removeAssetEntry = useCallback((id: string) => {
    setAssetEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, [setAssetEntries]);

  const openAssuranceVieModal = useCallback(() => {
    setAssuranceVieDraft(assuranceVieEntries.map((entry) => ({ ...entry })));
    setShowAssuranceVieModal(true);
  }, [assuranceVieEntries, setAssuranceVieDraft, setShowAssuranceVieModal]);

  const closeAssuranceVieModal = useCallback(() => {
    setShowAssuranceVieModal(false);
  }, [setShowAssuranceVieModal]);

  const validateAssuranceVieModal = useCallback(() => {
    setAssuranceVieEntries(assuranceVieDraft.map((entry) => ({ ...entry })));
    setShowAssuranceVieModal(false);
  }, [assuranceVieDraft, setAssuranceVieEntries, setShowAssuranceVieModal]);

  const addAssuranceVieEntry = useCallback(() => {
    setAssuranceVieDraft((prev) => ([
      ...prev,
      {
        id: createAssuranceVieId(),
        typeContrat: 'standard',
        souscripteur: assuranceViePartyOptions[0]?.value ?? 'epoux1',
        assure: assuranceViePartyOptions[0]?.value ?? 'epoux1',
        capitauxDeces: 0,
        versementsApres70: 0,
      },
    ]));
  }, [assuranceViePartyOptions, setAssuranceVieDraft]);

  const updateAssuranceVieEntry = useCallback((
    id: string,
    field: keyof SuccessionAssuranceVieEntry,
    value: string | number | undefined,
  ) => {
    setAssuranceVieDraft((prev) => prev.map((entry) => {
      if (entry.id !== id) return entry;
      if (field === 'capitauxDeces' || field === 'versementsApres70') {
        return {
          ...entry,
          [field]: Math.max(0, Number(value) || 0),
        };
      }
      if (field === 'ageUsufruitier') {
        const age = Number(value);
        return {
          ...entry,
          ageUsufruitier: Number.isFinite(age) && age > 0 ? age : undefined,
        };
      }
      return {
        ...entry,
        [field]: value,
      };
    }));
  }, [setAssuranceVieDraft]);

  const removeAssuranceVieEntry = useCallback((id: string) => {
    setAssuranceVieDraft((prev) => prev.filter((entry) => entry.id !== id));
  }, [setAssuranceVieDraft]);

  const getFirstTestamentBeneficiaryRef = useCallback(
    (side: SuccessionPrimarySide): SuccessionBeneficiaryRef | null =>
      testamentBeneficiaryOptionsBySide[side][0]?.value ?? null,
    [testamentBeneficiaryOptionsBySide],
  );

  const updateDispositionsTestament = useCallback((
    side: SuccessionPrimarySide,
    updater: (_current: SuccessionTestamentConfig) => SuccessionTestamentConfig,
  ) => {
    setDispositionsDraft((prev) => updateDraftTestament(prev, side, updater));
  }, [setDispositionsDraft]);

  const addDispositionsParticularLegacy = useCallback((side: SuccessionPrimarySide) => {
    const defaultBeneficiaryRef = getFirstTestamentBeneficiaryRef(side);
    setDispositionsDraft((prev) => updateDraftTestament(prev, side, (current) => ({
      ...current,
      particularLegacies: [
        ...current.particularLegacies,
        createSuccessionParticularLegacyEntry(defaultBeneficiaryRef),
      ],
    })));
  }, [getFirstTestamentBeneficiaryRef, setDispositionsDraft]);

  const updateDispositionsParticularLegacy = useCallback((
    side: SuccessionPrimarySide,
    legacyId: string,
    field: 'beneficiaryRef' | 'amount' | 'label',
    value: string | number | SuccessionBeneficiaryRef | null,
  ) => {
    setDispositionsDraft((prev) => updateDraftTestament(prev, side, (current) => ({
      ...current,
      particularLegacies: current.particularLegacies.map((entry) => {
        if (entry.id !== legacyId) return entry;
        if (field === 'beneficiaryRef') {
          return {
            ...entry,
            beneficiaryRef: typeof value === 'string' && value.length > 0 ? value as SuccessionBeneficiaryRef : null,
          };
        }
        if (field === 'amount') {
          return {
            ...entry,
            amount: Math.max(0, Number(value) || 0),
          };
        }
        return {
          ...entry,
          label: typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined,
        };
      }),
    })));
  }, [setDispositionsDraft]);

  const removeDispositionsParticularLegacy = useCallback((side: SuccessionPrimarySide, legacyId: string) => {
    setDispositionsDraft((prev) => updateDraftTestament(prev, side, (current) => ({
      ...current,
      particularLegacies: current.particularLegacies.filter((entry) => entry.id !== legacyId),
    })));
  }, [setDispositionsDraft]);

  const openDispositionsModal = useCallback(() => {
    if (!canOpenDispositionsModal) return;
    setDispositionsDraft({
      attributionBiensCommunsPct: patrimonialContext.attributionBiensCommunsPct,
      donationEntreEpouxActive: patrimonialContext.donationEntreEpouxActive,
      donationEntreEpouxOption: patrimonialContext.donationEntreEpouxOption,
      preciputMontant: patrimonialContext.preciputMontant,
      attributionIntegrale: patrimonialContext.attributionIntegrale,
      choixLegalConjointSansDDV: devolutionContext.choixLegalConjointSansDDV,
      testamentsBySide: cloneSuccessionTestamentsBySide(devolutionContext.testamentsBySide),
      ascendantsSurvivantsBySide: cloneAscendantsSurvivantsBySide(devolutionContext.ascendantsSurvivantsBySide),
    });
    setShowDispositionsModal(true);
  }, [
    canOpenDispositionsModal,
    devolutionContext,
    patrimonialContext,
    setDispositionsDraft,
    setShowDispositionsModal,
  ]);

  const validateDispositionsModal = useCallback(() => {
    setPatrimonialContext((prev) => ({
      ...prev,
      attributionBiensCommunsPct: dispositionsDraft.attributionBiensCommunsPct,
      donationEntreEpouxActive: dispositionsDraft.donationEntreEpouxActive,
      donationEntreEpouxOption: dispositionsDraft.donationEntreEpouxOption,
      preciputMontant: dispositionsDraft.preciputMontant,
      attributionIntegrale: dispositionsDraft.attributionBiensCommunsPct === 100,
    }));
    setDevolutionContext((prev) => ({
      ...prev,
      choixLegalConjointSansDDV: dispositionsDraft.choixLegalConjointSansDDV,
      testamentsBySide: cloneSuccessionTestamentsBySide(dispositionsDraft.testamentsBySide),
      ascendantsSurvivantsBySide: cloneAscendantsSurvivantsBySide(dispositionsDraft.ascendantsSurvivantsBySide),
    }));
    setShowDispositionsModal(false);
  }, [dispositionsDraft, setDevolutionContext, setPatrimonialContext, setShowDispositionsModal]);

  return {
    handleSituationChange,
    handleReset,
    setSimplifiedBalanceField,
    addEnfant,
    updateEnfantRattachement,
    toggleEnfantDeceased,
    removeEnfant,
    addFamilyMember,
    removeFamilyMember,
    addDonationEntry,
    updateDonationEntry,
    removeDonationEntry,
    addAssetEntry,
    updateAssetEntry,
    removeAssetEntry,
    openAssuranceVieModal,
    closeAssuranceVieModal,
    validateAssuranceVieModal,
    addAssuranceVieEntry,
    updateAssuranceVieEntry,
    removeAssuranceVieEntry,
    getFirstTestamentBeneficiaryRef,
    updateDispositionsTestament,
    addDispositionsParticularLegacy,
    updateDispositionsParticularLegacy,
    removeDispositionsParticularLegacy,
    openDispositionsModal,
    validateDispositionsModal,
  };
}
