/**
 * types.ts — Types UI du simulateur Trésorerie Société IS
 *
 * TresoState         : état complet du formulaire (saisies + UI)
 * TresoPersistedState : sous-ensemble persisté en sessionStorage
 *
 * Ces types sont strictement UI — aucun calcul métier ici.
 * Les types moteur sont dans src/engine/tresorerie/types.ts.
 */

import type { TresoInputs, TresoInputsV2, TresoInputsV3, TresoInputsV4 } from '../../engine/tresorerie/types';

export interface TresoState {
  inputsV4: TresoInputsV4;
  projectionVisible: boolean;
  projectionMode: 'resume' | 'detail';
}

export interface TresoPersistedState {
  /** Format runtime actuel. */
  inputsV4?: TresoInputsV4;
  /** Ancien format runtime, lu uniquement pendant la migration au chargement. */
  inputsV3?: TresoInputsV3;
  /** Ancien format runtime, lu uniquement pendant la migration au chargement. */
  inputsV2?: TresoInputsV2;
  /** Ancien format, lu uniquement pendant la migration au chargement. */
  inputs?: TresoInputs;
}
