import type { MementoEntry } from './types';

export const MEMENTO_FOYER_ENTRIES = [
  {
    chapterId: 'foyer',
    key: 'foyer.filiation',
    label: 'Filiation et branches familiales',
    description:
      'Composition familiale, enfants communs ou non et branches utiles à la dévolution et au rattachement du dossier central.',
    status: 'planned',
    statusReason:
      'Simulateur filiation planifié ; le dossier central porte la composition familiale sans moteur dédié.',
    priority: 'critique',
    ownerPagePath: null,
    registryKeys: [],
    claimKeys: [],
    refIds: ['code-civil-757'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['filiation'],
  },
  {
    chapterId: 'foyer',
    key: 'foyer.budget',
    label: 'Budget et capacité d’épargne',
    description:
      'Revenus, charges et capacité d’épargne du foyer comme données de dossier, sans règle fiscale propre.',
    status: 'planned',
    statusReason:
      'Simulateur budget planifié ; aucune source officielle requise car le thème ne porte pas de règle fiscale.',
    priority: 'structurant',
    ownerPagePath: null,
    registryKeys: [],
    claimKeys: [],
    refIds: [],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['budget'],
  },
  {
    chapterId: 'civil',
    key: 'civil.regime-matrimonial',
    label: 'Régime matrimonial et protection du conjoint',
    description:
      'Régimes matrimoniaux, avantages matrimoniaux et protection du conjoint survivant en lien avec les règles de transmission.',
    status: 'planned',
    statusReason:
      'Simulateur régime matrimonial planifié ; les règles civiles guident déjà le moteur succession via la page DMTG.',
    priority: 'critique',
    ownerPagePath: '/settings/dmtg-succession',
    registryKeys: [],
    claimKeys: [],
    refIds: ['code-civil-265', 'code-civil-1515', 'code-civil-1516', 'code-civil-1094-1'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['regime-matrimonial'],
  },
  {
    chapterId: 'transmission',
    key: 'transmission.donations-anterieures',
    label: 'Donations antérieures',
    description:
      'Historique des donations, rapport civil et rappel fiscal pris en compte avant toute nouvelle transmission.',
    status: 'planned',
    statusReason:
      'Simulateur donations antérieures planifié ; le rappel fiscal et ses paramètres restent portés par la page DMTG.',
    priority: 'critique',
    ownerPagePath: '/settings/dmtg-succession',
    registryKeys: [],
    claimKeys: [],
    refIds: ['cgi-784', 'code-civil-843'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['donations-anterieures'],
  },
  {
    chapterId: 'patrimoine',
    key: 'patrimoine.actif-passif',
    label: 'Synthèse actif-passif',
    description:
      'Masses patrimoniales, dettes et démembrement rattachés au dossier central pour alimenter les simulateurs.',
    status: 'a_verifier',
    statusReason:
      'Étape interne du dossier sans moteur autonome ; périmètre et sources à confirmer avant toute couverture.',
    priority: 'critique',
    ownerPagePath: null,
    registryKeys: [],
    claimKeys: [],
    refIds: ['code-civil-578'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['actif-passif'],
  },
] as const satisfies readonly MementoEntry[];
