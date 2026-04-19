import { DEFAULT_DMTG } from '../../../engine/civil';
import type {
  SuccessionCivilContext,
  SuccessionDevolutionContext,
  SuccessionEnfant,
  SuccessionLiquidationContext,
} from '../successionDraft';
import { buildSuccessionDevolutionAnalysis } from '../successionDevolution';
import {
  buildSuccessionDirectDisplayAnalysis,
  computeSuccessionDirectEstateBasis,
} from '../successionDisplay';

import { makeCivil, makeDevolution, makeLiquidation } from './fixtures';

export { makeCivil, makeDevolution, makeLiquidation };

export function buildDirectAnalysis(options: {
  civil: SuccessionCivilContext;
  liquidation: SuccessionLiquidationContext;
  devolutionContext?: SuccessionDevolutionContext;
  enfantsContext?: SuccessionEnfant[];
  familyMembers?: Parameters<typeof buildSuccessionDevolutionAnalysis>[5];
  order?: 'epoux1' | 'epoux2';
  actifNetSuccession?: number;
}) {
  const devolutionContext = options.devolutionContext ?? makeDevolution({});
  const enfantsContext = options.enfantsContext ?? [];
  const familyMembers = options.familyMembers ?? [];
  const order = options.order ?? 'epoux1';
  const basis = computeSuccessionDirectEstateBasis(options.civil, options.liquidation, order);
  const actifNetSuccession = options.actifNetSuccession ?? basis.actifNetSuccession;
  const devolution = buildSuccessionDevolutionAnalysis(
    options.civil,
    options.liquidation.nbEnfants,
    devolutionContext,
    actifNetSuccession,
    enfantsContext,
    familyMembers,
    { simulatedDeceased: order },
  );

  return buildSuccessionDirectDisplayAnalysis({
    civil: options.civil,
    devolution,
    devolutionContext,
    dmtgSettings: DEFAULT_DMTG,
    enfantsContext,
    familyMembers,
    order,
    actifNetSuccession,
    baseWarnings: basis.warnings,
  });
}
