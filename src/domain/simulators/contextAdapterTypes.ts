import type { FieldProvenance } from './types';

export interface ContextFieldRef {
  fieldPath: string;
  provenance: FieldProvenance;
  sourceId?: string;
}

export interface SimulatorContextAdapterInput<TDossier = unknown> {
  dossier: TDossier;
  requestedFields: string[];
}

export interface SimulatorContextAdapterResult<TInputs = unknown> {
  inputs: Partial<TInputs>;
  usedFields: ContextFieldRef[];
  missingRequiredFields: string[];
  warnings: string[];
}

export interface SimulatorContextAdapter<TDossier = unknown, TInputs = unknown> {
  simulatorId: string;
  adapt(input: SimulatorContextAdapterInput<TDossier>): SimulatorContextAdapterResult<TInputs>;
}
