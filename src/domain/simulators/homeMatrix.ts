import { isHomeCardLifecycle, SIMULATOR_DEFINITIONS } from './registry';
import type {
  SimulatorDefinition,
  SimulatorModeVisibility,
  SimulatorSpace,
  SimulatorTab,
} from './types';

export const HOME_SPACES = [
  { id: 'foyer', label: 'Foyer & patrimoine privé' },
  { id: 'societe', label: 'Société & dirigeant' },
] as const satisfies readonly { id: SimulatorSpace; label: string }[];

export const HOME_TABS = [
  { id: 'comprendre', label: 'Comprendre' },
  { id: 'piloter', label: 'Piloter' },
  { id: 'proteger', label: 'Protéger & transmettre' },
] as const satisfies readonly { id: SimulatorTab; label: string }[];

export interface HomeFamilyGroup {
  family: string;
  simulators: SimulatorDefinition[];
}

export interface HomeTabGroup {
  tab: SimulatorTab;
  label: string;
  families: HomeFamilyGroup[];
}

export interface HomeSpaceGroup {
  space: SimulatorSpace;
  label: string;
  tabs: HomeTabGroup[];
}

export function isVisibleInMode(
  simulator: SimulatorDefinition,
  mode: SimulatorModeVisibility,
): boolean {
  if (mode === 'internal') return true;
  if (simulator.visibility === 'internal') return false;
  if (mode === 'simplifie') return simulator.visibility === 'simplifie';
  return simulator.visibility === 'simplifie' || simulator.visibility === 'expert';
}

export function getHomeCardSimulators(
  mode: SimulatorModeVisibility = 'simplifie',
): SimulatorDefinition[] {
  return SIMULATOR_DEFINITIONS.filter((simulator) =>
    isHomeCardLifecycle(simulator.lifecycle),
  ).filter((simulator) => isVisibleInMode(simulator, mode));
}

export function getHomeMatrix(mode: SimulatorModeVisibility = 'simplifie'): HomeSpaceGroup[] {
  const cards = getHomeCardSimulators(mode);

  return HOME_SPACES.map((space) => ({
    space: space.id,
    label: space.label,
    tabs: HOME_TABS.map((tab) => {
      const tabCards = cards.filter(
        (simulator) => simulator.space === space.id && simulator.tab === tab.id,
      );
      const familyNames = [...new Set(tabCards.map((simulator) => simulator.family ?? 'Autres'))];

      return {
        tab: tab.id,
        label: tab.label,
        families: familyNames.map((family) => ({
          family,
          simulators: tabCards.filter((simulator) => (simulator.family ?? 'Autres') === family),
        })),
      };
    }),
  }));
}
