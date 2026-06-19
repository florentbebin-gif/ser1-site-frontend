import type { MementoBusinessPriority, MementoStatus } from '@/domain/settings-memento/types';

export const MEMENTO_STATUS_LABELS: Record<MementoStatus, string> = {
  couvert: 'Couverture : complète',
  partiel: 'Couverture : partielle',
  planned: 'Couverture : prévue',
  absent: 'Couverture : non traitée',
  a_verifier: 'Couverture : à qualifier',
  blocked_missing_official_source: 'Couverture : source officielle manquante',
};

export const MEMENTO_PRIORITY_LABELS: Record<MementoBusinessPriority, string> = {
  critique: 'Priorité critique',
  structurant: 'Priorité structurante',
  utile: 'Priorité utile',
  complementaire: 'Priorité complémentaire',
};
