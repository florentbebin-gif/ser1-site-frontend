/**
 * utils/baseContratOverridesCache.ts
 *
 * Cache minimal pour base_contrat_overrides.
 * Fetch Supabase → mémoire. TTL 24 h.
 */

import { supabase } from '../../supabaseClient';
import {
  normalizeBaseContratReviewStatus,
  type BaseContratOverride,
  type BaseContratOverrideInput,
  type OverrideMap,
} from '../../domain/base-contrat/overrides';

const TABLE = 'base_contrat_overrides';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SELECT_WITH_REVIEW =
  'product_id, closed_date, note_admin, review_status, review_reason, next_review_at, updated_at';

let _cache: OverrideMap | null = null;
let _fetchedAt: number | null = null;

function isFresh(): boolean {
  return _cache !== null && _fetchedAt !== null && Date.now() - _fetchedAt < CACHE_TTL_MS;
}

export async function getBaseContratOverrides(): Promise<OverrideMap> {
  if (isFresh() && _cache !== null) return _cache;

  const reviewResult = await supabase.from(TABLE).select(SELECT_WITH_REVIEW);
  const data = reviewResult.data as Array<Partial<BaseContratOverride>> | null;
  const error = reviewResult.error;

  if (error) {
    console.error('[baseContratOverridesCache] fetch error:', error.message);
    return _cache ?? {};
  }

  const map: Record<string, BaseContratOverride> = {};
  for (const row of data ?? []) {
    if (!row.product_id) continue;
    map[row.product_id] = {
      product_id: row.product_id,
      closed_date: row.closed_date ?? null,
      note_admin: row.note_admin ?? null,
      review_status: normalizeBaseContratReviewStatus(row.review_status),
      review_reason: row.review_reason ?? null,
      next_review_at: row.next_review_at ?? null,
      updated_at: row.updated_at ?? new Date(0).toISOString(),
    };
  }

  _cache = map;
  _fetchedAt = Date.now();
  return _cache;
}

export async function upsertBaseContratOverride(override: BaseContratOverrideInput): Promise<void> {
  const payload = { ...override, updated_at: new Date().toISOString() };
  const { error } = await supabase.from(TABLE).upsert(payload, { onConflict: 'product_id' });

  if (error) {
    throw new Error(`[baseContratOverridesCache] upsert error: ${error.message}`);
  }

  invalidateBaseContratOverridesCache();
}

export function invalidateBaseContratOverridesCache(): void {
  _cache = null;
  _fetchedAt = null;
}
