/**
 * Types PPTX du simulateur PER.
 */

import type { BusinessIconName } from './core';

export type PerFiscalBracket = {
  label: string;
  rate: number;
  threshold: number | null;
};

export type PerFiscalSnapshotSlideSpec = {
  type: 'per-fiscal-snapshot';
  title: string;
  subtitle: string;
  tmiRate: number;
  activeThreshold: number | null;
  irEstime: number;
  revenuImposableFoyer: number;
  revenuImposableD1: number;
  revenuImposableD2: number;
  isCouple: boolean;
  partsNb: number;
  taxablePerPart: number;
  montantDansLaTMI: number;
  brackets: PerFiscalBracket[];
};

export type PerDeclarantValues = {
  declarant1: number;
  declarant2?: number | undefined;
};

export type PerPlafondColumn = {
  heading: string;
  iconName: BusinessIconName;
  values: PerDeclarantValues;
  caption?: string;
};

export type PerPlafond3ColSlideSpec = {
  type: 'per-plafond-3col';
  title: string;
  subtitle: string;
  variant: '163q' | 'madelin';
  intro: string;
  columns: [PerPlafondColumn, PerPlafondColumn, PerPlafondColumn];
  isCouple: boolean;
  note?: string;
};

export type PerProjectionRow = {
  label: string;
  declarant1: number | string | boolean;
  declarant2?: number | string | boolean | undefined;
};

export type PerSimulationRow = {
  label: string;
  value: number | string;
};

export type PerProjectionTableSlideSpec = {
  type: 'per-projection-table';
  title: string;
  subtitle: string;
  isCouple: boolean;
  declarationRows: PerProjectionRow[];
  avisRows: PerProjectionRow[];
  simulationRows?: PerSimulationRow[];
};
