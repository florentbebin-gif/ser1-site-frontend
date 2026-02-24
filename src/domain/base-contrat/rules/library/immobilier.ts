/**
 * domain/base-contrat/rules/library/immobilier.ts
 *
 * Règles fiscales — Immobilier direct et indirect.
 * Produits : résidence principale, secondaire, locatif nu, LMNP, LMP,
 *            garage/parking, terrain, SCPI, groupements fonciers.
 */

import type { ProductRules, Audience } from '../types';

const RESIDENCE_PRINCIPALE: ProductRules = {
  constitution: [
    {
      title: 'Acquisition',
      bullets: [
        'Pas de déductibilité des intérêts d\'emprunt (dispositif supprimé depuis 2011).',
        'Droits de mutation à titre onéreux (DMTO) : environ 5 à 6 % du prix pour un logement ancien.',
        'Exonération partielle d\'IFI : abattement de 30 % sur la valeur de la résidence principale.',
      ],
      tags: ['dmto', 'ifi_abattement_30'],
    },
  ],
  sortie: [
    {
      title: 'Plus-value de cession — Exonération totale',
      bullets: [
        'La plus-value réalisée à la cession est totalement exonérée d\'IR et de prélèvements sociaux.',
        'Condition : le bien doit être la résidence principale du cédant au jour de la vente.',
        'L\'exonération s\'applique quelle que soit la durée de détention.',
      ],
      tags: ['exoneration_totale', 'residence_principale_vente'],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Le bien intègre la succession à sa valeur vénale au jour du décès.',
        'Droits de mutation à titre gratuit (DMTG) selon le barème et le lien de parenté.',
        'Abattement de 100 000 € par enfant (renouvelable tous 15 ans).',
        'L\'abattement IFI de 30 % n\'est pas applicable aux DMTG.',
      ],
      tags: ['dmtg_classique', 'abattement_100k_enfant'],
    },
  ],
};

const RESIDENCE_SECONDAIRE: ProductRules = {
  constitution: [
    {
      title: 'Acquisition',
      bullets: [
        'Droits de mutation à titre onéreux (DMTO) : environ 5 à 6 % pour un bien ancien.',
        'Intégration à l\'assiette IFI à sa valeur vénale.',
      ],
      tags: ['dmto', 'ifi'],
    },
  ],
  sortie: [
    {
      title: 'Plus-value de cession',
      bullets: [
        'Régime des plus-values immobilières des particuliers : IR 19 % + prélèvements sociaux 17,2 %.',
        'Abattements progressifs selon la durée de détention : exonération totale d\'IR après 22 ans, de PS après 30 ans.',
        'Surtaxe de 2 % à 6 % si la plus-value nette imposable dépasse 50 000 €.',
      ],
      tags: ['pv_immo', 'abattement_detention', 'surtaxe'],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Le bien intègre la succession à sa valeur vénale.',
        'DMTG selon le barème et le lien de parenté.',
        'Abattement 100 000 € par enfant renouvelable tous 15 ans.',
      ],
      tags: ['dmtg_classique'],
    },
  ],
};

const LOCATIF_NU: ProductRules = {
  constitution: [
    {
      title: 'Revenus fonciers et charges',
      bullets: [
        'Loyers imposés dans la catégorie des revenus fonciers.',
        'Micro-foncier (si loyers bruts ≤ 15 000 €/an) : abattement forfaitaire de 30 %.',
        'Régime réel : déductibilité des charges (travaux, intérêts d\'emprunt, assurances, taxe foncière…).',
        'Déficit foncier déductible du revenu global dans la limite de 10 700 €/an (20 200 € pour les travaux de rénovation énergétique d\'ampleur).',
      ],
      tags: ['revenus_fonciers', 'micro_foncier', 'regime_reel', 'deficit_foncier'],
    },
  ],
  sortie: [
    {
      title: 'Plus-value de cession',
      bullets: [
        'Régime des plus-values immobilières des particuliers : IR 19 % + PS 17,2 %.',
        'Abattements progressifs : exonération totale d\'IR après 22 ans, de PS après 30 ans de détention.',
        'Surtaxe de 2 % à 6 % si la plus-value nette dépasse 50 000 €.',
      ],
      tags: ['pv_immo', 'abattement_detention', 'surtaxe'],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Le bien intègre la succession à sa valeur vénale.',
        'DMTG selon le barème et le lien de parenté.',
        'Abattement 100 000 € par enfant renouvelable tous 15 ans.',
      ],
      tags: ['dmtg_classique'],
    },
  ],
};

const LOCATIF_MEUBLE_LMNP: ProductRules = {
  constitution: [
    {
      title: 'Régime BIC — Revenus',
      bullets: [
        'Revenus imposés en bénéfices industriels et commerciaux (BIC), pas en revenus fonciers.',
        'Micro-BIC (si recettes ≤ 77 700 €/an) : abattement forfaitaire de 50 %.',
        'Régime réel : amortissements du bien et du mobilier déductibles (avantage fiscal majeur).',
        'Statut LMNP : activité non professionnelle (recettes < 23 000 € ou < 50 % des revenus du foyer).',
      ],
      tags: ['bic', 'micro_bic', 'amortissements', 'lmnp'],
    },
  ],
  sortie: [
    {
      title: 'Plus-value de cession',
      bullets: [
        'Régime des plus-values des particuliers : IR 19 % + PS 17,2 %.',
        'Avantage distinctif LMNP : les amortissements passés ne sont pas réintégrés dans la plus-value imposable.',
        'Abattements progressifs selon la durée de détention (exonération IR après 22 ans, PS après 30 ans).',
      ],
      tags: ['pv_immo', 'no_reintegration_amortissements', 'abattement_detention'],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Le bien intègre la succession à sa valeur vénale.',
        'DMTG selon le barème et le lien de parenté.',
        'Abattement 100 000 € par enfant renouvelable tous 15 ans.',
      ],
      tags: ['dmtg_classique'],
    },
  ],
};

const LOCATIF_MEUBLE_LMP: ProductRules = {
  constitution: [
    {
      title: 'Régime BIC professionnel',
      bullets: [
        'Statut LMP : recettes locatives ≥ 23 000 €/an ET supérieures aux autres revenus professionnels du foyer.',
        'Régime réel obligatoire : amortissements et charges déductibles.',
        'Cotisations sociales obligatoires (TNS ou assimilé salarié selon le régime).',
      ],
      tags: ['bic_professionnel', 'lmp', 'cotisations_sociales'],
    },
  ],
  sortie: [
    {
      title: 'Plus-value professionnelle',
      bullets: [
        'Régime des plus-values professionnelles (court terme / long terme).',
        'Court terme (détention < 2 ans) : imposé à l\'IR + PS.',
        'Long terme (détention ≥ 2 ans) : taux réduit IR 12,8 % + PS 17,2 %.',
        'Exonération possible si recettes < 90 000 € (exonération totale) ou 126 000 € (partielle) sur les 2 derniers exercices.',
      ],
      tags: ['pv_pro', 'court_terme', 'long_terme', 'exoneration_recettes'],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Le bien intègre la succession à sa valeur vénale.',
        'DMTG selon le barème et le lien de parenté.',
        'Abattement 100 000 € par enfant renouvelable tous 15 ans.',
      ],
      tags: ['dmtg_classique'],
    },
  ],
};

const IMMO_AUTRE: ProductRules = {
  constitution: [
    {
      title: 'Acquisition',
      bullets: [
        'Droits de mutation à titre onéreux selon la nature du bien.',
        'Intégration à l\'assiette IFI selon la nature et l\'utilisation.',
      ],
      tags: ['dmto', 'ifi'],
    },
  ],
  sortie: [
    {
      title: 'Plus-value de cession',
      bullets: [
        'Régime des plus-values immobilières des particuliers : IR 19 % + PS 17,2 %.',
        'Abattements progressifs selon la durée de détention.',
        'Exonération totale d\'IR après 22 ans, de PS après 30 ans.',
      ],
      tags: ['pv_immo', 'abattement_detention'],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Le bien intègre la succession à sa valeur vénale.',
        'DMTG selon le barème et le lien de parenté.',
      ],
      tags: ['dmtg_classique'],
    },
  ],
};

const PARTS_SCPI: ProductRules = {
  constitution: [
    {
      title: 'Souscription et revenus',
      bullets: [
        'Souscription directe ou via emprunt (les intérêts sont déductibles des revenus fonciers).',
        'Revenus distribués (loyers) imposés en revenus fonciers (PP) : micro-foncier ou régime réel.',
        'Accessible aux personnes morales (PM) : revenus intégrés au résultat fiscal soumis à l\'IS.',
      ],
      tags: ['revenus_fonciers', 'micro_foncier', 'regime_reel', 'pm_eligible'],
    },
  ],
  sortie: [
    {
      title: 'Plus-value de cession',
      bullets: [
        'Régime des plus-values immobilières des particuliers (PP) : IR 19 % + PS 17,2 %.',
        'Abattements progressifs selon la durée de détention (exonération IR après 22 ans, PS après 30 ans).',
        'Personnes morales (PM) : plus-value intégrée au résultat soumis à l\'IS.',
      ],
      tags: ['pv_immo', 'abattement_detention', 'pm_is'],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Les parts entrent dans la succession à leur valeur de réalisation au jour du décès.',
        'DMTG selon le barème et le lien de parenté.',
        'Abattement 100 000 € par enfant renouvelable tous 15 ans.',
      ],
      tags: ['dmtg_classique'],
    },
  ],
};

const GROUPEMENT_FONCIER: ProductRules = {
  constitution: [
    {
      title: 'Souscription de parts',
      bullets: [
        'Revenus forestiers ou agricoles imposés selon le régime du groupement (BNC, micro, réel).',
        'Potentiel d\'exonération partielle d\'IFI sur les parts (sous conditions de gestion).',
        'Avantage Pacte Dutreil possible pour les GFA/GFV sous conditions strictes.',
      ],
      tags: ['revenu_agricole_forestier', 'ifi_exoneration_partielle', 'pacte_dutreil'],
    },
  ],
  sortie: [
    {
      title: 'Cession de parts',
      bullets: [
        'Régime des plus-values des particuliers ou des professionnels selon le statut.',
        'Abattements pour durée de détention applicables.',
      ],
      tags: ['pv_parts', 'abattement_detention'],
    },
  ],
  deces: [
    {
      title: 'Transmission — Pacte Dutreil possible',
      bullets: [
        'Les parts entrent dans la succession à leur valeur au jour du décès.',
        'Pacte Dutreil agricole/forestier : exonération de 75 % des DMTG sous conditions d\'engagement de conservation.',
        'DMTG classiques si aucun engagement Dutreil.',
      ],
      tags: ['dmtg_classique', 'pacte_dutreil', 'exoneration_75'],
    },
  ],
};

export function getImmobilierRules(
  productId: string,
  _audience: Audience,
): ProductRules | undefined {
  switch (productId) {
    case 'residence_principale':
      return RESIDENCE_PRINCIPALE;
    case 'residence_secondaire':
      return RESIDENCE_SECONDAIRE;
    case 'locatif_nu':
      return LOCATIF_NU;
    case 'locatif_meuble_lmnp':
      return LOCATIF_MEUBLE_LMNP;
    case 'locatif_meuble_lmp':
      return LOCATIF_MEUBLE_LMP;
    case 'immobilier_garage_parking':
    case 'immobilier_terrain':
      return IMMO_AUTRE;
    case 'parts_scpi':
      return PARTS_SCPI;
    case 'groupement_foncier_agri_viti':
    case 'groupement_foncier_forestier':
      return GROUPEMENT_FONCIER;
    default:
      return undefined;
  }
}
