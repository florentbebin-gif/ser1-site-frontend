import type { SuccessionLiquidationContext } from '../successionDraft';
import { makeCivilMarie, makeDevolution, makeLiquidation as makeLiquidationBase } from './fixtures';

/**
 * Les tests chainage travaillent tous avec un couple marié en communauté légale
 * comme cas de base. `makeCivil` est ré-exporté depuis `makeCivilMarie` de
 * `./fixtures`, sans logique supplémentaire.
 */
export { makeCivilMarie as makeCivil, makeDevolution };

/**
 * Variante chainage de `makeLiquidation` : patrimoine concret pour que
 * les scénarios aient un cas de base non trivial à démontrer (actifs non
 * nuls + deux enfants).
 */
const liquidationChainage = (
  overrides: Partial<SuccessionLiquidationContext> = {},
): SuccessionLiquidationContext =>
  makeLiquidationBase({
    actifEpoux1: 400000,
    actifEpoux2: 200000,
    actifCommun: 300000,
    nbEnfants: 2,
    ...overrides,
  });

export { liquidationChainage as makeLiquidation };

export const DONATION_SETTINGS = {
  rappelFiscalAnnees: 15,
  donFamilial790G: {
    montant: 31865,
    conditions: 'Donateur < 80 ans, donataire majeur',
  },
} as const;
