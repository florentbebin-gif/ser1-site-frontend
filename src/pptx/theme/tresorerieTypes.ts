/**
 * Specs PPTX Trésorerie société IS.
 */

import type { CompanyInput } from '@/engine/tresorerie/types';

export type TresorerieSchemaSlideSpec = {
  type: 'treso-schema';
  title: string;
  subtitle: string;
  typeCreation: 'newco' | 'existante';
  orgchartCompany: CompanyInput;
  companyKindLabel?: string;
  companyKindCode?: string;
  associates?: Array<{
    label: string;
    kind: 'pp' | 'pm';
    capitalPct: string;
    economicRightsPct: string;
  }>;
  subsidiaries?: Array<{
    label: string;
    parentEntityId: string;
    ownershipPct: string;
  }>;
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
