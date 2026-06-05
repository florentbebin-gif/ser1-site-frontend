import type { ProductRules } from '../../types';

export const EPARGNE_SALARIALE_PEE_PP: ProductRules = {
  constitution: [
    {
      title: 'Versements',
      bullets: [
        "Alimenté par la participation, l'intéressement, les versements volontaires du salarié et l'abondement employeur.",
        'Versements volontaires du salarié : plafond de 25 % de la rémunération annuelle brute.',
        "Intéressement et participation affectés au PEE : exonérés d'IR dans la limite des plafonds légaux.",
      ],
      tags: ['participation', 'interessement', 'abondement', 'plafond_25pct'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. L3332-10 Code du travail — PEE versements',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006902719',
        },
      ],
    },
  ],
  sortie: [
    {
      title: 'Avant 5 ans — Blocage',
      bullets: [
        'Les sommes sont bloquées pendant 5 ans (sauf cas de déblocage anticipé légaux).',
        "Déblocage anticipé : achat résidence principale, mariage/PACS, naissance, divorce, invalidité, décès, départ de l'entreprise, liquidation judiciaire.",
      ],
      tags: ['blocage_5_ans', 'deblocage_anticipe'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Service-Public — épargne salariale PEE',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F2142',
        },
      ],
    },
    {
      title: 'Après 5 ans',
      bullets: [
        "Plus-values exonérées d'IR.",
        'Prélèvements sociaux ({psException}) dus sur les gains.',
      ],
      tags: ['exoneration_ir', 'ps'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. L3332-25 Code du travail — PEE sortie',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006902745',
        },
      ],
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
      sources: [
        {
          label: 'Service-Public — épargne salariale PEE',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F2142',
        },
      ],
    },
  ],
};

export const ARTICLE_83_PP: ProductRules = {
  constitution: [
    {
      title: 'Cotisations (anciens contrats — fermés à la souscription depuis PACTE 2019)',
      bullets: [
        "Cotisations patronales et salariales définies par l'accord collectif.",
        "Cotisations patronales déductibles du résultat imposable de l'employeur selon le régime fiscal applicable.",
        'Plafond de déduction salarié : 8 % de la rémunération annuelle brute plafonnée à 8 PASS.',
        "À confirmer selon les conditions de l'accord et la date d'ouverture du contrat.",
      ],
      tags: ['cotisations_patronales', 'cotisations_salariales', 'plafond_8pct_8pass'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Art. 83 CGI (ancien)',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006302860',
        },
      ],
      dependencies: ['accord collectif applicable', "date d'ouverture du contrat"],
    },
  ],
  sortie: [
    {
      title: 'Sortie à la retraite',
      bullets: [
        'Sortie en rente viagère principalement ; capital possible via transfert vers PER (loi PACTE 2019).',
        "Rente imposable à l'IR (abattement 10 %) + prélèvements sociaux sur rentes (À confirmer selon les taux CSS en vigueur).",
        "À confirmer selon les conditions du contrat et l'option de transfert vers PER.",
      ],
      tags: ['rente_viagere', 'bareme_ir', 'abattement_10'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Loi PACTE 2019 — transfert vers PER',
          url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038496102',
        },
        {
          label: 'Art. L136-1 CSS — CSG sur rentes',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006742737',
        },
      ],
      dependencies: ["conditions de l'accord collectif", 'option de transfert vers PER exercée'],
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
      sources: [
        {
          label: 'Art. 83 CGI (ancien)',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006302860',
        },
      ],
      dependencies: ['clause de réversion prévue au contrat collectif'],
    },
  ],
};

export const ARTICLE_39_PP: ProductRules = {
  constitution: [
    {
      title: 'Cotisations (prestations définies)',
      bullets: [
        'Dispositif collectif de retraite supplémentaire à prestations définies, encadré par le règlement du régime.',
        'Les droits du bénéficiaire dépendent de la formule applicable (historique vs post-2019).',
        "À confirmer selon les clauses du règlement et la date d'acquisition des droits.",
      ],
      tags: ['prestations_definies', 'reglement_regime'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Ordonnance 2019-697 — Art. 39',
          url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038724818',
        },
      ],
      dependencies: ['règlement du régime', "date d'acquisition des droits"],
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
      sources: [
        {
          label: 'L137-11-1 CSS — contribution sur rentes élevées',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038612991',
        },
      ],
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
      sources: [
        {
          label: 'Ordonnance 2019-697 — Art. 39',
          url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038724818',
        },
      ],
      dependencies: ['clause de réversion', 'règlement du régime'],
    },
  ],
};

export const PERO_PP: ProductRules = {
  constitution: [
    {
      title: 'Cotisations obligatoires (PERO)',
      bullets: [
        'Dispositif collectif issu de la loi PACTE 2019, encadré par accord collectif.',
        'Cotisations obligatoires selon la catégorie de salariés visée.',
        "À confirmer selon l'accord collectif et les paramètres du régime.",
      ],
      tags: ['pero', 'accord_collectif', 'cotisations_obligatoires'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Loi PACTE 2019 — PERO',
          url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038496102',
        },
      ],
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
      sources: [
        {
          label: 'Service-Public — PER d’entreprise obligatoire',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F36526/2',
        },
      ],
      dependencies: [
        'compartiment concerné',
        'mode de sortie choisi',
        'règles fiscales en vigueur',
      ],
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
      sources: [
        {
          label: 'Service-Public — PER d’entreprise obligatoire',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F36526/2',
        },
      ],
      dependencies: ['clauses de réversion du régime collectif'],
    },
  ],
};
