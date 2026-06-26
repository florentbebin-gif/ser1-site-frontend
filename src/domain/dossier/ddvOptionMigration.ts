import type { DdvOption, DossierAudit, SituationCivile } from '@/domain/audit/types';

const LEGACY_DDV_OPTIONS: Record<string, DdvOption> = {
  quotite_disponible_pp: 'pleine_propriete_quotite',
  mixte_quart_pp_trois_quarts_us: 'mixte',
};

const DDV_OPTIONS = new Set<DdvOption>([
  'usufruit_total',
  'pleine_propriete_quotite',
  'mixte',
  'pleine_propriete_totale',
]);

interface DdvCarrier {
  ddvOptionMr?: unknown;
  ddvOptionMme?: unknown;
}

export function normalizeDdvOption(value: unknown): DdvOption | undefined {
  if (typeof value !== 'string') return undefined;
  if (value in LEGACY_DDV_OPTIONS) return LEGACY_DDV_OPTIONS[value];
  return DDV_OPTIONS.has(value as DdvOption) ? (value as DdvOption) : undefined;
}

export function normalizeSituationCivileDdvOptions(
  situationCivile: SituationCivile,
): SituationCivile {
  return normalizeDdvCarrier(situationCivile);
}

export function normalizeAuditDossierDdvOptions(dossier: DossierAudit): DossierAudit {
  return {
    ...dossier,
    situationCivile: normalizeSituationCivileDdvOptions(dossier.situationCivile),
  };
}

export function normalizeDossierRegimeDdvOptions<T extends DdvCarrier | null | undefined>(
  regime: T,
): T {
  if (!regime) return regime;
  return normalizeDdvCarrier(regime) as T;
}

function normalizeDdvCarrier<T extends DdvCarrier>(carrier: T): T {
  return {
    ...carrier,
    ddvOptionMr: normalizeDdvOption(carrier.ddvOptionMr),
    ddvOptionMme: normalizeDdvOption(carrier.ddvOptionMme),
  };
}
