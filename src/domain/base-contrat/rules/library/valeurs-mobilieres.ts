/**
 * domain/base-contrat/rules/library/valeurs-mobilieres.ts
 *
 * Règles fiscales — Valeurs mobilières, Non coté / PE, Créances/Droits.
 * Produits : actions cotées, fonds (FCPR/FCPI/FIP/OPCI),
 *            actions non cotées, crowdfunding, SOFICA, IR-PME/Madelin,
 *            obligations non cotées, CCA, prêt entre particuliers,
 *            usufruit/nue-propriété.
 */

import type { ProductRules, Audience } from '../types';
import {
  COMPTE_COURANT_ASSOCIE,
  PRET_PARTICULIERS,
  USUFRUIT_NUE_PROPRIETE,
} from './valeurs-mobilieres-creances-demembrement';

function buildPmLifecycleRules(subject: string, tags: string[] = []): ProductRules {
  return {
    constitution: [
      {
        title: `Détention et comptabilisation (${subject})`,
        bullets: [
          'Le produit est détenu par la personne morale et comptabilisé selon sa nature (titres, parts, créances ou droits).',
          'Le traitement fiscal courant suit le régime d’imposition de la personne morale (IS/IR) et les règles comptables applicables.',
          `À confirmer selon le régime fiscal de la personne morale et les règles comptables applicables aux ${subject}.`,
        ],
        tags: ['pm', 'comptabilisation', ...tags],
        confidence: 'moyenne',
        dependencies: ['régime fiscal PM', `comptabilité ${subject}`],
      },
    ],
    sortie: [
      {
        title: 'Cession / encaissement',
        bullets: [
          'Le résultat de cession, remboursement ou encaissement est intégré au résultat fiscal de la personne morale.',
          'Les modalités de calcul dépendent du mode de détention, des écritures de clôture et de la documentation comptable.',
          'À confirmer selon le mode de détention et les écritures de clôture.',
        ],
        tags: ['resultat_fiscal', 'cession_pm', ...tags],
        confidence: 'moyenne',
        dependencies: ['mode de détention', 'écritures de clôture', 'documentation comptable'],
      },
    ],
    deces: [
      {
        title: 'Fin de vie / sortie de la PM',
        bullets: [
          'En cas de dissolution, liquidation ou cession d’activité, le traitement est effectué dans les opérations de clôture de la personne morale.',
          'La valorisation retenue à la clôture détermine l’assiette fiscale finale selon le régime applicable.',
          `À confirmer selon les modalités de dissolution et la valorisation des ${subject} à la clôture.`,
        ],
        tags: ['fin_vie_pm', 'cloture_pm', ...tags],
        confidence: 'moyenne',
        dependencies: ['dissolution ou liquidation', `valorisation ${subject}`],
      },
    ],
  };
}

const ACTIONS_COTEES: ProductRules = {
  constitution: [
    {
      title: 'Acquisition',
      bullets: [
        'Pas de plafond ni de restriction. Détenus sur CTO, PEA (si actions européennes) ou PEA-PME.',
        "Frais d'acquisition (courtage) non déductibles fiscalement (régime PFU).",
        "À confirmer selon l'enveloppe de détention et l'éligibilité européenne des titres.",
      ],
      tags: ['cto', 'pea_eligible'],
      confidence: 'moyenne',
      dependencies: ['enveloppe CTO/PEA/PEA-PME', 'éligibilité européenne'],
    },
  ],
  sortie: [
    {
      title: 'Plus-values et dividendes',
      bullets: [
        'Plus-values de cession : {pfu} par défaut.',
        'Option globale pour le barème progressif (abattement pour durée de détention uniquement sur titres acquis avant 2018).',
        "Dividendes d'actions françaises : {pfu} ou option barème avec abattement de 40 %.",
        "Compensation des moins-values sur les plus-values de l'année et des 10 années suivantes.",
      ],
      tags: ['pfu', 'dividendes', 'abattement_40', 'compensation_mv'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 200 A CGI — PFU + Art. 158-3 CGI — abattement 40%',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036428122',
        },
      ],
    },
  ],
  deces: [
    {
      title: 'Purge des plus-values latentes et succession',
      bullets: [
        'Les titres intègrent la succession à leur valeur au jour du décès (valeur de marché).',
        "Purge fiscale : les héritiers repartent du cours de bourse au jour du décès (pas d'impôt sur les PV latentes).",
        'DMTG selon le barème et le lien de parenté, après abattements légaux.',
      ],
      tags: ['purge_pv', 'dmtg_classique'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 779 CGI — abattements DMTG',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047678018',
        },
      ],
    },
  ],
};

const FONDS_OPC: ProductRules = {
  constitution: [
    {
      title: 'Souscription',
      bullets: [
        'Souscription de parts ou actions de fonds (FCPR, FCPI, FIP, OPCI…).',
        "FCPI/FIP : réduction d'IR sur les versements (taux variable selon millésime et label — à confirmer selon le fonds souscrit).",
        'Engagement de blocage des fonds pendant la durée requise (généralement 5 à 10 ans).',
        'À confirmer : taux de réduction applicable et plafond annuel en vigueur lors de la souscription.',
      ],
      tags: ['reduction_ir', 'blocage', 'fcpi_fip'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Art. 199 terdecies-0 A CGI — FCPI/FIP',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044975826',
        },
      ],
      dependencies: [
        'millesime et label du fonds',
        'taux de réduction en vigueur lors de la souscription',
      ],
    },
  ],
  sortie: [
    {
      title: 'Cession de parts',
      bullets: [
        'Plus-values soumises au {pfu}.',
        "FCPR exonérés d'IR sur les plus-values sous conditions (délai de détention, investissement PME non cotées).",
        'Compensation des moins-values sur les 10 années suivantes.',
      ],
      tags: ['pfu', 'exoneration_fcpr', 'compensation_mv'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 200 A CGI — PFU',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036428122',
        },
      ],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Les parts entrent dans la succession à leur valeur liquidative au jour du décès.',
        'DMTG selon le barème et le lien de parenté.',
      ],
      tags: ['dmtg_classique'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 779 CGI — abattements DMTG',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047678018',
        },
      ],
    },
  ],
};

const ACTIONS_NON_COTEES: ProductRules = {
  constitution: [
    {
      title: 'Acquisition / Souscription',
      bullets: [
        'Pas de plafond légal. Titres non admis sur un marché réglementé.',
        "Souscription au capital : éventuellement éligible à la réduction IR-PME (18 % ou 25 % selon l'entreprise).",
      ],
      tags: ['ir_pme', 'non_cote'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 199 terdecies-0 A CGI — IR-PME',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044975826',
        },
      ],
    },
  ],
  sortie: [
    {
      title: 'Cession',
      bullets: [
        'Plus-values : {pfu} par défaut.',
        'Option barème avec abattements pour durée de détention (titres acquis avant 2018 uniquement).',
        'Abattement renforcé possible pour dirigeants partant en retraite (sous conditions).',
      ],
      tags: ['pfu', 'abattement_dirigeant_retraite'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 200 A CGI — PFU',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036428122',
        },
      ],
    },
  ],
  deces: [
    {
      title: 'Succession — Pacte Dutreil possible',
      bullets: [
        'Les titres intègrent la succession à leur valeur vénale.',
        'Pacte Dutreil (art. 787 B CGI) : exonération de 75 % des DMTG sous engagement collectif et individuel de conservation.',
        "Abattements légaux classiques en l'absence de Pacte Dutreil.",
      ],
      tags: ['pacte_dutreil', 'art_787_b_cgi', 'dmtg_classique'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 787 B CGI — Pacte Dutreil',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043663071',
        },
      ],
    },
  ],
};

const SOFICA: ProductRules = {
  constitution: [
    {
      title: 'Souscription',
      bullets: [
        "Réduction d'IR selon le taux d'affectation de la SOFICA ({soficaReductionRates}).",
        "Plafond annuel de souscription plafonné (montant et modalités définis à l'art. 163 bis G CGI — À confirmer).",
        'Engagement de conservation des parts pendant au moins 5 ans.',
      ],
      tags: ['reduction_ir', 'plafond_18k', 'sofica'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Art. 163 bis G CGI — SOFICA',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038614158',
        },
      ],
      dependencies: ["taux d'affectation de la SOFICA", 'plafond annuel de souscription'],
    },
  ],
  sortie: [
    {
      title: 'Cession de parts',
      bullets: [
        'Plus-values soumises au {pfu}.',
        "Moins-values non imputables sur d'autres plus-values de cession de valeurs mobilières.",
      ],
      tags: ['pfu', 'mv_non_imputables'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 200 A CGI — PFU',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036428122',
        },
      ],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Parts entrent dans la succession à leur valeur liquidative.',
        'DMTG selon le barème et le lien de parenté.',
      ],
      tags: ['dmtg_classique'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 779 CGI — abattements DMTG',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047678018',
        },
      ],
    },
  ],
};

const IR_PME_MADELIN: ProductRules = {
  constitution: [
    {
      title: 'Souscription au capital de PME',
      bullets: [
        "Réduction d'IR de 18 % sur les versements effectués (taux majoré possible si prorogation législative — À confirmer selon la loi de finances en vigueur).",
        'Plafond annuel légal selon la composition du foyer.',
        'Conditions : PME de moins de 7 ans, secteurs éligibles, engagement de conservation 5 ans minimum.',
      ],
      tags: ['reduction_ir_18_25', 'plafond_50k', 'engagement_5_ans'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Art. 199 terdecies-0 A CGI — IR-PME',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044975826',
        },
      ],
      dependencies: ['âge et secteur PME', 'conservation 5 ans', 'taux IR-PME millésime'],
    },
  ],
  sortie: [
    {
      title: 'Cession',
      bullets: [
        'Plus-values : {pfu} ou option barème.',
        'Moins-values déductibles des plus-values de même nature.',
        "Reprise de la réduction d'IR si cession avant 5 ans (hors cas de force majeure).",
      ],
      tags: ['pfu', 'reprise_reduction'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 200 A CGI — PFU',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036428122',
        },
      ],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Titres entrent dans la succession à leur valeur vénale.',
        'DMTG selon le barème et le lien de parenté.',
        "Pacte Dutreil possible si les conditions d'engagement sont remplies.",
      ],
      tags: ['dmtg_classique', 'pacte_dutreil'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 787 B CGI — Pacte Dutreil + Art. 779 CGI — abattements DMTG',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043663071',
        },
      ],
    },
  ],
};

const CROWDFUNDING: ProductRules = {
  constitution: [
    {
      title: 'Investissement via plateforme',
      bullets: [
        'Actions ou obligations souscrites via une plateforme de financement participatif (agrément CIP/PSI).',
        'Risque de perte en capital important (PME non cotées).',
        'À confirmer selon le statut de la plateforme et la nature des titres souscrits.',
      ],
      tags: ['financement_participatif', 'risque_capital'],
      confidence: 'moyenne',
      dependencies: ['statut de la plateforme', 'nature des titres souscrits'],
    },
  ],
  sortie: [
    {
      title: 'Cession / remboursement',
      bullets: [
        'Plus-values sur actions : {pfu}.',
        'Intérêts sur obligations : {pfu}.',
        'Pertes déductibles des gains de même nature (dans la limite des règles du PFU).',
      ],
      tags: ['pfu'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 200 A CGI — PFU',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036428122',
        },
      ],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Titres / créances entrent dans la succession à leur valeur vénale.',
        'DMTG selon le barème et le lien de parenté.',
      ],
      tags: ['dmtg_classique'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 779 CGI — abattements DMTG',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047678018',
        },
      ],
    },
  ],
};

const OBLIGATIONS_NON_COTEES: ProductRules = {
  constitution: [
    {
      title: 'Souscription',
      bullets: [
        'Obligations souscrites de gré à gré (PME, club deals, obligations convertibles…).',
        'Pas de plafond légal. Risque de crédit élevé.',
        "À confirmer selon la documentation obligataire et le risque de crédit de l'émetteur.",
      ],
      tags: ['gre_a_gre', 'risque_credit'],
      confidence: 'moyenne',
      dependencies: ['documentation obligataire', "risque de crédit de l'émetteur"],
    },
  ],
  sortie: [
    {
      title: 'Intérêts et cession',
      bullets: ['Intérêts courus : {pfu}.', 'Plus-values de cession : {pfu}.'],
      tags: ['pfu'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 200 A CGI — PFU',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036428122',
        },
      ],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'La créance intègre la succession à sa valeur nominale (ou de marché).',
        'DMTG selon le barème légal.',
      ],
      tags: ['dmtg_classique'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 779 CGI — abattements DMTG',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047678018',
        },
      ],
    },
  ],
};

export function getValeursMobilieresRules(
  productId: string,
  audience: Audience,
): ProductRules | undefined {
  switch (productId) {
    case 'actions_cotees_pp':
    case 'actions_preference_pp':
    case 'parts_sociales_cooperatives_pp':
    case 'titres_participatifs_pp':
    case 'droits_bsa_dps_pp':
      return ACTIONS_COTEES;
    case 'actions_cotees_pm':
    case 'actions_preference_pm':
    case 'parts_sociales_cooperatives_pm':
    case 'titres_participatifs_pm':
    case 'droits_bsa_dps_pm':
      return buildPmLifecycleRules('titres financiers', ['titres_financiers']);
    case 'actions_cotees':
    case 'actions_preference':
    case 'parts_sociales_cooperatives':
    case 'titres_participatifs':
    case 'droits_bsa_dps':
      return audience === 'pm'
        ? buildPmLifecycleRules('titres financiers', ['titres_financiers'])
        : ACTIONS_COTEES;
    case 'fcpr_pp':
    case 'fcpi_pp':
    case 'fip_pp':
    case 'opci_grand_public_pp':
      return FONDS_OPC;
    case 'fcpr_pm':
    case 'fcpi_pm':
    case 'fip_pm':
    case 'opci_grand_public_pm':
      return buildPmLifecycleRules('parts de fonds', ['fonds']);
    case 'fcpr':
    case 'fcpi':
    case 'fip':
    case 'opci_grand_public':
      return audience === 'pm' ? buildPmLifecycleRules('parts de fonds', ['fonds']) : FONDS_OPC;
    case 'actions_non_cotees_pp':
      return ACTIONS_NON_COTEES;
    case 'actions_non_cotees_pm':
      return buildPmLifecycleRules('titres non cotés', ['non_cote']);
    case 'actions_non_cotees':
      return audience === 'pm'
        ? buildPmLifecycleRules('titres non cotés', ['non_cote'])
        : ACTIONS_NON_COTEES;
    case 'sofica_pp':
      return SOFICA;
    case 'sofica_pm':
      return buildPmLifecycleRules('parts SOFICA', ['sofica']);
    case 'sofica':
      return audience === 'pm' ? buildPmLifecycleRules('parts SOFICA', ['sofica']) : SOFICA;
    case 'ir_pme_madelin_pp':
      return IR_PME_MADELIN;
    case 'ir_pme_madelin_pm':
      return buildPmLifecycleRules('titres de PME', ['ir_pme']);
    case 'ir_pme_madelin':
      return audience === 'pm'
        ? buildPmLifecycleRules('titres de PME', ['ir_pme'])
        : IR_PME_MADELIN;
    case 'crowdfunding_pp':
      return CROWDFUNDING;
    case 'crowdfunding_pm':
      return buildPmLifecycleRules('titres de financement participatif', ['crowdfunding']);
    case 'crowdfunding':
      return audience === 'pm'
        ? buildPmLifecycleRules('titres de financement participatif', ['crowdfunding'])
        : CROWDFUNDING;
    case 'obligations_non_cotees_pp':
      return OBLIGATIONS_NON_COTEES;
    case 'obligations_non_cotees_pm':
      return buildPmLifecycleRules('obligations non cotées', ['obligations']);
    case 'obligations_non_cotees':
      return audience === 'pm'
        ? buildPmLifecycleRules('obligations non cotées', ['obligations'])
        : OBLIGATIONS_NON_COTEES;
    case 'compte_courant_associe_pp':
      return COMPTE_COURANT_ASSOCIE;
    case 'compte_courant_associe_pm':
      return buildPmLifecycleRules('créances en compte courant d’associé', ['cca']);
    case 'compte_courant_associe':
      return audience === 'pm'
        ? buildPmLifecycleRules('créances en compte courant d’associé', ['cca'])
        : COMPTE_COURANT_ASSOCIE;
    case 'usufruit_nue_propriete_pp':
      return USUFRUIT_NUE_PROPRIETE;
    case 'usufruit_nue_propriete_pm':
      return buildPmLifecycleRules('droits démembrés', ['demembrement']);
    case 'pret_entre_particuliers':
      return audience === 'pm'
        ? buildPmLifecycleRules('créances de prêt', ['creances'])
        : PRET_PARTICULIERS;
    case 'usufruit_nue_propriete':
      return audience === 'pm'
        ? buildPmLifecycleRules('droits démembrés', ['demembrement'])
        : USUFRUIT_NUE_PROPRIETE;
    default:
      return undefined;
  }
}
