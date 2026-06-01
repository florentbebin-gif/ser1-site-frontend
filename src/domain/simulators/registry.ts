import { FOYER_COMPRENDRE_SIMULATORS } from './definitions/foyerComprendre';
import { FOYER_PILOTER_SIMULATORS } from './definitions/foyerPiloter';
import { FOYER_PROTEGER_SIMULATORS } from './definitions/foyerProteger';
import { SOCIETE_SIMULATORS } from './definitions/societe';
import type { SimulatorDefinition } from './types';

export const SIMULATOR_REGISTRY = [
  ...FOYER_COMPRENDRE_SIMULATORS,
  ...FOYER_PILOTER_SIMULATORS,
  ...FOYER_PROTEGER_SIMULATORS,
  ...SOCIETE_SIMULATORS,
] as const satisfies readonly SimulatorDefinition[];

export type SimulatorId = (typeof SIMULATOR_REGISTRY)[number]['id'];
export type RouteBackedSimulatorDefinition = Extract<
  (typeof SIMULATOR_REGISTRY)[number],
  { routeId: string }
>;

export const SIMULATOR_DEFINITIONS: readonly SimulatorDefinition[] = SIMULATOR_REGISTRY;

export function getSimulatorDefinition(id: string): SimulatorDefinition {
  const definition = SIMULATOR_DEFINITIONS.find((simulator) => simulator.id === id);
  if (!definition) {
    throw new Error(`Simulateur introuvable : ${id}`);
  }
  return definition;
}

export function getOptionalSimulatorDefinition(id: string): SimulatorDefinition | null {
  return SIMULATOR_DEFINITIONS.find((simulator) => simulator.id === id) ?? null;
}

export function isHomeCardLifecycle(lifecycle: SimulatorDefinition['lifecycle']): boolean {
  return lifecycle === 'active' || lifecycle === 'hub' || lifecycle === 'placeholder';
}
