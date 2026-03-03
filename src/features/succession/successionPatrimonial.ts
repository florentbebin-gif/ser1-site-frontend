import type { SuccessionCivilContext, SuccessionPatrimonialContext } from './successionDraft';

export interface SuccessionPatrimonialAnalysis {
  masseCivileReference: number;
  quotiteDisponibleMontant: number;
  liberalitesImputeesMontant: number;
  depassementQuotiteMontant: number;
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

export function buildSuccessionPatrimonialAnalysis(
  civil: SuccessionCivilContext,
  actifNetSuccessionInput: number,
  nbEnfantsInput: number,
  patrimonial: SuccessionPatrimonialContext,
): SuccessionPatrimonialAnalysis {
  const actifNetSuccession = asAmount(actifNetSuccessionInput);
  const nbEnfants = Math.max(0, Math.floor(Number(nbEnfantsInput) || 0));

  const donationsRapportables = asAmount(patrimonial.donationsRapportables);
  const donationsHorsPart = asAmount(patrimonial.donationsHorsPart);
  const legsParticuliers = asAmount(patrimonial.legsParticuliers);
  const preciputMontant = asAmount(patrimonial.preciputMontant);

  const masseCivileReference = actifNetSuccession + donationsRapportables + donationsHorsPart;
  const quotiteDisponibleMontant = masseCivileReference * getQuotiteDisponibleRatio(nbEnfants);
  const liberalitesImputeesMontant = donationsHorsPart + legsParticuliers;
  const depassementQuotiteMontant = Math.max(0, liberalitesImputeesMontant - quotiteDisponibleMontant);

  const warnings: string[] = [];

  if (depassementQuotiteMontant > 0 && nbEnfants > 0) {
    warnings.push('Libéralités hors part + legs au-delà de la quotité disponible: risque de réduction civile.');
  }

  if (patrimonial.donationEntreEpouxActive) {
    if (civil.situationMatrimoniale === 'marie') {
      warnings.push('Donation entre époux active: vérifier les options du conjoint survivant et les droits réservataires.');
    } else {
      warnings.push('Donation entre époux active incohérente hors mariage (donnée conservée à titre indicatif).');
    }
  }

  if (preciputMontant > 0) {
    if (civil.situationMatrimoniale === 'marie') {
      warnings.push('Clause de préciput renseignée: impact civil à vérifier avant calcul DMTG définitif.');
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

  warnings.push('Module patrimonial simplifié: rapport civil détaillé, réduction fine et liquidation notariale non modélisés.');

  return {
    masseCivileReference,
    quotiteDisponibleMontant,
    liberalitesImputeesMontant,
    depassementQuotiteMontant,
    warnings,
  };
}
