/**
 * placementEngine.ts - Facade publique du moteur Placement
 *
 * PR-4: moteur deplace vers src/engine/placement/*
 * Les signatures publiques restent inchangees.
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
