import type { BaseCgRetraiteContract } from '@/data/basecg';

export interface PerTransfertSynthesisRow {
  label: string;
  keepScenario: string;
  transferScenario: string;
  difference: string;
}

export interface PerTransfertSynthesisSlideSpec {
  type: 'per-transfert-synthesis';
  title: string;
  subtitle: string;
  rows: PerTransfertSynthesisRow[];
  legalNote?: string;
}

export interface PerTransfertAuditContractSlideSpec {
  type: 'per-transfert-audit-contract';
  title: string;
  subtitle?: string;
  contract: BaseCgRetraiteContract;
}
