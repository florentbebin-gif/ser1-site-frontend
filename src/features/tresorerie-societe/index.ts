/**
 * index.ts — Barrel export du simulateur Trésorerie Société IS
 */

export { default as TresorerieSocietePage } from './TresorerieSocietePage';
export type { TresoState, TresoPersistedState } from './types';
export type { TresoKPIs, TresoCalculationsResult } from './hooks/useTresorerieCalculations';
