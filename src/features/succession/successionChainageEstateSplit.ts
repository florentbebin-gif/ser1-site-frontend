import type {
  SuccessionCivilContext,
  SuccessionLiquidationContext,
  SuccessionPatrimonialContext,
} from './successionDraft';
import { DEFAULT_SUCCESSION_SOCIETE_ACQUETS_CONFIG } from './successionDraft';
import type { SuccessionDeceasedSide } from './successionEnfants';
import { getUsufruitValuationFromBirthDate } from './successionUsufruit';

type SuccessionChainOrder = 'epoux1' | 'epoux2';
type SuccessionChainRegime =
  | 'communaute_legale'
  | 'separation_biens'
  | 'communaute_universelle';

type DonationEntreEpouxSelection = Partial<Pick<
  SuccessionPatrimonialContext,
  | 'attributionIntegrale'
  | 'donationEntreEpouxActive'
  | 'donationEntreEpouxOption'
  | 'preciputMontant'
  | 'societeAcquets'
>>;

export interface SuccessionSocieteAcquetsDistribution {
  configured: boolean;
  totalValue: number;
  firstEstateContribution: number;
  survivorShare: number;
  preciputAmount: number;
  survivorAttributionAmount: number;
  liquidationMode: SuccessionPatrimonialContext['societeAcquets']['liquidationMode'];
  deceasedQuotePct: number;
  survivorQuotePct: number;
  attributionIntegrale: boolean;
  warnings: string[];
}

export interface SuccessionChainStep1Split {
  conjointPart: number;
  enfantsPart: number;
  carryOverToStep2: number;
  preciputDeducted: number;
  warnings: string[];
}

function asAmount(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, num);
}

function getQuotiteDisponibleRatio(nbEnfants: number): number {
  if (nbEnfants <= 0) return 1;
  if (nbEnfants === 1) return 0.5;
  if (nbEnfants === 2) return 1 / 3;
  return 0.25;
}

function getSurvivingSpouseBirthDate(
  civil: SuccessionCivilContext,
  deceased: SuccessionDeceasedSide,
): string | undefined {
  return deceased === 'epoux1' ? civil.dateNaissanceEpoux2 : civil.dateNaissanceEpoux1;
}

function getSocieteAcquetsQuotes(
  deceased: SuccessionDeceasedSide,
  patrimonial?: DonationEntreEpouxSelection,
): { deceasedPct: number; survivorPct: number } {
  const config = patrimonial?.societeAcquets?.active
    ? patrimonial.societeAcquets
    : DEFAULT_SUCCESSION_SOCIETE_ACQUETS_CONFIG;
  return deceased === 'epoux1'
    ? {
      deceasedPct: config.quoteEpoux1Pct,
      survivorPct: config.quoteEpoux2Pct,
    }
    : {
      deceasedPct: config.quoteEpoux2Pct,
      survivorPct: config.quoteEpoux1Pct,
    };
}

export function computeSocieteAcquetsDistribution(
  deceased: SuccessionDeceasedSide,
  societeAcquetsValue: number,
  patrimonial?: DonationEntreEpouxSelection,
): SuccessionSocieteAcquetsDistribution {
  const total = asAmount(societeAcquetsValue);
  const activeConfig = patrimonial?.societeAcquets?.active
    ? patrimonial.societeAcquets
    : DEFAULT_SUCCESSION_SOCIETE_ACQUETS_CONFIG;
  const { deceasedPct, survivorPct } = getSocieteAcquetsQuotes(deceased, patrimonial);

  if (total <= 0) {
    return {
      configured: Boolean(patrimonial?.societeAcquets?.active),
      totalValue: 0,
      firstEstateContribution: 0,
      survivorShare: 0,
      preciputAmount: 0,
      survivorAttributionAmount: 0,
      liquidationMode: activeConfig.liquidationMode,
      deceasedQuotePct: deceasedPct,
      survivorQuotePct: survivorPct,
      attributionIntegrale: Boolean(patrimonial?.societeAcquets?.active && patrimonial.attributionIntegrale),
      warnings: [],
    };
  }

  if (patrimonial?.societeAcquets?.active && patrimonial.attributionIntegrale) {
    return {
      configured: true,
      totalValue: total,
      firstEstateContribution: 0,
      survivorShare: total,
      preciputAmount: 0,
      survivorAttributionAmount: 0,
      liquidationMode: activeConfig.liquidationMode,
      deceasedQuotePct: deceasedPct,
      survivorQuotePct: survivorPct,
      attributionIntegrale: true,
      warnings: [
        "Societe d'acquets: attribution integrale du reliquat au survivant au 1er deces.",
      ],
    };
  }

  const preciput = patrimonial?.societeAcquets?.active
    ? Math.min(asAmount(patrimonial.preciputMontant), total)
    : 0;
  const remainingAfterPreciput = Math.max(0, total - preciput);
  const survivorAttribution = patrimonial?.societeAcquets?.active
    && activeConfig.liquidationMode === 'attribution_survivant'
    ? remainingAfterPreciput * (activeConfig.attributionSurvivantPct / 100)
    : 0;
  const remainingAfterAttribution = Math.max(0, remainingAfterPreciput - survivorAttribution);
  const firstEstateContribution = remainingAfterAttribution * (deceasedPct / 100);
  const survivorShare = total - firstEstateContribution;
  const warnings: string[] = [];

  if (patrimonial?.societeAcquets?.active) {
    warnings.push(
      `Societe d'acquets: liquidation dediee simplifiee appliquee (quotes ${Math.round(deceasedPct)}% / ${Math.round(survivorPct)}%).`,
    );
    if (preciput > 0) {
      warnings.push(
        `Societe d'acquets: preciput de ${Math.round(preciput).toLocaleString('fr-FR')} EUR preleve avant liquidation du reliquat.`,
      );
    }
    if (activeConfig.liquidationMode === 'attribution_survivant' && survivorAttribution > 0) {
      warnings.push(
        `Societe d'acquets: attribution prealable au survivant de ${Math.round(activeConfig.attributionSurvivantPct)}% du reliquat.`,
      );
    }
  }

  return {
    configured: Boolean(patrimonial?.societeAcquets?.active),
    totalValue: total,
    firstEstateContribution,
    survivorShare,
    preciputAmount: preciput,
    survivorAttributionAmount: survivorAttribution,
    liquidationMode: activeConfig.liquidationMode,
    deceasedQuotePct: deceasedPct,
    survivorQuotePct: survivorPct,
    attributionIntegrale: false,
    warnings,
  };
}

export function computeFirstEstate(
  regimeUsed: SuccessionChainRegime,
  order: SuccessionChainOrder,
  liquidation: SuccessionLiquidationContext,
  attributionBiensCommunsPct = 50,
  preserveQualifiedSeparatePocketsInUniversalCommunity = false,
): number {
  const actifEpoux1 = asAmount(liquidation.actifEpoux1);
  const actifEpoux2 = asAmount(liquidation.actifEpoux2);
  const actifCommun = asAmount(liquidation.actifCommun);

  if (regimeUsed === 'communaute_universelle') {
    const pctDefunt = (100 - Math.min(100, Math.max(0, attributionBiensCommunsPct))) / 100;
    if (preserveQualifiedSeparatePocketsInUniversalCommunity) {
      return (order === 'epoux1' ? actifEpoux1 : actifEpoux2) + (actifCommun * pctDefunt);
    }
    return (actifEpoux1 + actifEpoux2 + actifCommun) * pctDefunt;
  }

  if (regimeUsed === 'separation_biens') {
    return order === 'epoux1' ? actifEpoux1 : actifEpoux2;
  }

  const pctDefunt = (100 - Math.min(100, Math.max(0, attributionBiensCommunsPct))) / 100;
  return (order === 'epoux1' ? actifEpoux1 : actifEpoux2) + (actifCommun * pctDefunt);
}

export function computeStep1Split(
  civil: SuccessionCivilContext,
  regimeUsed: SuccessionChainRegime,
  firstEstate: number,
  nbEnfants: number,
  deceased: SuccessionDeceasedSide,
  patrimonial?: DonationEntreEpouxSelection,
  referenceDate = new Date(),
): SuccessionChainStep1Split {
  if (
    civil.situationMatrimoniale === 'marie'
    && regimeUsed === 'communaute_universelle'
    && patrimonial?.attributionIntegrale
  ) {
    const warnings = [
      'Communaute universelle avec attribution integrale: la masse commune est integralement attribuee au conjoint survivant par clause contractuelle.',
    ];
    if (asAmount(patrimonial.preciputMontant) > 0) {
      warnings.push('Attribution integrale prioritaire: clause de preciput ignoree au 1er deces.');
    }
    if (patrimonial.donationEntreEpouxActive) {
      warnings.push('Attribution integrale prioritaire: donation entre epoux ignoree au 1er deces.');
    }
    if (firstEstate <= 0) {
      return {
        conjointPart: 0,
        enfantsPart: 0,
        carryOverToStep2: 0,
        preciputDeducted: 0,
        warnings: [...warnings, 'Aucun propre du defunt: la totalite du patrimoine est attribuee au survivant.'],
      };
    }
    warnings.push(`Propres du defunt: ${Math.round(firstEstate).toLocaleString('fr-FR')} EUR soumis a la devolution legale.`);
  }

  const preciput = (civil.situationMatrimoniale === 'marie')
    ? Math.min(asAmount(patrimonial?.preciputMontant), firstEstate)
    : 0;
  const estateAfterPreciput = firstEstate - preciput;

  if (civil.situationMatrimoniale !== 'marie') {
    return {
      conjointPart: 0,
      enfantsPart: firstEstate,
      carryOverToStep2: 0,
      preciputDeducted: 0,
      warnings: [],
    };
  }
  if (nbEnfants <= 0) {
    return {
      conjointPart: estateAfterPreciput,
      enfantsPart: 0,
      carryOverToStep2: estateAfterPreciput,
      preciputDeducted: preciput,
      warnings: preciput > 0 ? [`Clause de preciput: ${preciput.toLocaleString('fr-FR')} EUR preleves avant partage successoral.`] : [],
    };
  }

  const warnings: string[] = [];
  if (preciput > 0) {
    warnings.push(`Clause de preciput: ${preciput.toLocaleString('fr-FR')} EUR preleves avant partage successoral.`);
  }
  const fallback = {
    conjointPart: estateAfterPreciput * 0.25,
    enfantsPart: estateAfterPreciput * 0.75,
    carryOverToStep2: estateAfterPreciput * 0.25,
  };

  if (!patrimonial?.donationEntreEpouxActive) {
    warnings.push(
      'Hypothese simplifiee: part du conjoint au 1er deces fixee a 1/4 en pleine propriete.',
    );
    return { ...fallback, preciputDeducted: preciput, warnings };
  }

  if (patrimonial.donationEntreEpouxOption === 'pleine_propriete_quotite') {
    const spousePart = estateAfterPreciput * getQuotiteDisponibleRatio(nbEnfants);
    return {
      conjointPart: spousePart,
      enfantsPart: Math.max(0, estateAfterPreciput - spousePart),
      carryOverToStep2: spousePart,
      preciputDeducted: preciput,
      warnings: [
        ...warnings,
        'Donation entre epoux: quotite disponible en pleine propriete retenue pour le conjoint survivant.',
      ],
    };
  }

  if (patrimonial.donationEntreEpouxOption === 'pleine_propriete_totale') {
    return {
      conjointPart: estateAfterPreciput,
      enfantsPart: 0,
      carryOverToStep2: estateAfterPreciput,
      preciputDeducted: preciput,
      warnings: [
        ...warnings,
        'Donation entre epoux: totalite en pleine propriete retenue dans le module simplifie, sous reserve de reduction civile.',
      ],
    };
  }

  const spouseBirthDate = getSurvivingSpouseBirthDate(civil, deceased);
  if (!spouseBirthDate) {
    warnings.push(
      'Donation entre epoux avec usufruit: date de naissance du conjoint survivant manquante, repli moteur sur 1/4 en pleine propriete.',
    );
    return { ...fallback, preciputDeducted: preciput, warnings };
  }

  if (patrimonial.donationEntreEpouxOption === 'usufruit_total') {
    const valuation = getUsufruitValuationFromBirthDate(spouseBirthDate, estateAfterPreciput, referenceDate);
    if (!valuation) {
      warnings.push(
        "Donation entre epoux en usufruit total: valorisation art. 669 CGI impossible, repli moteur sur 1/4 en pleine propriete.",
      );
      return { ...fallback, preciputDeducted: preciput, warnings };
    }
    warnings.push(
      `Donation entre epoux: usufruit total valorise selon l'art. 669 CGI (usufruitier ${valuation.age} ans, usufruit ${Math.round(valuation.tauxUsufruit * 100)}%).`,
    );
    return {
      conjointPart: valuation.valeurUsufruit,
      enfantsPart: valuation.valeurNuePropriete,
      carryOverToStep2: 0,
      preciputDeducted: preciput,
      warnings,
    };
  }

  if (patrimonial.donationEntreEpouxOption === 'mixte') {
    const valuation = getUsufruitValuationFromBirthDate(
      spouseBirthDate,
      estateAfterPreciput * 0.75,
      referenceDate,
    );
    if (!valuation) {
      warnings.push(
        "Donation entre epoux mixte: valorisation art. 669 CGI impossible, repli moteur sur 1/4 en pleine propriete.",
      );
      return { ...fallback, preciputDeducted: preciput, warnings };
    }
    warnings.push(
      `Donation entre epoux mixte: 1/4 en pleine propriete + usufruit des 3/4 valorise selon l'art. 669 CGI (usufruitier ${valuation.age} ans, usufruit ${Math.round(valuation.tauxUsufruit * 100)}% sur la part demembree).`,
    );
    return {
      conjointPart: (estateAfterPreciput * 0.25) + valuation.valeurUsufruit,
      enfantsPart: valuation.valeurNuePropriete,
      carryOverToStep2: estateAfterPreciput * 0.25,
      preciputDeducted: preciput,
      warnings,
    };
  }

  return { ...fallback, preciputDeducted: preciput, warnings };
}
