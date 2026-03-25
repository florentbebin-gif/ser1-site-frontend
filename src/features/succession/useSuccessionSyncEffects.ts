/**
 * useSuccessionSyncEffects — Effets de synchronisation état du SuccessionSimulator
 *
 * Regroupe les useEffect qui normalisent l'état lorsque le contexte civil/familial change :
 * - Reset des rattachements enfant invalides
 * - Dérivation automatique ascendants survivants
 * - Synchronisation liquidation depuis actifs nets
 * - Reset propriétaires d'actifs invalides
 * - Reset parties AV/PER/prévoyance invalides
 * - Reset GFV owners invalides
 * - Synchronisation patrimonial depuis donations
 */

import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type {
  SuccessionAssetDetailEntry,
  SuccessionAssetOwner,
  SuccessionPersonParty,
  SuccessionAssuranceVieEntry,
  SuccessionDevolutionContext,
  SuccessionEnfant,
  SuccessionGroupementFoncierEntry,
  SuccessionLiquidationContext,
  SuccessionPatrimonialContext,
  SuccessionPerEntry,
  SuccessionPrevoyanceDecesEntry,
  FamilyMember,
} from './successionDraft';
import { normalizeResidencePrincipaleAssetEntries } from './successionAssetValuation';

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
  // Derived values (read-only)
  enfantRattachementOptions: SelectOption[];
  assetOwnerOptions: SelectOption[];
  assuranceViePartyOptions: SelectOption<SuccessionPersonParty>[];
  assetNetTotals: AssetNetTotals;
  nbEnfants: number;
  donationTotals: DonationTotals;

  // States (read)
  familyMembers: FamilyMember[];

  // Setters (write)
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

export function useSuccessionSyncEffects({
  enfantRattachementOptions,
  assetOwnerOptions,
  assuranceViePartyOptions,
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

  // Reset enfant rattachement invalide lors d'un changement de situation matrimoniale
  useEffect(() => {
    const validValues = new Set(enfantRattachementOptions.map((o) => o.value));
    const defaultValue = (enfantRattachementOptions[0]?.value ?? 'epoux1') as 'commun' | 'epoux1' | 'epoux2';
    setEnfantsContext((prev) =>
      prev.map((e) =>
        validValues.has(e.rattachement) ? e : { ...e, rattachement: defaultValue },
      ),
    );
  }, [enfantRattachementOptions, setEnfantsContext]);

  // Auto-dériver les ascendants survivants par branche si des parents sont déclarés
  useEffect(() => {
    const hasParentsBySide = {
      epoux1: familyMembers.some((m) => m.type === 'parent' && (!m.branch || m.branch === 'epoux1')),
      epoux2: familyMembers.some((m) => m.type === 'parent' && m.branch === 'epoux2'),
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

  // Synchroniser liquidationContext depuis les actifs nets calculés
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

  // Reset propriétaires d'actifs invalides lors d'un changement de situation
  useEffect(() => {
    const validOwners = new Set(assetOwnerOptions.map((option) => option.value));
    const fallbackOwner = (assetOwnerOptions[0]?.value ?? 'epoux1') as SuccessionAssetOwner;
    setAssetEntries((prev) => {
      let changed = false;
      const mapped = prev.map((entry) => {
        if (validOwners.has(entry.owner)) return entry;
        changed = true;
        return { ...entry, owner: fallbackOwner };
      });
      const next = normalizeResidencePrincipaleAssetEntries(mapped);
      const residenceChanged = next.some((entry, index) => entry.subCategory !== mapped[index]?.subCategory);
      return changed || residenceChanged ? next : prev;
    });
  }, [assetOwnerOptions, setAssetEntries]);

  // Reset assurés/souscripteurs d'AV invalides lors d'un changement de situation
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

  // Reset PER assurés invalides
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

  // Reset GFV owners invalides
  useEffect(() => {
    const validOwners = new Set(assetOwnerOptions.map((option) => option.value));
    const fallbackOwner = (assetOwnerOptions[0]?.value ?? 'epoux1') as SuccessionAssetOwner;
    setGroupementFoncierEntries((prev) => {
      let changed = false;
      const next = prev.map((entry) => {
        const owner = validOwners.has(entry.owner) ? entry.owner : fallbackOwner;
        if (owner === entry.owner) return entry;
        changed = true;
        return { ...entry, owner };
      });
      return changed ? next : prev;
    });
  }, [assetOwnerOptions, setGroupementFoncierEntries]);

  // Reset prévoyance parties invalides
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

  // Synchroniser patrimonialContext depuis les totaux donations
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
