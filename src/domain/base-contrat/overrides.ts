/**
 * domain/base-contrat/overrides.ts
 *
 * Types pour la table base_contrat_overrides (ultra-minimale PR1).
 * L'admin peut uniquement fermer/rouvrir un produit avec une date.
 *
 * Garde-fou PR1 : 100% additive, aucun impact runtime.
 */

export interface BaseContratOverride {
  product_id: string;
  closed_date: string | null;
  note_admin: string | null;
  updated_at: string;
}

export type OverrideMap = Readonly<Record<string, BaseContratOverride>>;

export function isProductClosed(
  productId: string,
  overrides: OverrideMap,
  asOf: string = new Date().toISOString().slice(0, 10),
): boolean {
  const o = overrides[productId];
  if (!o || !o.closed_date) return false;
  return o.closed_date <= asOf;
}
