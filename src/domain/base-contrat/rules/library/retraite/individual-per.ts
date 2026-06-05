import type { ProductRules } from '../../types';

export const PERIN_ASSURANCE: ProductRules = {
  constitution: [
    {
      title: 'Versements et déductibilité',
      bullets: [
        'Versements volontaires libres ou programmés (pas de plafond légal spécifique).',
        "Déductibilité de l'IR dans la limite du disponible épargne retraite : environ 10 % des revenus professionnels N-1, plafonné à 8 PASS (montant révisé chaque année — À confirmer selon l'avis d'imposition N-1).",
        "TNS : déductibilité également couverte par l'art. 154 bis CGI (Madelin) pour les versements dans le compartiment Madelin du PER.",
        "Abondement employeur et transferts depuis d'anciens produits (PERP, Madelin, PERCO…) possibles.",
      ],
      tags: ['deductible_ir', 'plafond_per', 'pass', 'art_154_bis'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Art. 163 quatervicies CGI',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042912048',
        },
        {
          label: 'Art. 154 bis CGI (TNS)',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041471860',
        },
      ],
      dependencies: ['source officielle ou contractuelle applicable'],
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
      sources: [
        {
          label: 'Service-Public — PER individuel',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F36526/0',
        },
      ],
    },
  ],
  sortie: [
    {
      title: 'Sortie à la retraite — Compartiment déductible',
      bullets: [
        'Sortie en capital ou en rente viagère (au choix depuis la loi PACTE 2019).',
        "Capital : totalité soumise au barème progressif de l'IR + {psException} sur les seuls gains.",
        'Rente : soumise au barème IR avec abattement de 10 % (régime rentes viagères à titre gratuit).',
      ],
      tags: ['sortie_capital', 'sortie_rente', 'bareme_ir', 'ps'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Loi PACTE 2019 — PER',
          url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038496102',
        },
      ],
    },
    {
      title: 'Sortie à la retraite — Compartiment non déductible',
      bullets: [
        "Capital : exonéré d'IR ; seuls les gains sont soumis aux prélèvements sociaux ({psException}).",
        "Rente : régime des rentes viagères à titre onéreux (fraction imposable selon l'âge au premier versement).",
      ],
      tags: ['exoneration_capital', 'rente_titre_onereux'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 158-6 CGI — rentes viagères à titre onéreux',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033810417',
        },
      ],
    },
    {
      title: 'Déblocage anticipé autorisé',
      bullets: [
        'Décès du conjoint ou partenaire de PACS.',
        'Invalidité de 2e ou 3e catégorie (titulaire, conjoint ou enfant).',
        "Expiration des droits à l'assurance chômage.",
        'Situation de surendettement ou liquidation judiciaire.',
        'Acquisition de la résidence principale.',
      ],
      tags: ['deblocage_anticipe', 'residence_principale'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Service-Public — PER individuel',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F36526/0',
        },
      ],
    },
  ],
  deces: [
    {
      title: 'Avant 70 ans — fiscalité assurance-vie (art. 990 I CGI)',
      bullets: [
        'Abattement de {assuranceVie990IAllowance} désigné.',
        'Au-delà : {assuranceVie990IRates}.',
        'Capital hors succession pour les bénéficiaires désignés.',
      ],
      tags: ['art_990_i_cgi', 'abattement_990_i', 'hors_succession'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 990 I CGI',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038612905',
        },
      ],
    },
    {
      title: 'Après 70 ans',
      bullets: [
        'Abattement global de {assuranceVie757BAllowance} (art. 757 B CGI).',
        'Au-delà : intégration aux droits de succession selon le lien de parenté.',
        'Gains capitalisés exonérés de droits.',
      ],
      tags: ['art_757_b_cgi', 'abattement_757_b'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 757 B CGI',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006310172',
        },
      ],
    },
  ],
};

export const PERIN_BANCAIRE: ProductRules = {
  constitution: [
    {
      title: 'Versements et déductibilité',
      bullets: [
        'Mêmes règles que le PERIN assurantiel : déductibilité dans la limite du disponible épargne retraite.',
        'Supports : fonds diversifiés (pas de fonds euros garanti, contrairement à la version assurantielle).',
      ],
      tags: ['deductible_ir', 'plafond_per'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Service-Public — PER individuel',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F36526/0',
        },
      ],
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
      sources: [
        {
          label: 'Service-Public — PER individuel',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F36526/0',
        },
      ],
    },
    {
      title: 'Déblocage anticipé autorisé',
      bullets: ['Mêmes cas de déblocage que le PERIN assurantiel.'],
      tags: ['deblocage_anticipe'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Service-Public — PER individuel',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F36526/0',
        },
      ],
    },
  ],
  deces: [
    {
      title: 'Intégration dans la succession',
      bullets: [
        'Contrairement au PERIN assurantiel, le PERIN bancaire intègre la succession classique.',
        "Pas d'avantage hors-succession : droits de mutation selon le barème et le lien de parenté.",
        'Abattements légaux classiques selon le lien de parenté (art. 779 CGI).',
      ],
      tags: ['dmtg_classique', 'succession_active'],
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

export const PERP_MADELIN_ANCIEN: ProductRules = {
  constitution: [
    {
      title: 'Versements (anciens contrats — plus ouverts à la souscription)',
      bullets: [
        'Ces produits ne sont plus ouverts à la souscription depuis la loi PACTE (2019).',
        'Les contrats existants continuent à fonctionner et peuvent être transférés vers un PER.',
        'PERP : déductibilité dans la limite du disponible épargne retraite (art. 163 quatervicies CGI ancien).',
        "Madelin retraite (TNS) : déductibilité selon l'Article 154 bis CGI et l'Article 154 bis-0 A — À confirmer selon les articles exacts applicables.",
      ],
      tags: ['ferme_souscription', 'transfert_per', 'deductible_ir', 'art_154_bis'],
      confidence: 'moyenne',
      sources: [
        {
          label: 'Art. 154 bis CGI (TNS Madelin retraite)',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041471860',
        },
      ],
      dependencies: ['source officielle ou contractuelle applicable'],
    },
  ],
  sortie: [
    {
      title: 'Sortie à la retraite',
      bullets: [
        'Sortie principalement en rente viagère pour le PERP (option capital partielle possible, limitée par les conditions contractuelles).',
        "Rente imposable à l'IR (régime rentes viagères à titre gratuit, abattement 10 %).",
        'Transfert vers un PER possible pour bénéficier de la sortie en capital totale.',
      ],
      tags: ['rente_viagere', 'transfert_per', 'abattement_10'],
      confidence: 'elevee',
      sources: [
        {
          label: 'Art. 163 quatervicies CGI — PERP/Madelin sortie rente',
          url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006302851',
        },
      ],
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
      sources: [
        {
          label: 'Service-Public — PERP',
          url: 'https://www.service-public.fr/particuliers/vosdroits/F10259',
        },
      ],
    },
  ],
};
