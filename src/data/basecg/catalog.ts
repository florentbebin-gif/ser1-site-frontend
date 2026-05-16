import { BASECG_CATALOG as GENERATED_BASECG_CATALOG, BASECG_EXTRACTED_COUNT, BASECG_VERSION } from './catalog.generated';
import { PREFON_2025 } from './prefon';
import type { BaseCgRetraiteContract, BaseCgRetraiteContractType, PerTransfertCompartment } from './types';

const POINTS_CONTRACT_IDS = new Set(
  GENERATED_BASECG_CATALOG
    .filter((contract) => contract.typeContrat === 'PER_POINTS')
    .map((contract) => contract.id),
);

function resolveGeneratedCompartment(contract: BaseCgRetraiteContract): PerTransfertCompartment {
  if (contract.perCompartment) return contract.perCompartment;
  if (/non d[eé]duit/i.test(contract.nomContrat)) return 'C1_BIS';
  if (contract.typeContrat === 'ARTICLE83') return 'C3';
  if (contract.typeContrat === 'PERCO') return 'C2';
  return 'C1';
}

export const BASECG_CATALOG: BaseCgRetraiteContract[] = GENERATED_BASECG_CATALOG.map((contract) => ({
  ...contract,
  perCompartment: resolveGeneratedCompartment(contract),
  pointsParams: POINTS_CONTRACT_IDS.has(contract.id) ? PREFON_2025 : null,
}));

export { BASECG_EXTRACTED_COUNT, BASECG_VERSION };

export function listBaseCgTypes(catalog: BaseCgRetraiteContract[] = BASECG_CATALOG): BaseCgRetraiteContractType[] {
  return Array.from(new Set(catalog.map((contract) => contract.typeContrat))).sort();
}

export function listBaseCgCompagnies(
  typeContrat: BaseCgRetraiteContractType | '',
  catalog: BaseCgRetraiteContract[] = BASECG_CATALOG,
): string[] {
  return Array.from(
    new Set(
      catalog
        .filter((contract) => !typeContrat || contract.typeContrat === typeContrat)
        .map((contract) => contract.compagnie),
    ),
  ).sort((left, right) => left.localeCompare(right, 'fr-FR'));
}

export function findBaseCgContractById(
  id: string,
  catalog: BaseCgRetraiteContract[] = BASECG_CATALOG,
): BaseCgRetraiteContract | null {
  return catalog.find((contract) => contract.id === id) ?? null;
}
