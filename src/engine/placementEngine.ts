/**
 * placementEngine.js  Façade de compatibilité publique
 *
 * PR-4: moteur déplacé vers src/engine/placement/*
 * Les signatures publiques restent inchangées.
 */

export {
  ENVELOPES,
  ENVELOPE_LABELS,
  extractFiscalParams,
  simulateEpargne,
  calculFiscaliteRetrait,
  simulateLiquidation,
  calculTransmission,
  simulateComplete,
  compareProducts,
} from './placement/index.js';
