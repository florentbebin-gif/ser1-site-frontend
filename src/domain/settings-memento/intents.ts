import type { MementoChapterId, MementoUserIntent } from './types';

/**
 * Intentions métier : projection de lecture pour le CGP au-dessus des chapitres
 * existants. Ce n'est pas une seconde taxonomie : chaque intention pointe des
 * `MementoChapterId` déjà déclarés dans `chapters.ts`. La couverture des 14
 * chapitres par au moins une intention est vérifiée par `validateMementoIntents`.
 */
export interface MementoIntentDefinition {
  id: MementoUserIntent;
  label: string;
  chapterIds: readonly MementoChapterId[];
}

export const MEMENTO_USER_INTENTS = [
  {
    id: 'verifier-fiscalite',
    label: 'Vérifier la fiscalité',
    chapterIds: ['fiscalite-foyer'],
  },
  {
    id: 'preparer-transmission',
    label: 'Préparer une transmission',
    chapterIds: ['transmission', 'transmission-entreprise'],
  },
  {
    id: 'proteger-famille',
    label: 'Protéger la famille',
    chapterIds: ['foyer', 'civil', 'prevoyance'],
  },
  {
    id: 'piloter-dirigeant',
    label: 'Piloter un dirigeant',
    chapterIds: ['dirigeant'],
  },
  {
    id: 'preparer-retraite',
    label: 'Préparer la retraite',
    chapterIds: ['retraite', 'epargne-retraite'],
  },
  {
    id: 'structurer-societe',
    label: 'Structurer une société',
    chapterIds: ['societe'],
  },
  {
    id: 'investir-immobilier',
    label: 'Investir en immobilier',
    chapterIds: ['immobilier'],
  },
  {
    id: 'optimiser-placements',
    label: 'Optimiser les placements',
    chapterIds: ['placements'],
  },
  {
    id: 'comprendre-couverture',
    label: 'Comprendre la couverture',
    chapterIds: ['patrimoine', 'arbitrage'],
  },
] as const satisfies readonly MementoIntentDefinition[];

export function chaptersForIntent(intent: MementoUserIntent): readonly MementoChapterId[] {
  return MEMENTO_USER_INTENTS.find((definition) => definition.id === intent)?.chapterIds ?? [];
}
