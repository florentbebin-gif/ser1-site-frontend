import type {
  SuccessionCivilContext,
  SuccessionPatrimonialContext,
  SuccessionPrimarySide,
} from './successionDraft';
import type { SuccessionLiquidationContext } from './successionDraft';

type SuccessionChainOrder = SuccessionPrimarySide;

export interface SuccessionParticipationAcquetsSummary {
  configured: boolean;
  active: boolean;
  useCurrentAssetsAsFinalPatrimony: boolean;
  patrimoineOriginaireEpoux1: number;
  patrimoineOriginaireEpoux2: number;
  patrimoineFinalEpoux1: number;
  patrimoineFinalEpoux2: number;
  acquetsEpoux1: number;
  acquetsEpoux2: number;
  creditor: SuccessionPrimarySide | null;
  debtor: SuccessionPrimarySide | null;
  quoteAppliedPct: number;
  creanceAmount: number;
  firstEstateAdjustment: number;
  warnings: string[];
}

interface ComputeSuccessionParticipationAcquetsSummaryInput {
  civil: SuccessionCivilContext;
  regimeUsed: 'separation_biens' | 'communaute_legale' | 'communaute_universelle' | null;
  order: SuccessionChainOrder;
  liquidation: SuccessionLiquidationContext;
  patrimonial?: Partial<Pick<SuccessionPatrimonialContext, 'participationAcquets'>>;
}

function asAmount(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, num);
}

function getOtherSide(side: SuccessionPrimarySide): SuccessionPrimarySide {
  return side === 'epoux1' ? 'epoux2' : 'epoux1';
}

export function computeSuccessionParticipationAcquetsSummary({
  civil,
  regimeUsed,
  order,
  liquidation,
  patrimonial,
}: ComputeSuccessionParticipationAcquetsSummaryInput): SuccessionParticipationAcquetsSummary | null {
  const configured = civil.situationMatrimoniale === 'marie'
    && civil.regimeMatrimonial === 'participation_acquets'
    && regimeUsed === 'separation_biens';
  if (!configured) return null;

  const config = patrimonial?.participationAcquets;
  if (!config?.active) {
    return {
      configured: true,
      active: false,
      useCurrentAssetsAsFinalPatrimony: true,
      patrimoineOriginaireEpoux1: 0,
      patrimoineOriginaireEpoux2: 0,
      patrimoineFinalEpoux1: asAmount(liquidation.actifEpoux1),
      patrimoineFinalEpoux2: asAmount(liquidation.actifEpoux2),
      acquetsEpoux1: 0,
      acquetsEpoux2: 0,
      creditor: null,
      debtor: null,
      quoteAppliedPct: 0,
      creanceAmount: 0,
      firstEstateAdjustment: 0,
      warnings: [
        'Participation aux acquets: configuration inactive, chainage maintenu en separation de biens.',
      ],
    };
  }

  const finalEpoux1 = config.useCurrentAssetsAsFinalPatrimony
    ? asAmount(liquidation.actifEpoux1)
    : asAmount(config.patrimoineFinalEpoux1);
  const finalEpoux2 = config.useCurrentAssetsAsFinalPatrimony
    ? asAmount(liquidation.actifEpoux2)
    : asAmount(config.patrimoineFinalEpoux2);
  const originaireEpoux1 = asAmount(config.patrimoineOriginaireEpoux1);
  const originaireEpoux2 = asAmount(config.patrimoineOriginaireEpoux2);
  const acquetsEpoux1 = Math.max(0, finalEpoux1 - originaireEpoux1);
  const acquetsEpoux2 = Math.max(0, finalEpoux2 - originaireEpoux2);

  let creditor: SuccessionPrimarySide | null = null;
  let debtor: SuccessionPrimarySide | null = null;
  let quoteAppliedPct = 0;
  let creanceAmount = 0;

  if (acquetsEpoux1 > acquetsEpoux2) {
    creditor = 'epoux2';
    debtor = 'epoux1';
    quoteAppliedPct = asAmount(config.quoteEpoux2Pct);
    creanceAmount = Math.max(0, acquetsEpoux1 - acquetsEpoux2) * quoteAppliedPct / 100;
  } else if (acquetsEpoux2 > acquetsEpoux1) {
    creditor = 'epoux1';
    debtor = 'epoux2';
    quoteAppliedPct = asAmount(config.quoteEpoux1Pct);
    creanceAmount = Math.max(0, acquetsEpoux2 - acquetsEpoux1) * quoteAppliedPct / 100;
  }

  const firstEstateAdjustment = creditor === order
    ? creanceAmount
    : creditor === getOtherSide(order)
      ? -creanceAmount
      : 0;

  const warnings: string[] = [];
  if (creanceAmount > 0 && creditor && debtor) {
    warnings.push(
      `Participation aux acquets: creance de ${Math.round(creanceAmount).toLocaleString('fr-FR')} EUR due par ${debtor === 'epoux1' ? 'Epoux 1' : 'Epoux 2'} au profit de ${creditor === 'epoux1' ? 'Epoux 1' : 'Epoux 2'} (quote ${Math.round(quoteAppliedPct)} %).`,
    );
  } else {
    warnings.push('Participation aux acquets: aucune creance nette calculee sur les acquets declares.');
  }

  if (config.useCurrentAssetsAsFinalPatrimony) {
    warnings.push('Participation aux acquets: patrimoines finals derives des actifs propres actuellement saisis.');
  }
  if (asAmount(liquidation.actifCommun) > 0) {
    warnings.push('Participation aux acquets: actif commun saisi hors logique de separation, conserve hors calcul de creance.');
  }

  return {
    configured: true,
    active: true,
    useCurrentAssetsAsFinalPatrimony: config.useCurrentAssetsAsFinalPatrimony,
    patrimoineOriginaireEpoux1: originaireEpoux1,
    patrimoineOriginaireEpoux2: originaireEpoux2,
    patrimoineFinalEpoux1: finalEpoux1,
    patrimoineFinalEpoux2: finalEpoux2,
    acquetsEpoux1,
    acquetsEpoux2,
    creditor,
    debtor,
    quoteAppliedPct,
    creanceAmount,
    firstEstateAdjustment,
    warnings,
  };
}
