import { useState } from 'react';
import type { UserMode } from '../../../settings/userMode';
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
  type SuccessionAssuranceVieEntry,
  type SuccessionDonationEntry,
  type SuccessionEnfant,
  type SuccessionGroupementFoncierEntry,
  type SuccessionPerEntry,
  type SuccessionPrevoyanceDecesEntry,
} from '../successionDraft';
import type { SuccessionChainOrder } from '../successionChainage';
import {
  buildInitialDispositionsDraft,
  EMPTY_ADD_FAMILY_MEMBER_FORM,
  type AddFamilyMemberFormState,
  type DispositionsDraftState,
} from '../successionSimulator.helpers';

export function useSuccessionDraftState() {
  const [localMode, setLocalMode] = useState<UserMode | null>(null);
  const [hypothesesOpen, setHypothesesOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [civilContext, setCivilContext] = useState(DEFAULT_SUCCESSION_CIVIL_CONTEXT);
  const [liquidationContext, setLiquidationContext] = useState(
    DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
  );
  const [assetEntries, setAssetEntries] = useState<SuccessionAssetDetailEntry[]>(
    DEFAULT_SUCCESSION_ASSET_DETAILS,
  );
  const [assuranceVieEntries, setAssuranceVieEntries] = useState<SuccessionAssuranceVieEntry[]>(
    DEFAULT_SUCCESSION_ASSURANCE_VIE,
  );
  const [perEntries, setPerEntries] = useState<SuccessionPerEntry[]>(DEFAULT_SUCCESSION_PER);
  const [devolutionContext, setDevolutionContext] = useState(DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT);
  const [patrimonialContext, setPatrimonialContext] = useState(
    DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  );
  const [donationsContext, setDonationsContext] = useState<SuccessionDonationEntry[]>(
    DEFAULT_SUCCESSION_DONATIONS,
  );
  const [enfantsContext, setEnfantsContext] = useState<SuccessionEnfant[]>(
    DEFAULT_SUCCESSION_ENFANTS_CONTEXT,
  );
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(
    DEFAULT_SUCCESSION_FAMILY_MEMBERS,
  );
  const [showAddMemberPanel, setShowAddMemberPanel] = useState(false);
  const [showDispositionsModal, setShowDispositionsModal] = useState(false);
  const [showAssuranceVieModal, setShowAssuranceVieModal] = useState(false);
  const [showPerModal, setShowPerModal] = useState(false);
  const [showPrevoyanceModal, setShowPrevoyanceModal] = useState(false);
  const [assuranceVieDraft, setAssuranceVieDraft] = useState<SuccessionAssuranceVieEntry | null>(
    null,
  );
  const [perDraft, setPerDraft] = useState<SuccessionPerEntry | null>(null);
  const [prevoyanceDraft, setPrevoyanceDraft] = useState<SuccessionPrevoyanceDecesEntry | null>(
    null,
  );
  const [groupementFoncierEntries, setGroupementFoncierEntries] = useState<
    SuccessionGroupementFoncierEntry[]
  >([]);
  const [prevoyanceDecesEntries, setPrevoyanceDecesEntries] = useState<
    SuccessionPrevoyanceDecesEntry[]
  >([]);
  const [dispositionsDraft, setDispositionsDraft] = useState<DispositionsDraftState>(
    buildInitialDispositionsDraft,
  );
  const [addMemberForm, setAddMemberForm] = useState<AddFamilyMemberFormState>(
    EMPTY_ADD_FAMILY_MEMBER_FORM,
  );
  const [chainOrder, setChainOrder] = useState<SuccessionChainOrder>('epoux1');

  return {
    localMode,
    setLocalMode,
    hypothesesOpen,
    setHypothesesOpen,
    hydrated,
    setHydrated,
    civilContext,
    setCivilContext,
    liquidationContext,
    setLiquidationContext,
    assetEntries,
    setAssetEntries,
    assuranceVieEntries,
    setAssuranceVieEntries,
    perEntries,
    setPerEntries,
    devolutionContext,
    setDevolutionContext,
    patrimonialContext,
    setPatrimonialContext,
    donationsContext,
    setDonationsContext,
    enfantsContext,
    setEnfantsContext,
    familyMembers,
    setFamilyMembers,
    showAddMemberPanel,
    setShowAddMemberPanel,
    showDispositionsModal,
    setShowDispositionsModal,
    showAssuranceVieModal,
    setShowAssuranceVieModal,
    showPerModal,
    setShowPerModal,
    showPrevoyanceModal,
    setShowPrevoyanceModal,
    assuranceVieDraft,
    setAssuranceVieDraft,
    perDraft,
    setPerDraft,
    prevoyanceDraft,
    setPrevoyanceDraft,
    groupementFoncierEntries,
    setGroupementFoncierEntries,
    prevoyanceDecesEntries,
    setPrevoyanceDecesEntries,
    dispositionsDraft,
    setDispositionsDraft,
    addMemberForm,
    setAddMemberForm,
    chainOrder,
    setChainOrder,
  };
}
