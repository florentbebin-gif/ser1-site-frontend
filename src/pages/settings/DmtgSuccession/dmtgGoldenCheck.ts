import type { DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
import { calculateSuccession } from '@/engine/succession';

type DmtgSettings = typeof DEFAULT_TAX_SETTINGS.dmtg;

const SCENARIO_LABEL = 'Scénario conjoint + deux enfants 600 kEUR';
const EXPECTED_TOTAL_DROITS = 16_388;
const GOLDEN_INPUT = {
  actifNetSuccession: 600_000,
  heritiers: [
    { lien: 'conjoint' as const, partSuccession: 300_000 },
    { lien: 'enfant' as const, partSuccession: 150_000 },
    { lien: 'enfant' as const, partSuccession: 150_000 },
  ],
};

export interface DmtgGoldenCheckResult {
  ok: boolean;
  scenarioLabel: string;
  expectedTotalDroits: number;
  actualTotalDroits: number | null;
  message: string;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function hasGoldenReadyLineDirecte(dmtg: unknown): dmtg is DmtgSettings {
  if (!dmtg || typeof dmtg !== 'object') return false;
  const ligneDirecte = (dmtg as Partial<DmtgSettings>).ligneDirecte;
  if (!ligneDirecte || !isFiniteNumber(ligneDirecte.abattement) || !Array.isArray(ligneDirecte.scale)) {
    return false;
  }

  return ligneDirecte.scale.length > 0 && ligneDirecte.scale.every((row) => (
    isFiniteNumber(row.from)
    && (row.to === null || isFiniteNumber(row.to))
    && isFiniteNumber(row.rate)
  ));
}

function formatEuros(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function checkDmtgGoldenScenario(dmtg: unknown): DmtgGoldenCheckResult {
  if (!hasGoldenReadyLineDirecte(dmtg)) {
    return {
      ok: false,
      scenarioLabel: SCENARIO_LABEL,
      expectedTotalDroits: EXPECTED_TOTAL_DROITS,
      actualTotalDroits: null,
      message: `${SCENARIO_LABEL} : barème ligne directe incomplet, contrôle golden impossible.`,
    };
  }

  const result = calculateSuccession({
    ...GOLDEN_INPUT,
    dmtgSettings: dmtg,
  });
  const actualTotalDroits = result.result.totalDroits;
  const ok = actualTotalDroits === EXPECTED_TOTAL_DROITS;

  return {
    ok,
    scenarioLabel: SCENARIO_LABEL,
    expectedTotalDroits: EXPECTED_TOTAL_DROITS,
    actualTotalDroits,
    message: ok
      ? ''
      : `${SCENARIO_LABEL} : attendu ${formatEuros(EXPECTED_TOTAL_DROITS)}, calcul local ${formatEuros(actualTotalDroits)}. Corrigez les paramètres DMTG avant sauvegarde.`,
  };
}
