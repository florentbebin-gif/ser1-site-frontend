/**
 * types.ts — Types UI du simulateur Trésorerie Société IS
 *
 * TresoState         : état complet du formulaire (saisies + UI)
 * TresoPersistedState : sous-ensemble persisté en sessionStorage
 *
 * Ces types sont strictement UI — aucun calcul métier ici.
 * Les types moteur sont dans src/engine/tresorerie/types.ts.
 */

import type { TresoInputsV6 } from '../../engine/tresorerie/types';

export interface TresoState {
  inputsV6: TresoInputsV6;
  projectionVisible: boolean;
  projectionMode: 'resume' | 'detail';
}

export interface TresoPersistedState {
  /** Format runtime actuel. */
  inputsV6?: TresoInputsV6;
  /** Ancien format runtime, lu uniquement pendant la migration au chargement. */
  inputsV5?: unknown;
  /** Ancien format runtime, lu uniquement pendant la migration au chargement. */
  inputsV4?: unknown;
  /** Ancien format runtime, lu uniquement pendant la migration au chargement. */
  inputsV3?: unknown;
  /** Ancien format runtime, lu uniquement pendant la migration au chargement. */
  inputsV2?: unknown;
  /** Ancien format, lu uniquement pendant la migration au chargement. */
  inputs?: unknown;
}
