/**
 * domain/base-contrat/types.ts
 *
 * Types minimaux nécessaires au pivot catalogue hardcodé.
 */

export type CatalogKind = 'wrapper' | 'asset' | 'liability' | 'tax_overlay' | 'protection';

export type GrandeFamille =
  | 'Épargne Assurance'
  | 'Assurance prévoyance'
  | 'Épargne bancaire'
  | 'Valeurs mobilières'
  | 'Immobilier direct'
  | 'Immobilier indirect'
  | 'Non coté/PE'
  | 'Créances/Droits'
  | 'Dispositifs fiscaux immobilier'
  | 'Retraite & épargne salariale'
  | 'Autres';
