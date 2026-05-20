import {
  BASECG_CATALOG as STATIC_BASECG_CATALOG,
  BASECG_CONTRACT_COUNT,
  BASECG_VERSION,
} from './catalog.static';
import { PREFON_2025 } from './prefon';
import type {
  BaseCgRetraiteContract,
  BaseCgRetraiteContractType,
  PerTransfertCompartment,
} from './types';

const POINTS_CONTRACT_IDS = new Set(
  STATIC_BASECG_CATALOG.filter((contract) => contract.typeContrat === 'PER_POINTS').map(
    (contract) => contract.id,
  ),
);

const BASECG_COMPANY_RENAME_MAP: Record<string, string> = {
  AVIVA: 'ABEILLE',
  BPO: 'BANQUE_POPULAIRE',
  CREDIT_DU_NORD: 'SOCIETE_GENERALE',
  EPSENS: 'MALAKOFF_HUMANIS',
  GO_EPARGNE: 'EPARTIM',
  LA_MONDIALE: 'AG2R_LA_MONDIALE',
  LPA: 'LPA_PREVOYANCE',
  MNRA: 'GARANCE',
  PRIMONIAL: 'ORADEA',
  QUATREM: 'MALAKOFF_HUMANIS',
  SMA: 'SMA_BTP',
};

const BASECG_REMOVED_CONTRACT_IDS = new Set([
  'prefon-perp-prefon-retraite-41',
  'primonial-madelin-gestion-privee-promadelin-35',
  'primonial-madelin-cardif-retraite-professionnels-patrimoine-management-et-associes-36',
]);

const BASECG_REMOVED_CONTRACT_SOURCE_IDS = new Set([
  'Contrat N°35',
  'Contrat N°36',
  'Contrat N°41',
]);

const BASECG_REMOVED_CONTRACT_NAMES = new Set([
  'MADELIN- GESTION PRIVEE PROMADELIN',
  'MADELIN- CARDIF RETRAITE PROFESSIONNELS ( PATRIMOINE MANAGEMENT ET ASSOCIES)',
  'PERP- PREFON-RETRAITE',
]);

function resolveStaticCompartment(contract: BaseCgRetraiteContract): PerTransfertCompartment {
  if (contract.perCompartment) return contract.perCompartment;
  if (/non d[eé]duit/i.test(contract.nomContrat)) return 'C1_BIS';
  if (contract.typeContrat === 'ARTICLE83' || contract.typeContrat === 'PEROB') return 'C3';
  if (contract.typeContrat === 'PERCO' || contract.typeContrat === 'PERECO') return 'C2';
  return 'C1';
}

export function normalizeBaseCgRetraiteCompanyName(company: string): string {
  return BASECG_COMPANY_RENAME_MAP[company] ?? company;
}

export function normalizeBaseCgRetraiteContractCompany(
  contract: BaseCgRetraiteContract,
): BaseCgRetraiteContract {
  const compagnie = normalizeBaseCgRetraiteCompanyName(contract.compagnie);
  return compagnie === contract.compagnie ? contract : { ...contract, compagnie };
}

export function isRemovedBaseCgRetraiteContract(
  contract: Pick<BaseCgRetraiteContract, 'id' | 'sourceId' | 'nomContrat'>,
): boolean {
  return (
    BASECG_REMOVED_CONTRACT_IDS.has(contract.id) ||
    BASECG_REMOVED_CONTRACT_SOURCE_IDS.has(contract.sourceId) ||
    BASECG_REMOVED_CONTRACT_NAMES.has(contract.nomContrat)
  );
}

export const BASECG_CATALOG: BaseCgRetraiteContract[] = STATIC_BASECG_CATALOG.filter(
  (contract) => !isRemovedBaseCgRetraiteContract(contract),
).map((contract) =>
  normalizeBaseCgRetraiteContractCompany({
    ...contract,
    perCompartment: resolveStaticCompartment(contract),
    pointsParams: POINTS_CONTRACT_IDS.has(contract.id) ? PREFON_2025 : null,
  }),
);

export { BASECG_CONTRACT_COUNT, BASECG_VERSION };

export function listBaseCgTypes(
  catalog: BaseCgRetraiteContract[] = BASECG_CATALOG,
): BaseCgRetraiteContractType[] {
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

const POINTS_MARKER_PATTERN = /\bpoints?\b|pr[ée]fon/i;

/**
 * Détecte les contrats en système par points (rente acquise par unités, pas par capital).
 * Reconnaît :
 * - `typeContrat === 'PER_POINTS'` (Préfon : taggué en dur)
 * - rendementFondsEuro / repartitionUcEuro contenant "points" ou "Préfon" (COREM, Médicis, AGIPI PAIR, etc.)
 *
 * Le moteur n'implémente le calcul détaillé que pour le Préfon (via pointsParams) ;
 * les autres contrats en points produisent un warning dans `result.warnings` pour rappeler
 * que la formule Préfon n'est pas applicable telle quelle.
 */
export function isPointsContract(contract: BaseCgRetraiteContract): boolean {
  if (contract.typeContrat === 'PER_POINTS') return true;
  const rendement = contract.phaseEpargne.rendementFondsEuro;
  if (typeof rendement === 'string' && POINTS_MARKER_PATTERN.test(rendement)) return true;
  const repartition = contract.phaseEpargne.repartitionUcEuro;
  if (typeof repartition === 'string' && POINTS_MARKER_PATTERN.test(repartition)) return true;
  return false;
}
