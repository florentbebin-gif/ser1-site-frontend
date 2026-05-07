/**
 * Types PPTX du simulateur Succession.
 */

import type { BusinessIconName } from './core';

export type SuccessionKpi = {
  icon: BusinessIconName;
  label: string;
  value: string;
  caption?: string;
};

export type SuccessionBeneficiarySummary = {
  label: string;
  gross: string;
  tax: string;
  net?: string;
  exonerated?: boolean;
};

export type SuccessionSynthesisSlideSpec = {
  type: 'succession-synthesis';
  title: string;
  subtitle: string;
  heroLabel: string;
  heroValue: string;
  heroCaption?: string;
  kpis: [SuccessionKpi, SuccessionKpi, SuccessionKpi, SuccessionKpi];
};

export type SuccessionFiliationNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: string;
  deceased?: boolean;
};

export type SuccessionFiliationEdge = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dashed?: boolean;
};

export type SuccessionFiliationGroup = {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
};

export type SuccessionFiliationLayout = {
  nodes: SuccessionFiliationNode[];
  edges: SuccessionFiliationEdge[];
  groups: SuccessionFiliationGroup[];
  svgWidth: number;
  svgHeight: number;
};

export type SuccessionFamilyContextSlideSpec = {
  type: 'succession-family-context';
  title: string;
  subtitle: string;
  situationLabel: string;
  regimeLabel?: string;
  pacsConventionLabel?: string;
  dispositions: string[];
  filiation: SuccessionFiliationLayout;
};

export type SuccessionChronologyStepSummary = {
  title: string;
  subtitle: string;
  masseTransmise: string;
  partConjoint: string;
  autresBeneficiaires: string;
  droitsSuccession: string;
  droitsHorsSuccession?: string;
  beneficiaries: SuccessionBeneficiarySummary[];
};

export type SuccessionChronologySlideSpec = {
  type: 'succession-chronology';
  title: string;
  subtitle: string;
  applicable: boolean;
  orderLabel: string;
  steps: SuccessionChronologyStepSummary[];
  totalDroits: string;
};

export type SuccessionHypothesesSlideSpec = {
  type: 'succession-hypotheses';
  title: string;
  subtitle: string;
  items: string[];
  groups?: Array<{
    title: string;
    items: string[];
  }>;
};

export type SuccessionAnnexBeneficiaryRow = {
  label: string;
  capitauxDecesNets: number;
  droitsAssuranceVie990I: number;
  droitsSuccession: number;
  transmissionNetteSuccession: number;
  exonerated?: boolean;
  isTotal?: boolean;
};

export type SuccessionAnnexStep = {
  title: string;
  beneficiaries: SuccessionAnnexBeneficiaryRow[];
};

export type SuccessionAnnexTableSlideSpec = {
  type: 'succession-annex-table';
  title: string;
  subtitle: string;
  steps: SuccessionAnnexStep[];
};

export type SuccessionAssetAnnexColumn = {
  key: string;
  label: string;
};

export type SuccessionAssetAnnexRow = {
  label: string;
  values: number[];
};

export type SuccessionAssetAnnexSlideSpec = {
  type: 'succession-annex-assets';
  title: string;
  subtitle: string;
  columns: SuccessionAssetAnnexColumn[];
  rows: SuccessionAssetAnnexRow[];
};
