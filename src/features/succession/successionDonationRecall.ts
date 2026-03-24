import { calculateSuccession, type LienParente } from '../../engine/succession';
import type { DmtgSettings } from '../../engine/civil';
import type { SuccessionDonationSettings } from './successionFiscalContext';
import type { SuccessionDonationEntry, SuccessionPrimarySide } from './successionDraft';

interface DonationRecallHeirLike {
  id: string;
  lien: LienParente;
  partSuccession: number;
  taxablePartSuccession?: number;
  abattementOverride?: number;
  baseHistoriqueTaxee?: number;
  droitsDejaAcquittes?: number;
}

function asAmount(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, amount);
}

function parseDonationDate(value?: string): Date | null {
  if (!value) return null;
  const normalized = /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : value;
  const parsed = new Date(`${normalized}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isWithinRappelFiscalYears(
  value: string | undefined,
  years: number,
  referenceDate: Date,
): boolean {
  const parsed = parseDonationDate(value);
  if (!parsed) return false;
  const limit = new Date(referenceDate);
  limit.setFullYear(limit.getFullYear() - Math.max(0, Math.floor(years)));
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    limit.setUTCDate(1);
  }
  return parsed >= limit;
}

function getDonationValueAtDonation(entry: SuccessionDonationEntry): number {
  return asAmount(entry.valeurDonation ?? entry.montant);
}

function getHistoricalRights({
  lien,
  baseHistoriqueTaxee,
  abattementOverride,
  dmtgSettings,
}: {
  lien: LienParente;
  baseHistoriqueTaxee: number;
  abattementOverride?: number;
  dmtgSettings: DmtgSettings;
}): number {
  if (baseHistoriqueTaxee <= 0) return 0;
  return calculateSuccession({
    actifNetSuccession: baseHistoriqueTaxee,
    heritiers: [{
      lien,
      partSuccession: baseHistoriqueTaxee,
      ...(abattementOverride != null ? { abattementOverride } : {}),
    }],
    dmtgSettings,
  }).result.totalDroits;
}

export function applySuccessionDonationRecallToHeirs<THeir extends DonationRecallHeirLike>({
  heirs,
  donations,
  simulatedDeceased,
  donationSettings,
  dmtgSettings,
  referenceDate,
}: {
  heirs: THeir[];
  donations?: SuccessionDonationEntry[];
  simulatedDeceased: SuccessionPrimarySide;
  donationSettings?: SuccessionDonationSettings;
  dmtgSettings: DmtgSettings;
  referenceDate?: Date;
}): Array<THeir & Pick<DonationRecallHeirLike, 'baseHistoriqueTaxee' | 'droitsDejaAcquittes'>> {
  if (!donationSettings || !donations || donations.length === 0) return heirs;

  const effectiveReferenceDate = referenceDate ?? new Date();
  return heirs.map((heir) => {
    const relevantDonations = donations.filter((entry) => (
      entry.type !== 'legs_particulier'
      && entry.donateur === simulatedDeceased
      && entry.donataire === heir.id
      && isWithinRappelFiscalYears(entry.date, donationSettings.rappelFiscalAnnees, effectiveReferenceDate)
    ));

    if (relevantDonations.length === 0) return heir;

    const baseHistoriqueTaxee = relevantDonations.reduce((sum, entry) => sum + getDonationValueAtDonation(entry), 0);
    if (baseHistoriqueTaxee <= 0) return heir;

    const droitsDejaAcquittes = getHistoricalRights({
      lien: heir.lien,
      baseHistoriqueTaxee,
      abattementOverride: heir.abattementOverride,
      dmtgSettings,
    });

    return {
      ...heir,
      baseHistoriqueTaxee,
      droitsDejaAcquittes,
    };
  });
}
