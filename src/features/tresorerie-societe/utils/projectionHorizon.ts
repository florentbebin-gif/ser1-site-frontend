export const DEFAULT_PROJECTION_HORIZON_YEARS = 40;
export const MIN_PROJECTION_HORIZON_YEARS = 5;
export const MAX_PROJECTION_HORIZON_YEARS = 60;

export function normalizeProjectionHorizonYears(value: number | undefined): number {
  if (!Number.isFinite(value)) return DEFAULT_PROJECTION_HORIZON_YEARS;
  return Math.min(
    MAX_PROJECTION_HORIZON_YEARS,
    Math.max(MIN_PROJECTION_HORIZON_YEARS, Math.round(value ?? DEFAULT_PROJECTION_HORIZON_YEARS)),
  );
}
