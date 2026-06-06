import type { ProductRules } from '../../types';

export const EPARGNE_SALARIALE_PEE_PM: ProductRules = {
  constitution: [
    {
      title: "Dispositifs collectifs d'épargne salariale",
      bullets: [
        'Mise en place par accord collectif (participation, intéressement, abondement, versements volontaires selon le plan).',
        "Les versements de l'entreprise sont traités en charges déductibles du résultat (IS/IR) sous conditions légales.",
        "À confirmer selon l'accord collectif, l'effectif et les plafonds applicables.",
      ],
      tags: ['epargne_salariale', 'accord_collectif', 'charges_deductibles'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Service-Public — épargne salariale PEE',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F2142',
        },
      ],
      dependencies: [
        'accord collectif en vigueur',
        "effectif de l'entreprise",
        'plafonds légaux applicables',
      ],
    },
  ],
  sortie: [
    {
      title: 'Disponibilité des avoirs',
      bullets: [
        "Les modalités de sortie dépendent du plan (PEE/PERCOL/PERCO), des clauses d'accord et des cas de déblocage anticipé autorisés.",
        "Les flux financiers et sociaux sont appréciés au niveau de l'entreprise et des bénéficiaires selon la nature des versements.",
        "À confirmer selon l'accord applicable et l'année de versement.",
      ],
      tags: ['modalites_sortie', 'deblocage_anticipe', 'accord_collectif'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Service-Public — épargne salariale PEE',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F2142',
        },
      ],
      dependencies: ['type de plan', 'accord collectif applicable', 'année de versement'],
    },
  ],
  deces: [
    {
      title: 'Fin de vie / sortie de la PM',
      bullets: [
        "En cas de dissolution, liquidation ou cession de l'activité, les dispositifs d'épargne salariale sont clôturés ou transférés selon les accords en vigueur.",
        'Le traitement social, fiscal et comptable des engagements restants est arrêté à la date de cessation de la personne morale.',
        "À confirmer selon les modalités de liquidation, de transfert des engagements et le régime fiscal de l'entreprise.",
      ],
      tags: ['fin_vie_pm', 'liquidation', 'cession_activite'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Entreprendre.Service-Public — participation',
          url: 'https://entreprendre.service-public.fr/vosdroits/F2141',
        },
      ],
      dependencies: [
        'modalités de dissolution ou liquidation',
        'accord collectif en vigueur',
        "régime fiscal de l'entreprise",
      ],
    },
  ],
};

export const ARTICLE_83_PM: ProductRules = {
  constitution: [
    {
      title: 'Cotisations (PM)',
      bullets: [
        'Cotisations patronales et salariales définies par accord collectif.',
        "Cotisations patronales déductibles du résultat imposable de l'entreprise (IS ou IR).",
        "À confirmer selon les conditions de l'accord et la catégorie de salariés couverte.",
      ],
      tags: ['cotisations_patronales', 'cotisations_salariales', 'accord_collectif'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Art. 83 CGI (ancien)',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006302860',
        },
      ],
      dependencies: ['accord collectif applicable', 'catégorie de salariés couverte'],
    },
  ],
  sortie: [
    {
      title: 'Sortie des engagements',
      bullets: [
        "Les flux sont traités selon l'accord collectif et les modalités de sortie (rente, transfert, liquidation des droits).",
        'Le traitement social et fiscal dépend de la structure des cotisations et des régimes applicables.',
        "À confirmer selon les clauses d'accord, les transferts opérés et la période concernée.",
      ],
      tags: ['sortie_engagements', 'accord_collectif', 'traitement_social_fiscal'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Art. 83 CGI (ancien)',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006302860',
        },
      ],
      dependencies: ["clauses de l'accord collectif", 'modalités de sortie', 'période concernée'],
    },
  ],
  deces: [
    {
      title: 'Fin de vie / sortie de la PM',
      bullets: [
        "En cas de dissolution, liquidation ou cession de l'entreprise, les engagements Article 83 sont soldés ou transférés selon le cadre conventionnel.",
        'Le traitement comptable et fiscal est apprécié à la clôture de la personne morale selon le régime IS/IR.',
        "À confirmer selon les modalités de liquidation et les obligations prévues par l'accord collectif.",
      ],
      tags: ['fin_vie_pm', 'liquidation', 'cession_entreprise'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Art. 83 CGI (ancien)',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006302860',
        },
      ],
      dependencies: [
        'modalités de dissolution ou liquidation',
        'clauses de transfert des engagements',
        'régime fiscal IS/IR',
      ],
    },
  ],
};

export const ARTICLE_39_PM: ProductRules = {
  constitution: [
    {
      title: 'Cotisations (prestations définies — PM uniquement)',
      bullets: [
        'Cotisations exclusivement patronales : le salarié ne cotise pas.',
        "Cotisations déductibles du résultat imposable de l'entreprise (IS ou IR).",
        'Ordonnance 2019-697 (nouvelle formule) : droits acquis conservés en cas de départ, avec plafonnement annuel et cumulé — À confirmer selon les paramètres exacts du régime.',
        'À confirmer selon la formule applicable (ancienne avec condition de présence vs nouvelle post-2019).',
      ],
      tags: ['cotisations_patronales', 'prestations_definies'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Ordonnance 2019-697 — Art. 39',
          url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038724818',
        },
      ],
      dependencies: ['formule appliquée (ancienne vs post-2019)', 'catégorie de salariés visés'],
    },
  ],
  sortie: [
    {
      title: 'Sortie obligatoire en rente',
      bullets: [
        'Sortie uniquement en rente viagère — pas de capital possible.',
        "Rente imposable à l'IR (abattement 10 %) + prélèvements sociaux sur rentes (À confirmer selon les taux CSS en vigueur).",
        'Contribution sociale sur rentes élevées (L137-11-1 CSS) : taux progressifs selon le montant mensuel — À confirmer selon la rente exacte.',
        'À confirmer selon le montant exact de la rente mensuelle.',
      ],
      tags: ['rente_obligatoire', 'bareme_ir', 'abattement_10', 'contribution_l137_11_1'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'L137-11-1 CSS — contribution sur rentes élevées',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038612991',
        },
      ],
      dependencies: ['montant de la rente mensuelle'],
    },
  ],
  deces: [
    {
      title: 'Fin de vie / sortie de la PM',
      bullets: [
        "En cas de dissolution, liquidation ou cession de l'entreprise, les engagements de retraite supplémentaire sont soldés selon le règlement du régime.",
        'Le traitement comptable et fiscal des engagements restants est arrêté à la clôture de la personne morale.',
        'À confirmer selon la formule du régime, les clauses de transfert et le régime fiscal IS/IR.',
      ],
      tags: ['fin_vie_pm', 'liquidation', 'cession_entreprise'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Ordonnance 2019-697 — Art. 39',
          url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038724818',
        },
      ],
      dependencies: [
        'formule du régime appliquée',
        'clauses de transfert des engagements',
        'régime fiscal IS/IR',
      ],
    },
  ],
};

export const PERO_PM: ProductRules = {
  constitution: [
    {
      title: "Cotisations obligatoires (PERO — successeur de l'Art. 83, depuis PACTE 2019)",
      bullets: [
        'Cotisations patronales et salariales obligatoires définies par accord collectif.',
        "Cotisations patronales déductibles du résultat imposable de l'entreprise (IS ou IR).",
        "Forfait social sur les cotisations patronales : taux variable selon l'effectif de l'entreprise — À confirmer selon les seuils CSS en vigueur.",
      ],
      tags: ['cotisations_patronales', 'cotisations_salariales', 'forfait_social'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Loi PACTE 2019 — PERO',
          url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038496102',
        },
      ],
      dependencies: ["effectif de l'entreprise", 'seuils de forfait social applicables'],
    },
  ],
  sortie: [
    {
      title: 'Sortie à la retraite',
      bullets: [
        "Sortie en capital ou en rente au choix (différent de l'Art. 39 : la sortie en capital est possible).",
        "Rente imposable à l'IR (abattement 10 %) + prélèvements sociaux sur rentes (À confirmer selon les taux CSS en vigueur).",
        'Capital : partie obligatoire soumise au barème IR + {psException} sur les gains.',
        "À confirmer selon le compartiment et les conditions de l'accord collectif.",
      ],
      tags: ['sortie_capital', 'sortie_rente', 'bareme_ir', 'abattement_10'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Loi PACTE 2019 — PERO',
          url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038496102',
        },
      ],
      dependencies: ["conditions de l'accord collectif", 'compartiment de versement'],
    },
  ],
  deces: [
    {
      title: 'Fin de vie / sortie de la PM',
      bullets: [
        "En cas de dissolution, liquidation ou cession de l'entreprise, les engagements PERO sont soldés ou transférés selon l'accord collectif.",
        'Le traitement social, comptable et fiscal est arrêté lors de la clôture de la personne morale.',
        "À confirmer selon les dispositions de l'accord collectif et les modalités de liquidation.",
      ],
      tags: ['fin_vie_pm', 'liquidation', 'cession_entreprise'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Service-Public — PER d’entreprise obligatoire',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F36526/2',
        },
      ],
      dependencies: [
        "dispositions de l'accord collectif",
        'modalités de dissolution ou liquidation',
      ],
    },
  ],
};

export const PPV_INTERESSEMENT_PARTICIPATION_PM: ProductRules = {
  constitution: [
    {
      title: 'Mise en place (PM uniquement — dispositifs employeur)',
      bullets: [
        "PPV (Prime de Partage de la Valeur) : exonération de cotisations sociales dans les plafonds légaux selon accord d'intéressement (loi 2023 — À confirmer selon l'exercice de versement).",
        'Intéressement : accord collectif nécessaire, plafonné selon la masse salariale brute. Déductible du résultat imposable (IS ou IR) — À confirmer selon les plafonds en vigueur.',
        "Participation : obligatoire au-delà d'un seuil d'effectif. Formule légale (RSP). Déductible du résultat — À confirmer selon l'effectif et l'accord.",
        "À confirmer selon l'effectif, l'accord et les exercices concernés.",
      ],
      tags: ['ppv', 'interessement', 'participation', 'pm_uniquement', 'deductible_is_ir'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Loi 2023-1107 — PPV',
          url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000048327674',
        },
      ],
      dependencies: [
        "effectif de l'entreprise",
        'accord collectif (intéressement/participation)',
        'exercice de versement',
      ],
    },
  ],
  sortie: [
    {
      title: 'Imposition des sommes reçues par le salarié',
      bullets: [
        "PPV : exonérée d'IR pour les salariés dont la rémunération est < 3 SMIC (loi 2023 — À confirmer selon l'année de versement).",
        "Intéressement / Participation bloqués sur PEE ou PER : exonérés d'IR dans les plafonds légaux.",
        "Disponibles immédiatement (sans blocage) : imposables à l'IR + {psException}.",
      ],
      tags: ['exoneration_ir', 'ps', 'pee'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Service-Public — prime de partage de la valeur',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F35235',
        },
      ],
      dependencies: ['modalité de versement (bloquée ou immédiate)', 'rémunération du salarié'],
    },
  ],
  deces: [
    {
      title: 'Fin de vie / sortie de la PM',
      bullets: [
        "En cas de dissolution, liquidation ou cession d'activité, les dispositifs sont clôturés ou transférés selon les accords collectifs en vigueur.",
        'Le traitement social et fiscal des sommes en cours est régularisé à la date de clôture de la personne morale.',
        'À confirmer selon les accords collectifs et les modalités de liquidation retenues.',
      ],
      tags: ['fin_vie_pm', 'liquidation', 'accord_collectif'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Entreprendre.Service-Public — participation',
          url: 'https://entreprendre.service-public.fr/vosdroits/F2141',
        },
      ],
      dependencies: ['accord collectif applicable', 'modalités de dissolution ou liquidation'],
    },
  ],
};
