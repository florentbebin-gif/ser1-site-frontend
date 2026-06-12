import type { MementoEntry } from './types';

export const PER_INDIVIDUEL_CLAIMS = [
  'base-contrat-perin-assurance-pp-constitution-versements-et-deductibilite',
  'base-contrat-perin-assurance-pp-constitution-compartiments-de-versements',
  'base-contrat-perin-assurance-pp-sortie-sortie-a-la-retraite-compartiment-deductible',
  'base-contrat-perin-assurance-pp-sortie-sortie-a-la-retraite-compartiment-non-deductible',
  'base-contrat-perin-assurance-pp-sortie-deblocage-anticipe-autorise',
  'base-contrat-perin-assurance-pp-deces-avant-70-ans-fiscalite-assurance-vie-art-990-i-cgi',
  'base-contrat-perin-assurance-pp-deces-apres-70-ans',
  'base-contrat-perin-bancaire-pp-constitution-versements-et-deductibilite',
  'base-contrat-perin-bancaire-pp-sortie-sortie-a-la-retraite',
  'base-contrat-perin-bancaire-pp-sortie-deblocage-anticipe-autorise',
  'base-contrat-perin-bancaire-pp-deces-integration-dans-la-succession',
] as const;

export const ARTICLE_83_PERO_CLAIMS = [
  'base-contrat-article-83-pp-pp-constitution-cotisations-anciens-contrats-fermes-a-la-souscription-depuis-pacte-2019',
  'base-contrat-article-83-pp-pp-sortie-sortie-a-la-retraite',
  'base-contrat-article-83-pp-pp-deces-reversion',
  'base-contrat-article-83-pm-pm-constitution-cotisations-pm',
  'base-contrat-article-83-pm-pm-sortie-sortie-des-engagements',
  'base-contrat-article-83-pm-pm-deces-fin-de-vie-sortie-de-la-pm',
  'base-contrat-pero-pp-pp-constitution-cotisations-obligatoires-pero',
  'base-contrat-pero-pp-pp-sortie-sortie-a-la-retraite',
  'base-contrat-pero-pp-pp-deces-reversion',
  'base-contrat-pero-pm-pm-constitution-cotisations-obligatoires-pero-successeur-de-l-art-83-depuis-pacte-2019',
  'base-contrat-pero-pm-pm-sortie-sortie-a-la-retraite',
  'base-contrat-pero-pm-pm-deces-fin-de-vie-sortie-de-la-pm',
] as const;

export const MADELIN_RETRAITE_CLAIMS = [
  'base-contrat-madelin-retraite-ancien-pp-constitution-versements-anciens-contrats-plus-ouverts-a-la-souscription',
  'base-contrat-madelin-retraite-ancien-pp-sortie-sortie-a-la-retraite',
  'base-contrat-madelin-retraite-ancien-pp-deces-reversion',
] as const;

export const EPARGNE_SALARIALE_RETRAITE_CLAIMS = [
  'base-contrat-percol-pp-pp-constitution-versements',
  'base-contrat-percol-pp-pp-sortie-avant-5-ans-blocage',
  'base-contrat-percol-pp-pp-sortie-apres-5-ans',
  'base-contrat-percol-pp-pp-deces-deblocage-et-succession',
  'base-contrat-percol-pm-pm-constitution-dispositifs-collectifs-d-epargne-salariale',
  'base-contrat-percol-pm-pm-sortie-disponibilite-des-avoirs',
  'base-contrat-percol-pm-pm-deces-fin-de-vie-sortie-de-la-pm',
  'base-contrat-perco-ancien-pp-pp-constitution-versements',
  'base-contrat-perco-ancien-pp-pp-sortie-avant-5-ans-blocage',
  'base-contrat-perco-ancien-pp-pp-sortie-apres-5-ans',
  'base-contrat-perco-ancien-pp-pp-deces-deblocage-et-succession',
  'base-contrat-perco-ancien-pm-pm-constitution-dispositifs-collectifs-d-epargne-salariale',
  'base-contrat-perco-ancien-pm-pm-sortie-disponibilite-des-avoirs',
  'base-contrat-perco-ancien-pm-pm-deces-fin-de-vie-sortie-de-la-pm',
] as const;

export const FISCALITE_SORTIE_RETRAITE_CLAIMS = [
  'abat10-pensions-current',
  'retirement-thresholds-current',
  'retirement-current-brackets',
  'base-contrat-perin-assurance-pp-sortie-sortie-a-la-retraite-compartiment-deductible',
  'base-contrat-perin-assurance-pp-sortie-sortie-a-la-retraite-compartiment-non-deductible',
  'base-contrat-perin-bancaire-pp-sortie-sortie-a-la-retraite',
] as const;

export const MEMENTO_EPARGNE_RETRAITE_ENTRIES = [
  {
    chapterId: 'epargne-retraite',
    key: 'epargne-retraite.base-cg-retraite',
    label: 'Base CG retraite',
    description:
      'Référentiel de contrats retraite et de documents contractuels utilisé pour comparer les produits transférables.',
    status: 'partiel',
    statusReason:
      'La page Base CG retraite et ses tables Supabase sont actives ; les règles fiscales restent portées par les claims PER et Base-Contrat.',
    priority: 'structurant',
    ownerPagePath: '/settings/base-contrat-retraite',
    registryKeys: [],
    claimKeys: [],
    refIds: ['cmf-l224-1', 'cmf-l224-40', 'cgi-154-bis', 'cgi-163-quatervicies'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['per', 'per-transfert'],
  },
  {
    chapterId: 'epargne-retraite',
    key: 'epargne-retraite.per-individuel',
    label: 'PER individuel',
    description:
      'Plan d’épargne retraite individuel : versements, compartiments, sorties et décès, avec articulation IR et contrat.',
    status: 'couvert',
    statusReason:
      'Les simulateurs PER actifs consomment un ruleset centralisé et les claims Base-Contrat PERIN qualifient les blocs produit nécessaires au mémento.',
    priority: 'critique',
    ownerPagePath: '/settings/base-contrat',
    registryKeys: ['placements.per-individuel'],
    claimKeys: PER_INDIVIDUEL_CLAIMS,
    refIds: [
      'cmf-l224-1',
      'cmf-l224-40',
      'cgi-154-bis',
      'cgi-163-quatervicies',
      'base-source-service-public-per-individuel',
      'base-source-art-163-quatervicies-cgi',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['per', 'per-potentiel', 'per-transfert'],
  },
  {
    chapterId: 'epargne-retraite',
    key: 'epargne-retraite.per-potentiel',
    label: 'Potentiel PER',
    description:
      'Analyse du potentiel de versement retraite en lien avec l’IR, les pensions et les règles PER individuelles.',
    status: 'couvert',
    statusReason:
      'Le simulateur actif est rattaché aux settings IR et au ruleset PER centralisé ; les claims d’abattement pensions et PERIN cadrent la fiscalité consommée.',
    priority: 'critique',
    ownerPagePath: '/settings/memento',
    registryKeys: [
      'impots.ir.bareme',
      'impots.ir.abattements-et-decote',
      'placements.per-individuel',
    ],
    claimKeys: [
      'abat10-pensions-current',
      'base-contrat-perin-assurance-pp-constitution-versements-et-deductibilite',
      'base-contrat-perin-bancaire-pp-constitution-versements-et-deductibilite',
    ],
    refIds: ['boi-rsa-pens-30-10-10', 'cgi-154-bis', 'cgi-163-quatervicies'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['per-potentiel', 'per'],
  },
  {
    chapterId: 'epargne-retraite',
    key: 'epargne-retraite.per-transfert',
    label: 'Transfert PER',
    description:
      'Comparaison et transfert de contrats retraite, avec lecture contractuelle et fiscalité de sortie retraite.',
    status: 'couvert',
    statusReason:
      'Le simulateur transfert PER actif est couvert par Base CG retraite, les claims PERIN et les réglages de prélèvements sociaux retraite.',
    priority: 'critique',
    ownerPagePath: '/settings/base-contrat-retraite',
    registryKeys: ['placements.per-individuel', 'retraite-prevoyance.ps-retraite'],
    claimKeys: [
      'retirement-current-brackets',
      'base-contrat-perin-assurance-pp-sortie-sortie-a-la-retraite-compartiment-deductible',
      'base-contrat-perin-assurance-pp-sortie-sortie-a-la-retraite-compartiment-non-deductible',
      'base-contrat-perin-bancaire-pp-sortie-sortie-a-la-retraite',
      'base-contrat-perin-assurance-pp-sortie-deblocage-anticipe-autorise',
      'base-contrat-perin-bancaire-pp-sortie-deblocage-anticipe-autorise',
    ],
    refIds: [
      'cmf-l224-1',
      'cmf-l224-40',
      'css-l136-8',
      'base-source-art-158-6-cgi-rentes-viageres-a-titre-onereux',
      'base-source-service-public-per-individuel',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['per-transfert', 'per'],
  },
  {
    chapterId: 'epargne-retraite',
    key: 'epargne-retraite.article-83-pero',
    label: 'Article 83 et PER obligatoire',
    description:
      'Anciens contrats article 83 et PER obligatoires d’entreprise, à distinguer du PER individuel et du PERCOL.',
    status: 'partiel',
    statusReason:
      'Les claims Base-Contrat qualifient les blocs article 83 et PERO ; SER1 ne livre pas de moteur dédié à ces contrats collectifs.',
    priority: 'structurant',
    ownerPagePath: '/settings/base-contrat',
    registryKeys: [],
    claimKeys: ARTICLE_83_PERO_CLAIMS,
    refIds: [
      'base-source-art-83-cgi-ancien',
      'base-source-art-l136-1-css-csg-sur-rentes',
      'base-source-service-public-per-d-entreprise-obligatoire',
      'cmf-l224-1',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['per', 'per-transfert'],
  },
  {
    chapterId: 'epargne-retraite',
    key: 'epargne-retraite.madelin',
    label: 'Madelin retraite',
    description:
      'Anciens contrats Madelin retraite des travailleurs non salariés, à relier aux versements et sorties retraite.',
    status: 'partiel',
    statusReason:
      'Les claims Base-Contrat et références CGI qualifient le cadrage ; aucun parcours dédié Madelin n’est livré hors simulateurs PER existants.',
    priority: 'structurant',
    ownerPagePath: '/settings/base-contrat',
    registryKeys: ['placements.per-individuel'],
    claimKeys: MADELIN_RETRAITE_CLAIMS,
    refIds: [
      'cgi-154-bis',
      'base-source-art-154-bis-cgi-tns-madelin-retraite',
      'base-source-art-163-quatervicies-cgi-perp-madelin-sortie-rente',
      'base-source-service-public-perp',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['per-potentiel', 'per'],
  },
  {
    chapterId: 'epargne-retraite',
    key: 'epargne-retraite.epargne-salariale-retraite',
    label: 'Épargne salariale retraite',
    description:
      'PERCOL, anciens PERCO, intéressement, participation et plans d’épargne salariés reliés aux contrats retraite collectifs.',
    status: 'partiel',
    statusReason:
      'Les claims Base-Contrat PERCOL/PERCO complètent l’entrée société ; le simulateur épargne salariale reste placeholder et aucun moteur n’est activé.',
    priority: 'structurant',
    ownerPagePath: '/settings/base-contrat',
    registryKeys: ['placements.epargne-salariale'],
    claimKeys: EPARGNE_SALARIALE_RETRAITE_CLAIMS,
    refIds: [
      'code-travail-l3312-1',
      'code-travail-l3332-1',
      'base-source-art-l3332-10-code-du-travail-pee-versements',
      'base-source-art-l3332-25-code-du-travail-pee-sortie',
      'base-source-service-public-epargne-salariale-pee',
      'base-source-entreprendre-service-public-participation',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['epargne-salariale', 'per'],
  },
  {
    chapterId: 'epargne-retraite',
    key: 'epargne-retraite.fiscalite-sortie-retraite',
    label: 'Fiscalité de sortie retraite',
    description:
      'Lecture fiscale des pensions, rentes, sorties PER et prélèvements sociaux retraite, sans recalcul dans le mémento.',
    status: 'partiel',
    statusReason:
      'Les claims IR et prélèvements sociaux retraite sont administrés ; la doctrine de sortie PER reste rattachée aux blocs Base-Contrat plutôt qu’à un moteur fiscal séparé.',
    priority: 'critique',
    ownerPagePath: '/settings/memento',
    registryKeys: [
      'impots.ir.abattements-et-decote',
      'retraite-prevoyance.ps-retraite',
      'retraite-prevoyance.seuils-rfr',
    ],
    claimKeys: FISCALITE_SORTIE_RETRAITE_CLAIMS,
    refIds: [
      'boi-rsa-pens-30-10-10',
      'css-l136-8',
      'boss-protection-sociale-complementaire',
      'base-source-art-158-6-cgi-rentes-viageres-a-titre-onereux',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['per', 'per-potentiel', 'per-transfert', 'retraite'],
  },
] as const satisfies readonly MementoEntry[];
