/**
 * types.ts — Types UI du simulateur Trésorerie Société IS
 *
 * TresoState         : état complet du formulaire (saisies + UI)
 * TresoPersistedState : sous-ensemble persisté en sessionStorage
 *
 * Ces types sont strictement UI — aucun calcul métier ici.
 * Les types moteur sont dans src/engine/tresorerie/types.ts.
 */

import type { TresoInputs } from '../../engine/tresorerie/types';

export interface TresoState {
  inputs: TresoInputs;
  projectionVisible: boolean;
  projectionMode: 'resume' | 'detail';
}

export type TresoPersistedState = Pick<TresoState, 'inputs'>;
