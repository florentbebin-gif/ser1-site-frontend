import type { DmtgSettings } from '../../engine/succession/civil';
import { calculateSuccession } from '../../engine/succession';
import type {
  SuccessionCivilContext,
  SuccessionDonationEntry,
  SuccessionPrimarySide,
} from './successionDraft';
import { getAgeAtReferenceDate, getUsufruitRateFromAge } from './successionUsufruit';

const WARNING_BENEFICIAIRE_INCOHERENT =
  'Usufruit successif ignoré: bénéficiaire non reconnu comme conjoint ou partenaire PACS au décès simulé.';
const WARNING_DATE_NAISSANCE_MANQUANTE =
  'Usufruit successif: date de naissance du conjoint ou partenaire manquante, repli sur la valeur pleine.';

export interface SuccessionUsufruitSuccessifTransmission {
  donationId: string;
  beneficiaire: SuccessionPrimarySide;
  valeurBase: number;
  tauxUsufruit: number;
  valeurUsufruit: number;
  droits: number;
  fallbackValueUsed?: boolean;
}

export interface SuccessionUsufruitSuccessifReunion1133 {
  donationId: string;
  droits: number;
}

export interface SuccessionUsufruitSuccessifAnalysis {
  transmissions: SuccessionUsufruitSuccessifTransmission[];
  reunions1133: SuccessionUsufruitSuccessifReunion1133[];
  warnings: string[];
}

function asAmount(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

function getOtherSide(side: SuccessionPrimarySide): SuccessionPrimarySide {
  return side === 'epoux1' ? 'epoux2' : 'epoux1';
}

function getBirthDate(
  civil: SuccessionCivilContext,
  side: SuccessionPrimarySide,
): string | undefined {
  return side === 'epoux1' ? civil.dateNaissanceEpoux1 : civil.dateNaissanceEpoux2;
}

function isConjointOrPartnerContext(civil: SuccessionCivilContext): boolean {
  return civil.situationMatrimoniale === 'marie' || civil.situationMatrimoniale === 'pacse';
}

export function buildSuccessionUsufruitSuccessifAnalysis({
  civil,
  donations,
  simulatedDeceased,
  referenceDate,
  dmtgSettings,
}: {
  civil: SuccessionCivilContext;
  donations: SuccessionDonationEntry[];
  simulatedDeceased: SuccessionPrimarySide;
  referenceDate: Date;
  dmtgSettings: DmtgSettings;
}): SuccessionUsufruitSuccessifAnalysis {
  const transmissions: SuccessionUsufruitSuccessifTransmission[] = [];
  const reunions1133: SuccessionUsufruitSuccessifReunion1133[] = [];
  const warnings: string[] = [];

  donations.forEach((donation) => {
    if (!donation.avecReserveUsufruit || !donation.usufruitSuccessif) return;
    if (donation.donateur !== simulatedDeceased) return;

    const beneficiaire = donation.usufruitSuccessifBeneficiaire;
    if (
      !beneficiaire ||
      beneficiaire !== getOtherSide(simulatedDeceased) ||
      !isConjointOrPartnerContext(civil)
    ) {
      warnings.push(WARNING_BENEFICIAIRE_INCOHERENT);
      return;
    }

    const valeurBase = asAmount(
      donation.valeurActuelle ?? donation.valeurDonation ?? donation.montant,
    );
    if (valeurBase <= 0) return;

    const birthDate = getBirthDate(civil, beneficiaire);
    const age = getAgeAtReferenceDate(birthDate, referenceDate);
    const fallbackValueUsed = age == null;
    if (fallbackValueUsed) warnings.push(WARNING_DATE_NAISSANCE_MANQUANTE);

    const tauxUsufruit = age == null ? 1 : getUsufruitRateFromAge(age);
    const valeurUsufruit = valeurBase * tauxUsufruit;
    const droits = calculateSuccession({
      actifNetSuccession: valeurUsufruit,
      heritiers: [
        {
          lien: 'conjoint',
          partSuccession: valeurUsufruit,
        },
      ],
      dmtgSettings,
    }).result.totalDroits;

    transmissions.push({
      donationId: donation.id,
      beneficiaire,
      valeurBase,
      tauxUsufruit,
      valeurUsufruit,
      droits,
      ...(fallbackValueUsed ? { fallbackValueUsed: true } : {}),
    });
    reunions1133.push({
      donationId: donation.id,
      droits: 0,
    });
  });

  return {
    transmissions,
    reunions1133,
    warnings: Array.from(new Set(warnings)),
  };
}
