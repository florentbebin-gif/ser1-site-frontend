import type { BusinessJourney } from '@/domain/simulators/types';

export type DossierVersionStatus = 'draft' | 'active' | 'archived';

export type SourceRefKind = 'manual' | 'scan' | 'simulator-output' | 'strategy' | 'import';

export type SourceRefScope = 'dossier' | 'audit' | 'simulator' | 'strategy';

export type SourceRefReviewStatus = 'proposed' | 'validated' | 'rejected';

export interface SourceRef {
  id: string;
  kind: SourceRefKind;
  scope: SourceRefScope;
  label: string;
  fieldPaths: string[];
  createdAt: string | null;
  reviewStatus?: SourceRefReviewStatus;
  documentId?: string;
  simulatorId?: string;
  strategyId?: string;
  confidence?: number;
}

export interface StrategyActivation {
  id: string;
  strategyScenarioId: string;
  activatedVersionId: string;
  activatedAt: string | null;
  effectiveFrom: string | null;
  replacesVersionId?: string;
  sourceRefIds: string[];
}

export interface DossierVersion {
  id: string;
  label: string;
  versionCode: string;
  status: DossierVersionStatus;
  createdAt: string | null;
  updatedAt: string | null;
  activatedAt: string | null;
  isPersisted: boolean;
  sourceRefs: SourceRef[];
  strategyActivation: StrategyActivation | null;
}

export const WORKING_DOSSIER_VERSION: DossierVersion = {
  id: 'working-version',
  label: 'Version de travail',
  versionCode: 'Version travail',
  status: 'draft',
  createdAt: null,
  updatedAt: null,
  activatedAt: null,
  isPersisted: false,
  sourceRefs: [],
  strategyActivation: null,
};

export type DossierRailRouteKind = 'audit' | 'strategy' | 'simulator';

export interface DossierRailRouteContext {
  kind: DossierRailRouteKind;
  pathname: string;
  simulatorId?: string;
  routeId?: string;
  preferredJourneyId?: BusinessJourney['id'];
}

export type DossierRailDensity = 'full' | 'compact';

export type DossierRailStepKind = 'simulator' | 'conceptual';

export type DossierRailStepAvailability = 'available' | 'future' | 'internal' | 'conceptual';

export interface DossierRailStepView {
  id: string;
  kind: DossierRailStepKind;
  label: string;
  availability: DossierRailStepAvailability;
  routeId?: string;
  lifecycle?: string;
  isCurrent: boolean;
}

export interface DossierRailBranchView {
  condition: string;
  steps: DossierRailStepView[];
}

export interface DossierRailJourneyView {
  id: string;
  label: string;
  objective: string;
}

export interface DossierRailViewModel {
  routeKind: DossierRailRouteKind;
  density: DossierRailDensity;
  version: DossierVersion;
  journey: DossierRailJourneyView;
  current: DossierRailStepView;
  previous: DossierRailStepView[];
  next: DossierRailStepView[];
  branches: DossierRailBranchView[];
}
