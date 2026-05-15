export interface PerTransfertSynthesisRow {
  label: string;
  currentContract: string;
  newPer: string;
  capitalExit: string;
}

export interface PerTransfertSynthesisSlideSpec {
  type: 'per-transfert-synthesis';
  title: string;
  subtitle: string;
  rows: PerTransfertSynthesisRow[];
  legalNote?: string;
}
