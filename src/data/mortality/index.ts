import { TGF05 } from './tgf05.generated';
import { TGH05 } from './tgh05.generated';
import { TPG93 } from './tpg93.generated';
import { TPRV93 } from './tprv93.generated';
import type { MortalityTable, MortalityTableCode } from './types';

export const MORTALITY_TABLES: Record<MortalityTableCode, MortalityTable> = {
  TPRV93,
  TGF05,
  TGH05,
  TPG93,
};

export type { GenerationMortalityTable, MortalityTable, MortalityTableCode, SingleMortalityTable } from './types';
