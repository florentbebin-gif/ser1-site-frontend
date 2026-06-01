import {
  getHomeMatrix,
  getSimulatorPanelDetails,
  HOME_SPACES,
  HOME_TABS,
} from '@/domain/simulators/homeMatrix';
import type {
  SimulatorDefinition,
  SimulatorModeVisibility,
  SimulatorSpace,
  SimulatorTab,
} from '@/domain/simulators/types';
import { SIM_ROUTE_CONTRACTS } from '@/routes/simRouteContracts';
import type { SimRouteContract } from '@/routes/simRouteContracts';

export type HomeGuideMode = Extract<SimulatorModeVisibility, 'simplifie' | 'expert'>;

export interface HomeGuideAction {
  id: 'strategy' | 'scan';
  title: string;
  subtitle: string;
  to: string | null;
  disabledReason?: string;
}

export interface HomeGuideCard {
  definition: SimulatorDefinition;
  route: SimRouteContract | null;
  statusLabel: string;
}

export interface HomeGuideFamily {
  name: string;
  cards: HomeGuideCard[];
}

export interface HomeGuideTab {
  id: SimulatorTab;
  label: string;
  families: HomeGuideFamily[];
  hasCards: boolean;
}

export interface HomeGuideSpace {
  id: SimulatorSpace;
  label: string;
  tabs: HomeGuideTab[];
}

export interface HomeGuideState {
  spaces: HomeGuideSpace[];
  allCards: HomeGuideCard[];
}

export interface HomeGuidePanelItem {
  definition: SimulatorDefinition;
  route: SimRouteContract | null;
  statusLabel: string;
  selectable: boolean;
}

export interface HomeGuidePanel {
  simulator: HomeGuidePanelItem;
  upstream: HomeGuidePanelItem[];
  next: HomeGuidePanelItem[];
  futureDependencies: HomeGuidePanelItem[];
}

export const HOME_PRIMARY_ACTIONS: readonly HomeGuideAction[] = [
  {
    id: 'strategy',
    title: 'Nouvelle stratégie',
    subtitle: 'Créer un audit manuel puis comparer les scénarios.',
    to: '/audit',
  },
  {
    id: 'scan',
    title: 'Scan documentaire',
    subtitle: 'Préparer le dossier à partir des pièces client.',
    to: null,
    disabledReason: 'OCR et revue documentaire prévus dans une PR dédiée.',
  },
] as const;

const ROUTES_BY_ID = new Map<string, SimRouteContract>(
  SIM_ROUTE_CONTRACTS.map((route) => [route.id, route]),
);

export function buildHomeGuideState(mode: HomeGuideMode): HomeGuideState {
  const spaces = getHomeMatrix(mode).map<HomeGuideSpace>((space) => ({
    id: space.space,
    label: HOME_SPACES.find((entry) => entry.id === space.space)?.label ?? space.label,
    tabs: HOME_TABS.map((tab) => {
      const sourceTab = space.tabs.find((entry) => entry.tab === tab.id);
      const families =
        sourceTab?.families
          .map<HomeGuideFamily>((family) => ({
            name: family.family,
            cards: family.simulators.map(toHomeGuideCard),
          }))
          .filter((family) => family.cards.length > 0) ?? [];

      return {
        id: tab.id,
        label: tab.label,
        families,
        hasCards: families.some((family) => family.cards.length > 0),
      };
    }),
  }));

  return {
    spaces,
    allCards: spaces.flatMap((space) =>
      space.tabs.flatMap((tab) => tab.families.flatMap((family) => family.cards)),
    ),
  };
}

export function buildHomeGuidePanel(id: string): HomeGuidePanel {
  const details = getSimulatorPanelDetails(id);

  return {
    simulator: toHomeGuidePanelItem(details.simulator),
    upstream: details.upstream.map(toHomeGuidePanelItem),
    next: details.next.map(toHomeGuidePanelItem),
    futureDependencies: details.futureDependencies.map(toHomeGuidePanelItem),
  };
}

export function getSimulatorRoute(definition: SimulatorDefinition): SimRouteContract | null {
  if (!definition.routeId) return null;
  return ROUTES_BY_ID.get(definition.routeId) ?? null;
}

function toHomeGuideCard(definition: SimulatorDefinition): HomeGuideCard {
  return {
    definition,
    route: getSimulatorRoute(definition),
    statusLabel: getStatusLabel(definition),
  };
}

function toHomeGuidePanelItem(definition: SimulatorDefinition): HomeGuidePanelItem {
  return {
    definition,
    route: getSimulatorRoute(definition),
    statusLabel: getStatusLabel(definition),
    selectable: definition.lifecycle === 'active' || definition.lifecycle === 'hub',
  };
}

function getStatusLabel(definition: SimulatorDefinition): string {
  switch (definition.lifecycle) {
    case 'active':
      return 'Disponible';
    case 'hub':
      return 'Parcours';
    case 'placeholder':
      return 'À cadrer';
    case 'expertOnly':
      return 'Expert';
    case 'internalOnly':
      return 'Dossier interne';
    case 'planned':
      return 'Étape future';
  }
}
