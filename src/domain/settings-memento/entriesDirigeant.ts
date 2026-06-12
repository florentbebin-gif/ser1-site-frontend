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
      'Le seuil social des dividendes TNS est sourcé et administré sur Prélèvements ; le futur moteur rémunération doit encore qualifier le régime complet dividendes.',
    priority: 'critique',
    ownerPagePath: '/settings/prelevements',
    registryKeys: ['social-dirigeant.charges-sociales', 'comptables-societes.dividendes'],
    claimKeys: ['social-dirigeant-dividendes-tns'],
    refIds: [
      'urssaf-dividendes-tns-cotisations-sociales',
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
      'Simulateur rémunération planifié ; les sources assimilé salarié sont identifiées mais aucun modèle social, retraite ou arbitrage IR n’est livré.',
    priority: 'critique',
    ownerPagePath: '/settings/prelevements',
    registryKeys: [
      'social-dirigeant.charges-sociales',
      'comptables-societes.dividendes',
      'retraite-prevoyance.cotisations-retraite',
      'retraite-prevoyance.validation-retraite-600-smic',
    ],
    claimKeys: [],
    refIds: ['urssaf-assimile-salarie-dirigeant', 'boss-assiette-generale'],
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
      'Sources URSSAF et BOSS qualifiées pour le cadrage ; aucune grille de cotisations ni consommation moteur n’est ouverte.',
    priority: 'structurant',
    ownerPagePath: '/settings/prelevements',
    registryKeys: ['social-dirigeant.charges-sociales'],
    claimKeys: [],
    refIds: ['urssaf-assimile-salarie-dirigeant', 'boss-assiette-generale'],
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
      'Le seuil social des dividendes TNS et la référence Madelin existante donnent un socle partiel ; les cotisations par caisse restent à qualifier.',
    priority: 'critique',
    ownerPagePath: '/settings/prelevements',
    registryKeys: ['social-dirigeant.charges-sociales'],
    claimKeys: ['social-dirigeant-dividendes-tns'],
    refIds: ['urssaf-dividendes-tns-cotisations-sociales', 'cgi-154-bis'],
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
      'Caisses libérales inventoriées côté prévoyance et retraite ; aucun modèle social par caisse n’est livré dans ce lot.',
    priority: 'structurant',
    ownerPagePath: '/settings/prelevements',
    registryKeys: ['social-dirigeant.charges-sociales', 'retraite-prevoyance.cotisations-retraite'],
    claimKeys: [],
    refIds: [],
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
      'La source PUMA est qualifiée ; la contribution subsidiaire maladie reste à cadrer avant tout paramètre ou alerte moteur.',
    priority: 'structurant',
    ownerPagePath: '/settings/prelevements',
    registryKeys: ['social-dirigeant.puma-csm'],
    claimKeys: [],
    refIds: ['service-public-puma'],
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
    ownerPagePath: '/settings/prelevements',
    registryKeys: [
      'social-dirigeant.charges-sociales',
      'social-dirigeant.puma-csm',
      'comptables-societes.dividendes',
    ],
    claimKeys: ['social-dirigeant-dividendes-tns'],
    refIds: [
      'urssaf-dividendes-tns-cotisations-sociales',
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
    ownerPagePath: '/settings/prevoyance-regimes',
    registryKeys: ['retraite-prevoyance.prevoyance-garanties'],
    claimKeys: [],
    refIds: ['boss-protection-sociale-complementaire', 'css-l911-1'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: [],
  },
] as const satisfies readonly MementoEntry[];
