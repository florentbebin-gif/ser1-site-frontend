import type { MementoEntry } from './types';

export const MEMENTO_DIRIGEANT_ENTRIES = [
  {
    chapterId: 'dirigeant',
    key: 'dirigeant.dividendes-tns',
    label: 'Dividendes TNS',
    description:
      'Dividendes versés au dirigeant travailleur non salarié, avec lecture sociale distincte de la décision de distribution.',
    status: 'partiel',
    statusReason:
      'Le seuil social des dividendes TNS est sourcé et administré sur Prélèvements ; l’assiette CSS est qualifiée mais le moteur rémunération reste à construire.',
    priority: 'critique',
    ownerPagePath: '/settings/memento',
    registryKeys: ['social-dirigeant.charges-sociales', 'comptables-societes.dividendes'],
    claimKeys: ['social-dirigeant-dividendes-tns'],
    refIds: [
      'urssaf-dividendes-tns-cotisations-sociales',
      'css-l131-6',
      'code-commerce-l232-12',
      'cgi-200-a',
      'css-l136-7',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['tresorerie-societe', 'remuneration', 'sortie-capitaux'],
  },
  {
    chapterId: 'dirigeant',
    key: 'dirigeant.remuneration',
    label: 'Rémunération dirigeant',
    description:
      'Arbitrage futur entre rémunération, dividendes, coût société, impact IR et protection sociale du dirigeant.',
    status: 'planned',
    statusReason:
      'Simulateur rémunération planifié ; le périmètre assimilé salarié et la taxe sur les salaires sont sourcés, sans modèle social, retraite ou arbitrage IR livré.',
    priority: 'critique',
    ownerPagePath: '/settings/memento',
    registryKeys: [
      'social-dirigeant.charges-sociales',
      'comptables-societes.dividendes',
      'retraite-prevoyance.cotisations-retraite',
      'retraite-prevoyance.validation-retraite-600-smic',
    ],
    claimKeys: [],
    refIds: [
      'css-l311-3',
      'cgi-231',
      'urssaf-assimile-salarie-dirigeant',
      'boss-assiette-generale',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['remuneration'],
  },
  {
    chapterId: 'dirigeant',
    key: 'dirigeant.charges-sociales-assimile-salarie',
    label: 'Charges sociales assimilé salarié',
    description:
      'Régime social des mandataires assimilés salariés à séparer du salarié standard et du TNS.',
    status: 'planned',
    statusReason:
      'Sources CSS, URSSAF et BOSS qualifiées pour le cadrage ; aucune grille de cotisations ni consommation moteur n’est ouverte.',
    priority: 'structurant',
    ownerPagePath: '/settings/memento',
    registryKeys: ['social-dirigeant.charges-sociales'],
    claimKeys: [],
    refIds: [
      'css-l311-3',
      'cgi-231',
      'urssaf-assimile-salarie-dirigeant',
      'boss-assiette-generale',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['remuneration'],
  },
  {
    chapterId: 'dirigeant',
    key: 'dirigeant.charges-sociales-tns',
    label: 'Charges sociales TNS',
    description:
      'Cotisations du dirigeant travailleur non salarié, rémunération et dividendes, à raccorder au futur modèle social.',
    status: 'partiel',
    statusReason:
      'Le seuil social des dividendes TNS, l’assiette CSS et les barèmes URSSAF donnent un socle partiel ; le moteur par régime reste à construire.',
    priority: 'critique',
    ownerPagePath: '/settings/memento',
    registryKeys: ['social-dirigeant.charges-sociales'],
    claimKeys: ['social-dirigeant-dividendes-tns'],
    refIds: [
      'urssaf-dividendes-tns-cotisations-sociales',
      'urssaf-cotisations-independants',
      'urssaf-taux-cotisations-ac-plnr',
      'css-l131-6',
      'cgi-154-bis',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['tresorerie-societe', 'remuneration', 'sortie-capitaux'],
  },
  {
    chapterId: 'dirigeant',
    key: 'dirigeant.charges-sociales-liberales',
    label: 'Charges sociales professions libérales',
    description:
      'Cotisations des dirigeants libéraux et professionnels affiliés à des caisses propres, à traiter régime par régime.',
    status: 'planned',
    statusReason:
      'Barèmes URSSAF transverses sourcés ; les caisses libérales restent inventoriées côté prévoyance et retraite sans modèle social par caisse livré.',
    priority: 'structurant',
    ownerPagePath: '/settings/memento',
    registryKeys: ['social-dirigeant.charges-sociales', 'retraite-prevoyance.cotisations-retraite'],
    claimKeys: [],
    refIds: ['urssaf-cotisations-independants', 'urssaf-taux-cotisations-ac-plnr'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['remuneration'],
  },
  {
    chapterId: 'dirigeant',
    key: 'dirigeant.puma-csm',
    label: 'PUMA / CSM',
    description:
      'Protection universelle maladie et contribution subsidiaire maladie à contrôler dans les arbitrages de revenus du dirigeant.',
    status: 'planned',
    statusReason:
      'La source PUMA et la base légale de contribution subsidiaire maladie sont qualifiées ; aucun paramètre ni alerte moteur n’est livré.',
    priority: 'structurant',
    ownerPagePath: '/settings/memento',
    registryKeys: ['social-dirigeant.puma-csm'],
    claimKeys: [],
    refIds: ['service-public-puma', 'css-l380-2'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['remuneration', 'sortie-capitaux'],
  },
  {
    chapterId: 'dirigeant',
    key: 'dirigeant.micro-social',
    label: 'Micro-social',
    description:
      'Régime micro-social du dirigeant indépendant, avec déclaration périodique et cotisations liées au chiffre d’affaires déclaré.',
    status: 'absent',
    statusReason:
      'Hors cible initiale du mémento dirigeant/social ; la décision V5 conserve le micro-social sans source, propriétaire ni simulateur.',
    priority: 'complementaire',
    ownerPagePath: null,
    registryKeys: [],
    claimKeys: [],
    refIds: [],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: [],
  },
  {
    chapterId: 'dirigeant',
    key: 'dirigeant.sortie-capitaux',
    label: 'Sortie de capitaux',
    description:
      'Comparaison future des sorties de cash société vers le dirigeant par dividendes, remboursement de compte courant ou rémunération.',
    status: 'partiel',
    statusReason:
      'Les dividendes TNS et les prélèvements sociaux disposent déjà de sources qualifiées ; le moteur sortie de capitaux reste planifié.',
    priority: 'critique',
    ownerPagePath: '/settings/memento',
    registryKeys: [
      'social-dirigeant.charges-sociales',
      'social-dirigeant.puma-csm',
      'comptables-societes.dividendes',
    ],
    claimKeys: ['social-dirigeant-dividendes-tns'],
    refIds: [
      'urssaf-dividendes-tns-cotisations-sociales',
      'css-l131-6',
      'code-commerce-l232-12',
      'cgi-200-a',
      'css-l136-7',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['sortie-capitaux', 'tresorerie-societe'],
  },
  {
    chapterId: 'dirigeant',
    key: 'dirigeant.prevoyance',
    label: 'Prévoyance dirigeant',
    description:
      'Garanties prévoyance du dirigeant, contrats collectifs ou individuels et rattachement aux régimes obligatoires.',
    status: 'planned',
    statusReason:
      'Le simulateur prévoyance actif couvre la famille ; la variante dirigeant ROADMAP-only attend les sources par régime et l’audit base avec références Supabase.',
    priority: 'structurant',
    ownerPagePath: '/settings/memento',
    registryKeys: ['retraite-prevoyance.prevoyance-garanties'],
    claimKeys: [],
    refIds: ['boss-protection-sociale-complementaire', 'css-l911-1'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: [],
  },
] as const satisfies readonly MementoEntry[];
