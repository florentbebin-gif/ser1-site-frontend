import type { MementoBusinessPriority, MementoStatus } from '@/domain/settings-memento/types';
import type { MementoLexiconTerm } from '@/domain/settings-memento/lexicon';

export const MEMENTO_STATUS_LABELS: Record<MementoStatus, string> = {
  couvert: 'A - Couverture : complète',
  partiel: 'A - Couverture : partielle',
  planned: 'A - Couverture : prévue',
  absent: 'A - Couverture : non traitée',
  a_verifier: 'A - Couverture : à qualifier',
  blocked_missing_official_source: 'A - Couverture : source officielle manquante',
};

export const MEMENTO_PRIORITY_LABELS: Record<MementoBusinessPriority, string> = {
  critique: 'Priorité critique',
  structurant: 'Priorité structurante',
  utile: 'Priorité utile',
  complementaire: 'Priorité complémentaire',
};

export const MEMENTO_LEXICON_SOURCE_LABELS: Record<MementoLexiconTerm['status'], string> = {
  sourced: 'C1 - Source qualité : lexique sourcé',
  a_verifier: 'C1 - Source qualité : lexique à relire',
};
