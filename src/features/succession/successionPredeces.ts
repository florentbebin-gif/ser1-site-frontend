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
        "Participation aux acquets: approximation en separation de biens (creance de participation non modelisee).",
      ],
    };
  }
  if (selectedRegime === 'communaute_meubles_acquets') {
    return {
      regimeUsed: 'communaute_legale',
      regimeLabel: REGIMES_MATRIMONIAUX[selectedRegime].label,
      warnings: [
        'Communaute de meubles et acquets: approximation en communaute legale (regime historique simplifie).',
      ],
    };
  }
  if (selectedRegime === 'separation_biens_societe_acquets') {
    return {
      regimeUsed: 'separation_biens',
      regimeLabel: REGIMES_MATRIMONIAUX[selectedRegime].label,
      warnings: [
        "Société d'acquêts: l'audit predeces reste approxime en separation de biens ; le chainage succession applique desormais une liquidation dediee simplifiee.",
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
          'PACS indivision: approximation en communaute legale (indivision conventionnelle non liquidee finement).',
          "PACS: absence de vocation successorale legale sans testament (devolution non modelisee a ce stade).",
        ],
      };
    }
    return {
      regimeUsed: 'separation_biens',
      regimeLabel: 'PACS - separation de biens',
      warnings: [
        'PACS separation: approximation en separation de biens.',
        "PACS: absence de vocation successorale legale sans testament (devolution non modelisee a ce stade).",
      ],
    };
  }

  if (civil.situationMatrimoniale === 'concubinage') {
    return {
      regimeUsed: null,
      regimeLabel: null,
      warnings: [
        "Union libre: pas de liquidation matrimoniale. La synthese retient la succession directe du defunt simule.",
        "Union libre: les biens en indivision ne sont retenus qu'a hauteur de la quote-part du defunt (50 % par defaut dans ce module).",
      ],
    };
  }

  return {
    regimeUsed: null,
    regimeLabel: null,
    warnings: ['Ce module de liquidation matrimoniale est applicable aux couples maries ou pacses.'],
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

  // L'engine de predeces suppose un partage communautaire 50/50.
  // On ajuste donc en entree pour refleter l'attribution economique retenue.
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
      ? [`Attribution des biens communs au survivant: ${pct} % (ajustement applique au calcul).`]
      : []),
    ...(pct !== 50 && mapping.regimeUsed !== 'communaute_legale'
      ? [`Attribution des biens communs au survivant: ${pct} % (non applique pour ce regime).`]
      : []),
    ...(liquidation.nbEnfants === 0
      ? ['Aucun enfant declare: droits de succession des descendants non simules.']
      : []),
    ...calc.warnings.map((warning) => warning.message),
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
