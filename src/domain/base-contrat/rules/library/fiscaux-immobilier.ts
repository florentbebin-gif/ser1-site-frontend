/**
 * domain/base-contrat/rules/library/fiscaux-immobilier.ts
 *
 * Règles fiscales — Dispositifs fiscaux immobilier.
 * Produits : Pinel, Denormandie, Malraux, Monuments historiques,
 *            Scellier, Duflot, Censi-Bouvard, Loc'Avantages, Cosse, Jeanbrun.
 */

import type { ProductRules, Audience } from '../types';

const PINEL_PINEL_PLUS: ProductRules = {
  constitution: [
    {
      title: 'Réduction d\'IR (dispositif clôturé au 31/12/2024)',
      bullets: [
        'Pinel classique : réduction d\'IR de 9 %, 12 % ou 14 % du prix selon l\'engagement de location (6, 9 ou 12 ans).',
        'Pinel+ (Super Pinel) : réduction de 12 %, 18 % ou 21 % si critères de qualité et de localisation renforcés.',
        'Plafond d\'investissement : 300 000 €/an et 5 500 €/m².',
        'Dispositif clôturé : plus d\'acquisition éligible depuis le 1er janvier 2025.',
      ],
      tags: ['reduction_ir', 'plafond_300k', 'ferme_2025'],
    },
  ],
  sortie: [
    {
      title: 'Cession du bien',
      bullets: [
        'Plus-value soumise au régime des plus-values immobilières des particuliers.',
        'IR 19 % + PS 17,2 % avec abattement progressif (exonération IR après 22 ans, PS après 30 ans).',
        'Reprise de la réduction d\'IR si le bien est vendu avant la fin de l\'engagement.',
      ],
      tags: ['pv_immo', 'abattement_detention', 'reprise_reduction'],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Le bien intègre la succession à sa valeur vénale.',
        'L\'engagement de location est transmis aux héritiers (ou clôturé sans reprise si décès).',
        'DMTG selon le barème légal.',
      ],
      tags: ['dmtg_classique', 'transmission_engagement'],
    },
  ],
};

const DENORMANDIE: ProductRules = {
  constitution: [
    {
      title: 'Réduction d\'IR — Ancien à rénover',
      bullets: [
        'Réduction d\'IR de 12 %, 18 % ou 21 % selon la durée d\'engagement (6, 9 ou 12 ans).',
        'Conditions : bien situé dans une commune éligible, travaux de rénovation ≥ 25 % du coût total d\'opération.',
        'Plafond identique au Pinel : 300 000 €/an et 5 500 €/m².',
      ],
      tags: ['reduction_ir', 'renovation', 'plafond_300k'],
    },
  ],
  sortie: [
    {
      title: 'Cession du bien',
      bullets: [
        'Plus-value soumise au régime des plus-values immobilières des particuliers (IR 19 % + PS 17,2 %).',
        'Abattements pour durée de détention applicables.',
        'Reprise de la réduction d\'IR si cession avant la fin de l\'engagement.',
      ],
      tags: ['pv_immo', 'abattement_detention', 'reprise_reduction'],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Bien intègre la succession à sa valeur vénale. DMTG selon le barème légal.',
      ],
      tags: ['dmtg_classique'],
    },
  ],
};

const MALRAUX: ProductRules = {
  constitution: [
    {
      title: 'Réduction d\'IR — Restauration de patrimoine',
      bullets: [
        'Réduction d\'IR de 30 % des travaux (ZPPAUP/AVAP) ou 22 % (autres zones protégées).',
        'Plafond des travaux retenus : 400 000 € sur 4 années consécutives.',
        'Pas de plafonnement des niches fiscales (dérogation pour les monuments).',
        'Engagement de location : 9 ans à compter de l\'achèvement des travaux.',
      ],
      tags: ['reduction_ir', 'hors_plafond_niches', 'patrimoine_historique'],
    },
  ],
  sortie: [
    {
      title: 'Cession',
      bullets: [
        'Plus-value soumise au régime des plus-values immobilières des particuliers.',
        'Abattements pour durée de détention applicables.',
      ],
      tags: ['pv_immo', 'abattement_detention'],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Bien intègre la succession à sa valeur vénale. DMTG selon le barème légal.',
      ],
      tags: ['dmtg_classique'],
    },
  ],
};

const MONUMENTS_HISTORIQUES: ProductRules = {
  constitution: [
    {
      title: 'Déduction des charges — Régime de faveur',
      bullets: [
        'Les charges foncières (travaux, entretien) sont déductibles du revenu global sans limite.',
        'Avantage hors plafonnement des niches fiscales.',
        'Applicable aux immeubles classés ou inscrits à l\'inventaire des monuments historiques.',
        'Pas d\'obligation de location (dérogation pour les propriétaires occupants).',
      ],
      tags: ['deduction_revenu_global', 'hors_plafond_niches', 'monument_classe'],
    },
  ],
  sortie: [
    {
      title: 'Cession',
      bullets: [
        'Plus-value soumise au régime des plus-values immobilières des particuliers.',
        'Abattements pour durée de détention applicables.',
      ],
      tags: ['pv_immo', 'abattement_detention'],
    },
  ],
  deces: [
    {
      title: 'Succession — Avantage DMTG',
      bullets: [
        'Exonération de DMTG possible si le bien fait l\'objet d\'une convention avec l\'État (ouverture au public).',
        'Sans convention : intégration dans la succession à la valeur vénale, DMTG classiques.',
      ],
      tags: ['exoneration_dmtg_convention', 'dmtg_classique'],
    },
  ],
};

const DISPOSITIF_GENERIQUE: ProductRules = {
  constitution: [
    {
      title: 'Réduction ou déduction d\'IR',
      bullets: [
        'Dispositif fiscal d\'investissement immobilier ouvrant droit à une réduction ou déduction fiscale.',
        'Conditions spécifiques : zone géographique, durée d\'engagement, plafonds de loyers et de ressources locataires.',
        'Consulter les textes en vigueur pour les règles détaillées de chaque dispositif.',
      ],
      tags: ['dispositif_fiscal_immo'],
    },
  ],
  sortie: [
    {
      title: 'Cession',
      bullets: [
        'Plus-value soumise au régime des plus-values immobilières des particuliers.',
        'Abattements pour durée de détention applicables (exonération IR après 22 ans, PS après 30 ans).',
        'Reprise de l\'avantage fiscal si cession avant la fin de l\'engagement.',
      ],
      tags: ['pv_immo', 'abattement_detention', 'reprise_avantage'],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Bien intègre la succession à sa valeur vénale.',
        'DMTG selon le barème légal et le lien de parenté.',
      ],
      tags: ['dmtg_classique'],
    },
  ],
};

export function getFiscauxImmobilierRules(
  productId: string,
  _audience: Audience,
): ProductRules | undefined {
  switch (productId) {
    case 'pinel_pinel_plus':
      return PINEL_PINEL_PLUS;
    case 'denormandie':
      return DENORMANDIE;
    case 'malraux':
      return MALRAUX;
    case 'monuments_historiques':
      return MONUMENTS_HISTORIQUES;
    case 'scellier':
    case 'duflot':
    case 'censi_bouvard':
    case 'loc_avantages':
    case 'louer_abordable_cosse':
    case 'relance_logement_jeanbrun':
      return DISPOSITIF_GENERIQUE;
    default:
      return undefined;
  }
}
