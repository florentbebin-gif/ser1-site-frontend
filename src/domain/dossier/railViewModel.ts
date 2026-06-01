import {
  BUSINESS_JOURNEYS,
  getJourneyPosition,
  type JourneyPosition,
} from '@/domain/simulators/chainage';
import { getOptionalSimulatorDefinition } from '@/domain/simulators/registry';
import type {
  BusinessJourney,
  BusinessJourneyBranch,
  BusinessJourneyStep,
  SimulatorDefinition,
} from '@/domain/simulators/types';

import {
  WORKING_DOSSIER_VERSION,
  type DossierRailBranchView,
  type DossierRailRouteContext,
  type DossierRailStepAvailability,
  type DossierRailStepView,
  type DossierRailViewModel,
} from './types';

const PREFERRED_JOURNEY_BY_SIMULATOR_ID: Partial<Record<string, BusinessJourney['id']>> = {
  succession: 'transmission-privee',
  'donation-demembrement': 'transmission-privee',
  prevoyance: 'protection-famille',
  credit: 'protection-famille',
  per: 'retraite',
  'per-potentiel': 'retraite',
  'per-transfert': 'retraite',
  placement: 'investissement-patrimonial',
  ir: 'audit-global',
  'tresorerie-societe': 'societe-dirigeant',
  'epargne-salariale': 'societe-dirigeant',
};

export function getPreferredJourneyIdForSimulator(
  simulatorId: string,
): BusinessJourney['id'] | undefined {
  return PREFERRED_JOURNEY_BY_SIMULATOR_ID[simulatorId];
}

export function buildDossierRailViewModel(
  context: DossierRailRouteContext,
): DossierRailViewModel | null {
  if (context.kind === 'audit') {
    return buildConceptualRail(context, 'audit-objectives');
  }

  if (context.kind === 'strategy') {
    return buildConceptualRail(context, 'strategy');
  }

  if (!context.simulatorId) {
    return null;
  }

  return buildSimulatorRail(context);
}

function buildConceptualRail(
  context: DossierRailRouteContext,
  conceptualId: 'audit-objectives' | 'strategy',
): DossierRailViewModel | null {
  const journey = getJourney('audit-global');
  const currentIndex = journey.steps.findIndex(
    (step) => step.type === 'conceptual' && step.conceptualId === conceptualId,
  );
  const current = journey.steps[currentIndex];

  if (!current) {
    return null;
  }

  return {
    routeKind: context.kind,
    density: 'full',
    version: WORKING_DOSSIER_VERSION,
    journey: toJourneyView(journey),
    current: toRailStep(current, true),
    previous: toRailSteps(journey.steps.slice(0, currentIndex)),
    next: toRailSteps(journey.steps.slice(currentIndex + 1)),
    branches: [],
  };
}

function buildSimulatorRail(context: DossierRailRouteContext): DossierRailViewModel | null {
  const simulatorId = context.simulatorId;
  if (!simulatorId) {
    return null;
  }

  const preferredJourneyId =
    context.preferredJourneyId ?? getPreferredJourneyIdForSimulator(simulatorId);
  const position =
    getJourneyPosition(simulatorId, preferredJourneyId) ?? getJourneyPosition(simulatorId);

  if (position) {
    return buildFromJourneyPosition(context, position);
  }

  const simulator = getOptionalSimulatorDefinition(simulatorId);
  if (!simulator) {
    return null;
  }

  return buildFallbackRail(context, simulator);
}

function buildFromJourneyPosition(
  context: DossierRailRouteContext,
  position: JourneyPosition,
): DossierRailViewModel {
  return {
    routeKind: context.kind,
    density: 'compact',
    version: WORKING_DOSSIER_VERSION,
    journey: toJourneyView(position.journey),
    current: toRailStep(position.current, true),
    previous: toRailSteps(position.previous),
    next: toRailSteps(position.next),
    branches: toBranchViews(position.branches ?? []),
  };
}

function buildFallbackRail(
  context: DossierRailRouteContext,
  simulator: SimulatorDefinition,
): DossierRailViewModel {
  const current: BusinessJourneyStep = { type: 'simulator', simulatorId: simulator.id };
  const upstream = simulator.upstream.map(
    (simulatorId): BusinessJourneyStep => ({
      type: 'simulator',
      simulatorId,
    }),
  );
  const next = simulator.next.map(
    (simulatorId): BusinessJourneyStep => ({
      type: 'simulator',
      simulatorId,
    }),
  );

  return {
    routeKind: context.kind,
    density: 'compact',
    version: WORKING_DOSSIER_VERSION,
    journey: {
      id: 'chainage-direct',
      label: 'Chaînage direct',
      objective: simulator.objective,
    },
    current: toRailStep(current, true),
    previous: toRailSteps(upstream),
    next: toRailSteps(next),
    branches: [],
  };
}

function getJourney(id: BusinessJourney['id']): BusinessJourney {
  const journey = BUSINESS_JOURNEYS.find((entry) => entry.id === id);
  if (!journey) {
    throw new Error(`Parcours dossier introuvable : ${id}`);
  }
  return journey;
}

function toJourneyView(journey: BusinessJourney) {
  return {
    id: journey.id,
    label: journey.label,
    objective: journey.objective,
  };
}

function toBranchViews(branches: readonly BusinessJourneyBranch[]): DossierRailBranchView[] {
  return branches.map((branch) => ({
    condition: branch.condition,
    steps: toRailSteps(branch.steps),
  }));
}

function toRailSteps(steps: readonly BusinessJourneyStep[]): DossierRailStepView[] {
  return steps.map((step) => toRailStep(step, false));
}

function toRailStep(step: BusinessJourneyStep, isCurrent: boolean): DossierRailStepView {
  if (step.type === 'conceptual') {
    return {
      id: step.conceptualId,
      kind: 'conceptual',
      label: step.label,
      availability: 'conceptual',
      isCurrent,
    };
  }

  const simulator = getOptionalSimulatorDefinition(step.simulatorId);

  if (!simulator) {
    return {
      id: step.simulatorId,
      kind: 'simulator',
      label: step.simulatorId,
      availability: 'future',
      isCurrent,
    };
  }

  return {
    id: simulator.id,
    kind: 'simulator',
    label: simulator.shortLabel,
    availability: getSimulatorAvailability(simulator),
    routeId: simulator.routeId,
    lifecycle: simulator.lifecycle,
    isCurrent,
  };
}

function getSimulatorAvailability(simulator: SimulatorDefinition): DossierRailStepAvailability {
  if (simulator.lifecycle === 'internalOnly') return 'internal';
  if (simulator.lifecycle === 'active' || simulator.lifecycle === 'hub') return 'available';
  if (simulator.lifecycle === 'placeholder') return 'available';
  return 'future';
}
