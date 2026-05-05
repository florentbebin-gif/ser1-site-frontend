/**
 * Specs PPTX Trésorerie société IS.
 */

export type TresorerieSchemaSlideSpec = {
  type: 'treso-schema';
  title: string;
  subtitle: string;
  typeCreation: 'newco' | 'existante';
  hasHolding: boolean;
  hasDistribution: boolean;
  hasCapitalisation: boolean;
  hasAllocationMatrix?: boolean;
  hasCreditIR: boolean;
  hasCreditIS: boolean;
  ccaTotalConstitue: number;
  isTotalDecaisse: number;
  isLatentCapi: number;
  revenusNetsRetraite: number;
  valeurNetteSocieteRetraite: number;
  dureeRemboursementCCA: number | null;
};

export type TresorerieProjectionSlideSpec = {
  type: 'treso-projection';
  title: string;
  subtitle: string;
  yearsForPage: number[];
  rows: Array<{ label: string; values: number[] }>;
  pageIndex: number;
  totalPages: number;
  /** Index 1-based de l'année de retraite pour mise en évidence. */
  retraiteYearIndex?: number;
};
