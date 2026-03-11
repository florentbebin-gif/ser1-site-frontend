/**
 * placementEngine.js  Fa�ade de compatibilit� publique
 *
 * PR-4: moteur d�plac� vers src/engine/placement/*
 * Les signatures publiques restent inchang�es.
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
} from './placement/index';
