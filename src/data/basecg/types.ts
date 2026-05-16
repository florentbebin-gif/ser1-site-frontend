export type BaseCgRetraiteContractType =
  | 'PERIN'
  | 'PERP'
  | 'MADELIN'
  | 'ARTICLE83'
  | 'PERCO'
  | 'PER_POINTS'
  | 'AUTRE';

export type PerTransfertCompartment = 'C1' | 'C1_BIS' | 'C2' | 'C3';

export interface PrefonPointsParams {
  millesime: number;
  valeurAcquisition: number;
  valeurService: number;
  fraisVersementRate: number;
  fraisTransfertRate: number;
  coefAcquisitionByAge: Record<number, number>;
  coefLiquidationByAge: Record<number, number>;
  sourceLabel: string;
}

export interface BaseCgPhaseEpargne {
  dateCommercialisation: string | null;
  nombreFonds: number | string | null;
  nombreSupportsUc?: number | null;
  repartitionUcEuro: string | null;
  rendementFondsEuro: string | number | null;
  fondsEuroGarantis?: string | number | null;
  fraisVersements: string | number | null;
  fraisGestion: string | number | null;
  fraisGestionFondsEuro?: string | number | null;
  fraisGestionUc?: string | number | null;
  fraisArbitrage: string | number | null;
  fraisTransfertSortant: string | number | null;
  fraisTransfertSortantRate: number | null;
  clauseBeneficiaire: string | null;
  garantiesComplementaires: string | null;
}

export interface BaseCgPhaseLiquidation {
  ageLimiteLiquidation: string | number | null;
  sortieCapitalRetraite: string | null;
  fractionnementCapital: string | null;
  rachatLibre: string | null;
  tableConversionRente: string | null;
  tableGarantieAdhesion: string | null;
  tauxTechnique: string | number | null;
  fraisArrerages: string | number | null;
  fraisArreragesRate: number | null;
  annuitesGaranties: string | null;
  reversionPossible: string | null;
  reversionIncluse: string | null;
  renteEstimee: string | number | null;
}

export interface BaseCgRetraiteDocument {
  id: string;
  label: string;
  type: 'conditions_generales' | 'notice_information' | 'avenant' | 'autre';
  sourceUrl?: string;
  status: 'missing' | 'linked' | 'uploaded';
  uploadedAt?: string;
}

export interface BaseCgRetraiteContract {
  id: string;
  sourceId: string;
  compagnie: string;
  nomContrat: string;
  typeContrat: BaseCgRetraiteContractType;
  perCompartment?: PerTransfertCompartment | null;
  phaseEpargne: BaseCgPhaseEpargne;
  phaseLiquidation: BaseCgPhaseLiquidation;
  documents?: BaseCgRetraiteDocument[];
  pointsParams?: PrefonPointsParams | null;
}
