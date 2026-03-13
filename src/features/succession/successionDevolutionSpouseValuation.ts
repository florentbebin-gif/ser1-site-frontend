import type {
  SuccessionCivilContext,
  SuccessionChoixLegalConjointSansDDV,
  SuccessionPatrimonialContext,
  SuccessionPrimarySide,
} from './successionDraft';
import { getQuotiteDisponibleRatio } from './successionTestament';
import { getUsufruitValuationFromBirthDate } from './successionUsufruit';

type DonationEntreEpouxSelection = Pick<
  SuccessionPatrimonialContext,
  'donationEntreEpouxActive' | 'donationEntreEpouxOption'
>;

export interface SuccessionSpouseValuationResult {
  conjointAmount: number;
  descendantsAmount: number;
  conjointRights: string;
  descendantsRights: string;
  warnings: string[];
}

function getSurvivingSpouseBirthDate(
  civil: SuccessionCivilContext,
  simulatedDeceased: SuccessionPrimarySide,
): string | undefined {
  return simulatedDeceased === 'epoux1'
    ? civil.dateNaissanceEpoux2
    : civil.dateNaissanceEpoux1;
}

export function getDonationEntreEpouxValuation(
  civil: SuccessionCivilContext,
  nbEnfants: number,
  masseReference: number,
  patrimonial: DonationEntreEpouxSelection | undefined,
  simulatedDeceased: SuccessionPrimarySide,
  referenceDate: Date,
): SuccessionSpouseValuationResult | null {
  if (!patrimonial?.donationEntreEpouxActive) return null;

  const warnings: string[] = [];
  const birthDate = getSurvivingSpouseBirthDate(civil, simulatedDeceased);
  const usufruitValuation = getUsufruitValuationFromBirthDate(
    birthDate,
    masseReference,
    referenceDate,
  );

  if (patrimonial.donationEntreEpouxOption === 'usufruit_total') {
    if (!usufruitValuation) {
      warnings.push(
        'Donation entre \u00e9poux en usufruit total: date de naissance du conjoint survivant manquante, repli moteur sur 1/4 en pleine propri\u00e9t\u00e9.',
      );
      return {
        conjointAmount: masseReference * 0.25,
        descendantsAmount: masseReference * 0.75,
        conjointRights:
          'Totalit\u00e9 en usufruit (repli de calcul 1/4 PP faute de date de naissance)',
        descendantsRights:
          '75% en pleine propri\u00e9t\u00e9 (repli moteur faute de valorisation art. 669 CGI)',
        warnings,
      };
    }

    warnings.push(
      `Donation entre \u00e9poux: valorisation art. 669 CGI sur la base d'un usufruitier \u00e2g\u00e9 de ${usufruitValuation.age} ans.`,
    );
    return {
      conjointAmount: usufruitValuation.valeurUsufruit,
      descendantsAmount: usufruitValuation.valeurNuePropriete,
      conjointRights: `Totalit\u00e9 en usufruit (${Math.round(usufruitValuation.tauxUsufruit * 100)}% art. 669 CGI)`,
      descendantsRights: `Nue-propri\u00e9t\u00e9 de la totalit\u00e9 (${Math.round(usufruitValuation.tauxNuePropriete * 100)}% art. 669 CGI)`,
      warnings,
    };
  }

  if (patrimonial.donationEntreEpouxOption === 'mixte') {
    if (!usufruitValuation) {
      warnings.push(
        'Donation entre \u00e9poux mixte: date de naissance du conjoint survivant manquante, repli moteur sur 1/4 en pleine propri\u00e9t\u00e9.',
      );
      return {
        conjointAmount: masseReference * 0.25,
        descendantsAmount: masseReference * 0.75,
        conjointRights:
          '1/4 en pleine propri\u00e9t\u00e9 et 3/4 en usufruit (repli de calcul 1/4 PP faute de date de naissance)',
        descendantsRights:
          '75% en pleine propri\u00e9t\u00e9 (repli moteur faute de valorisation art. 669 CGI)',
        warnings,
      };
    }

    const demembreBase = masseReference * 0.75;
    const demembreValuation = getUsufruitValuationFromBirthDate(
      birthDate,
      demembreBase,
      referenceDate,
    );
    if (!demembreValuation) return null;
    warnings.push(
      `Donation entre \u00e9poux mixte: valorisation art. 669 CGI sur 3/4 d\u00e9membr\u00e9s, usufruitier \u00e2g\u00e9 de ${demembreValuation.age} ans.`,
    );
    return {
      conjointAmount: (masseReference * 0.25) + demembreValuation.valeurUsufruit,
      descendantsAmount: demembreValuation.valeurNuePropriete,
      conjointRights: `1/4 en pleine propri\u00e9t\u00e9 + usufruit des 3/4 (${Math.round(demembreValuation.tauxUsufruit * 100)}% sur la part d\u00e9membr\u00e9e)`,
      descendantsRights: `Nue-propri\u00e9t\u00e9 des 3/4 (${Math.round(demembreValuation.tauxNuePropriete * 100)}% sur la part d\u00e9membr\u00e9e)`,
      warnings,
    };
  }

  if (patrimonial.donationEntreEpouxOption === 'pleine_propriete_quotite') {
    const quotite = getQuotiteDisponibleRatio(nbEnfants);
    return {
      conjointAmount: masseReference * quotite,
      descendantsAmount: masseReference * (1 - quotite),
      conjointRights: 'Quotit\u00e9 disponible en pleine propri\u00e9t\u00e9',
      descendantsRights: 'R\u00e9serve h\u00e9r\u00e9ditaire en pleine propri\u00e9t\u00e9',
      warnings,
    };
  }

  if (patrimonial.donationEntreEpouxOption === 'pleine_propriete_totale') {
    warnings.push(
      'Donation entre \u00e9poux en pleine propri\u00e9t\u00e9 totale: hypoth\u00e8se tr\u00e8s protectrice, \u00e0 confronter \u00e0 la r\u00e9serve h\u00e9r\u00e9ditaire.',
    );
    return {
      conjointAmount: masseReference,
      descendantsAmount: 0,
      conjointRights: 'Totalit\u00e9 en pleine propri\u00e9t\u00e9',
      descendantsRights:
        'Droits des descendants potentiellement r\u00e9duits \u00e0 due concurrence',
      warnings,
    };
  }

  return null;
}

export function getLegalSpouseValuationWithoutDonation(
  civil: SuccessionCivilContext,
  choixLegal: SuccessionChoixLegalConjointSansDDV,
  masseReference: number,
  simulatedDeceased: SuccessionPrimarySide,
  referenceDate: Date,
): SuccessionSpouseValuationResult | null {
  if (choixLegal !== 'usufruit') return null;

  const warnings: string[] = [];
  const birthDate = getSurvivingSpouseBirthDate(civil, simulatedDeceased);
  const usufruitValuation = getUsufruitValuationFromBirthDate(
    birthDate,
    masseReference,
    referenceDate,
  );

  if (!usufruitValuation) {
    warnings.push(
      'Choix l\u00e9gal du conjoint en usufruit total: date de naissance du conjoint survivant manquante, repli moteur sur 1/4 en pleine propri\u00e9t\u00e9.',
    );
    return {
      conjointAmount: masseReference * 0.25,
      descendantsAmount: masseReference * 0.75,
      conjointRights:
        'Usufruit de la totalite (repli de calcul 1/4 PP faute de date de naissance)',
      descendantsRights:
        '75% en pleine propri\u00e9t\u00e9 (repli moteur faute de valorisation art. 669 CGI)',
      warnings,
    };
  }

  warnings.push(
    `Choix l\u00e9gal du conjoint: valorisation art. 669 CGI sur la base d'un usufruitier \u00e2g\u00e9 de ${usufruitValuation.age} ans.`,
  );
  return {
    conjointAmount: usufruitValuation.valeurUsufruit,
    descendantsAmount: usufruitValuation.valeurNuePropriete,
    conjointRights: `Usufruit de la totalite (${Math.round(usufruitValuation.tauxUsufruit * 100)}% art. 669 CGI)`,
    descendantsRights: `Nue-propri\u00e9t\u00e9 de la totalit\u00e9 (${Math.round(usufruitValuation.tauxNuePropriete * 100)}% art. 669 CGI)`,
    warnings,
  };
}
