/**
 * domain/base-contrat/rules/library/epargne-bancaire.ts
 *
 * Règles fiscales — Épargne bancaire.
 * Produits : livrets réglementés, CTO, PEA, PEA-PME, PEL, CEL, CAT, CSL.
 */

import type { ProductRules, Audience } from '../types';

const LIVRETS_REGLEMENTES: ProductRules = {
  constitution: [
    {
      title: 'Versements et plafonds',
      bullets: [
        'Livret A : plafond de 22 950 € (hors capitalisation des intérêts).',
        'LDDS : plafond de 12 000 €. Réservé aux résidents fiscaux français.',
        'LEP : plafond de 10 000 €. Accessible sous conditions de revenus.',
        'Livret Jeune : plafond de 1 600 €. Réservé aux 12-25 ans.',
        'PEAC : plafond de 22 950 €. Réservé aux moins de 21 ans.',
      ],
      tags: ['plafond_reglemente', 'resident_fiscal'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'Exonération totale',
      bullets: [
        'Intérêts totalement exonérés d\'impôt sur le revenu.',
        'Intérêts exonérés de prélèvements sociaux (17,2 %).',
        'Retraits à tout moment sans contrainte fiscale.',
      ],
      tags: ['exoneration_ir', 'exoneration_ps'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 157-7° CGI', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006307751' }],
    },
  ],
  deces: [
    {
      title: 'Intégration dans la succession',
      bullets: [
        'Le solde des livrets entre dans la succession à leur valeur au jour du décès.',
        'Droits de mutation applicables selon le barème et le lien de parenté.',
        'Abattements légaux classiques (100 000 € par enfant, renouvelables tous 15 ans).',
      ],
      tags: ['dmtg_classique', 'succession_active'],
      confidence: 'elevee',
    },
  ],
};

const CTO: ProductRules = {
  constitution: [
    {
      title: 'Ouverture et versements',
      bullets: [
        'Pas de plafond de versements, ni de restriction sur les titres (actions, obligations, ETF, OPCVM, produits dérivés…).',
        'Accessible aux personnes physiques et morales.',
        'Plusieurs CTO possibles par personne.',
      ],
      tags: ['no_plafond', 'pp_pm_eligible'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'Plus-values et cessions',
      bullets: [
        'Plus-values soumises au PFU 30 % (12,8 % IR + 17,2 % prélèvements sociaux) par défaut.',
        'Option possible pour le barème progressif de l\'IR (abattement pour durée de détention uniquement sur titres acquis avant 2018).',
        'Compensation des moins-values sur les plus-values de l\'année et des 10 années suivantes.',
      ],
      tags: ['pfu_30', 'compensation_mv', 'option_bareme'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 200 A CGI — PFU', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036428122' }],
    },
    {
      title: 'Dividendes et revenus',
      bullets: [
        'Dividendes d\'actions françaises et étrangères : PFU 30 % ou option barème avec abattement 40 % sur les dividendes français.',
        'Intérêts obligataires : PFU 30 %.',
      ],
      tags: ['dividendes', 'abattement_40', 'pfu_30'],
      confidence: 'elevee',
    },
  ],
  deces: [
    {
      title: 'Purge des plus-values latentes',
      bullets: [
        'Les titres entrent dans la succession à leur valeur au jour du décès.',
        'Avantage fiscal : la plus-value latente est "purgée" (les héritiers repartent du prix d\'acquisition à la date du décès).',
        'Droits de mutation selon le barème et le lien de parenté, après abattements légaux.',
      ],
      tags: ['purge_pv', 'dmtg_classique'],
      confidence: 'elevee',
    },
  ],
};

const CTO_PM: ProductRules = {
  constitution: CTO.constitution,
  sortie: CTO.sortie,
  deces: [
    {
      title: 'Fin de vie / événements de sortie de la personne morale',
      bullets: [
        'En cas de dissolution, liquidation ou cession d’activité, les titres sont intégrés aux opérations de clôture de la personne morale.',
        'Le résultat fiscal des cessions est déterminé selon le régime d’imposition (IS/IR) et les écritures de clôture applicables.',
      ],
      tags: ['fin_vie_pm', 'cloture_pm', 'resultat_fiscal_titres'],
      confidence: 'elevee',
    },
  ],
};

const PEA: ProductRules = {
  constitution: [
    {
      title: 'Versements et titres éligibles',
      bullets: [
        'Plafond de versements : 150 000 € (cumulable avec le PEA-PME dans la limite de 225 000 € au total).',
        'Titres éligibles : actions de sociétés ayant leur siège dans l\'UE ou l\'EEE, parts d\'OPCVM investis à plus de 75 % en actions européennes.',
        'Un seul PEA par personne physique.',
      ],
      tags: ['plafond_150k', 'actions_europeennes', 'pp_uniquement'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'Avant 5 ans',
      bullets: [
        'Retrait entraîne la clôture du plan.',
        'Plus-value soumise au PFU 30 % (12,8 % IR + 17,2 % PS).',
      ],
      tags: ['cloture_avant_5_ans', 'pfu_30'],
      confidence: 'elevee',
    },
    {
      title: 'Après 5 ans',
      bullets: [
        'Exonération totale d\'impôt sur le revenu sur les gains.',
        'Prélèvements sociaux de 17,2 % restent dus sur les gains.',
        'Retraits partiels possibles sans clôture du plan.',
        'Conversion en rente viagère exonérée d\'IR après 5 ans.',
      ],
      tags: ['exoneration_ir', 'ps_17_2', 'rente_viagere'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 150-0 A II-2 CGI — PEA', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042908358' }],
    },
  ],
  deces: [
    {
      title: 'Clôture et succession',
      bullets: [
        'Clôture automatique du PEA au décès du titulaire.',
        'Exonération d\'IR sur les gains si le plan avait plus de 5 ans.',
        'Prélèvements sociaux (17,2 %) dus sur la plus-value constatée à la clôture.',
        'Titres entrent dans la succession ; droits de mutation selon le barème légal.',
      ],
      tags: ['cloture_deces', 'exoneration_ir_5_ans', 'dmtg_classique'],
      confidence: 'elevee',
    },
  ],
};

const PEA_PME: ProductRules = {
  constitution: [
    {
      title: 'Versements et titres éligibles',
      bullets: [
        'Plafond de versements : 75 000 € (cumulable avec le PEA 150 000 € — plafond global 225 000 €).',
        'Titres éligibles : PME et ETI européennes, titres participatifs, obligations remboursables en actions.',
        'Un seul PEA-PME par personne physique.',
      ],
      tags: ['plafond_75k', 'pme_eti_europeennes', 'pp_uniquement'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'Avant 5 ans',
      bullets: [
        'Retrait entraîne la clôture du plan.',
        'Plus-value soumise au PFU 30 %.',
      ],
      tags: ['cloture_avant_5_ans', 'pfu_30'],
      confidence: 'elevee',
    },
    {
      title: 'Après 5 ans',
      bullets: [
        'Exonération d\'IR sur les gains (identique au PEA).',
        'Prélèvements sociaux 17,2 % restent dus.',
        'Retraits partiels sans clôture possibles.',
      ],
      tags: ['exoneration_ir', 'ps_17_2'],
      confidence: 'elevee',
    },
  ],
  deces: [
    {
      title: 'Clôture et succession',
      bullets: [
        'Clôture automatique au décès, mêmes règles que le PEA.',
        'Exonération d\'IR sur les gains (si plan > 5 ans) ; PS 17,2 % dus.',
        'Droits de mutation sur les titres selon le barème légal.',
      ],
      tags: ['cloture_deces', 'exoneration_ir_5_ans', 'dmtg_classique'],
      confidence: 'elevee',
    },
  ],
};

const PEL: ProductRules = {
  constitution: [
    {
      title: 'Versements',
      bullets: [
        'Versement minimal à l\'ouverture : 225 €. Versements annuels minimaux : 540 €.',
        'Plafond des versements : 61 200 €.',
        'Taux d\'intérêt garanti fixé à l\'ouverture (taux réglementé).',
      ],
      tags: ['plafond_61200', 'taux_garanti'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'Fiscalité des intérêts',
      bullets: [
        'PEL ouvert depuis le 1er janvier 2018 : intérêts soumis au PFU 30 % dès la première année.',
        'PEL ouvert avant 2018 : intérêts exonérés d\'IR les 12 premières années, puis soumis au PFU.',
        'Prélèvements sociaux prélevés annuellement.',
        'Prime d\'État supprimée pour les PEL ouverts depuis 2018.',
      ],
      tags: ['pfu_30', 'ps_annuels', 'regime_transitoire'],
      confidence: 'elevee',
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Le PEL entre dans la succession à sa valeur au jour du décès.',
        'Droits de mutation applicables selon le barème légal.',
      ],
      tags: ['dmtg_classique'],
      confidence: 'elevee',
    },
  ],
};

const CEL: ProductRules = {
  constitution: [
    {
      title: 'Versements',
      bullets: [
        'Plafond des versements : 15 300 €.',
        'Doit être détenu conjointement avec un PEL pour l\'accès au prêt épargne logement.',
        'Taux d\'intérêt réglementé (0,75 % en 2024).',
      ],
      tags: ['plafond_15300', 'taux_reglemente'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'Fiscalité des intérêts',
      bullets: [
        'Intérêts soumis au PFU 30 % (12,8 % IR + 17,2 % PS).',
        'Option possible pour le barème progressif de l\'IR.',
      ],
      tags: ['pfu_30'],
      confidence: 'elevee',
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Entre dans la succession à sa valeur au jour du décès.',
        'Droits de mutation applicables selon le barème légal.',
      ],
      tags: ['dmtg_classique'],
      confidence: 'elevee',
    },
  ],
};

const CAT_CSL: ProductRules = {
  constitution: [
    {
      title: 'Versements',
      bullets: [
        'Pas de plafond légal de versements.',
        'Accessible aux personnes physiques et morales.',
        'Rémunération librement négociée (taux du marché).',
      ],
      tags: ['no_plafond', 'pp_pm_eligible'],
      confidence: 'elevee',
    },
  ],
  sortie: [
    {
      title: 'Fiscalité des intérêts',
      bullets: [
        'Intérêts soumis au PFU 30 % (12,8 % IR + 17,2 % prélèvements sociaux).',
        'Option possible pour le barème progressif de l\'IR.',
      ],
      tags: ['pfu_30', 'option_bareme'],
      confidence: 'elevee',
    },
  ],
  deces: [
    {
      title: 'Succession',
      bullets: [
        'Solde entre dans la succession à sa valeur au jour du décès.',
        'Droits de mutation applicables selon le barème légal.',
      ],
      tags: ['dmtg_classique'],
      confidence: 'elevee',
    },
  ],
};

const CAT_CSL_PM: ProductRules = {
  constitution: CAT_CSL.constitution,
  sortie: CAT_CSL.sortie,
  deces: [
    {
      title: 'Fin de vie / événements de sortie de la personne morale',
      bullets: [
        'En cas de dissolution, liquidation ou cession d’activité, les soldes sont intégrés aux opérations de clôture de la personne morale.',
        'Le traitement fiscal de clôture dépend du régime d’imposition (IS/IR) et de la qualification comptable des flux.',
      ],
      tags: ['fin_vie_pm', 'cloture_pm', 'traitement_fiscal_cloture'],
      confidence: 'elevee',
    },
  ],
};

export function getEpargneBancaireRules(
  productId: string,
  audience: Audience,
): ProductRules | undefined {
  switch (productId) {
    case 'livret_a':
    case 'ldds':
    case 'lep':
    case 'livret_jeune':
    case 'peac':
      return LIVRETS_REGLEMENTES;
    case 'cto':
      return audience === 'pm' ? CTO_PM : CTO;
    case 'pea':
      return PEA;
    case 'pea_pme':
      return PEA_PME;
    case 'pel':
      return PEL;
    case 'cel':
      return CEL;
    case 'cat_compte_a_terme':
    case 'csl_compte_sur_livret':
    case 'compte_courant_depot':
      return audience === 'pm' ? CAT_CSL_PM : CAT_CSL;
    default:
      return undefined;
  }
}
