export type MortalityTableCode = 'TPRV93' | 'TGF05' | 'TGH05' | 'TPG93';

export interface SingleMortalityTable {
  code: MortalityTableCode;
  type: 'single';
  base: number;
  minAge: number;
  maxAge: number;
  lx: number[];
}

export interface GenerationMortalityTable {
  code: MortalityTableCode;
  type: 'generation';
  base: number;
  minAge: number;
  maxAge: number;
  generations: Record<string, number[]>;
}

export type MortalityTable = SingleMortalityTable | GenerationMortalityTable;
