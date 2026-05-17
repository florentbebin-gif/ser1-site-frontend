/**
 * domain/base-contrat/overrides.ts
 *
 * Types pour la table base_contrat_overrides.
 * L'admin peut fermer/rouvrir un produit et piloter sa revue juridique.
 */

export const BASE_CONTRAT_REVIEW_STATUS_LABELS = {
  ok: 'OK',
  a_revoir: 'À revoir',
  obsolescence_a_confirmer: 'Obsolescence à confirmer',
} as const;

export type BaseContratReviewStatus = keyof typeof BASE_CONTRAT_REVIEW_STATUS_LABELS;

export interface BaseContratOverride {
  product_id: string;
  closed_date: string | null;
  note_admin: string | null;
  review_status: BaseContratReviewStatus;
  review_reason: string | null;
  next_review_at: string | null;
  updated_at: string;
}

export type OverrideMap = Readonly<Record<string, BaseContratOverride>>;

export type BaseContratOverrideInput = Pick<
  BaseContratOverride,
  'product_id' | 'closed_date' | 'note_admin' | 'review_status' | 'review_reason' | 'next_review_at'
>;

export function normalizeBaseContratReviewStatus(value: unknown): BaseContratReviewStatus {
  return typeof value === 'string' && value in BASE_CONTRAT_REVIEW_STATUS_LABELS
    ? (value as BaseContratReviewStatus)
    : 'ok';
}

export function isProductClosed(
  productId: string,
  overrides: OverrideMap,
  asOf: string = new Date().toISOString().slice(0, 10),
): boolean {
  const o = overrides[productId];
  if (!o || !o.closed_date) return false;
  return o.closed_date <= asOf;
}
