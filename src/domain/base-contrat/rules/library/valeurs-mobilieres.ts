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

function buildPmLifecycleRules(subject: string, tags: string[] = []): ProductRules {
  return {
    constitution: [
      {
        title: `Détention et comptabilisation (${subject})`,
        bullets: [
          'Le produit est détenu par la personne morale et comptabilisé selon sa nature (titres, parts, créances ou droits).',
          'Le traitement fiscal courant suit le régime d’imposition de la personne morale (IS/IR) et les règles comptables applicables.',
        ],
        tags: ['pm', 'comptabilisation', ...tags],
        confidence: 'elevee',
      },
    ],
    sortie: [
      {
        title: 'Cession / encaissement',
        bullets: [
          'Le résultat de cession, remboursement ou encaissement est intégré au résultat fiscal de la personne morale.',
          'Les modalités de calcul dépendent du mode de détention, des écritures de clôture et de la documentation comptable.',
        ],
        tags: ['resultat_fiscal', 'cession_pm', ...tags],
        confidence: 'elevee',
      },
    ],
    deces: [
      {
        title: 'Fin de vie / sortie de la PM',
        bullets: [
          'En cas de dissolution, liquidation ou cession d’activité, le traitement est effectué dans les opérations de clôture de la personne morale.',
          'La valorisation retenue à la clôture détermine l’assiette fiscale finale selon le régime applicable.',
        ],
        tags: ['fin_vie_pm', 'cloture_pm', ...tags],
        confidence: 'elevee',
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
        'Frais d\'acquisition (courtage) non déductibles fiscalement (régime PFU).',
      ],
      tags: ['cto', 'pea_eligible'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'Plus-values et dividendes',
      bullets: [
        'Plus-values de cession : PFU 30 % (12,8 % IR + 17,2 % PS) par défaut.',
        'Option globale pour le barème progressif (abattement pour durée de détention uniquement sur titres acquis avant 2018).',
        'Dividendes d\'actions françaises : PFU 30 % ou option barème avec abattement de 40 %.',
        'Compensation des moins-values sur les plus-values de l\'année et des 10 années suivantes.',
      ],
      tags: ['pfu_30', 'dividendes', 'abattement_40', 'compensation_mv'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 200 A CGI — PFU + Art. 158-3 CGI — abattement 40%', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036428122' }],
    },
  ],
  deces: [
    {
      title: 'Purge des plus-values latentes et succession',
      bullets: [
        'Les titres intègrent la succession à leur valeur au jour du décès (valeur de marché).',
        'Purge fiscale : les héritiers repartent du cours de bourse au jour du décès (pas d\'impôt sur les PV latentes).',
        'DMTG selon le barème et le lien de parenté, après abattements légaux.',
      ],
      tags: ['purge_pv', 'dmtg_classique'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 779 CGI — abattements DMTG', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047678018' }],
    },
  ],
};

const FONDS_OPC: ProductRules = {
  constitution: [
    {
      title: 'Souscription',
      bullets: [
        'Souscription de parts ou actions de fonds (FCPR, FCPI, FIP, OPCI…).',
        'FCPI/FIP : réduction d\'IR sur les versements (taux variable selon millésime et label — à confirmer selon le fonds souscrit).',
        'Engagement de blocage des fonds pendant la durée requise (généralement 5 à 10 ans).',
        'À confirmer : taux de réduction applicable et plafond annuel en vigueur lors de la souscription.',
      ],
      tags: ['reduction_ir', 'blocage', 'fcpi_fip'],
      confidence: 'moyenne',
      sources: [{ label: 'Art. 199 terdecies-0 A CGI — FCPI/FIP', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044975826' }],
      dependencies: ['millesime et label du fonds', 'taux de réduction en vigueur lors de la souscription'],
    },
  ],
  sortie: [
    {
      title: 'Cession de parts',
      bullets: [
        'Plus-values soumises au PFU 30 % (12,8 % IR + 17,2 % PS).',
        'FCPR exonérés d\'IR sur les plus-values sous conditions (délai de détention, investissement PME non cotées).',
        'Compensation des moins-values sur les 10 années suivantes.',
      ],
      tags: ['pfu_30', 'exoneration_fcpr', 'compensation_mv'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 200 A CGI — PFU', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036428122' }],
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
      sources: [{ label: 'Art. 779 CGI — abattements DMTG', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047678018' }],
    },
  ],
};

const ACTIONS_NON_COTEES: ProductRules = {
  constitution: [
    {
      title: 'Acquisition / Souscription',
      bullets: [
        'Pas de plafond légal. Titres non admis sur un marché réglementé.',
        'Souscription au capital : éventuellement éligible à la réduction IR-PME (18 % ou 25 % selon l\'entreprise).',
      ],
      tags: ['ir_pme', 'non_cote'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 199 terdecies-0 A CGI — IR-PME', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044975826' }],
    },
  ],
  sortie: [
    {
      title: 'Cession',
      bullets: [
        'Plus-values : PFU 30 % (12,8 % IR + 17,2 % PS) par défaut.',
        'Option barème avec abattements pour durée de détention (titres acquis avant 2018 uniquement).',
        'Abattement renforcé possible pour dirigeants partant en retraite (sous conditions).',
      ],
      tags: ['pfu_30', 'abattement_dirigeant_retraite'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 200 A CGI — PFU', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036428122' }],
    },
  ],
  deces: [
    {
      title: 'Succession — Pacte Dutreil possible',
      bullets: [
        'Les titres intègrent la succession à leur valeur vénale.',
        'Pacte Dutreil (art. 787 B CGI) : exonération de 75 % des DMTG sous engagement collectif et individuel de conservation.',
        'Abattements légaux classiques en l\'absence de Pacte Dutreil.',
      ],
      tags: ['pacte_dutreil', 'art_787_b_cgi', 'dmtg_classique'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 787 B CGI — Pacte Dutreil', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043663071' }],
    },
  ],
};

const SOFICA: ProductRules = {
  constitution: [
    {
      title: 'Souscription',
      bullets: [
        'Réduction d\'IR de 30 % à 48 % des sommes investies (selon affectation de la SOFICA).',
        'Plafond annuel de souscription : 18 000 € maximum (ou 25 % du revenu net global si inférieur).',
        'Engagement de conservation des parts pendant au moins 5 ans.',
      ],
      tags: ['reduction_ir', 'plafond_18k', 'sofica'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 163 bis G CGI — SOFICA', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038614158' }],
    },
  ],
  sortie: [
    {
      title: 'Cession de parts',
      bullets: [
        'Plus-values soumises au PFU 30 %.',
        'Moins-values non imputables sur d\'autres plus-values de cession de valeurs mobilières.',
      ],
      tags: ['pfu_30', 'mv_non_imputables'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 200 A CGI — PFU', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036428122' }],
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
      sources: [{ label: 'Art. 779 CGI — abattements DMTG', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047678018' }],
    },
  ],
};

const IR_PME_MADELIN: ProductRules = {
  constitution: [
    {
      title: 'Souscription au capital de PME',
      bullets: [
        'Réduction d\'IR de 18 % (ou 25 % si prorogé) sur les versements effectués.',
        'Plafond annuel : 50 000 € pour une personne seule, 100 000 € pour un couple.',
        'Conditions : PME de moins de 7 ans, secteurs éligibles, engagement de conservation 5 ans minimum.',
      ],
      tags: ['reduction_ir_18_25', 'plafond_50k', 'engagement_5_ans'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 199 terdecies-0 A CGI — IR-PME', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044975826' }],
    },
  ],
  sortie: [
    {
      title: 'Cession',
      bullets: [
        'Plus-values : PFU 30 % ou option barème.',
        'Moins-values déductibles des plus-values de même nature.',
        'Reprise de la réduction d\'IR si cession avant 5 ans (hors cas de force majeure).',
      ],
      tags: ['pfu_30', 'reprise_reduction'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 200 A CGI — PFU', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036428122' }],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Titres entrent dans la succession à leur valeur vénale.',
        'DMTG selon le barème et le lien de parenté.',
        'Pacte Dutreil possible si les conditions d\'engagement sont remplies.',
      ],
      tags: ['dmtg_classique', 'pacte_dutreil'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 787 B CGI — Pacte Dutreil + Art. 779 CGI — abattements DMTG', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043663071' }],
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
      ],
      tags: ['financement_participatif', 'risque_capital'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'Cession / remboursement',
      bullets: [
        'Plus-values sur actions : PFU 30 %.',
        'Intérêts sur obligations : PFU 30 %.',
        'Pertes déductibles des gains de même nature (dans la limite des règles du PFU).',
      ],
      tags: ['pfu_30'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 200 A CGI — PFU', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036428122' }],
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
      sources: [{ label: 'Art. 779 CGI — abattements DMTG', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047678018' }],
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
      ],
      tags: ['gre_a_gre', 'risque_credit'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'Intérêts et cession',
      bullets: [
        'Intérêts courus : PFU 30 % (12,8 % IR + 17,2 % PS).',
        'Plus-values de cession : PFU 30 %.',
      ],
      tags: ['pfu_30'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 200 A CGI — PFU', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036428122' }],
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
      sources: [{ label: 'Art. 779 CGI — abattements DMTG', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047678018' }],
    },
  ],
};

const COMPTE_COURANT_ASSOCIE: ProductRules = {
  constitution: [
    {
      title: 'Nature juridique',
      bullets: [
        'Prêt consenti par un associé à l\'entité dans laquelle il détient des droits (créance de compte courant d\'associé).',
        'Intérêts déductibles pour l\'entité débitrice dans la limite du taux plafond légal.',
      ],
      tags: ['pret_associe', 'interet_deductible_societe'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'Remboursement',
      bullets: [
        'Remboursement du capital : non imposable (restitution de la créance).',
        'Intérêts perçus : imposables à l\'IR selon le PFU 30 % (ou option barème).',
      ],
      tags: ['pfu_30', 'interet_imposable'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 200 A CGI — PFU', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036428122' }],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'La créance (solde du CCA) intègre la succession à sa valeur nominale.',
        'DMTG selon le barème légal.',
        'Risque de dépréciation si l\'entité débitrice est en difficulté : valeur à estimer avec prudence.',
      ],
      tags: ['dmtg_classique', 'valeur_nominale'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 779 CGI — abattements DMTG', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047678018' }],
    },
  ],
};

const PRET_PARTICULIERS: ProductRules = {
  constitution: [
    {
      title: 'Nature',
      bullets: [
        'Prêt formalisé par une reconnaissance de dette (acte sous seing privé ou notarié).',
        'Déclaration obligatoire à l\'administration fiscale si montant > 5 000 €.',
      ],
      tags: ['reconnaissance_dette', 'declaration_fiscale'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 242 ter CGI — déclaration prêt > 5 000 €', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006312267' }],
    },
  ],
  sortie: [
    {
      title: 'Remboursement',
      bullets: [
        'Remboursement du capital : non imposable.',
        'Intérêts éventuels : imposables à l\'IR selon le PFU 30 %.',
      ],
      tags: ['pfu_30', 'interet_imposable'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 200 A CGI — PFU', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036428122' }],
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'La créance intègre la succession à sa valeur (solde restant dû).',
        'DMTG selon le barème légal et le lien de parenté.',
      ],
      tags: ['dmtg_classique'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 779 CGI — abattements DMTG', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047678018' }],
    },
  ],
};

const USUFRUIT_NUE_PROPRIETE: ProductRules = {
  constitution: [
    {
      title: 'Démembrement de propriété',
      bullets: [
        'L\'usufruit et la nue-propriété représentent deux droits distincts sur un même bien.',
        'Valorisation selon le barème fiscal de l\'usufruit (art. 669 CGI) : dépend de l\'âge de l\'usufruitier.',
        'Donation de la nue-propriété : DMTG calculés sur la seule valeur de la nue-propriété.',
        'À confirmer selon l\'origine du démembrement (légal type succession, ou conventionnel type donation/cession).',
      ],
      tags: ['demembrement', 'art_669_cgi', 'bareme_fiscal_usufruit'],
      confidence: 'moyenne',
      sources: [{ label: 'Art. 669 CGI', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006310228' }],
      dependencies: ['origine du démembrement (légal vs conventionnel)', 'âge de l\'usufruitier'],
    },
  ],
  sortie: [
    {
      title: 'Cession et revenus',
      bullets: [
        'Les loyers ou revenus reviennent à l\'usufruitier (imposition en revenus fonciers ou BIC).',
        'Cession de la pleine propriété : PV partagée entre usufruitier et nu-propriétaire selon les droits respectifs.',
        'Réunion de l\'usufruit et de la nue-propriété (extinction de l\'usufruit) : sans taxation pour le nu-propriétaire.',
        'À confirmer selon la répartition conventionnelle des droits entre usufruitier et nu-propriétaire.',
      ],
      tags: ['revenus_usufruitier', 'pv_demembrement', 'reunion'],
      confidence: 'moyenne',
      dependencies: ['répartition des droits usufruitier/nu-propriétaire'],
    },
  ],
  deces: [
    {
      title: 'Extinction de l\'usufruit et transmission',
      bullets: [
        'Au décès de l\'usufruitier, la pleine propriété se reconstitue sans droits de succession supplémentaires.',
        'La nue-propriété transmise de son vivant évite une double taxation.',
        'Intégration dans la succession des droits détenus à la valeur fiscale.',
        'À confirmer selon la présence éventuelle d\'une clause de réversion d\'usufruit.',
      ],
      tags: ['reunion_usufruit', 'no_dmtg_reunion', 'optimisation_transmission'],
      confidence: 'moyenne',
      dependencies: ['clause de réversion d\'usufruit éventuelle'],
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
      return audience === 'pm' ? buildPmLifecycleRules('titres financiers', ['titres_financiers']) : ACTIONS_COTEES;
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
      return audience === 'pm' ? buildPmLifecycleRules('titres non cotés', ['non_cote']) : ACTIONS_NON_COTEES;
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
      return audience === 'pm' ? buildPmLifecycleRules('titres de PME', ['ir_pme']) : IR_PME_MADELIN;
    case 'crowdfunding_pp':
      return CROWDFUNDING;
    case 'crowdfunding_pm':
      return buildPmLifecycleRules('titres de financement participatif', ['crowdfunding']);
    case 'crowdfunding':
      return audience === 'pm' ? buildPmLifecycleRules('titres de financement participatif', ['crowdfunding']) : CROWDFUNDING;
    case 'obligations_non_cotees_pp':
      return OBLIGATIONS_NON_COTEES;
    case 'obligations_non_cotees_pm':
      return buildPmLifecycleRules('obligations non cotées', ['obligations']);
    case 'obligations_non_cotees':
      return audience === 'pm' ? buildPmLifecycleRules('obligations non cotées', ['obligations']) : OBLIGATIONS_NON_COTEES;
    case 'compte_courant_associe_pp':
      return COMPTE_COURANT_ASSOCIE;
    case 'compte_courant_associe_pm':
      return buildPmLifecycleRules('créances en compte courant d’associé', ['cca']);
    case 'compte_courant_associe':
      return audience === 'pm' ? buildPmLifecycleRules('créances en compte courant d’associé', ['cca']) : COMPTE_COURANT_ASSOCIE;
    case 'usufruit_nue_propriete_pp':
      return USUFRUIT_NUE_PROPRIETE;
    case 'usufruit_nue_propriete_pm':
      return buildPmLifecycleRules('droits démembrés', ['demembrement']);
    case 'pret_entre_particuliers':
      return audience === 'pm' ? buildPmLifecycleRules('créances de prêt', ['creances']) : PRET_PARTICULIERS;
    case 'usufruit_nue_propriete':
      return audience === 'pm' ? buildPmLifecycleRules('droits démembrés', ['demembrement']) : USUFRUIT_NUE_PROPRIETE;
    default:
      return undefined;
  }
}
