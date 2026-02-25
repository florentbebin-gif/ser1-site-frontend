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
        'TNS : déductibilité également couverte par l\'art. 154 bis CGI (Madelin) pour les versements dans le compartiment Madelin du PER.',
        'Abondement employeur et transferts depuis d\'anciens produits (PERP, Madelin, PERCO…) possibles.',
      ],
      tags: ['deductible_ir', 'plafond_per', 'pass', 'art_154_bis'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 163 quatervicies CGI', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042912048' }, { label: 'Art. 154 bis CGI (TNS)', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041471860' }],
    },
    {
      title: 'Compartiments de versements',
      bullets: [
        'Compartiment 1 : versements volontaires déductibles.',
        'Compartiment 2 : versements volontaires non déductibles (sur option).',
        'Compartiment 3 : versements obligatoires / abondement employeur.',
      ],
      tags: ['compartiment_1', 'compartiment_2', 'compartiment_3'],
      confidence: 'elevee',
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
      confidence: 'elevee',
      sources: [{ label: 'Loi PACTE 2019 — PER', url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038496102' }],
    },
    {
      title: 'Sortie à la retraite — Compartiment non déductible',
      bullets: [
        'Capital : exonéré d\'IR ; seuls les gains sont soumis aux PS (17,2 %).',
        'Rente : régime des rentes viagères à titre onéreux (fraction imposable selon l\'âge au premier versement).',
      ],
      tags: ['exoneration_capital', 'rente_titre_onereux'],
      confidence: 'elevee',
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
      confidence: 'elevee',
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
      confidence: 'elevee',
    },
    {
      title: 'Après 70 ans',
      bullets: [
        'Abattement global de 30 500 € partagé entre tous les bénéficiaires (art. 757 B CGI).',
        'Au-delà : intégration aux droits de succession selon le lien de parenté.',
        'Gains capitalisés exonérés de droits.',
      ],
      tags: ['art_757_b_cgi', 'abattement_30500'],
      confidence: 'elevee',
    },
  ],
};

const EPARGNE_SALARIALE_PEE_PM: ProductRules = {
  constitution: [
    {
      title: 'Dispositifs collectifs d\'épargne salariale',
      bullets: [
        'Mise en place par accord collectif (participation, intéressement, abondement, versements volontaires selon le plan).',
        'Les versements de l\'entreprise sont traités en charges déductibles du résultat (IS/IR) sous conditions légales.',
        'À confirmer selon l\'accord collectif, l\'effectif et les plafonds applicables.',
      ],
      tags: ['epargne_salariale', 'accord_collectif', 'charges_deductibles'],
      confidence: 'moyenne',
      dependencies: ['accord collectif en vigueur', 'effectif de l\'entreprise', 'plafonds légaux applicables'],
    },
  ],
  sortie: [
    {
      title: 'Disponibilité des avoirs',
      bullets: [
        'Les modalités de sortie dépendent du plan (PEE/PERCOL/PERCO), des clauses d\'accord et des cas de déblocage anticipé autorisés.',
        'Les flux financiers et sociaux sont appréciés au niveau de l\'entreprise et des bénéficiaires selon la nature des versements.',
        'À confirmer selon l\'accord applicable et l\'année de versement.',
      ],
      tags: ['modalites_sortie', 'deblocage_anticipe', 'accord_collectif'],
      confidence: 'moyenne',
      dependencies: ['type de plan', 'accord collectif applicable', 'année de versement'],
    },
  ],
  deces: [
    {
      title: 'Fin de vie / sortie de la PM',
      bullets: [
        'En cas de dissolution, liquidation ou cession de l\'activité, les dispositifs d\'épargne salariale sont clôturés ou transférés selon les accords en vigueur.',
        'Le traitement social, fiscal et comptable des engagements restants est arrêté à la date de cessation de la personne morale.',
        'À confirmer selon les modalités de liquidation, de transfert des engagements et le régime fiscal de l\'entreprise.',
      ],
      tags: ['fin_vie_pm', 'liquidation', 'cession_activite'],
      confidence: 'moyenne',
      dependencies: ['modalités de dissolution ou liquidation', 'accord collectif en vigueur', 'régime fiscal de l\'entreprise'],
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
      confidence: 'elevee',
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
      confidence: 'elevee',
    },
    {
      title: 'Déblocage anticipé autorisé',
      bullets: [
        'Mêmes cas de déblocage que le PERIN assurantiel.',
      ],
      tags: ['deblocage_anticipe'],
      confidence: 'elevee',
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
      confidence: 'elevee',
    },
  ],
};

const EPARGNE_SALARIALE_PEE_PP: ProductRules = {
  constitution: [
    {
      title: 'Versements',
      bullets: [
        'Alimenté par la participation, l\'intéressement, les versements volontaires du salarié et l\'abondement employeur.',
        'Versements volontaires du salarié : plafond de 25 % de la rémunération annuelle brute.',
        'Intéressement et participation affectés au PEE : exonérés d\'IR dans la limite des plafonds légaux.',
      ],
      tags: ['participation', 'interessement', 'abondement', 'plafond_25pct'],
      confidence: 'elevee',
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
      confidence: 'elevee',
    },
    {
      title: 'Après 5 ans',
      bullets: [
        'Plus-values exonérées d\'IR.',
        'Prélèvements sociaux (17,2 %) dus sur les gains.',
      ],
      tags: ['exoneration_ir', 'ps_17_2'],
      confidence: 'elevee',
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
      confidence: 'elevee',
    },
  ],
};

const ARTICLE_83_PP: ProductRules = {
  constitution: [
    {
      title: 'Cotisations (anciens contrats — fermés à la souscription depuis PACTE 2019)',
      bullets: [
        'Cotisations patronales et salariales définies par l\'accord collectif.',
        'Cotisations patronales déductibles du résultat imposable de l\'employeur selon le régime fiscal applicable.',
        'Plafond de déduction salarié : 8 % de la rémunération annuelle brute plafonnée à 8 PASS.',
        'À confirmer selon les conditions de l\'accord et la date d\'ouverture du contrat.',
      ],
      tags: ['cotisations_patronales', 'cotisations_salariales', 'plafond_8pct_8pass'],
      confidence: 'moyenne',
      sources: [{ label: 'Art. 83 CGI (ancien)', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006302860' }],
      dependencies: ['accord collectif applicable', 'date d\'ouverture du contrat'],
    },
  ],
  sortie: [
    {
      title: 'Sortie à la retraite',
      bullets: [
        'Sortie en rente viagère principalement ; capital possible via transfert vers PER (loi PACTE 2019).',
        'Rente imposable à l\'IR (abattement 10 %) + CSG 8,3 % + CRDS 0,5 % + CASA 0,3 %.',
        'À confirmer selon les conditions du contrat et l\'option de transfert vers PER.',
      ],
      tags: ['rente_viagere', 'bareme_ir', 'abattement_10'],
      confidence: 'moyenne',
      sources: [{ label: 'Loi PACTE 2019 — transfert vers PER', url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038496102' }],
      dependencies: ['conditions de l\'accord collectif', 'option de transfert vers PER exercée'],
    },
  ],
  deces: [
    {
      title: 'Réversion',
      bullets: [
        'Rente de réversion au conjoint si prévue par le contrat collectif.',
        'Le traitement du capital résiduel dépend des stipulations contractuelles applicables au bénéficiaire.',
        'À confirmer selon la clause de réversion et les stipulations du contrat.',
      ],
      tags: ['reversion', 'capital_residuel'],
      confidence: 'moyenne',
      dependencies: ['clause de réversion prévue au contrat collectif'],
    },
  ],
};

const ARTICLE_83_PM: ProductRules = {
  constitution: [
    {
      title: 'Cotisations (PM)',
      bullets: [
        'Cotisations patronales et salariales définies par accord collectif.',
        'Cotisations patronales déductibles du résultat imposable de l\'entreprise (IS ou IR).',
        'À confirmer selon les conditions de l\'accord et la catégorie de salariés couverte.',
      ],
      tags: ['cotisations_patronales', 'cotisations_salariales', 'accord_collectif'],
      confidence: 'moyenne',
      sources: [{ label: 'Art. 83 CGI (ancien)', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006302860' }],
      dependencies: ['accord collectif applicable', 'catégorie de salariés couverte'],
    },
  ],
  sortie: [
    {
      title: 'Sortie des engagements',
      bullets: [
        'Les flux sont traités selon l\'accord collectif et les modalités de sortie (rente, transfert, liquidation des droits).',
        'Le traitement social et fiscal dépend de la structure des cotisations et des régimes applicables.',
        'À confirmer selon les clauses d\'accord, les transferts opérés et la période concernée.',
      ],
      tags: ['sortie_engagements', 'accord_collectif', 'traitement_social_fiscal'],
      confidence: 'moyenne',
      dependencies: ['clauses de l\'accord collectif', 'modalités de sortie', 'période concernée'],
    },
  ],
  deces: [
    {
      title: 'Fin de vie / sortie de la PM',
      bullets: [
        'En cas de dissolution, liquidation ou cession de l\'entreprise, les engagements Article 83 sont soldés ou transférés selon le cadre conventionnel.',
        'Le traitement comptable et fiscal est apprécié à la clôture de la personne morale selon le régime IS/IR.',
        'À confirmer selon les modalités de liquidation et les obligations prévues par l\'accord collectif.',
      ],
      tags: ['fin_vie_pm', 'liquidation', 'cession_entreprise'],
      confidence: 'moyenne',
      dependencies: ['modalités de dissolution ou liquidation', 'clauses de transfert des engagements', 'régime fiscal IS/IR'],
    },
  ],
};

const ARTICLE_39_PP: ProductRules = {
  constitution: [
    {
      title: 'Cotisations (prestations définies)',
      bullets: [
        'Dispositif collectif de retraite supplémentaire à prestations définies, encadré par le règlement du régime.',
        'Les droits du bénéficiaire dépendent de la formule applicable (historique vs post-2019).',
        'À confirmer selon les clauses du règlement et la date d\'acquisition des droits.',
      ],
      tags: ['prestations_definies', 'reglement_regime'],
      confidence: 'moyenne',
      dependencies: ['règlement du régime', 'date d\'acquisition des droits'],
    },
  ],
  sortie: [
    {
      title: 'Sortie en rente',
      bullets: [
        'Sortie en rente viagère selon le règlement du régime.',
        'Imposition de la rente selon les règles applicables au bénéficiaire.',
        'À confirmer selon le montant de rente et les prélèvements en vigueur.',
      ],
      tags: ['rente_viagere', 'fiscalite_beneficiaire'],
      confidence: 'moyenne',
      dependencies: ['montant de rente', 'règles fiscales et sociales en vigueur'],
    },
  ],
  deces: [
    {
      title: 'Réversion',
      bullets: [
        'Réversion possible selon les clauses du régime.',
        'Le traitement des droits résiduels dépend des stipulations contractuelles.',
        'À confirmer selon la clause de réversion et le règlement applicable.',
      ],
      tags: ['reversion', 'droits_residuels'],
      confidence: 'moyenne',
      dependencies: ['clause de réversion', 'règlement du régime'],
    },
  ],
};

const ARTICLE_39_PM: ProductRules = {
  constitution: [
    {
      title: 'Cotisations (prestations définies — PM uniquement)',
      bullets: [
        'Cotisations exclusivement patronales : le salarié ne cotise pas.',
        'Cotisations déductibles du résultat imposable de l\'entreprise (IS ou IR).',
        'Ordonnance 2019-697 (nouvelle formule) : droits acquis conservés en cas de départ ; limités à 3 % du salaire/an, plafonnés à 30 points cumulés.',
        'À confirmer selon la formule applicable (ancienne avec condition de présence vs nouvelle post-2019).',
      ],
      tags: ['cotisations_patronales', 'prestations_definies'],
      confidence: 'moyenne',
      sources: [{ label: 'Ordonnance 2019-697 — Art. 39', url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038724818' }],
      dependencies: ['formule appliquée (ancienne vs post-2019)', 'catégorie de salariés visés'],
    },
  ],
  sortie: [
    {
      title: 'Sortie obligatoire en rente',
      bullets: [
        'Sortie uniquement en rente viagère — pas de capital possible.',
        'Rente imposable à l\'IR (abattement 10 %) + CSG 8,3 % + CRDS 0,5 % + CASA 0,3 %.',
        'Contribution sociale sur rentes élevées (L137-11-1 CSS) : 7 % sur la part > 500 €/mois, 14 % > 1 000 €/mois, 21 % > 24 000 €/mois.',
        'À confirmer selon le montant exact de la rente mensuelle.',
      ],
      tags: ['rente_obligatoire', 'bareme_ir', 'abattement_10', 'contribution_l137_11_1'],
      confidence: 'moyenne',
      sources: [{ label: 'L137-11-1 CSS — contribution sur rentes élevées', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038612991' }],
      dependencies: ['montant de la rente mensuelle'],
    },
  ],
  deces: [
    {
      title: 'Fin de vie / sortie de la PM',
      bullets: [
        'En cas de dissolution, liquidation ou cession de l\'entreprise, les engagements de retraite supplémentaire sont soldés selon le règlement du régime.',
        'Le traitement comptable et fiscal des engagements restants est arrêté à la clôture de la personne morale.',
        'À confirmer selon la formule du régime, les clauses de transfert et le régime fiscal IS/IR.',
      ],
      tags: ['fin_vie_pm', 'liquidation', 'cession_entreprise'],
      confidence: 'moyenne',
      dependencies: ['formule du régime appliquée', 'clauses de transfert des engagements', 'régime fiscal IS/IR'],
    },
  ],
};

const PERO_PP: ProductRules = {
  constitution: [
    {
      title: 'Cotisations obligatoires (PERO)',
      bullets: [
        'Dispositif collectif issu de la loi PACTE 2019, encadré par accord collectif.',
        'Cotisations obligatoires selon la catégorie de salariés visée.',
        'À confirmer selon l\'accord collectif et les paramètres du régime.',
      ],
      tags: ['pero', 'accord_collectif', 'cotisations_obligatoires'],
      confidence: 'moyenne',
      sources: [{ label: 'Loi PACTE 2019 — PERO', url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038496102' }],
      dependencies: ['accord collectif applicable', 'catégorie de salariés couverte'],
    },
  ],
  sortie: [
    {
      title: 'Sortie à la retraite',
      bullets: [
        'Sortie en capital ou en rente selon le compartiment et les options du régime.',
        'Fiscalité dépendante de la nature des versements et du mode de sortie.',
        'À confirmer selon le compartiment concerné et les règles en vigueur à la date de sortie.',
      ],
      tags: ['sortie_capital', 'sortie_rente', 'compartiment'],
      confidence: 'moyenne',
      dependencies: ['compartiment concerné', 'mode de sortie choisi', 'règles fiscales en vigueur'],
    },
  ],
  deces: [
    {
      title: 'Réversion',
      bullets: [
        'Réversion éventuelle selon les clauses du régime collectif.',
        'Le traitement des droits résiduels dépend des stipulations contractuelles.',
        'À confirmer selon les clauses de réversion prévues au régime.',
      ],
      tags: ['reversion', 'droits_residuels'],
      confidence: 'moyenne',
      dependencies: ['clauses de réversion du régime collectif'],
    },
  ],
};

const PERO_PM: ProductRules = {
  constitution: [
    {
      title: 'Cotisations obligatoires (PERO — successeur de l\'Art. 83, depuis PACTE 2019)',
      bullets: [
        'Cotisations patronales et salariales obligatoires définies par accord collectif.',
        'Cotisations patronales déductibles du résultat imposable de l\'entreprise (IS ou IR).',
        'Forfait social sur les cotisations patronales : 0 % si < 50 salariés, 16 % entre 50 et 250 salariés, 20 % au-delà. À confirmer selon les seuils exacts (source CSS).',
      ],
      tags: ['cotisations_patronales', 'cotisations_salariales', 'forfait_social'],
      confidence: 'moyenne',
      sources: [{ label: 'Loi PACTE 2019 — PERO', url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038496102' }],
      dependencies: ['effectif de l\'entreprise', 'seuils forfait social (source CSS à vérifier)'],
    },
  ],
  sortie: [
    {
      title: 'Sortie à la retraite',
      bullets: [
        'Sortie en capital ou en rente au choix (différent de l\'Art. 39 : la sortie en capital est possible).',
        'Rente imposable à l\'IR (abattement 10 %) + CSG 8,3 % + CRDS 0,5 % + CASA 0,3 %.',
        'Capital : partie obligatoire soumise au barème IR + PS 17,2 % sur les gains.',
        'À confirmer selon le compartiment et les conditions de l\'accord collectif.',
      ],
      tags: ['sortie_capital', 'sortie_rente', 'bareme_ir', 'abattement_10'],
      confidence: 'moyenne',
      sources: [{ label: 'Loi PACTE 2019 — PERO', url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038496102' }],
      dependencies: ['conditions de l\'accord collectif', 'compartiment de versement'],
    },
  ],
  deces: [
    {
      title: 'Fin de vie / sortie de la PM',
      bullets: [
        'En cas de dissolution, liquidation ou cession de l\'entreprise, les engagements PERO sont soldés ou transférés selon l\'accord collectif.',
        'Le traitement social, comptable et fiscal est arrêté lors de la clôture de la personne morale.',
        'À confirmer selon les dispositions de l\'accord collectif et les modalités de liquidation.',
      ],
      tags: ['fin_vie_pm', 'liquidation', 'cession_entreprise'],
      confidence: 'moyenne',
      dependencies: ['dispositions de l\'accord collectif', 'modalités de dissolution ou liquidation'],
    },
  ],
};

const PPV_INTERESSEMENT_PARTICIPATION_PM: ProductRules = {
  constitution: [
    {
      title: 'Mise en place (PM uniquement — dispositifs employeur)',
      bullets: [
        'PPV (Prime de Partage de la Valeur) : plafond d\'exonération de cotisations sociales 3 000 € / 6 000 € selon accord d\'intéressement — loi du 29 novembre 2023.',
        'Intéressement : accord collectif nécessaire, plafonné à 20 % de la masse salariale brute. Déductible du résultat imposable de l\'entreprise (IS ou IR).',
        'Participation : obligatoire > 50 salariés. Formule légale (RSP). Déductible du résultat.',
        'À confirmer selon l\'effectif, l\'accord et les exercices concernés.',
      ],
      tags: ['ppv', 'interessement', 'participation', 'pm_uniquement', 'deductible_is_ir'],
      confidence: 'moyenne',
      sources: [{ label: 'Loi 2023-1107 — PPV', url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000048327674' }],
      dependencies: ['effectif de l\'entreprise', 'accord collectif (intéressement/participation)', 'exercice de versement'],
    },
  ],
  sortie: [
    {
      title: 'Imposition des sommes reçues par le salarié',
      bullets: [
        'PPV : exonérée d\'IR pour les salariés dont la rémunération est < 3 SMIC (loi 2023 — À confirmer selon l\'année de versement).',
        'Intéressement / Participation bloqués sur PEE ou PER : exonérés d\'IR dans les plafonds légaux.',
        'Disponibles immédiatement (sans blocage) : imposables à l\'IR + PS 17,2 %.',
      ],
      tags: ['exoneration_ir', 'ps_17_2', 'pee'],
      confidence: 'moyenne',
      dependencies: ['modalité de versement (bloquée ou immédiate)', 'rémunération du salarié'],
    },
  ],
  deces: [
    {
      title: 'Fin de vie / sortie de la PM',
      bullets: [
        'En cas de dissolution, liquidation ou cession d\'activité, les dispositifs sont clôturés ou transférés selon les accords collectifs en vigueur.',
        'Le traitement social et fiscal des sommes en cours est régularisé à la date de clôture de la personne morale.',
        'À confirmer selon les accords collectifs et les modalités de liquidation retenues.',
      ],
      tags: ['fin_vie_pm', 'liquidation', 'accord_collectif'],
      confidence: 'moyenne',
      dependencies: ['accord collectif applicable', 'modalités de dissolution ou liquidation'],
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
        'PERP : déductibilité dans la limite du disponible épargne retraite (art. 163 quatervicies CGI ancien).',
        'Madelin retraite (TNS) : déductibilité selon l\'Article 154 bis CGI et l\'Article 154 bis-0 A — À confirmer selon les articles exacts applicables.',
      ],
      tags: ['ferme_souscription', 'transfert_per', 'deductible_ir', 'art_154_bis'],
      confidence: 'elevee',
      sources: [{ label: 'Art. 154 bis CGI (TNS Madelin retraite)', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041471860' }],
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
      confidence: 'elevee',
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
      confidence: 'elevee',
    },
  ],
};

export function getRetraiteRules(
  productId: string,
  audience: Audience,
): ProductRules | undefined {
  switch (productId) {
    case 'perin_assurance':
      return PERIN_ASSURANCE;
    case 'perin_bancaire':
      return PERIN_BANCAIRE;
    case 'pee_pp':
    case 'percol_pp':
    case 'perco_ancien_pp':
      return EPARGNE_SALARIALE_PEE_PP;
    case 'pee_pm':
    case 'percol_pm':
    case 'perco_ancien_pm':
      return EPARGNE_SALARIALE_PEE_PM;
    case 'pee':
    case 'percol':
    case 'perco_ancien':
      return audience === 'pm' ? EPARGNE_SALARIALE_PEE_PM : EPARGNE_SALARIALE_PEE_PP;
    case 'article_83_pp':
      return ARTICLE_83_PP;
    case 'article_83_pm':
      return ARTICLE_83_PM;
    case 'article_83':
      return audience === 'pm' ? ARTICLE_83_PM : ARTICLE_83_PP;
    case 'article_39_pp':
      return ARTICLE_39_PP;
    case 'article_39_pm':
      return ARTICLE_39_PM;
    case 'article_39':
      return audience === 'pm' ? ARTICLE_39_PM : ARTICLE_39_PP;
    case 'pero_pp':
      return PERO_PP;
    case 'pero_pm':
      return PERO_PM;
    case 'pero':
      return audience === 'pm' ? PERO_PM : PERO_PP;
    case 'ppv_prime_partage_valeur':
    case 'interessement':
    case 'participation':
      return audience === 'pm' ? PPV_INTERESSEMENT_PARTICIPATION_PM : undefined;
    case 'perp_ancien':
    case 'madelin_retraite_ancien':
      return PERP_MADELIN_ANCIEN;
    default:
      return undefined;
  }
}
