import type { MementoEntry } from './types';

export const MEMENTO_RETRAITE_ENTRIES = [
  {
    chapterId: 'retraite',
    key: 'retraite.globale',
    label: 'Retraite globale',
    description:
      'Vue globale des droits obligatoires, de l’âge de départ, de la durée d’assurance et des régimes de base ou complémentaires.',
    status: 'planned',
    statusReason:
      'La registry expose déjà PASS, prélèvements sociaux retraite et seuils RFR ; le simulateur retraite reste planifié et aucun modèle générationnel n’est livré.',
    priority: 'critique',
    ownerPagePath: '/settings/prelevements',
    registryKeys: [
      'retraite-prevoyance.ps-retraite',
      'retraite-prevoyance.seuils-rfr',
      'retraite-prevoyance.pass',
      'retraite-prevoyance.cotisations-retraite',
      'retraite-prevoyance.validation-retraite-600-smic',
    ],
    claimKeys: ['retirement-current-brackets', 'retirement-thresholds-current', 'pass-latest'],
    refIds: ['assurance-retraite-age-taux-plein', 'urssaf-pass-2026', 'ameli-pass-2026'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['retraite'],
  },
  {
    chapterId: 'retraite',
    key: 'retraite.regime-general',
    label: 'Régime général salarié',
    description:
      'Droits obligatoires du régime général : âge, durée d’assurance, taux plein, décote, surcote et retraite de base.',
    status: 'partiel',
    statusReason:
      'La source Assurance retraite qualifie le cadrage du régime général ; SER1 ne livre pas encore de moteur de droits salariés.',
    priority: 'critique',
    ownerPagePath: '/settings/prelevements',
    registryKeys: ['retraite-prevoyance.pass'],
    claimKeys: ['pass-latest'],
    refIds: ['assurance-retraite-age-taux-plein'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['retraite'],
  },
  {
    chapterId: 'retraite',
    key: 'retraite.agirc-arrco',
    label: 'Complémentaire AGIRC-ARRCO',
    description:
      'Retraite complémentaire des salariés par points, distincte du régime général de base.',
    status: 'partiel',
    statusReason:
      'La source AGIRC-ARRCO qualifie le principe des points ; les valeurs, tranches et calculs restent hors lot.',
    priority: 'critique',
    ownerPagePath: '/settings/prelevements',
    registryKeys: ['retraite-prevoyance.cotisations-retraite'],
    claimKeys: [],
    refIds: ['agirc-arrco-points-retraite'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['retraite'],
  },
  {
    chapterId: 'retraite',
    key: 'retraite.dirigeant-assimile-salarie',
    label: 'Retraite dirigeant assimilé salarié',
    description:
      'Rattachement retraite des mandataires assimilés salariés, à séparer du salarié standard et du dirigeant TNS.',
    status: 'planned',
    statusReason:
      'Les sources sociales du dirigeant et les sources retraite de base et complémentaire sont identifiées ; l’articulation rémunération-droits reste à livrer.',
    priority: 'structurant',
    ownerPagePath: '/settings/prelevements',
    registryKeys: [
      'social-dirigeant.charges-sociales',
      'retraite-prevoyance.cotisations-retraite',
      'retraite-prevoyance.validation-retraite-600-smic',
    ],
    claimKeys: [],
    refIds: [
      'urssaf-assimile-salarie-dirigeant',
      'assurance-retraite-age-taux-plein',
      'agirc-arrco-points-retraite',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['retraite', 'remuneration'],
  },
  {
    chapterId: 'retraite',
    key: 'retraite.ssi-artisan-commercant',
    label: 'Retraite SSI artisan et commerçant',
    description:
      'Droits retraite obligatoires des artisans, commerçants et indépendants rattachés au régime général.',
    status: 'partiel',
    statusReason:
      'Les sources Service-Public et URSSAF cadrent la retraite de l’entrepreneur individuel ; les règles CSS détaillées restent à qualifier.',
    priority: 'structurant',
    ownerPagePath: '/settings/prelevements',
    registryKeys: [
      'retraite-prevoyance.cotisations-retraite',
      'retraite-prevoyance.validation-retraite-600-smic',
    ],
    claimKeys: [],
    refIds: ['entreprendre-service-public-retraite-ei', 'urssaf-independant-droits-retraite'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['retraite', 'remuneration'],
  },
  {
    chapterId: 'retraite',
    key: 'retraite.cnavpl-professions-liberales',
    label: 'CNAVPL et professions libérales',
    description:
      'Socle retraite des professions libérales réglementées, avec régime de base commun et régimes complémentaires par section.',
    status: 'partiel',
    statusReason:
      'Les sources CNAVPL et Service-Public qualifient le socle ; les articles CSS et chaque section professionnelle restent à qualifier.',
    priority: 'structurant',
    ownerPagePath: '/settings/prelevements',
    registryKeys: [
      'retraite-prevoyance.cotisations-retraite',
      'retraite-prevoyance.validation-retraite-600-smic',
    ],
    claimKeys: [],
    refIds: ['cnavpl-retraite-liberaux', 'entreprendre-service-public-retraite-ei'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['retraite', 'remuneration'],
  },
  {
    chapterId: 'retraite',
    key: 'retraite.caisses-sante-liberales',
    label: 'Caisses santé libérales',
    description:
      'Retraite des professionnels de santé libéraux, à rattacher aux caisses professionnelles concernées.',
    status: 'a_verifier',
    statusReason:
      'CARMF, CARCDSF, CARPIMKO, CAVP et CARPV doivent être qualifiées caisse par caisse avant statut partiel.',
    priority: 'utile',
    ownerPagePath: '/settings/prelevements',
    registryKeys: ['retraite-prevoyance.cotisations-retraite'],
    claimKeys: [],
    refIds: [],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['retraite', 'remuneration'],
  },
  {
    chapterId: 'retraite',
    key: 'retraite.cipav',
    label: 'CIPAV',
    description:
      'Retraite des professionnels rattachés à la CIPAV, avec identification de la caisse avant modèle dédié.',
    status: 'partiel',
    statusReason:
      'La source CIPAV qualifie l’affiliation et les droits à cadrer ; les règles de liquidation et de réversion restent hors lot.',
    priority: 'utile',
    ownerPagePath: '/settings/prelevements',
    registryKeys: ['retraite-prevoyance.cotisations-retraite'],
    claimKeys: [],
    refIds: ['lacipav-affiliation-retraite'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['retraite', 'remuneration'],
  },
  {
    chapterId: 'retraite',
    key: 'retraite.msa',
    label: 'MSA',
    description:
      'Retraite des salariés et exploitants agricoles, à distinguer des caisses libérales et du régime général classique.',
    status: 'partiel',
    statusReason:
      'La source MSA qualifie l’entrée retraite agricole ; le détail salarié, exploitant et règles agricoles reste à qualifier.',
    priority: 'utile',
    ownerPagePath: '/settings/prelevements',
    registryKeys: ['retraite-prevoyance.cotisations-retraite'],
    claimKeys: [],
    refIds: ['msa-retraite'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['retraite'],
  },
  {
    chapterId: 'retraite',
    key: 'retraite.autres-caisses-liberales',
    label: 'Autres caisses libérales',
    description:
      'Retraite des professions libérales non santé, dont droit, conseil, assurance et officiers ministériels.',
    status: 'a_verifier',
    statusReason:
      'CAVEC, CAVAMAC, CNBF, CPRN et autres caisses non santé restent à qualifier caisse par caisse.',
    priority: 'utile',
    ownerPagePath: '/settings/prelevements',
    registryKeys: ['retraite-prevoyance.cotisations-retraite'],
    claimKeys: [],
    refIds: [],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['retraite', 'remuneration'],
  },
] as const satisfies readonly MementoEntry[];
