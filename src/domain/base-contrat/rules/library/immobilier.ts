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
      confidence: 'elevee',
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
      confidence: 'elevee',
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Le bien intègre la succession à sa valeur vénale au jour du décès.',
        'Droits de mutation à titre gratuit (DMTG) selon le barème et le lien de parenté.',
      ],
      tags: ['dmtg_classique'],
      confidence: 'elevee',
    },
  ],
};

const PARTS_SCPI_PM: ProductRules = {
  constitution: [
    {
      title: 'Souscription et revenus (personne morale)',
      bullets: [
        'Souscription de parts de SCPI par la personne morale, en direct ou via financement.',
        'Les revenus distribués sont intégrés au résultat fiscal de la personne morale (IS/IR selon régime).',
      ],
      tags: ['scpi_pm', 'resultat_fiscal'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'Cession des parts',
      bullets: [
        'La plus-value de cession est intégrée au résultat fiscal de la personne morale selon son régime d\'imposition.',
        'Le traitement comptable et fiscal dépend des modalités de détention et de clôture des comptes.',
      ],
      tags: ['cession_parts', 'resultat_fiscal', 'traitement_comptable'],
      confidence: 'elevee',
    },
  ],
  deces: [
    {
      title: 'Fin de vie / sortie de la PM',
      bullets: [
        'En cas de dissolution, liquidation ou cession d\'activité, les parts de SCPI sont intégrées aux opérations de clôture de la personne morale.',
        'Le résultat de cession ou de liquidation est traité selon le régime fiscal de la personne morale.',
      ],
      tags: ['fin_vie_pm', 'liquidation', 'cession_activite'],
      confidence: 'elevee',
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
      confidence: 'elevee',
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
      confidence: 'elevee',
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
      confidence: 'elevee',
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
      confidence: 'elevee',
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
      confidence: 'elevee',
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
      confidence: 'elevee',
    },
  ],
};

const LOCATIF_NU_PM: ProductRules = {
  constitution: LOCATIF_NU.constitution,
  sortie: LOCATIF_NU.sortie,
  deces: [
    {
      title: 'Fin de vie / sortie de la PM',
      bullets: [
        'En cas de dissolution, liquidation ou cession d’activité, le bien est intégré aux opérations de clôture de la personne morale.',
        'Le traitement fiscal de sortie dépend du régime d’imposition (IS/IR) et des écritures de clôture applicables.',
      ],
      tags: ['fin_vie_pm', 'cloture_pm', 'sortie_immobiliere_pm'],
      confidence: 'elevee',
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
        'À confirmer selon l\'inscription éventuelle au registre du commerce et des sociétés (RCS).',
      ],
      tags: ['bic', 'micro_bic', 'amortissements', 'lmnp'],
      confidence: 'moyenne',
      dependencies: ['inscription RCS', 'seuil de recettes annuelles'],
    },
  ],
  sortie: [
    {
      title: 'Plus-value de cession',
      bullets: [
        'Régime des plus-values des particuliers : IR 19 % + PS 17,2 %.',
        'Depuis la loi de finances 2025 (art. 84) : les amortissements déduits sont réintégrés dans le calcul de la plus-value imposable (art. 150 VB CGI modifié).',
        'Abattements progressifs selon la durée de détention restent applicables (exonération IR après 22 ans, PS après 30 ans).',
        'À confirmer selon la date de cession (les cessions antérieures à la LF 2025 restent sous l\'ancien régime sans réintégration).',
      ],
      tags: ['pv_immo', 'lmnp_pv', 'abattement_detention'],
      confidence: 'moyenne',
      sources: [{ label: 'Art. 84 LF 2025 — réintégration amortissements', url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051199510' }],
      dependencies: ['date de cession (avant/après LF 2025)', 'basculement éventuel en LMP'],
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
      confidence: 'elevee',
    },
  ],
};

const LOCATIF_MEUBLE_LMP: ProductRules = {
  constitution: [
    {
      title: 'Régime BIC professionnel',
      bullets: [
        'Statut LMP : recettes locatives ≥ 23 000 €/an ET supérieures aux autres revenus professionnels du foyer.',
        'Régime réel obligatoire : amortissements et charges déductibles (y compris déficits sur le revenu global).',
        'Cotisations sociales obligatoires (TNS ou assimilé salarié selon le régime).',
        'À confirmer selon l\'affiliation sociale spécifique du loueur (SSI, régime général).',
      ],
      tags: ['bic_professionnel', 'lmp', 'cotisations_sociales'],
      confidence: 'moyenne',
      dependencies: ['affiliation sociale (SSI ou régime général)', 'seuil de recettes annuelles'],
    },
  ],
  sortie: [
    {
      title: 'Plus-value professionnelle',
      bullets: [
        'Régime des plus-values professionnelles (court terme / long terme).',
        'Court terme (détention < 2 ans) : imposé à l\'IR + PS (et cotisations sociales).',
        'Long terme (détention ≥ 2 ans) : taux réduit IR 12,8 % + PS 17,2 %.',
        'Exonération possible si recettes < 90 000 € (exonération totale) ou 126 000 € (partielle) sur les 2 derniers exercices.',
        'À confirmer selon le chiffre d\'affaires précis des exercices N-1 et N-2 (Art. 151 septies du CGI).',
      ],
      tags: ['pv_pro', 'court_terme', 'long_terme', 'exoneration_recettes'],
      confidence: 'moyenne',
      sources: [{ label: 'Art. 151 septies CGI', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042908282' }],
      dependencies: ['chiffre d’affaires N-1 et N-2', 'durée d’activité LMP'],
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
      confidence: 'elevee',
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
      confidence: 'elevee',
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
      confidence: 'elevee',
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
      confidence: 'elevee',
    },
  ],
};

const IMMO_AUTRE_PM: ProductRules = {
  constitution: IMMO_AUTRE.constitution,
  sortie: IMMO_AUTRE.sortie,
  deces: [
    {
      title: 'Fin de vie / sortie de la PM',
      bullets: [
        'En cas de dissolution, liquidation ou cession d’activité, le bien est intégré aux opérations de clôture de la personne morale.',
        'Le traitement fiscal de sortie dépend du régime d’imposition (IS/IR) et de la nature comptable du bien.',
      ],
      tags: ['fin_vie_pm', 'cloture_pm', 'sortie_immobiliere_pm'],
      confidence: 'elevee',
    },
  ],
};

const PARTS_SCPI_PP: ProductRules = {
  constitution: [
    {
      title: 'Souscription et revenus',
      bullets: [
        'Souscription directe ou via emprunt (les intérêts sont déductibles des revenus fonciers).',
        'Revenus distribués (loyers) imposés en revenus fonciers : micro-foncier ou régime réel.',
      ],
      tags: ['revenus_fonciers', 'micro_foncier', 'regime_reel'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'Plus-value de cession',
      bullets: [
        'Régime des plus-values immobilières des particuliers : IR 19 % + PS 17,2 %.',
        'Abattements progressifs selon la durée de détention (exonération IR après 22 ans, PS après 30 ans).',
      ],
      tags: ['pv_immo', 'abattement_detention'],
      confidence: 'elevee',
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Les parts entrent dans la succession à leur valeur de réalisation au jour du décès.',
        'DMTG selon le barème et le lien de parenté.',
      ],
      tags: ['dmtg_classique'],
      confidence: 'elevee',
    },
  ],
};

const GROUPEMENT_FONCIER_AGRI_VITI: ProductRules = {
  constitution: [
    {
      title: 'Souscription de parts (GFA / GFV)',
      bullets: [
        'Revenus agricoles (GFA) ou viticoles (GFV) imposés dans la catégorie des bénéfices agricoles (BA).',
        'Exonération partielle d\'IFI sur les parts sous conditions de gestion (statuts + engagement de location).',
        'À confirmer selon le visa préfectoral et les statuts du groupement.',
      ],
      tags: ['benefices_agricoles', 'ifi_exoneration_partielle'],
      confidence: 'moyenne',
      sources: [{ label: 'Art. 793 bis CGI', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006310364' }],
      dependencies: ['visa préfectoral', 'statuts du GFA/GFV', 'mise en valeur active'],
    },
  ],
  sortie: [
    {
      title: 'Cession de parts',
      bullets: [
        'Régime des plus-values des particuliers : IR 19 % + PS 17,2 %.',
        'Abattements pour durée de détention applicables.',
        'À confirmer selon le statut du cédant et la durée de détention.',
      ],
      tags: ['pv_parts', 'abattement_detention'],
      confidence: 'moyenne',
      dependencies: ['statut du cédant (particulier vs professionnel)'],
    },
  ],
  deces: [
    {
      title: 'Transmission — régime art. 793 bis CGI',
      bullets: [
        'Exonération de 75 % des DMTG (art. 793 bis CGI) si les biens sont donnés à bail long terme (≥ 18 ans) et les parts détenues depuis plus de 2 ans.',
        'Au-delà de 600 000 € par bénéficiaire (seuil relevé par LF 2025 art. 70) : exonération réduite à 50 %.',
        'DMTG classiques si aucun bail long terme ou engagement de conservation non respecté.',
        'À confirmer selon l\'existence du bail long terme et le respect des conditions de conservation (5 ans).',
      ],
      tags: ['dmtg_classique', 'art_793_bis', 'exoneration_75'],
      confidence: 'moyenne',
      sources: [{ label: 'Art. 793 bis CGI', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006310364' }],
      dependencies: ['bail long terme ≥ 18 ans', 'engagement de conservation 5 ans', 'seuil 600 000 € (LF 2025 art. 70)'],
    },
  ],
};

const GROUPEMENT_FONCIER_AGRI_VITI_PM: ProductRules = {
  constitution: GROUPEMENT_FONCIER_AGRI_VITI.constitution,
  sortie: GROUPEMENT_FONCIER_AGRI_VITI.sortie,
  deces: [
    {
      title: 'Fin de vie / sortie de la PM',
      bullets: [
        'En cas de dissolution, liquidation ou cession d’activité, les parts sont intégrées aux opérations de clôture de la personne morale.',
        'Le traitement fiscal de sortie est déterminé selon le régime d’imposition et la valorisation retenue à la clôture.',
      ],
      tags: ['fin_vie_pm', 'cloture_pm', 'parts_groupement_pm'],
      confidence: 'elevee',
    },
  ],
};

const GROUPEMENT_FONCIER_FORESTIER: ProductRules = {
  constitution: [
    {
      title: 'Souscription de parts (GFF)',
      bullets: [
        'Revenus forestiers imposés dans la catégorie des bénéfices agricoles (BA) ou forfait forestier selon le cas.',
        'Exonération partielle d\'IFI possible si les forêts font l\'objet d\'un Plan Simple de Gestion (PSG) agréé.',
        'À confirmer selon le PSG et les statuts du groupement.',
      ],
      tags: ['benefices_agricoles', 'ifi_exoneration_partielle', 'psg'],
      confidence: 'moyenne',
      sources: [{ label: 'Art. 793 CGI', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006310362' }],
      dependencies: ['PSG agréé', 'statuts du GFF'],
    },
  ],
  sortie: [
    {
      title: 'Cession de parts',
      bullets: [
        'Régime des plus-values des particuliers : IR 19 % + PS 17,2 %.',
        'Abattements pour durée de détention applicables.',
        'À confirmer selon le statut du cédant et la durée de détention.',
      ],
      tags: ['pv_parts', 'abattement_detention'],
      confidence: 'moyenne',
      dependencies: ['statut du cédant (particulier vs professionnel)'],
    },
  ],
  deces: [
    {
      title: 'Transmission — régime art. 793 CGI (forêts)',
      bullets: [
        'Exonération de 75 % des DMTG (art. 793 CGI — Loi Sérot) si les forêts sont couvertes par un Plan Simple de Gestion agréé (PSG) et engagement de conservation.',
        'Contrairement au régime GFA, pas de plafond monétaire sur l\'exonération si les conditions PSG sont remplies.',
        'À confirmer selon l\'existence du PSG agréé, la durée et les conditions de conservation appliquées.',
      ],
      tags: ['dmtg_classique', 'art_793_cgi', 'exoneration_75', 'psg'],
      confidence: 'moyenne',
      sources: [{ label: 'Art. 793 CGI', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006310362' }],
      dependencies: ['PSG agréé', 'engagement de conservation', 'durée de détention des parts'],
    },
  ],
};

const GROUPEMENT_FONCIER_FORESTIER_PM: ProductRules = {
  constitution: GROUPEMENT_FONCIER_FORESTIER.constitution,
  sortie: GROUPEMENT_FONCIER_FORESTIER.sortie,
  deces: [
    {
      title: 'Fin de vie / sortie de la PM',
      bullets: [
        'En cas de dissolution, liquidation ou cession d’activité, les parts sont intégrées aux opérations de clôture de la personne morale.',
        'Le traitement fiscal de sortie est déterminé selon le régime d’imposition et la valorisation retenue à la clôture.',
      ],
      tags: ['fin_vie_pm', 'cloture_pm', 'parts_groupement_pm'],
      confidence: 'elevee',
    },
  ],
};

export function getImmobilierRules(
  productId: string,
  audience: Audience,
): ProductRules | undefined {
  switch (productId) {
    case 'residence_principale':
      return RESIDENCE_PRINCIPALE;
    case 'residence_secondaire':
      return RESIDENCE_SECONDAIRE;
    case 'locatif_nu':
      return audience === 'pm' ? LOCATIF_NU_PM : LOCATIF_NU;
    case 'locatif_meuble_lmnp':
      return LOCATIF_MEUBLE_LMNP;
    case 'locatif_meuble_lmp':
      return LOCATIF_MEUBLE_LMP;
    case 'immobilier_garage_parking':
    case 'immobilier_terrain':
      return audience === 'pm' ? IMMO_AUTRE_PM : IMMO_AUTRE;
    case 'parts_scpi':
      return audience === 'pm' ? PARTS_SCPI_PM : PARTS_SCPI_PP;
    case 'groupement_foncier_agri_viti':
      return audience === 'pm' ? GROUPEMENT_FONCIER_AGRI_VITI_PM : GROUPEMENT_FONCIER_AGRI_VITI;
    case 'groupement_foncier_forestier':
      return audience === 'pm' ? GROUPEMENT_FONCIER_FORESTIER_PM : GROUPEMENT_FONCIER_FORESTIER;
    default:
      return undefined;
  }
}
