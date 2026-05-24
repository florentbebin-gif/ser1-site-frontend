export interface PrevoyanceRoChartSlideSpec {
  type: 'prevoyance-ro-chart';
  title: string;
  subtitle: string;
  regimeLabels: string[];
  arretRows: Array<{
    label: string;
    segments: Array<{ label: string; valuePct: number }>;
    totalPct: number;
  }>;
  invaliditeRows: Array<{
    label: string;
    segments: Array<{ label: string; valuePct: number }>;
    totalPct: number;
  }>;
  decesCapitalLabel: string;
}

export interface PrevoyanceContractsTableSlideSpec {
  type: 'prevoyance-contracts-table';
  title: string;
  subtitle: string;
  modeLabel: string;
  columns: string[];
  rows: Array<{
    label: string;
    values: string[];
  }>;
}
