import { useEffect } from 'react';
import { onResetEvent } from '../../../utils/reset';
import {
  buildSuccessionDraftPayload,
  parseSuccessionDraftPayload,
  type FamilyMember,
  type PersistedSuccessionForm,
  type SuccessionAssetDetailEntry,
  type SuccessionAssuranceVieEntry,
  type SuccessionCivilContext,
  type SuccessionDevolutionContext,
  type SuccessionDonationEntry,
  type SuccessionDonationPartageAct,
  type SuccessionEnfant,
  type SuccessionGroupementFoncierEntry,
  type SuccessionLiquidationContext,
  type SuccessionPatrimonialContext,
  type SuccessionPerEntry,
  type SuccessionPrevoyanceDecesEntry,
} from '../successionDraft';
import type { SuccessionChainOrder } from '../successionChainage';

interface UseSuccessionDraftPersistenceParams {
  storeKey: string;
  hydrated: boolean;
  setHydrated: (_value: boolean) => void;
  persistedForm: PersistedSuccessionForm;
  hydrateForm: (_form: PersistedSuccessionForm) => void;
  civilContext: SuccessionCivilContext;
  setCivilContext: (_value: SuccessionCivilContext) => void;
  liquidationContext: SuccessionLiquidationContext;
  setLiquidationContext: (_value: SuccessionLiquidationContext) => void;
  assetEntries: SuccessionAssetDetailEntry[];
  setAssetEntries: (_value: SuccessionAssetDetailEntry[]) => void;
  assuranceVieEntries: SuccessionAssuranceVieEntry[];
  setAssuranceVieEntries: (_value: SuccessionAssuranceVieEntry[]) => void;
  perEntries: SuccessionPerEntry[];
  setPerEntries: (_value: SuccessionPerEntry[]) => void;
  groupementFoncierEntries: SuccessionGroupementFoncierEntry[];
  setGroupementFoncierEntries: (_value: SuccessionGroupementFoncierEntry[]) => void;
  prevoyanceDecesEntries: SuccessionPrevoyanceDecesEntry[];
  setPrevoyanceDecesEntries: (_value: SuccessionPrevoyanceDecesEntry[]) => void;
  devolutionContext: SuccessionDevolutionContext;
  setDevolutionContext: (_value: SuccessionDevolutionContext) => void;
  patrimonialContext: SuccessionPatrimonialContext;
  setPatrimonialContext: (_value: SuccessionPatrimonialContext) => void;
  donationsContext: SuccessionDonationEntry[];
  setDonationsContext: (_value: SuccessionDonationEntry[]) => void;
  donationPartageActs: SuccessionDonationPartageAct[];
  setDonationPartageActs: (_value: SuccessionDonationPartageAct[]) => void;
  enfantsContext: SuccessionEnfant[];
  setEnfantsContext: (_value: SuccessionEnfant[]) => void;
  familyMembers: FamilyMember[];
  setFamilyMembers: (_value: FamilyMember[]) => void;
  chainOrder: SuccessionChainOrder;
  setChainOrder: (_value: SuccessionChainOrder) => void;
  nbEnfantsNonCommuns: number;
  handleReset: () => void;
}

export function useSuccessionDraftPersistence({
  storeKey,
  hydrated,
  setHydrated,
  persistedForm,
  hydrateForm,
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
  groupementFoncierEntries,
  setGroupementFoncierEntries,
  prevoyanceDecesEntries,
  setPrevoyanceDecesEntries,
  devolutionContext,
  setDevolutionContext,
  patrimonialContext,
  setPatrimonialContext,
  donationsContext,
  setDonationsContext,
  donationPartageActs,
  setDonationPartageActs,
  enfantsContext,
  setEnfantsContext,
  familyMembers,
  setFamilyMembers,
  chainOrder,
  setChainOrder,
  nbEnfantsNonCommuns,
  handleReset,
}: UseSuccessionDraftPersistenceParams) {
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storeKey);
      if (raw) {
        const parsed = parseSuccessionDraftPayload(raw);
        if (parsed) {
          hydrateForm(parsed.form);
          setCivilContext(parsed.civil);
          setLiquidationContext(parsed.liquidation);
          setAssetEntries(parsed.assetEntries);
          setAssuranceVieEntries(parsed.assuranceVieEntries);
          setPerEntries(parsed.perEntries);
          if (parsed.groupementFoncierEntries)
            setGroupementFoncierEntries(parsed.groupementFoncierEntries);
          if (parsed.prevoyanceDecesEntries)
            setPrevoyanceDecesEntries(parsed.prevoyanceDecesEntries);
          setDevolutionContext(parsed.devolution);
          setPatrimonialContext(parsed.patrimonial);
          setDonationsContext(parsed.donations);
          setDonationPartageActs(parsed.donationPartageActs);
          setEnfantsContext(parsed.enfants);
          setFamilyMembers(parsed.familyMembers);
          setChainOrder(parsed.ui.chainOrder);
        }
      }
    } catch {
      // SessionStorage peut être indisponible en navigation privée stricte.
    }
    setHydrated(true);
  }, [
    hydrateForm,
    setAssetEntries,
    setAssuranceVieEntries,
    setChainOrder,
    setCivilContext,
    setDevolutionContext,
    setDonationPartageActs,
    setDonationsContext,
    setEnfantsContext,
    setFamilyMembers,
    setGroupementFoncierEntries,
    setHydrated,
    setLiquidationContext,
    setPatrimonialContext,
    setPerEntries,
    setPrevoyanceDecesEntries,
    storeKey,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(
        storeKey,
        JSON.stringify(
          buildSuccessionDraftPayload(
            persistedForm,
            civilContext,
            liquidationContext,
            { ...devolutionContext, nbEnfantsNonCommuns },
            patrimonialContext,
            enfantsContext,
            familyMembers,
            donationsContext,
            assetEntries,
            assuranceVieEntries,
            perEntries,
            groupementFoncierEntries,
            prevoyanceDecesEntries,
            chainOrder,
            donationPartageActs,
          ),
        ),
      );
    } catch {
      // SessionStorage peut être indisponible en navigation privée stricte.
    }
  }, [
    assetEntries,
    assuranceVieEntries,
    chainOrder,
    civilContext,
    devolutionContext,
    donationPartageActs,
    donationsContext,
    enfantsContext,
    familyMembers,
    groupementFoncierEntries,
    hydrated,
    liquidationContext,
    nbEnfantsNonCommuns,
    patrimonialContext,
    perEntries,
    persistedForm,
    prevoyanceDecesEntries,
    storeKey,
  ]);

  useEffect(() => {
    const off = onResetEvent?.(({ simId }: { simId?: string }) => {
      if (simId && simId !== 'succession') return;
      handleReset();
    });
    return off || (() => {});
  }, [handleReset]);
}
