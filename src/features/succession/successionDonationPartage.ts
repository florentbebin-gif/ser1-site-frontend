import type {
  SuccessionDonationEntry,
  SuccessionDonationPartageAct,
  SuccessionDonationPartageLot,
  SuccessionDonationPartageSoulte,
  SuccessionEnfant,
} from './successionDraft';

interface LotNetValue {
  lot: SuccessionDonationPartageLot;
  valeurDonation: number;
  valeurActuelle?: number;
}

function asAmount(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, amount);
}

function getSoulteReceivedTotal(
  enfantId: string,
  soultes: SuccessionDonationPartageSoulte[],
): number {
  return soultes
    .filter((soulte) => soulte.receveurEnfantId === enfantId)
    .reduce((sum, soulte) => sum + asAmount(soulte.montant), 0);
}

function getSoultePaidTotal(enfantId: string, soultes: SuccessionDonationPartageSoulte[]): number {
  return soultes
    .filter((soulte) => soulte.payeurEnfantId === enfantId)
    .reduce((sum, soulte) => sum + asAmount(soulte.montant), 0);
}

function getAcceptedLots(act: SuccessionDonationPartageAct): SuccessionDonationPartageLot[] {
  return act.lots.filter((lot) => lot.accepted);
}

function buildLotNetValues(act: SuccessionDonationPartageAct): LotNetValue[] {
  return getAcceptedLots(act).map((lot) => {
    const received = getSoulteReceivedTotal(lot.enfantId, act.soultes);
    const paid = getSoultePaidTotal(lot.enfantId, act.soultes);
    const valeurDonation = Math.max(0, asAmount(lot.valeur) + received - paid);
    const valeurActuelle = lot.valeurActuelle == null ? undefined : asAmount(lot.valeurActuelle);

    return {
      lot,
      valeurDonation,
      ...(valeurActuelle != null ? { valeurActuelle } : {}),
    };
  });
}

export function validateDonationPartageAct(
  act: SuccessionDonationPartageAct,
  enfants: SuccessionEnfant[],
): string[] {
  const errors: string[] = [];
  const livingEnfantIds = new Set(
    enfants.filter((enfant) => !enfant.deceased).map((enfant) => enfant.id),
  );
  const acceptedLots = getAcceptedLots(act);

  if (!act.date) errors.push('La date de l’acte est obligatoire.');
  if (!act.donateur) errors.push('Le donateur de l’acte est obligatoire.');
  if (acceptedLots.length === 0) errors.push('Au moins un enfant doit accepter un lot.');
  if (act.avecReserveUsufruit && act.usufruitSuccessif && !act.usufruitSuccessifBeneficiaire) {
    errors.push('Le bénéficiaire de l’usufruit successif est obligatoire.');
  }

  acceptedLots.forEach((lot) => {
    if (!livingEnfantIds.has(lot.enfantId)) {
      errors.push('La donation-partage v1 cible uniquement les enfants vivants déclarés.');
    }
  });

  act.soultes.forEach((soulte) => {
    if (soulte.payeurEnfantId === soulte.receveurEnfantId) {
      errors.push('Une soulte doit être versée entre deux enfants distincts.');
    }
    if (asAmount(soulte.montant) <= 0) {
      errors.push('Le montant de chaque soulte doit être positif.');
    }
  });

  return Array.from(new Set(errors));
}

export function buildDonationPartageFiscalLines(
  acts: SuccessionDonationPartageAct[],
): SuccessionDonationEntry[] {
  return acts.flatMap((act) =>
    buildLotNetValues(act)
      .filter((entry) => entry.valeurDonation > 0 || (entry.valeurActuelle ?? 0) > 0)
      .map((entry): SuccessionDonationEntry => {
        // Valeur gelée nette CCV 1078 utilisée ensuite pour le rappel fiscal CGI 784.
        const donation: SuccessionDonationEntry = {
          id: `${act.id}:${entry.lot.id}`,
          type: 'donation_partage',
          montant: entry.valeurDonation,
          valeurDonation: entry.valeurDonation,
          date: act.date,
          donateur: act.donateur,
          donataire: entry.lot.enfantId,
          avecReserveUsufruit: act.avecReserveUsufruit || undefined,
          usufruitSuccessif: act.usufruitSuccessif || undefined,
          usufruitSuccessifBeneficiaire: act.usufruitSuccessifBeneficiaire,
          sourceDonationPartageActId: act.id,
        };
        if (entry.valeurActuelle != null) donation.valeurActuelle = entry.valeurActuelle;
        return donation;
      }),
  );
}

function formatEur(value: number): string {
  return `${Math.round(value)
    .toLocaleString('fr-FR')
    .replace(/\u202f|\u00a0/g, ' ')} EUR`;
}

export function summarizeDonationPartageActs(acts: SuccessionDonationPartageAct[]): string | null {
  if (acts.length === 0) return null;

  const lotCount = acts.reduce((sum, act) => sum + getAcceptedLots(act).length, 0);
  const soulteCount = acts.reduce((sum, act) => sum + act.soultes.length, 0);
  const soulteTotal = acts.reduce(
    (sum, act) =>
      sum + act.soultes.reduce((innerSum, soulte) => innerSum + asAmount(soulte.montant), 0),
    0,
  );
  const actLabel = acts.length === 1 ? '1 donation-partage' : `${acts.length} donations-partage`;
  const lotLabel = lotCount === 1 ? '1 lot' : `${lotCount} lots`;
  if (soulteCount === 0) return `${actLabel} : ${lotLabel}`;
  const soulteLabel =
    soulteCount === 1
      ? `1 soulte de ${formatEur(soulteTotal)}`
      : `${soulteCount} soultes pour ${formatEur(soulteTotal)}`;
  return `${actLabel} : ${lotLabel}, ${soulteLabel}`;
}
