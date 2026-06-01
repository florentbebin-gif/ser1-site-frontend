export type SimulatorLifecycle =
  | 'active'
  | 'hub'
  | 'placeholder'
  | 'planned'
  | 'expertOnly'
  | 'internalOnly';

export type SimulatorSpace = 'foyer' | 'societe';
export type SimulatorTab = 'comprendre' | 'piloter' | 'proteger';
export type SimulatorModeVisibility = 'simplifie' | 'expert' | 'internal';

export type FieldProvenance =
  | 'manual'
  | 'dossier'
  | 'scan'
  | 'simulatorOutput'
  | 'strategy'
  | 'defaultFiscalSettings';

export interface SimulatorContextPolicy {
  canRunStandalone: boolean;
  canUseDossierContext: boolean;
  requiredForStandalone: string[];
  requiredFromDossier: string[];
  optionalFromDossier: string[];
  missingFieldsBehavior: 'block' | 'warn' | 'ask';
  writeBackPolicy: 'never' | 'ask' | 'autoOutputOnly';
}

export interface SimulatorDefinition {
  id: string;
  routeId?: string;
  path?: `/sim/${string}`;
  space: SimulatorSpace;
  tab: SimulatorTab;
  family?: string;
  shortLabel: string;
  fullLabel: string;
  objective: string;
  inputs: string[];
  calculates: string[];
  outputs: string[];
  upstream: string[];
  next: string[];
  dossierFields: string[];
  legalRefs: string[];
  legalRefsStatus?: 'complete' | 'a-renseigner-avant-codage';
  testScenarios: string[];
  contextPolicy: SimulatorContextPolicy;
  subtypes?: string[];
  lifecycle: SimulatorLifecycle;
  visibility: SimulatorModeVisibility;
  engine?: string;
}

export type ConceptualJourneyStepId = 'strategy' | 'audit-objectives';

export type BusinessJourneyStep =
  | {
      type: 'simulator';
      simulatorId: string;
    }
  | {
      type: 'conceptual';
      conceptualId: ConceptualJourneyStepId;
      label: string;
    };

export interface BusinessJourneyBranch {
  condition: string;
  steps: BusinessJourneyStep[];
}

export interface BusinessJourney {
  id:
    | 'audit-global'
    | 'transmission-privee'
    | 'protection-famille'
    | 'retraite'
    | 'investissement-patrimonial'
    | 'immobilier'
    | 'societe-dirigeant'
    | 'transmission-entreprise'
    | 'cession-reemploi';
  label: string;
  objective: string;
  steps: BusinessJourneyStep[];
  branches?: BusinessJourneyBranch[];
}
