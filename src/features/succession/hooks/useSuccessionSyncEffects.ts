/**
 * useSuccessionSyncEffects - Effets de synchronisation et normalisation.
 *
 * Les entrees detaillees sont maintenant normalisees directement via
 * `pocket`; l'alias legacy `owner` n'est plus requis dans le runtime detaille.
 */

import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type {
  SuccessionAssetDetailEntry,
  SuccessionAssetPocket,
  SuccessionPersonParty,
  SituationMatrimoniale,
  PacsConvention,
  SuccessionAssuranceVieEntry,
  SuccessionDevolutionContext,
  SuccessionEnfant,
  SuccessionGroupementFoncierEntry,
  SuccessionLiquidationContext,
  SuccessionPatrimonialContext,
  SuccessionPerEntry,
  SuccessionPrevoyanceDecesEntry,
  FamilyMember,
} from '../successionDraft';
import type { RegimeMatrimonial } from '../../../engine/civil';
import { normalizeResidencePrincipaleAssetEntries } from '../successionAssetValuation';
import { resolveSuccessionAssetLocation } from '../successionPatrimonialModel';

interface SelectOption<TValue extends string = string> {
  value: TValue;
}

interface DonationTotals {
  rapportable: number;
  horsPart: number;
  legsParticuliers: number;
}

interface AssetNetTotals {
  epoux1: number;
  epoux2: number;
  commun: number;
}

interface UseSuccessionSyncEffectsParams {
  enfantRattachementOptions: SelectOption[];
  assetPocketOptions: SelectOption<SuccessionAssetPocket>[];
  assuranceViePartyOptions: SelectOption<SuccessionPersonParty>[];
  situationMatrimoniale: SituationMatrimoniale;
  regimeMatrimonial: RegimeMatrimonial | null;
  pacsConvention: PacsConvention;
  assetNetTotals: AssetNetTotals;
  nbEnfants: number;
  donationTotals: DonationTotals;
  familyMembers: FamilyMember[];
  setEnfantsContext: Dispatch<SetStateAction<SuccessionEnfant[]>>;
  setDevolutionContext: Dispatch<SetStateAction<SuccessionDevolutionContext>>;
  setLiquidationContext: Dispatch<SetStateAction<SuccessionLiquidationContext>>;
  setAssetEntries: Dispatch<SetStateAction<SuccessionAssetDetailEntry[]>>;
  setAssuranceVieEntries: Dispatch<SetStateAction<SuccessionAssuranceVieEntry[]>>;
  setPerEntries: Dispatch<SetStateAction<SuccessionPerEntry[]>>;
  setGroupementFoncierEntries: Dispatch<SetStateAction<SuccessionGroupementFoncierEntry[]>>;
  setPrevoyanceDecesEntries: Dispatch<SetStateAction<SuccessionPrevoyanceDecesEntry[]>>;
  setPatrimonialContext: Dispatch<SetStateAction<SuccessionPatrimonialContext>>;
}

function getFallbackPocket(
  fallbackPocket: SuccessionAssetPocket,
  situationMatrimoniale: SituationMatrimoniale,
  regimeMatrimonial: RegimeMatrimonial | null,
  pacsConvention: PacsConvention,
) {
  return resolveSuccessionAssetLocation({
    pocket: fallbackPocket,
    situationMatrimoniale,
    regimeMatrimonial,
    pacsConvention,
  })?.pocket ?? 'epoux1';
}

export function useSuccessionSyncEffects({
  enfantRattachementOptions,
  assetPocketOptions,
  assuranceViePartyOptions,
  situationMatrimoniale,
  regimeMatrimonial,
  pacsConvention,
  assetNetTotals,
  nbEnfants,
  donationTotals,
  familyMembers,
  setEnfantsContext,
  setDevolutionContext,
  setLiquidationContext,
  setAssetEntries,
  setAssuranceVieEntries,
  setPerEntries,
  setGroupementFoncierEntries,
  setPrevoyanceDecesEntries,
  setPatrimonialContext,
}: UseSuccessionSyncEffectsParams): void {
  useEffect(() => {
    const validValues = new Set(enfantRattachementOptions.map((option) => option.value));
    const defaultValue = (enfantRattachementOptions[0]?.value ?? 'epoux1') as 'commun' | 'epoux1' | 'epoux2';
    setEnfantsContext((prev) => prev.map((entry) => (
      validValues.has(entry.rattachement) ? entry : { ...entry, rattachement: defaultValue }
    )));
  }, [enfantRattachementOptions, setEnfantsContext]);

  useEffect(() => {
    const hasParentsBySide = {
      epoux1: familyMembers.some((member) => member.type === 'parent' && (!member.branch || member.branch === 'epoux1')),
      epoux2: familyMembers.some((member) => member.type === 'parent' && member.branch === 'epoux2'),
    };
    setDevolutionContext((prev) => {
      if (
        prev.ascendantsSurvivantsBySide.epoux1 === hasParentsBySide.epoux1
        && prev.ascendantsSurvivantsBySide.epoux2 === hasParentsBySide.epoux2
      ) {
        return prev;
      }
      return {
        ...prev,
        ascendantsSurvivantsBySide: hasParentsBySide,
      };
    });
  }, [familyMembers, setDevolutionContext]);

  useEffect(() => {
    setLiquidationContext((prev) => {
      const next = {
        actifEpoux1: assetNetTotals.epoux1,
        actifEpoux2: assetNetTotals.epoux2,
        actifCommun: assetNetTotals.commun,
        nbEnfants,
      };
      if (
        prev.actifEpoux1 === next.actifEpoux1
        && prev.actifEpoux2 === next.actifEpoux2
        && prev.actifCommun === next.actifCommun
        && prev.nbEnfants === next.nbEnfants
      ) {
        return prev;
      }
      return next;
    });
  }, [assetNetTotals.commun, assetNetTotals.epoux1, assetNetTotals.epoux2, nbEnfants, setLiquidationContext]);

  useEffect(() => {
    const validPockets = new Set(assetPocketOptions.map((option) => option.value));
    const rawFallbackPocket = assetPocketOptions[0]?.value ?? 'epoux1';
    const fallbackPocket = getFallbackPocket(
      rawFallbackPocket,
      situationMatrimoniale,
      regimeMatrimonial,
      pacsConvention,
    );

    setAssetEntries((prev) => {
      let changed = false;
      const mapped = prev.map((entry) => {
        const resolved = resolveSuccessionAssetLocation({
          pocket: entry.pocket,
          situationMatrimoniale,
          regimeMatrimonial,
          pacsConvention,
        });
        const pocket = resolved && validPockets.has(resolved.pocket)
          ? resolved.pocket
          : fallbackPocket;
        if (entry.pocket === pocket) return entry;
        changed = true;
        return { ...entry, pocket };
      });
      const normalized = normalizeResidencePrincipaleAssetEntries(mapped);
      const residenceChanged = normalized.some((entry, index) => entry.subCategory !== mapped[index]?.subCategory);
      return changed || residenceChanged ? normalized : prev;
    });
  }, [
    assetPocketOptions,
    pacsConvention,
    regimeMatrimonial,
    setAssetEntries,
    situationMatrimoniale,
  ]);

  useEffect(() => {
    const validOwners = new Set(assuranceViePartyOptions.map((option) => option.value));
    const fallbackOwner = assuranceViePartyOptions[0]?.value ?? 'epoux1';
    setAssuranceVieEntries((prev) => {
      let changed = false;
      const next = prev.map((entry) => {
        const souscripteur = validOwners.has(entry.souscripteur) ? entry.souscripteur : fallbackOwner;
        const assure = validOwners.has(entry.assure) ? entry.assure : fallbackOwner;
        if (souscripteur === entry.souscripteur && assure === entry.assure) return entry;
        changed = true;
        return {
          ...entry,
          souscripteur,
          assure,
        };
      });
      return changed ? next : prev;
    });
  }, [assuranceViePartyOptions, setAssuranceVieEntries]);

  useEffect(() => {
    const validOwners = new Set(assuranceViePartyOptions.map((option) => option.value));
    const fallbackOwner = assuranceViePartyOptions[0]?.value ?? 'epoux1';
    setPerEntries((prev) => {
      let changed = false;
      const next = prev.map((entry) => {
        const assure = validOwners.has(entry.assure) ? entry.assure : fallbackOwner;
        if (assure === entry.assure) return entry;
        changed = true;
        return {
          ...entry,
          assure,
        };
      });
      return changed ? next : prev;
    });
  }, [assuranceViePartyOptions, setPerEntries]);

  useEffect(() => {
    const validPockets = new Set(assetPocketOptions.map((option) => option.value));
    const rawFallbackPocket = assetPocketOptions[0]?.value ?? 'epoux1';
    const fallbackPocket = getFallbackPocket(
      rawFallbackPocket,
      situationMatrimoniale,
      regimeMatrimonial,
      pacsConvention,
    );

    setGroupementFoncierEntries((prev) => {
      let changed = false;
      const next = prev.map((entry) => {
        const resolved = resolveSuccessionAssetLocation({
          pocket: entry.pocket,
          situationMatrimoniale,
          regimeMatrimonial,
          pacsConvention,
        });
        const pocket = resolved && validPockets.has(resolved.pocket)
          ? resolved.pocket
          : fallbackPocket;
        if (entry.pocket === pocket) return entry;
        changed = true;
        return { ...entry, pocket };
      });
      return changed ? next : prev;
    });
  }, [
    assetPocketOptions,
    pacsConvention,
    regimeMatrimonial,
    setGroupementFoncierEntries,
    situationMatrimoniale,
  ]);

  useEffect(() => {
    const validOwners = new Set(assuranceViePartyOptions.map((option) => option.value));
    const fallbackOwner = assuranceViePartyOptions[0]?.value ?? 'epoux1';
    setPrevoyanceDecesEntries((prev) => {
      let changed = false;
      const next = prev.map((entry) => {
        const souscripteur = validOwners.has(entry.souscripteur) ? entry.souscripteur : fallbackOwner;
        const assure = validOwners.has(entry.assure) ? entry.assure : fallbackOwner;
        if (souscripteur === entry.souscripteur && assure === entry.assure) return entry;
        changed = true;
        return { ...entry, souscripteur, assure };
      });
      return changed ? next : prev;
    });
  }, [assuranceViePartyOptions, setPrevoyanceDecesEntries]);

  useEffect(() => {
    setPatrimonialContext((prev) => {
      if (
        prev.donationsRapportables === donationTotals.rapportable
        && prev.donationsHorsPart === donationTotals.horsPart
        && prev.legsParticuliers === donationTotals.legsParticuliers
      ) {
        return prev;
      }
      return {
        ...prev,
        donationsRapportables: donationTotals.rapportable,
        donationsHorsPart: donationTotals.horsPart,
        legsParticuliers: donationTotals.legsParticuliers,
      };
    });
  }, [donationTotals.horsPart, donationTotals.legsParticuliers, donationTotals.rapportable, setPatrimonialContext]);
}
