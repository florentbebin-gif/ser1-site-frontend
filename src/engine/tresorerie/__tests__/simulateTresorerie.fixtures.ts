import type { TresoFiscalParams, TresoInputs } from '../types';

export const PARAMS_STD: TresoFiscalParams = {
  isNormalRate: 0.25,
  isReducedRate: 0.15,
  isReducedThreshold: 42500,
  motherDaughterStandardQpfcRate: 0.05,
  motherDaughterGroupQpfcRate: 0.01,
  pfuRateIR: 0.128,
  psRate: 0.172,
  pfuTotal: 0.3,
  dividendesAbattement: 0.4,
  irScale: [],
};

export const BASE_INPUTS: TresoInputs = {
  typeCreation: 'newco',
  ageActuel: 45,
  ageRetraite: 65,
  besoinsRetraiteAnnuels: 30000,
  fraisStructureAnnuels: 3000,
  ccaInitial: 100000,
  apportAnnuelCCA: 16600,
  dureeActiveAns: 20,
};
