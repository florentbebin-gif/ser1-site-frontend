/**
 * domain/base-contrat/rules/library/placeholder.ts
 *
 * Règles génériques "À compléter" — PR5.
 * Utilisé pour tous les produits sans règles réelles dans cette version.
 */

import type { ProductRules } from '../types';

const TODO_BLOCK = {
  title: 'Règles à compléter',
  bullets: [
    'Les règles fiscales détaillées de ce produit seront disponibles dans une prochaine mise à jour.',
  ],
};

export const PLACEHOLDER_RULES: ProductRules = {
  isPlaceholder: true,
  constitution: [TODO_BLOCK],
  sortie: [TODO_BLOCK],
  deces: [TODO_BLOCK],
};
