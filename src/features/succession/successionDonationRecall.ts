import { calculateSuccession, type LienParente } from '../../engine/succession';
import type { DmtgSettings } from '../../engine/civil';
import type { SuccessionDonationSettings } from './successionFiscalContext';
import type { SuccessionDonationEntry, SuccessionPrimarySide } from './successionDraft';
import { getBareOwnershipRateFromAge, getAgeAtReferenceDate } from './successionUsufruit';

interface DonationRecallHeirLike {
  id: string;
  lien: LienParente;
  partSuccession: number;
  taxablePartSuccession?: number;
  abattementOverride?: number;
  baseHistoriqueTaxee?: number;
  droitsDejaAcquittes?: number;
}

export interface DonationRecallWarning {
  type: 'np_date_naissance_manquante' | 'np_incompatible_790g';
  donationId: string;
}

export function buildDonationRecallWarningMessages(warnings: DonationRecallWarning[]): string[] {
  const npFallbackCount = warnings.filter((w) => w.type === 'np_date_naissance_manquante').length;
  const incompatible790GCount = warnings.filter((w) => w.type === 'np_incompatible_790g').length;
  const messages: string[] = [];

  if (npFallbackCount > 0) {
    messages.push(
      `${npFallbackCount} donation(s) avec réserve d'usufruit : date de naissance du donateur manquante, valorisation NP non calculable — repli sur valeur pleine.`,
    );
  }

  if (incompatible790GCount > 0) {
    messages.push(
      `${incompatible790GCount} donation(s) avec réserve d'usufruit et option 790 G : combinaison incohérente, le 790 G est ignoré et la valorisation NP est retenue.`,
    );
  }

  return messages;
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

/**
 * Applique uniquement la valorisation en nue-propriété (CGI 669, étape 1).
 * Utilisée en interne pour séparer le calcul NP du plafonnement 790 G.
 */
function getDonationNpAdjustedValue(
  entry: SuccessionDonationEntry,
  donateurDateNaissance: string | undefined,
  warnings: DonationRecallWarning[],
): number {
  const valeurBrute = asAmount(entry.valeurDonation ?? entry.montant);
  if (valeurBrute <= 0 || !entry.avecReserveUsufruit) return valeurBrute;

  const donationDate = parseDonationDate(entry.date);
  const ageAuJourDonation = donationDate
    ? getAgeAtReferenceDate(donateurDateNaissance, donationDate)
    : null;

  if (ageAuJourDonation != null) {
    return valeurBrute * getBareOwnershipRateFromAge(ageAuJourDonation);
  }
  // Repli sur valeur pleine, warning remonté au call-site
  warnings.push({ type: 'np_date_naissance_manquante', donationId: entry.id });
  return valeurBrute;
}

/**
 * Calcule la valeur rappelable d'une donation en tenant compte :
 * - CGI 669 : valorisation NP si avecReserveUsufruit (taux fonction de l'âge du donateur au jour de la donation)
 * - CGI 790 G : exonération hors rappel fiscal (art. 784) si donSommeArgentExonere
 *
 * Note : pour un lot de plusieurs donations 790 G vers le même donataire, utiliser
 * applySuccessionDonationRecallToHeirs qui applique le plafond 790 G une seule fois.
 *
 * Règle conservatrice : avecReserveUsufruit et donSommeArgentExonere sont incompatibles
 * (don de somme d'argent ≠ donation en nue-propriété). Si les deux sont actifs,
 * le 790 G est ignoré et un warning est remonté.
 */
export function getDonationRappelableValue(
  entry: SuccessionDonationEntry,
  donationSettings: SuccessionDonationSettings,
  donateurDateNaissance: string | undefined,
  warnings: DonationRecallWarning[],
): number {
  // Étape 1 : valorisation NP si réserve d'usufruit (CGI 669)
  const valeurTaxable = getDonationNpAdjustedValue(entry, donateurDateNaissance, warnings);
  if (valeurTaxable <= 0) return 0;

  // Étape 2 : exonération CGI 790 G hors rappel 784 (don de somme d'argent)
  if (entry.donSommeArgentExonere) {
    if (entry.avecReserveUsufruit) {
      // Règle conservatrice : 790 G incompatible avec NP — 790 G ignoré
      warnings.push({ type: 'np_incompatible_790g', donationId: entry.id });
      return valeurTaxable;
    }
    const plafond = asAmount(donationSettings.donFamilial790G.montant);
    return Math.max(0, valeurTaxable - plafond);
  }

  return valeurTaxable;
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

export interface DonationRecallResult<THeir extends DonationRecallHeirLike> {
  heirs: Array<THeir & Pick<DonationRecallHeirLike, 'baseHistoriqueTaxee' | 'droitsDejaAcquittes'>>;
  warnings: DonationRecallWarning[];
}

export function applySuccessionDonationRecallToHeirs<THeir extends DonationRecallHeirLike>({
  heirs,
  donations,
  simulatedDeceased,
  donationSettings,
  dmtgSettings,
  referenceDate,
  donateurDateNaissance,
}: {
  heirs: THeir[];
  donations?: SuccessionDonationEntry[];
  simulatedDeceased: SuccessionPrimarySide;
  donationSettings?: SuccessionDonationSettings;
  dmtgSettings: DmtgSettings;
  referenceDate?: Date;
  donateurDateNaissance?: string;
}): DonationRecallResult<THeir> {
  const emptyResult: DonationRecallResult<THeir> = {
    heirs: heirs as Array<THeir & Pick<DonationRecallHeirLike, 'baseHistoriqueTaxee' | 'droitsDejaAcquittes'>>,
    warnings: [],
  };
  if (!donationSettings || !donations || donations.length === 0) return emptyResult;

  const effectiveReferenceDate = referenceDate ?? new Date();
  const allWarnings: DonationRecallWarning[] = [];

  const updatedHeirs = heirs.map((heir) => {
    const relevantDonations = donations.filter((entry) => (
      entry.type !== 'legs_particulier'
      && entry.donateur === simulatedDeceased
      && entry.donataire === heir.id
      && isWithinRappelFiscalYears(entry.date, donationSettings.rappelFiscalAnnees, effectiveReferenceDate)
    ));

    if (relevantDonations.length === 0) {
      return heir as THeir & Pick<DonationRecallHeirLike, 'baseHistoriqueTaxee' | 'droitsDejaAcquittes'>;
    }

    const heirWarnings: DonationRecallWarning[] = [];

    // Donations ordinaires (sans 790 G, ou NP+790G → 790 G ignoré) : rappelable par entrée
    const donationsOrdinaires = relevantDonations.filter(
      (e) => !e.donSommeArgentExonere || e.avecReserveUsufruit,
    );
    // Donations 790 G pures (sans NP) : plafond appliqué une seule fois (CGI art. 790 G)
    const donations790G = relevantDonations.filter(
      (e) => e.donSommeArgentExonere && !e.avecReserveUsufruit,
    );

    // Avertissement pour les entrées qui cumulent NP + 790 G (données persistées incohérentes)
    relevantDonations
      .filter((e) => e.donSommeArgentExonere && e.avecReserveUsufruit)
      .forEach((e) => heirWarnings.push({ type: 'np_incompatible_790g', donationId: e.id }));

    const baseOrdinaire = donationsOrdinaires.reduce(
      (sum, entry) => sum + getDonationNpAdjustedValue(entry, donateurDateNaissance, heirWarnings),
      0,
    );

    const sum790GNpAdjusted = donations790G.reduce(
      (sum, entry) => sum + getDonationNpAdjustedValue(entry, donateurDateNaissance, heirWarnings),
      0,
    );
    const plafond790G = asAmount(donationSettings.donFamilial790G.montant);
    const base790G = Math.max(0, sum790GNpAdjusted - plafond790G);

    const baseHistoriqueTaxee = baseOrdinaire + base790G;
    allWarnings.push(...heirWarnings);

    if (baseHistoriqueTaxee <= 0) {
      return heir as THeir & Pick<DonationRecallHeirLike, 'baseHistoriqueTaxee' | 'droitsDejaAcquittes'>;
    }

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

  return { heirs: updatedHeirs, warnings: allWarnings };
}
