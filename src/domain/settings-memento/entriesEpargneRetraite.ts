import type { MementoEntry } from './types';

export const MEMENTO_EPARGNE_RETRAITE_ENTRIES = [
  {
    chapterId: 'epargne-retraite',
    key: 'epargne-retraite.base-cg-retraite',
    label: 'Base CG retraite',
    description:
      'Référentiel de contrats retraite et de documents contractuels utilisé pour comparer les produits transférables.',
    status: 'partiel',
    statusReason:
      'La page Base CG retraite et ses tables Supabase sont actives ; les entrées PER détaillées restent livrées au lot suivant.',
    priority: 'structurant',
    ownerPagePath: '/settings/base-contrat-retraite',
    registryKeys: [],
    claimKeys: [],
    refIds: ['cmf-l224-1', 'cmf-l224-40', 'cgi-154-bis', 'cgi-163-quatervicies'],
    coverageSources: ['cadrage-externe'],
    relatedSimulatorIds: ['per', 'per-transfert'],
  },
] as const satisfies readonly MementoEntry[];
