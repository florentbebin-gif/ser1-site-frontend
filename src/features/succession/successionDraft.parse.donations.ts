import {
  asAmount,
  asBoolean,
  isDonationEntryType,
  isObject,
  isPrimarySide,
  normalizeOptionalString,
} from './successionDraft.guards';
import type {
  SuccessionDonationEntry,
  SuccessionDonationPartageAct,
  SuccessionDonationPartageLot,
  SuccessionDonationPartageSoulte,
} from './successionDraft.types';

export function parseDonations(rawDonations: unknown): SuccessionDonationEntry[] {
  return (Array.isArray(rawDonations) ? rawDonations : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => {
      if (!isDonationEntryType(item.type)) return null;

      const donation: SuccessionDonationEntry = {
        id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : `don-${idx + 1}`,
        type: item.type,
        montant: asAmount(item.montant, 0),
      };

      const date = normalizeOptionalString(item.date);
      const donateur = normalizeOptionalString(item.donateur);
      const donataire = normalizeOptionalString(item.donataire);
      if (date) donation.date = date;
      if (donateur) donation.donateur = donateur;
      if (donataire) donation.donataire = donataire;

      const valeurDonation = asAmount(item.valeurDonation, -1);
      const valeurActuelle = asAmount(item.valeurActuelle, -1);
      if (valeurDonation >= 0) donation.valeurDonation = valeurDonation;
      if (valeurActuelle >= 0) donation.valeurActuelle = valeurActuelle;
      if (asBoolean(item.donSommeArgentExonere, false)) donation.donSommeArgentExonere = true;
      if (asBoolean(item.avecReserveUsufruit, false)) donation.avecReserveUsufruit = true;
      if (asBoolean(item.usufruitSuccessif, false)) donation.usufruitSuccessif = true;
      if (isPrimarySide(item.usufruitSuccessifBeneficiaire)) {
        donation.usufruitSuccessifBeneficiaire = item.usufruitSuccessifBeneficiaire;
      }
      const sourceDonationPartageActId = normalizeOptionalString(item.sourceDonationPartageActId);
      if (sourceDonationPartageActId) donation.sourceDonationPartageActId = sourceDonationPartageActId;

      return donation;
    })
    .filter((item): item is SuccessionDonationEntry => item !== null);
}

function parseDonationPartageLots(rawLots: unknown): SuccessionDonationPartageLot[] {
  return (Array.isArray(rawLots) ? rawLots : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => {
      const enfantId = normalizeOptionalString(item.enfantId);
      if (!enfantId) return null;
      const lot: SuccessionDonationPartageLot = {
        id: normalizeOptionalString(item.id) ?? `lot-${idx + 1}`,
        enfantId,
        valeur: asAmount(item.valeur, 0),
        accepted: asBoolean(item.accepted, false),
      };
      const valeurActuelle = asAmount(item.valeurActuelle, -1);
      if (valeurActuelle >= 0) lot.valeurActuelle = valeurActuelle;
      return lot;
    })
    .filter((item): item is SuccessionDonationPartageLot => item !== null);
}

function parseDonationPartageSoultes(rawSoultes: unknown): SuccessionDonationPartageSoulte[] {
  return (Array.isArray(rawSoultes) ? rawSoultes : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => {
      const payeurEnfantId = normalizeOptionalString(item.payeurEnfantId);
      const receveurEnfantId = normalizeOptionalString(item.receveurEnfantId);
      if (!payeurEnfantId || !receveurEnfantId) return null;
      return {
        id: normalizeOptionalString(item.id) ?? `soulte-${idx + 1}`,
        payeurEnfantId,
        receveurEnfantId,
        montant: asAmount(item.montant, 0),
      };
    })
    .filter((item): item is SuccessionDonationPartageSoulte => item !== null);
}

export function parseDonationPartageActs(rawActs: unknown): SuccessionDonationPartageAct[] {
  return (Array.isArray(rawActs) ? rawActs : [])
    .filter((item): item is Record<string, unknown> => isObject(item))
    .map((item, idx) => {
      const lots = parseDonationPartageLots(item.lots);
      if (lots.length === 0) return null;
      const act: SuccessionDonationPartageAct = {
        id: normalizeOptionalString(item.id) ?? `dp-act-${idx + 1}`,
        avecReserveUsufruit: asBoolean(item.avecReserveUsufruit, false),
        usufruitSuccessif: asBoolean(item.usufruitSuccessif, false),
        lots,
        soultes: parseDonationPartageSoultes(item.soultes),
      };
      const date = normalizeOptionalString(item.date);
      if (date) act.date = date;
      if (isPrimarySide(item.donateur)) act.donateur = item.donateur;
      if (isPrimarySide(item.usufruitSuccessifBeneficiaire)) {
        act.usufruitSuccessifBeneficiaire = item.usufruitSuccessifBeneficiaire;
      }
      return act;
    })
    .filter((item): item is SuccessionDonationPartageAct => item !== null);
}

export function extractLegacyDonationPartageActs(
  donations: SuccessionDonationEntry[],
): {
  donations: SuccessionDonationEntry[];
  donationPartageActs: SuccessionDonationPartageAct[];
} {
  const donationPartageActs: SuccessionDonationPartageAct[] = [];
  const filteredDonations = donations.filter((donation) => {
    if (donation.type !== 'donation_partage' || !donation.donataire) return true;

    const lot: SuccessionDonationPartageLot = {
      id: `lot-${donation.id}`,
      enfantId: donation.donataire,
      valeur: Math.max(0, donation.valeurDonation ?? donation.montant),
      accepted: true,
    };
    if (donation.valeurActuelle != null) lot.valeurActuelle = Math.max(0, donation.valeurActuelle);

    donationPartageActs.push({
      id: `act-${donation.id}`,
      date: donation.date,
      donateur: isPrimarySide(donation.donateur) ? donation.donateur : undefined,
      avecReserveUsufruit: Boolean(donation.avecReserveUsufruit),
      usufruitSuccessif: Boolean(donation.usufruitSuccessif),
      usufruitSuccessifBeneficiaire: donation.usufruitSuccessifBeneficiaire,
      lots: [lot],
      soultes: [],
    });
    return false;
  });

  return { donations: filteredDonations, donationPartageActs };
}
