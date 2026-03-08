import { REGIMES_MATRIMONIAUX, type DmtgSettings, type RegimeMatrimonial } from '../../engine/civil';
import { calculatePredecesSenarios, type PredecesScenariosResult } from '../../engine/succession';
import type { CalcResult } from '../../engine/types';
import {
  DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
  type SuccessionCivilContext,
  type SuccessionLiquidationContext,
} from './successionDraft';

type SupportedRegime = 'communaute_legale' | 'separation_biens' | 'communaute_universelle';

export interface SuccessionPredecesAnalysis {
  applicable: boolean;
  regimeUsed: SupportedRegime | null;
  regimeLabel: string | null;
  liquidation: SuccessionLiquidationContext;
  warnings: string[];
  calc: CalcResult<PredecesScenariosResult> | null;
}

interface RegimeMapping {
  regimeUsed: SupportedRegime | null;
  regimeLabel: string | null;
  warnings: string[];
}

function asAmount(value: unknown, fallback = 0): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, num);
}

function asChildrenCount(value: unknown, fallback = 1): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.floor(num));
}

function normalizeLiquidationContext(input?: Partial<SuccessionLiquidationContext>): SuccessionLiquidationContext {
  return {
    actifEpoux1: asAmount(input?.actifEpoux1, DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT.actifEpoux1),
    actifEpoux2: asAmount(input?.actifEpoux2, DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT.actifEpoux2),
    actifCommun: asAmount(input?.actifCommun, DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT.actifCommun),
    nbEnfants: asChildrenCount(input?.nbEnfants, DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT.nbEnfants),
  };
}

function mapMarriedRegime(regime: RegimeMatrimonial | null): RegimeMapping {
  const selectedRegime = regime ?? 'communaute_legale';
  if (selectedRegime === 'participation_acquets') {
    return {
      regimeUsed: 'separation_biens',
      regimeLabel: REGIMES_MATRIMONIAUX[selectedRegime].label,
      warnings: [
        'Participation aux acquêts: approximation en séparation de biens (créance de participation non modélisée).',
      ],
    };
  }
  if (selectedRegime === 'communaute_meubles_acquets') {
    return {
      regimeUsed: 'communaute_legale',
      regimeLabel: REGIMES_MATRIMONIAUX[selectedRegime].label,
      warnings: [
        'Communauté de meubles et acquêts: approximation en communauté légale (régime historique simplifié).',
      ],
    };
  }
  return {
    regimeUsed: selectedRegime as SupportedRegime,
    regimeLabel: REGIMES_MATRIMONIAUX[selectedRegime].label,
    warnings: [],
  };
}

function mapCivilToPredecesRegime(civil: SuccessionCivilContext): RegimeMapping {
  if (civil.situationMatrimoniale === 'marie') {
    return mapMarriedRegime(civil.regimeMatrimonial);
  }

  if (civil.situationMatrimoniale === 'pacse') {
    if (civil.pacsConvention === 'indivision') {
      return {
        regimeUsed: 'communaute_legale',
        regimeLabel: 'PACS - indivision conventionnelle',
        warnings: [
          'PACS indivision: approximation en communauté légale (indivision conventionnelle non liquidée finement).',
          'PACS: absence de vocation successorale légale sans testament (dévolution non modélisée à ce stade).',
        ],
      };
    }
    return {
      regimeUsed: 'separation_biens',
      regimeLabel: 'PACS - séparation de biens',
      warnings: [
        'PACS séparation: approximation en séparation de biens.',
        'PACS: absence de vocation successorale légale sans testament (dévolution non modélisée à ce stade).',
      ],
    };
  }

  if (civil.situationMatrimoniale === 'concubinage') {
    return {
      regimeUsed: null,
      regimeLabel: null,
      warnings: [
        'Union libre: pas de liquidation matrimoniale. La synthèse retient la succession directe du défunt simulé.',
        'Union libre: les biens en indivision ne sont retenus qu’à hauteur de la quote-part du défunt (50 % par défaut dans ce module).',
      ],
    };
  }

  return {
    regimeUsed: null,
    regimeLabel: null,
    warnings: ['Ce module de liquidation matrimoniale est applicable aux couples mariés ou pacsés.'],
  };
}

export function buildSuccessionPredecesAnalysis(
  civil: SuccessionCivilContext,
  liquidationInput: Partial<SuccessionLiquidationContext> | undefined,
  dmtgSettings: DmtgSettings,
  attributionBiensCommunsPct = 50,
): SuccessionPredecesAnalysis {
  const liquidation = normalizeLiquidationContext(liquidationInput);
  const mapping = mapCivilToPredecesRegime(civil);

  if (!mapping.regimeUsed) {
    return {
      applicable: false,
      regimeUsed: null,
      regimeLabel: null,
      liquidation,
      warnings: mapping.warnings,
      calc: null,
    };
  }

  // Ajustement de l'actifCommun pour refléter l'attribution %
  // L'engine hardcode un 50/50, on pré-ajuste pour obtenir le bon résultat économique
  const pct = Math.min(100, Math.max(0, attributionBiensCommunsPct));
  const adjustedActifCommun = mapping.regimeUsed === 'communaute_legale'
    ? liquidation.actifCommun * 2 * (100 - pct) / 100
    : liquidation.actifCommun;

  const calc = calculatePredecesSenarios({
    actifMr: liquidation.actifEpoux1,
    actifMme: liquidation.actifEpoux2,
    actifCommun: adjustedActifCommun,
    nbEnfants: liquidation.nbEnfants,
    regime: mapping.regimeUsed,
    dmtgSettings,
  });

  const warnings = [
    ...mapping.warnings,
    ...(pct !== 50 && mapping.regimeUsed === 'communaute_legale'
      ? [`Attribution des biens communs au survivant: ${pct} % (ajustement appliqué au calcul).`]
      : []),
    ...(pct !== 50 && mapping.regimeUsed !== 'communaute_legale'
      ? [`Attribution des biens communs au survivant: ${pct} % (non appliqué pour ce régime).`]
      : []),
    ...(liquidation.nbEnfants === 0 ? ['Aucun enfant déclaré: droits de succession des descendants non simulés.'] : []),
    ...calc.warnings.map((w) => w.message),
  ];

  return {
    applicable: true,
    regimeUsed: mapping.regimeUsed,
    regimeLabel: mapping.regimeLabel,
    liquidation,
    warnings,
    calc,
  };
}
