import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  DEFAULT_SUCCESSION_ASSET_DETAILS,
  DEFAULT_SUCCESSION_ASSURANCE_VIE,
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  DEFAULT_SUCCESSION_DONATIONS,
  DEFAULT_SUCCESSION_ENFANTS_CONTEXT,
  DEFAULT_SUCCESSION_FAMILY_MEMBERS,
  DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  DEFAULT_SUCCESSION_PER,
  type FamilyMember,
  type SuccessionAssetDetailEntry,
  type SuccessionAssetOwner,
  type SuccessionPersonParty,
  type SuccessionAssuranceVieEntry,
  type SuccessionDonationEntry,
  type SuccessionEnfant,
  type SuccessionGroupementFoncierEntry,
  type SuccessionPerEntry,
  type SuccessionPrevoyanceDecesEntry,
} from './successionDraft';
import type { buildTestamentBeneficiaryOptions } from './successionTestament';
import {
  EMPTY_ADD_FAMILY_MEMBER_FORM,
  buildInitialDispositionsDraft,
  type AddFamilyMemberFormState,
  type DispositionsDraftState,
} from './successionSimulator.helpers';
import type { SuccessionChainOrder } from './successionChainage';
import { useSuccessionAssetHandlers } from './useSuccessionAssetHandlers';
import { useSuccessionContractModalHandlers } from './useSuccessionContractModalHandlers';
import { useSuccessionDispositionsHandlers } from './useSuccessionDispositionsHandlers';
import { useSuccessionFamilyHandlers } from './useSuccessionFamilyHandlers';

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
  assetEntries: SuccessionAssetDetailEntry[];
  assuranceVieEntries: SuccessionAssuranceVieEntry[];
  assuranceVieDraft: SuccessionAssuranceVieEntry | null;
  perEntries: SuccessionPerEntry[];
  perDraft: SuccessionPerEntry | null;
  prevoyanceDecesEntries: SuccessionPrevoyanceDecesEntry[];
  prevoyanceDraft: SuccessionPrevoyanceDecesEntry | null;
  assuranceViePartyOptions: { value: SuccessionPersonParty; label: string }[];
  testamentBeneficiaryOptionsBySide: Record<
    'epoux1' | 'epoux2',
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
  setPerEntries: Dispatch<SetStateAction<SuccessionPerEntry[]>>;
  setGroupementFoncierEntries: Dispatch<SetStateAction<SuccessionGroupementFoncierEntry[]>>;
  setPrevoyanceDecesEntries: Dispatch<SetStateAction<SuccessionPrevoyanceDecesEntry[]>>;
  setDevolutionContext: Dispatch<SetStateAction<typeof DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT>>;
  setPatrimonialContext: Dispatch<SetStateAction<typeof DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT>>;
  setDonationsContext: Dispatch<SetStateAction<SuccessionDonationEntry[]>>;
  setEnfantsContext: Dispatch<SetStateAction<SuccessionEnfant[]>>;
  setFamilyMembers: Dispatch<SetStateAction<FamilyMember[]>>;
  setShowAddMemberPanel: Dispatch<SetStateAction<boolean>>;
  setShowDispositionsModal: Dispatch<SetStateAction<boolean>>;
  setShowAssuranceVieModal: Dispatch<SetStateAction<boolean>>;
  setShowPerModal: Dispatch<SetStateAction<boolean>>;
  setShowPrevoyanceModal: Dispatch<SetStateAction<boolean>>;
  setAssuranceVieDraft: Dispatch<SetStateAction<SuccessionAssuranceVieEntry | null>>;
  setPerDraft: Dispatch<SetStateAction<SuccessionPerEntry | null>>;
  setPrevoyanceDraft: Dispatch<SetStateAction<SuccessionPrevoyanceDecesEntry | null>>;
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
  assetEntries,
  assuranceVieEntries,
  assuranceVieDraft,
  perEntries,
  perDraft,
  prevoyanceDecesEntries,
  prevoyanceDraft,
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
  setPerEntries,
  setGroupementFoncierEntries,
  setPrevoyanceDecesEntries,
  setDevolutionContext,
  setPatrimonialContext,
  setDonationsContext,
  setEnfantsContext,
  setFamilyMembers,
  setShowAddMemberPanel,
  setShowDispositionsModal,
  setShowAssuranceVieModal,
  setShowPerModal,
  setShowPrevoyanceModal,
  setAssuranceVieDraft,
  setPerDraft,
  setPrevoyanceDraft,
  setDispositionsDraft,
  setAddMemberForm,
  setChainOrder,
  setHypothesesOpen,
}: UseSuccessionSimulatorHandlersArgs) {
  const familyHandlers = useSuccessionFamilyHandlers({
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
  });

  const assetHandlers = useSuccessionAssetHandlers({
    assetBreakdown,
    assetOwnerOptions,
    assuranceViePartyOptions,
    assetEntries,
    setAssetEntries,
    setGroupementFoncierEntries,
    setAssuranceVieEntries,
    setAssuranceVieDraft,
    setShowAssuranceVieModal,
    setPerEntries,
    setPerDraft,
    setShowPerModal,
    setPrevoyanceDecesEntries,
    setPrevoyanceDraft,
    setShowPrevoyanceModal,
  });

  const contractModalHandlers = useSuccessionContractModalHandlers({
    assuranceVieEntries,
    assuranceVieDraft,
    setAssuranceVieEntries,
    setAssuranceVieDraft,
    setShowAssuranceVieModal,
    perEntries,
    perDraft,
    setPerEntries,
    setPerDraft,
    setShowPerModal,
    prevoyanceDecesEntries,
    prevoyanceDraft,
    setPrevoyanceDecesEntries,
    setPrevoyanceDraft,
    setShowPrevoyanceModal,
  });

  const dispositionsHandlers = useSuccessionDispositionsHandlers({
    testamentBeneficiaryOptionsBySide,
    canOpenDispositionsModal,
    devolutionContext,
    patrimonialContext,
    dispositionsDraft,
    setDispositionsDraft,
    setShowDispositionsModal,
    setPatrimonialContext,
    setDevolutionContext,
  });

  const handleReset = useCallback(() => {
    reset();
    setCivilContext(DEFAULT_SUCCESSION_CIVIL_CONTEXT);
    setLiquidationContext(DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT);
    setAssetEntries(DEFAULT_SUCCESSION_ASSET_DETAILS);
    setAssuranceVieEntries(DEFAULT_SUCCESSION_ASSURANCE_VIE);
    setAssuranceVieDraft(null);
    setPerEntries(DEFAULT_SUCCESSION_PER);
    setPerDraft(null);
    setGroupementFoncierEntries([]);
    setPrevoyanceDecesEntries([]);
    setShowPrevoyanceModal(false);
    setPrevoyanceDraft(null);
    setDevolutionContext(DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT);
    setPatrimonialContext(DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT);
    setDispositionsDraft(buildInitialDispositionsDraft());
    setDonationsContext(DEFAULT_SUCCESSION_DONATIONS);
    setEnfantsContext(DEFAULT_SUCCESSION_ENFANTS_CONTEXT);
    setFamilyMembers(DEFAULT_SUCCESSION_FAMILY_MEMBERS);
    setShowAddMemberPanel(false);
    setShowDispositionsModal(false);
    setShowAssuranceVieModal(false);
    setShowPerModal(false);
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
    setGroupementFoncierEntries,
    setPrevoyanceDecesEntries,
    setPrevoyanceDraft,
    setPerDraft,
    setPerEntries,
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
    setShowDispositionsModal,
    setShowPerModal,
    setShowPrevoyanceModal,
    storeKey,
  ]);

  return {
    ...familyHandlers,
    handleReset,
    ...assetHandlers,
    ...contractModalHandlers,
    ...dispositionsHandlers,
  };
}
