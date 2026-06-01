import type { SimulatorContextPolicy } from './types';

export const standalone = (
  requiredForStandalone: string[],
  requiredFromDossier: string[],
  optionalFromDossier: string[],
  missingFieldsBehavior: SimulatorContextPolicy['missingFieldsBehavior'] = 'ask',
): SimulatorContextPolicy => ({
  canRunStandalone: true,
  canUseDossierContext: true,
  requiredForStandalone,
  requiredFromDossier,
  optionalFromDossier,
  missingFieldsBehavior,
  writeBackPolicy: 'ask',
});

export const dossierFirst = (
  requiredFromDossier: string[],
  optionalFromDossier: string[] = [],
): SimulatorContextPolicy => ({
  canRunStandalone: false,
  canUseDossierContext: true,
  requiredForStandalone: [],
  requiredFromDossier,
  optionalFromDossier,
  missingFieldsBehavior: 'block',
  writeBackPolicy: 'ask',
});
