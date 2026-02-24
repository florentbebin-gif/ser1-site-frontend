/**
 * domain/base-contrat/rules/library/retraite.ts
 *
 * Règles fiscales — Retraite & épargne salariale.
 * Produits : PERIN assurantiel, PERIN bancaire, PEE, PERCOL, PERO,
 *            Article 83, Article 39, Madelin retraite, PERP, PERCO.
 */

import type { ProductRules, Audience } from '../types';

const PERIN_ASSURANCE: ProductRules = {
  constitution: [
    {
      title: 'Versements et déductibilité',
      bullets: [
        'Versements volontaires libres ou programmés (pas de plafond légal spécifique).',
        'Déductibilité de l\'IR dans la limite du disponible épargne retraite : environ 10 % des revenus professionnels N-1, plafonné à 8 PASS (≈ 35 194 € pour 2024).',
        'Abondement employeur et transferts depuis d\'anciens produits (PERP, Madelin, PERCO…) possibles.',
      ],
      tags: ['deductible_ir', 'plafond_per', 'pass'],
    },
    {
      title: 'Compartiments de versements',
      bullets: [
        'Compartiment 1 : versements volontaires déductibles.',
        'Compartiment 2 : versements volontaires non déductibles (sur option).',
        'Compartiment 3 : versements obligatoires / abondement employeur.',
      ],
      tags: ['compartiment_1', 'compartiment_2', 'compartiment_3'],
    },
  ],
  sortie: [
    {
      title: 'Sortie à la retraite — Compartiment déductible',
      bullets: [
        'Sortie en capital ou en rente viagère (au choix depuis la loi PACTE 2019).',
        'Capital : totalité soumise au barème progressif de l\'IR + PS 17,2 % sur les seuls gains.',
        'Rente : soumise au barème IR avec abattement de 10 % (régime rentes viagères à titre gratuit).',
      ],
      tags: ['sortie_capital', 'sortie_rente', 'bareme_ir', 'ps_17_2'],
    },
    {
      title: 'Sortie à la retraite — Compartiment non déductible',
      bullets: [
        'Capital : exonéré d\'IR ; seuls les gains sont soumis aux PS (17,2 %).',
        'Rente : régime des rentes viagères à titre onéreux (fraction imposable selon l\'âge au premier versement).',
      ],
      tags: ['exoneration_capital', 'rente_titre_onereux'],
    },
    {
      title: 'Déblocage anticipé autorisé',
      bullets: [
        'Décès du conjoint ou partenaire de PACS.',
        'Invalidité de 2e ou 3e catégorie (titulaire, conjoint ou enfant).',
        'Expiration des droits à l\'assurance chômage.',
        'Situation de surendettement ou liquidation judiciaire.',
        'Acquisition de la résidence principale.',
      ],
      tags: ['deblocage_anticipe', 'residence_principale'],
    },
  ],
  deces: [
    {
      title: 'Avant 70 ans — fiscalité assurance-vie (art. 990 I CGI)',
      bullets: [
        'Abattement de 152 500 € par bénéficiaire désigné.',
        'Au-delà : 20 % jusqu\'à 852 500 €, puis 31,25 %.',
        'Capital hors succession pour les bénéficiaires désignés.',
      ],
      tags: ['art_990_i_cgi', 'abattement_152500', 'hors_succession'],
    },
    {
      title: 'Après 70 ans',
      bullets: [
        'Abattement global de 30 500 € partagé entre tous les bénéficiaires (art. 757 B CGI).',
        'Au-delà : intégration aux droits de succession selon le lien de parenté.',
        'Gains capitalisés exonérés de droits.',
      ],
      tags: ['art_757_b_cgi', 'abattement_30500'],
    },
  ],
};

const PERIN_BANCAIRE: ProductRules = {
  constitution: [
    {
      title: 'Versements et déductibilité',
      bullets: [
        'Mêmes règles que le PERIN assurantiel : déductibilité dans la limite du disponible épargne retraite.',
        'Supports : fonds diversifiés (pas de fonds euros garanti, contrairement à la version assurantielle).',
      ],
      tags: ['deductible_ir', 'plafond_per'],
    },
  ],
  sortie: [
    {
      title: 'Sortie à la retraite',
      bullets: [
        'Sortie en capital ou en rente (même liberté que le PERIN assurantiel depuis PACTE).',
        'Fiscalité identique au PERIN assurantiel selon le compartiment de versement.',
      ],
      tags: ['sortie_capital', 'sortie_rente'],
    },
    {
      title: 'Déblocage anticipé autorisé',
      bullets: [
        'Mêmes cas de déblocage que le PERIN assurantiel.',
      ],
      tags: ['deblocage_anticipe'],
    },
  ],
  deces: [
    {
      title: 'Intégration dans la succession',
      bullets: [
        'Contrairement au PERIN assurantiel, le PERIN bancaire intègre la succession classique.',
        'Pas d\'avantage hors-succession : droits de mutation selon le barème et le lien de parenté.',
        'Abattements légaux classiques applicables (100 000 € par enfant…).',
      ],
      tags: ['dmtg_classique', 'succession_active'],
    },
  ],
};

const EPARGNE_SALARIALE_PEE: ProductRules = {
  constitution: [
    {
      title: 'Versements',
      bullets: [
        'Alimenté par la participation, l\'intéressement, les versements volontaires du salarié et l\'abondement employeur.',
        'Versements volontaires du salarié : plafond de 25 % de la rémunération annuelle brute.',
        'Intéressement et participation affectés au PEE : exonérés d\'IR dans la limite des plafonds légaux.',
      ],
      tags: ['participation', 'interessement', 'abondement', 'plafond_25pct'],
    },
  ],
  sortie: [
    {
      title: 'Avant 5 ans — Blocage',
      bullets: [
        'Les sommes sont bloquées pendant 5 ans (sauf cas de déblocage anticipé légaux).',
        'Déblocage anticipé : achat résidence principale, mariage/PACS, naissance, divorce, invalidité, décès, départ de l\'entreprise, liquidation judiciaire.',
      ],
      tags: ['blocage_5_ans', 'deblocage_anticipe'],
    },
    {
      title: 'Après 5 ans',
      bullets: [
        'Plus-values exonérées d\'IR.',
        'Prélèvements sociaux (17,2 %) dus sur les gains.',
      ],
      tags: ['exoneration_ir', 'ps_17_2'],
    },
  ],
  deces: [
    {
      title: 'Déblocage et succession',
      bullets: [
        'Le décès du titulaire est un cas de déblocage anticipé.',
        'Les sommes intègrent la succession ; droits de mutation applicables.',
      ],
      tags: ['deblocage_deces', 'dmtg_classique'],
    },
  ],
};

const RETRAITE_ENTREPRISE_GENERIQUE: ProductRules = {
  constitution: [
    {
      title: 'Versements (Contrat à cotisations définies ou article 39)',
      bullets: [
        'Cotisations employeur et/ou salarié selon les modalités du contrat collectif.',
        'Déductibilité des cotisations patronales dans les limites légales.',
        'Les droits sont liés à la présence dans l\'entreprise (pour les contrats à droits conditionnels - Article 39).',
        'À confirmer selon les plafonds de déductibilité applicables au prorata du PASS.',
      ],
      tags: ['cotisations_patronales', 'cotisations_salariales'],
    },
  ],
  sortie: [
    {
      title: 'Sortie à la retraite',
      bullets: [
        'Sortie obligatoire en rente viagère pour les contrats à prestations définies (Article 39).',
        'Sortie en capital possible pour les contrats à cotisations définies (Article 83 transformé en PERO).',
        'Rente imposable à l\'IR (après abattement de 10 %) + Prélèvements sociaux.',
        'À confirmer selon le régime spécifique de sortie et l\'option d\'imposition choisie.',
      ],
      tags: ['rente_obligatoire', 'bareme_ir', 'abattement_10'],
    },
  ],
  deces: [
    {
      title: 'Réversion et succession',
      bullets: [
        'Rente de réversion possible au profit du conjoint survivant (si prévue au contrat).',
        'Capital résiduel éventuel intègre la succession.',
        'Droits de mutation selon barème et lien de parenté.',
      ],
      tags: ['reversion', 'dmtg_classique'],
    },
  ],
};

const PERP_MADELIN_ANCIEN: ProductRules = {
  constitution: [
    {
      title: 'Versements (anciens contrats — plus ouverts à la souscription)',
      bullets: [
        'Ces produits ne sont plus ouverts à la souscription depuis la loi PACTE (2019).',
        'Les contrats existants continuent à fonctionner et peuvent être transférés vers un PER.',
        'Déductibilité des cotisations de l\'IR dans la limite du disponible épargne retraite.',
      ],
      tags: ['ferme_souscription', 'transfert_per', 'deductible_ir'],
    },
  ],
  sortie: [
    {
      title: 'Sortie à la retraite',
      bullets: [
        'Sortie principalement en rente viagère (capital limité à 20 % pour le PERP).',
        'Rente imposable à l\'IR (régime rentes viagères à titre gratuit, abattement 10 %).',
        'Transfert vers un PER possible pour bénéficier de la sortie en capital totale.',
      ],
      tags: ['rente_viagere', 'transfert_per', 'abattement_10'],
    },
  ],
  deces: [
    {
      title: 'Réversion',
      bullets: [
        'Rente de réversion au conjoint si prévue au contrat.',
        'Capital résiduel intègre la succession classique.',
      ],
      tags: ['reversion', 'dmtg_classique'],
    },
  ],
};

export function getRetraiteRules(
  productId: string,
  _audience: Audience,
): ProductRules | undefined {
  switch (productId) {
    case 'perin_assurance':
      return PERIN_ASSURANCE;
    case 'perin_bancaire':
      return PERIN_BANCAIRE;
    case 'pee':
    case 'percol':
    case 'perco_ancien':
      return EPARGNE_SALARIALE_PEE;
    case 'article_83':
    case 'article_39':
    case 'pero':
      return RETRAITE_ENTREPRISE_GENERIQUE;
    case 'perp_ancien':
    case 'madelin_retraite_ancien':
      return PERP_MADELIN_ANCIEN;
    default:
      return undefined;
  }
}
