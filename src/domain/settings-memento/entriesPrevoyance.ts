import type { MementoEntry } from './types';

export const PREVOYANCE_MAINTIEN_EMPLOYEUR_CLAIMS = ['code-travail-minimum-legal'] as const;

export const PREVOYANCE_SALARIE_CLAIMS = [
  'prevoyance-salarie-cpam-arret',
  'prevoyance-salarie-cpam-invalidite',
  'prevoyance-salarie-cpam-deces',
  'prevoyance-salarie-cpam-cotisations',
  'prevoyance-salarie-msa-arret',
  'prevoyance-salarie-msa-invalidite',
  'prevoyance-salarie-msa-deces',
  'prevoyance-salarie-msa-cotisations',
] as const;

export const PREVOYANCE_INDEPENDANT_CLAIMS = [
  'prevoyance-ssi-artisan-commercant-arret',
  'prevoyance-ssi-artisan-commercant-invalidite',
  'prevoyance-ssi-artisan-commercant-deces',
  'prevoyance-ssi-artisan-commercant-cotisations',
  'prevoyance-msa-exploitant-arret',
  'prevoyance-msa-exploitant-invalidite',
  'prevoyance-msa-exploitant-deces',
  'prevoyance-msa-exploitant-cotisations',
] as const;

export const PREVOYANCE_LIBERAL_SOCLE_CLAIMS = [
  'prevoyance-cnavpl-arret',
  'prevoyance-cnavpl-invalidite',
  'prevoyance-cnavpl-deces',
  'prevoyance-cnavpl-cotisations',
  'prevoyance-cipav-arret',
  'prevoyance-cipav-invalidite',
  'prevoyance-cipav-deces',
  'prevoyance-cipav-cotisations',
] as const;

export const PREVOYANCE_LIBERAL_HEALTH_CLAIMS = [
  'prevoyance-carpimko-arret',
  'prevoyance-carpimko-invalidite',
  'prevoyance-carpimko-deces',
  'prevoyance-carpimko-cotisations',
  'prevoyance-carmf-arret',
  'prevoyance-carmf-invalidite',
  'prevoyance-carmf-deces',
  'prevoyance-carmf-cotisations',
  'prevoyance-carcdsf-dentiste-arret',
  'prevoyance-carcdsf-dentiste-invalidite',
  'prevoyance-carcdsf-dentiste-deces',
  'prevoyance-carcdsf-dentiste-cotisations',
  'prevoyance-carcdsf-sagefemme-arret',
  'prevoyance-carcdsf-sagefemme-invalidite',
  'prevoyance-carcdsf-sagefemme-deces',
  'prevoyance-carcdsf-sagefemme-cotisations',
  'prevoyance-cavp-arret',
  'prevoyance-cavp-invalidite',
  'prevoyance-cavp-deces',
  'prevoyance-cavp-cotisations',
  'prevoyance-carpv-arret',
  'prevoyance-carpv-invalidite',
  'prevoyance-carpv-deces',
  'prevoyance-carpv-cotisations',
] as const;

export const PREVOYANCE_LIBERAL_OTHER_CLAIMS = [
  'prevoyance-cavec-arret',
  'prevoyance-cavec-invalidite',
  'prevoyance-cavec-deces',
  'prevoyance-cavec-cotisations',
  'prevoyance-cprn-arret',
  'prevoyance-cprn-invalidite',
  'prevoyance-cprn-deces',
  'prevoyance-cprn-cotisations',
  'prevoyance-cavom-arret',
  'prevoyance-cavom-invalidite',
  'prevoyance-cavom-deces',
  'prevoyance-cavom-cotisations',
  'prevoyance-cavamac-arret',
  'prevoyance-cavamac-invalidite',
  'prevoyance-cavamac-deces',
  'prevoyance-cavamac-cotisations',
  'prevoyance-cnbf-arret',
  'prevoyance-cnbf-invalidite',
  'prevoyance-cnbf-deces',
  'prevoyance-cnbf-cotisations',
] as const;

export const PREVOYANCE_AFFILIATION_CAISSES_CLAIMS = [
  ...PREVOYANCE_LIBERAL_SOCLE_CLAIMS,
  ...PREVOYANCE_LIBERAL_HEALTH_CLAIMS,
  ...PREVOYANCE_LIBERAL_OTHER_CLAIMS,
] as const;

export const PREVOYANCE_REGIME_CLAIMS = [
  ...PREVOYANCE_SALARIE_CLAIMS,
  ...PREVOYANCE_INDEPENDANT_CLAIMS,
  ...PREVOYANCE_AFFILIATION_CAISSES_CLAIMS,
] as const;

export const MEMENTO_PREVOYANCE_ENTRIES = [
  {
    chapterId: 'prevoyance',
    key: 'prevoyance.familiale',
    label: 'Prévoyance familiale',
    description:
      'Protection décès, arrêt de travail et invalidité du foyer, à relier aux régimes obligatoires et aux contrats privés.',
    status: 'partiel',
    statusReason:
      'Le simulateur prévoyance est actif et les sources générales sont qualifiées ; le besoin familial reste à relier au dossier central.',
    priority: 'critique',
    ownerPagePath: '/settings/prevoyance-regimes',
    registryKeys: ['retraite-prevoyance.prevoyance-garanties'],
    claimKeys: [],
    refIds: [
      'css-l911-1',
      'code-assurances-l132-1',
      'boss-protection-sociale-complementaire',
      'base-source-boss-prevoyance-tns',
    ],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['prevoyance'],
  },
  {
    chapterId: 'prevoyance',
    key: 'prevoyance.maintien-employeur',
    label: 'Maintien employeur',
    description:
      'Maintien de salaire légal et conventionnel à distinguer des garanties complémentaires de prévoyance.',
    status: 'partiel',
    statusReason:
      'La ligne Supabase dédiée porte les sources vérifiées ; le mémento n’écrase pas les JSONB de la page propriétaire.',
    priority: 'structurant',
    ownerPagePath: '/settings/prevoyance-regimes',
    registryKeys: ['retraite-prevoyance.prevoyance-garanties'],
    claimKeys: PREVOYANCE_MAINTIEN_EMPLOYEUR_CLAIMS,
    refIds: [],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['prevoyance'],
  },
  {
    chapterId: 'prevoyance',
    key: 'prevoyance.regimes-salaries',
    label: 'Régimes salariés',
    description:
      'Prévoyance obligatoire des salariés du privé et du régime agricole, par arrêt, invalidité, décès et cotisations.',
    status: 'partiel',
    statusReason:
      'Les claims DB couvrent les catégories attendues ; le calcul des garanties reste propriétaire du simulateur prévoyance.',
    priority: 'structurant',
    ownerPagePath: '/settings/prevoyance-regimes',
    registryKeys: ['retraite-prevoyance.prevoyance-garanties'],
    claimKeys: PREVOYANCE_SALARIE_CLAIMS,
    refIds: [],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['prevoyance'],
  },
  {
    chapterId: 'prevoyance',
    key: 'prevoyance.regimes-independants',
    label: 'Régimes indépendants',
    description:
      'Prévoyance des artisans, commerçants et exploitants agricoles à relier aux arbitrages dirigeant.',
    status: 'partiel',
    statusReason:
      'Les sources par régime sont auditées en base ; le futur modèle dirigeant ne consomme pas encore ces barèmes.',
    priority: 'structurant',
    ownerPagePath: '/settings/prevoyance-regimes',
    registryKeys: [
      'retraite-prevoyance.prevoyance-garanties',
      'retraite-prevoyance.cotisations-retraite',
      'social-dirigeant.charges-sociales',
    ],
    claimKeys: PREVOYANCE_INDEPENDANT_CLAIMS,
    refIds: ['cgi-154-bis', 'base-source-boss-prevoyance-tns'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['prevoyance', 'remuneration', 'retraite'],
  },
  {
    chapterId: 'prevoyance',
    key: 'prevoyance.affiliation-caisses',
    label: 'Affiliation aux caisses',
    description:
      'Cartographie des caisses libérales de prévoyance, distincte du futur calcul social par caisse.',
    status: 'partiel',
    statusReason:
      'Les claims DB qualifient les caisses par catégorie ; le moteur charges sociales libérales reste planifié.',
    priority: 'critique',
    ownerPagePath: '/settings/prevoyance-regimes',
    registryKeys: [
      'retraite-prevoyance.prevoyance-garanties',
      'retraite-prevoyance.cotisations-retraite',
      'social-dirigeant.charges-sociales',
    ],
    claimKeys: PREVOYANCE_AFFILIATION_CAISSES_CLAIMS,
    refIds: [],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['prevoyance', 'remuneration', 'retraite'],
  },
] as const satisfies readonly MementoEntry[];
