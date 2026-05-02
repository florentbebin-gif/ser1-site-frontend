import type {
  SuccessionAssetDetailEntry,
  SuccessionCivilContext,
  SuccessionDonationEntry,
  SuccessionPatrimonialContext,
  SuccessionPrimarySide,
  SuccessionTestamentConfig,
} from './successionDraft';
import type { SuccessionFiscalSnapshot } from './successionFiscalContext';
import { getEffectiveSuccessionMeubleImmeubleLegal } from './successionLegalQualification';

export interface SuccessionPatrimonialAnalysis {
  masseCivileReference: number;
  quotiteDisponibleMontant: number;
  liberalitesImputeesMontant: number;
  depassementQuotiteMontant: number;
  donationsPartagees: number;
  warnings: string[];
}

interface SuccessionPatrimonialAnalysisOptions {
  simulatedDeceased: SuccessionPrimarySide;
  testament: SuccessionTestamentConfig | null;
  referenceDate?: Date;
  assetEntries?: SuccessionAssetDetailEntry[];
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

function donationEntreEpouxOptionLabel(option: SuccessionPatrimonialContext['donationEntreEpouxOption']): string {
  if (option === 'usufruit_total') return 'totalité en usufruit';
  if (option === 'pleine_propriete_quotite') return 'quotité disponible en pleine propriété';
  if (option === 'pleine_propriete_totale') return 'totalité en pleine propriété';
  return 'option mixte 1/4 PP + 3/4 usufruit';
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
  // When donation date is month-only (YYYY-MM), compare at month granularity
  // to avoid false negatives when the day-of-month differs.
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    limit.setUTCDate(1);
  }
  return parsed >= limit;
}

function getDonationCurrentValue(entry: SuccessionDonationEntry): number {
  return asAmount(entry.valeurActuelle ?? entry.montant);
}

export function buildSuccessionPatrimonialAnalysis(
  civil: SuccessionCivilContext,
  actifNetSuccessionInput: number,
  nbEnfantsInput: number,
  patrimonial: SuccessionPatrimonialContext,
  donations: SuccessionDonationEntry[] = [],
  fiscalSnapshot?: SuccessionFiscalSnapshot,
  options?: SuccessionPatrimonialAnalysisOptions,
): SuccessionPatrimonialAnalysis {
  const actifNetSuccession = asAmount(actifNetSuccessionInput);
  const nbEnfants = Math.max(0, Math.floor(Number(nbEnfantsInput) || 0));

  const computedDonationsRapportables = donations
    .filter((entry) => entry.type === 'rapportable')
    .reduce((sum, entry) => sum + getDonationCurrentValue(entry), 0);
  const computedDonationsHorsPart = donations
    .filter((entry) => entry.type === 'hors_part')
    .reduce((sum, entry) => sum + getDonationCurrentValue(entry), 0);
  const computedLegacyLegsParticuliers = donations
    .filter((entry) => entry.type === 'legs_particulier')
    .reduce((sum, entry) => sum + getDonationCurrentValue(entry), 0);
  const computedDonationsPartagees = donations
    .filter((entry) => entry.type === 'donation_partage')
    .reduce((sum, entry) => sum + getDonationCurrentValue(entry), 0);
  const testamentLegsParticuliers = options?.testament
    ? options.testament.particularLegacies.reduce((sum, entry) => sum + asAmount(entry.amount), 0)
    : 0;

  const donationsRapportables = donations.length > 0
    ? computedDonationsRapportables
    : asAmount(patrimonial.donationsRapportables);
  const donationsHorsPart = donations.length > 0
    ? computedDonationsHorsPart
    : asAmount(patrimonial.donationsHorsPart);
  const legsParticuliers = options?.testament
    ? testamentLegsParticuliers
    : donations.length > 0
      ? computedLegacyLegsParticuliers
      : asAmount(patrimonial.legsParticuliers);
  const preciputMontant = asAmount(patrimonial.preciputMontant);
  const hasTargetedPreciput = patrimonial.preciputMode === 'cible'
    && patrimonial.preciputSelections.some((selection) => selection.enabled && asAmount(selection.amount) > 0);

  const masseCivileReference = actifNetSuccession + donationsRapportables + donationsHorsPart;
  const quotiteDisponibleMontant = masseCivileReference * getQuotiteDisponibleRatio(nbEnfants);
  const liberalitesImputeesMontant = donationsHorsPart + legsParticuliers;
  const depassementQuotiteMontant = Math.max(0, liberalitesImputeesMontant - quotiteDisponibleMontant);

  const warnings: string[] = [];
  const qualifiedAssets = options?.assetEntries ?? [];
  const propresParNatureCount = qualifiedAssets.filter((entry) => entry.legalNature === 'propre_par_nature').length;
  const cmaQualifiedMovables = qualifiedAssets.filter((entry) => (
    entry.category !== 'passif'
    && getEffectiveSuccessionMeubleImmeubleLegal(entry) === 'meuble'
    && entry.legalNature !== 'propre'
    && entry.legalNature !== 'propre_par_nature'
  )).length;

  if (depassementQuotiteMontant > 0 && nbEnfants > 0) {
    warnings.push('Libéralités hors part + legs au-delà de la quotité disponible: risque de réduction civile.');
  }

  if (patrimonial.donationEntreEpouxActive) {
    if (civil.situationMatrimoniale === 'marie') {
      warnings.push(`Donation entre époux active (${donationEntreEpouxOptionLabel(patrimonial.donationEntreEpouxOption)}): vérifier les options du conjoint survivant et les droits réservataires.`);
      if (patrimonial.donationEntreEpouxOption === 'pleine_propriete_totale') {
        warnings.push('Totalité en pleine propriété: option exceptionnelle, sous réserve de réduction et accord des descendants (art. 1094-1 C. civ.).');
      }
    } else {
      warnings.push('Donation entre époux active incohérente hors mariage (donnée conservée à titre indicatif).');
    }
  }

  if (patrimonial.attributionBiensCommunsPct !== 50 && civil.situationMatrimoniale === 'marie') {
    warnings.push(`Attribution des biens communs au survivant: ${patrimonial.attributionBiensCommunsPct} % (vs 50 % en partage usuel).`);
  }

  if (civil.regimeMatrimonial === 'participation_acquets') {
    warnings.push(
      patrimonial.participationAcquets.active
        ? 'Participation aux acquets activee: creance de participation simplifiee calculee sur les patrimoines declares.'
        : 'Participation aux acquets sans configuration dediee: approximation conservee en separation de biens.',
    );
  }

  if (civil.regimeMatrimonial === 'communaute_universelle') {
    if (patrimonial.stipulationContraireCU && propresParNatureCount > 0) {
      warnings.push("Communaute universelle: les biens qualifies 'propre par nature' et rattaches a un epoux sont exclus de la masse commune simplifiee.");
    } else if (!patrimonial.stipulationContraireCU && propresParNatureCount > 0) {
      warnings.push("Communaute universelle: des biens sont qualifies 'propre par nature' mais restent integres a la masse commune simplifiee tant que la stipulation contraire n'est pas activee.");
    }
  }

  if (civil.regimeMatrimonial === 'communaute_meubles_acquets') {
    warnings.push(
      cmaQualifiedMovables > 0
        ? "Communaute de meubles et acquets: les biens qualifies meubles sont rapproches de la communaute simplifiee, les immeubles restant sur leur poche declaree."
        : "Communaute de meubles et acquets: la qualification meuble / immeuble reste simplifiee ; a defaut de saisie explicite, la categorie detaillee sert de proxy.",
    );
  }

  const activeInterMassClaims = patrimonial.interMassClaims.filter(
    (claim) => claim.enabled && asAmount(claim.amount) > 0,
  );
  if (activeInterMassClaims.length > 0) {
    warnings.push(
      `${activeInterMassClaims.length} recompense(s) / creance(s) entre masses declaree(s): integration simplifiee par transferts entre poches, sans liquidation notariale exhaustive.`,
    );
  }

  const affectedLiabilitiesCount = qualifiedAssets.filter(
    (entry) => entry.category === 'passif' && asAmount(entry.amount) > 0,
  ).length;
  if (affectedLiabilitiesCount > 0) {
    warnings.push(
      `${affectedLiabilitiesCount} passif(s) detaille(s) rattache(s) a une masse: traites comme passif affecte dans la liquidation simplifiee.`,
    );
  }

  if (preciputMontant > 0 || hasTargetedPreciput) {
    if (civil.situationMatrimoniale === 'marie') {
      warnings.push(
        hasTargetedPreciput
          ? 'Clause de préciput ciblée renseignée: impact civil à vérifier avant calcul DMTG définitif.'
          : 'Clause de préciput renseignée: impact civil à vérifier avant calcul DMTG définitif.',
      );
    } else {
      warnings.push('Préciput saisi hors mariage: non applicable en l’état (vérifier le contexte).');
    }
  }

  if (patrimonial.attributionIntegrale) {
    if (civil.situationMatrimoniale === 'marie') {
      warnings.push('Attribution intégrale activée: peut retarder la transmission aux descendants au second décès.');
    } else {
      warnings.push('Attribution intégrale activée hors mariage: non applicable en l’état (vérifier le contexte).');
    }
  }

  if (donations.length > 0) {
    const usufruitCount = donations.filter((entry) => entry.avecReserveUsufruit).length;
    const donSommeArgentExonereCount = donations.filter((entry) => entry.donSommeArgentExonere).length;

    if (usufruitCount > 0) {
      warnings.push(`${usufruitCount} donation(s) avec réserve d’usufruit: valorisation fiscale/civile à confirmer.`);
    }
    if (donSommeArgentExonereCount > 0) {
      warnings.push(`${donSommeArgentExonereCount} don(s) de somme d’argent exonéré(s): vérifier les conditions d’âge et de délai (CGI art. 790 G).`);
    }
    if (computedDonationsPartagees > 0) {
      warnings.push(`Donation(s)-partage présente(s) (valeur gelée CCV 1078, non rapportable au partage civil) — exclue(s) de la masse civile de référence. Imputation fine sur la réserve non modélisée.`);
    }

    if (fiscalSnapshot) {
      const recentDonationsCount = donations.filter((entry) =>
        isWithinRappelFiscalYears(
          entry.date,
          fiscalSnapshot.donation.rappelFiscalAnnees,
          options?.referenceDate ?? new Date(),
        )).length;
      if (recentDonationsCount > 0) {
        warnings.push(`${recentDonationsCount} donation(s) dans le rappel fiscal de ${fiscalSnapshot.donation.rappelFiscalAnnees} ans: reprise DMTG à contrôler.`);
      }
    }
  }

  if (options?.testament?.active && options.testament.dispositionType === 'legs_particulier' && legsParticuliers > 0) {
    warnings.push(`Legs particuliers integres au titre du testament du cote ${options.simulatedDeceased}.`);
  }

  warnings.push('Module patrimonial simplifié: rapport civil détaillé, réduction fine et liquidation notariale non modélisés.');

  return {
    masseCivileReference,
    quotiteDisponibleMontant,
    liberalitesImputeesMontant,
    depassementQuotiteMontant,
    donationsPartagees: computedDonationsPartagees,
    warnings,
  };
}
