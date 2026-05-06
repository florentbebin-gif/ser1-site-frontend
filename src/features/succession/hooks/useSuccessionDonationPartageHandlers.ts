import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import {
  DEFAULT_SUCCESSION_DONATION_PARTAGE_ACTS,
  type SuccessionDonationEntry,
  type SuccessionDonationPartageAct,
  type SuccessionDonationPartageLot,
  type SuccessionEnfant,
  type SuccessionPrimarySide,
} from '../successionDraft';
import { validateDonationPartageAct } from '../successionDonationPartage';
import type { SuccessionChainOrder } from '../successionChainage';
import {
  createDonationPartageActId,
  createDonationPartageLotId,
} from '../successionSimulator.helpers';

interface UseSuccessionDonationPartageHandlersInput {
  donationsContext: SuccessionDonationEntry[];
  enfantsContext: SuccessionEnfant[];
  chainOrder: SuccessionChainOrder;
  setDonationsContext: Dispatch<SetStateAction<SuccessionDonationEntry[]>>;
}

function isPrimarySideValue(value: unknown): value is SuccessionPrimarySide {
  return value === 'epoux1' || value === 'epoux2';
}

function otherPrimarySide(side: SuccessionPrimarySide): SuccessionPrimarySide {
  return side === 'epoux1' ? 'epoux2' : 'epoux1';
}

function cloneDonationPartageAct(act: SuccessionDonationPartageAct): SuccessionDonationPartageAct {
  return {
    ...act,
    lots: act.lots.map((lot) => ({ ...lot })),
    soultes: act.soultes.map((soulte) => ({ ...soulte })),
  };
}

function buildDonationPartageLotsFromEntry(
  enfants: SuccessionEnfant[],
  entry?: SuccessionDonationEntry,
): SuccessionDonationPartageLot[] {
  const livingChildren = enfants.filter((enfant) => !enfant.deceased);
  const hasSelectedChild = Boolean(entry?.donataire && livingChildren.some((enfant) => enfant.id === entry.donataire));
  return livingChildren.map((enfant) => {
    const selected = hasSelectedChild ? entry?.donataire === enfant.id : true;
    const lot: SuccessionDonationPartageLot = {
      id: createDonationPartageLotId(),
      enfantId: enfant.id,
      valeur: selected ? Math.max(0, Number(entry?.valeurDonation ?? entry?.montant ?? 0) || 0) : 0,
      accepted: selected,
    };
    if (selected && entry?.valeurActuelle != null) {
      lot.valeurActuelle = Math.max(0, Number(entry.valeurActuelle) || 0);
    }
    return lot;
  });
}

export function useSuccessionDonationPartageHandlers({
  donationsContext,
  enfantsContext,
  chainOrder,
  setDonationsContext,
}: UseSuccessionDonationPartageHandlersInput) {
  const [donationPartageActs, setDonationPartageActs] = useState<SuccessionDonationPartageAct[]>(
    DEFAULT_SUCCESSION_DONATION_PARTAGE_ACTS,
  );
  const [showDonationPartageModal, setShowDonationPartageModal] = useState(false);
  const [donationPartageDraft, setDonationPartageDraft] = useState<SuccessionDonationPartageAct | null>(null);
  const [donationPartageSourceEntryId, setDonationPartageSourceEntryId] = useState<string | null>(null);

  const openDonationPartageAct = useCallback((actId: string) => {
    const act = donationPartageActs.find((entry) => entry.id === actId);
    if (!act) return;
    setDonationPartageDraft(cloneDonationPartageAct(act));
    setDonationPartageSourceEntryId(null);
    setShowDonationPartageModal(true);
  }, [donationPartageActs]);

  const openDonationPartageFromEntry = useCallback((entryId: string) => {
    const entry = donationsContext.find((donation) => donation.id === entryId);
    const donateur = isPrimarySideValue(entry?.donateur) ? entry.donateur : chainOrder;
    const draft: SuccessionDonationPartageAct = {
      id: createDonationPartageActId(),
      date: entry?.date,
      donateur,
      avecReserveUsufruit: Boolean(entry?.avecReserveUsufruit),
      usufruitSuccessif: Boolean(entry?.usufruitSuccessif && entry?.avecReserveUsufruit),
      usufruitSuccessifBeneficiaire: entry?.usufruitSuccessif && entry?.avecReserveUsufruit
        ? (entry.usufruitSuccessifBeneficiaire ?? otherPrimarySide(donateur))
        : undefined,
      lots: buildDonationPartageLotsFromEntry(enfantsContext, entry),
      soultes: [],
    };
    setDonationPartageDraft(draft);
    setDonationPartageSourceEntryId(entryId);
    setShowDonationPartageModal(true);
  }, [chainOrder, donationsContext, enfantsContext]);

  const closeDonationPartageModal = useCallback(() => {
    setShowDonationPartageModal(false);
    setDonationPartageDraft(null);
    setDonationPartageSourceEntryId(null);
  }, []);

  const validateDonationPartageModal = useCallback(() => {
    if (!donationPartageDraft) return;
    if (validateDonationPartageAct(donationPartageDraft, enfantsContext).length > 0) return;
    setDonationPartageActs((prev) => {
      const exists = prev.some((act) => act.id === donationPartageDraft.id);
      return exists
        ? prev.map((act) => (act.id === donationPartageDraft.id ? donationPartageDraft : act))
        : [...prev, donationPartageDraft];
    });
    if (donationPartageSourceEntryId) {
      setDonationsContext((prev) => prev.filter((entry) => entry.id !== donationPartageSourceEntryId));
    }
    closeDonationPartageModal();
  }, [
    closeDonationPartageModal,
    donationPartageDraft,
    donationPartageSourceEntryId,
    enfantsContext,
    setDonationsContext,
  ]);

  const removeDonationPartageAct = useCallback((actId: string) => {
    setDonationPartageActs((prev) => prev.filter((act) => act.id !== actId));
    if (donationPartageDraft?.id === actId) closeDonationPartageModal();
  }, [closeDonationPartageModal, donationPartageDraft?.id]);

  return {
    donationPartageActs,
    setDonationPartageActs,
    showDonationPartageModal,
    setShowDonationPartageModal,
    donationPartageDraft,
    setDonationPartageDraft,
    openDonationPartageAct,
    openDonationPartageFromEntry,
    closeDonationPartageModal,
    validateDonationPartageModal,
    removeDonationPartageAct,
  };
}
