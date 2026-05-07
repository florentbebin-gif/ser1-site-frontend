/**
 * Types PPTX du simulateur Placement.
 */

import type { BusinessIconName } from './core';

export type PlacementProductKpis = {
  envelopeLabel: string;
  effortTotal: number;
  capitalAcquis: number;
  revenusNets: number;
  transmissionNette: number;
  roi: number;
};

export type PlacementSynthesisSlideSpec = {
  type: 'placement-synthesis';
  produit1: PlacementProductKpis;
  produit2: PlacementProductKpis;
  timeline: {
    ageActuel: number;
    ageDebutLiquidation: number;
    ageAuDeces: number;
  };
};

export type PlacementDetailFlowBar = {
  gross: number;
  tax: number;
  net: number;
  taxLabel: string;
};

export type PlacementDetailGainBar = {
  capitalAcquis: number;
  versements: number;
  gains: number;
  shortfall?: number;
  revenusPercus?: number;
};

export type PlacementDetailSlideSpec = {
  type: 'placement-detail';
  title: string;
  subtitle: string;
  produit1: { label: string; metrics: Array<{ icon: BusinessIconName; label: string; value: string }>; params?: string[]; flowBar?: PlacementDetailFlowBar; gainBar?: PlacementDetailGainBar };
  produit2: { label: string; metrics: Array<{ icon: BusinessIconName; label: string; value: string }>; params?: string[]; flowBar?: PlacementDetailFlowBar; gainBar?: PlacementDetailGainBar };
  optionalNote?: string;
};

export type PlacementHypothesesSlideSpec = {
  type: 'placement-hypotheses';
  title: string;
  subtitle: string;
  sections: Array<{ icon: BusinessIconName; title: string; body: string[] }>;
};

export type PlacementProjectionSlideSpec = {
  type: 'placement-projection';
  title: string;
  subtitle: string;
  productLabel: string;
  productIndex: 1 | 2;
  phase: 'epargne' | 'liquidation';
  yearsForPage: number[];
  rows: Array<{ label: string; values: number[] }>;
  pageIndex: number;
  totalPages: number;
    deathYearIndex?: number;
};
