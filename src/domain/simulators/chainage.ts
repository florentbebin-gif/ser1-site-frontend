import { getOptionalSimulatorDefinition } from './registry';
import type { BusinessJourney, BusinessJourneyStep, SimulatorDefinition } from './types';

const simulatorStep = (simulatorId: string): BusinessJourneyStep => ({
  type: 'simulator',
  simulatorId,
});

const conceptualStep = (
  conceptualId: 'strategy' | 'audit-objectives',
  label: string,
): BusinessJourneyStep => ({
  type: 'conceptual',
  conceptualId,
  label,
});

export const BUSINESS_JOURNEYS: readonly BusinessJourney[] = [
  {
    id: 'audit-global',
    label: 'Audit global',
    objective: 'Constituer le dossier patrimonial complet avant stratégie.',
    steps: [
      simulatorStep('filiation'),
      simulatorStep('regime-matrimonial'),
      simulatorStep('donations-anterieures'),
      simulatorStep('budget'),
      simulatorStep('ir'),
      simulatorStep('ifi'),
      simulatorStep('actif-passif'),
      simulatorStep('prevoyance'),
      simulatorStep('retraite'),
      simulatorStep('placement'),
      simulatorStep('succession'),
      conceptualStep('audit-objectives', 'Objectifs client'),
      conceptualStep('strategy', 'Stratégie'),
    ],
  },
  {
    id: 'transmission-privee',
    label: 'Transmission privée',
    objective: 'Préparer la transmission familiale et la liquidité successorale.',
    steps: [
      simulatorStep('filiation'),
      simulatorStep('regime-matrimonial'),
      simulatorStep('donations-anterieures'),
      simulatorStep('succession'),
      simulatorStep('donation-demembrement'),
      simulatorStep('succession'),
      simulatorStep('prevoyance'),
    ],
    branches: [
      {
        condition: 'Assurance-vie ou capitalisation',
        steps: [simulatorStep('placement'), simulatorStep('succession')],
      },
      {
        condition: 'Immobilier familial',
        steps: [simulatorStep('sci'), simulatorStep('donation-demembrement')],
      },
      {
        condition: 'IFI important',
        steps: [
          simulatorStep('ifi'),
          simulatorStep('donation-demembrement'),
          simulatorStep('arbitrage-reemploi'),
        ],
      },
    ],
  },
  {
    id: 'protection-famille',
    label: 'Protection famille',
    objective: 'Identifier les personnes à protéger, les dettes et les garanties nécessaires.',
    steps: [
      simulatorStep('filiation'),
      simulatorStep('regime-matrimonial'),
      simulatorStep('budget'),
      simulatorStep('credit'),
      simulatorStep('prevoyance'),
      simulatorStep('succession'),
      simulatorStep('placement'),
    ],
  },
  {
    id: 'retraite',
    label: 'Retraite',
    objective: 'Dimensionner le besoin retraite et les enveloppes de financement.',
    steps: [
      simulatorStep('budget'),
      simulatorStep('ir'),
      simulatorStep('retraite'),
      simulatorStep('per'),
      simulatorStep('placement'),
      simulatorStep('succession'),
    ],
    branches: [
      {
        condition: 'Dirigeant',
        steps: [
          simulatorStep('projection-comptable'),
          simulatorStep('remuneration'),
          simulatorStep('retraite'),
        ],
      },
      {
        condition: 'Société cessible',
        steps: [
          simulatorStep('valorisation-titres'),
          simulatorStep('cession-titres'),
          simulatorStep('placement'),
        ],
      },
      {
        condition: 'Immobilier',
        steps: [
          simulatorStep('revenus-fonciers'),
          simulatorStep('arbitrage-reemploi'),
          simulatorStep('placement'),
        ],
      },
    ],
  },
  {
    id: 'investissement-patrimonial',
    label: 'Investissement patrimonial',
    objective: 'Arbitrer l’effort d’épargne entre placements, retraite et immobilier.',
    steps: [
      simulatorStep('budget'),
      simulatorStep('ir'),
      simulatorStep('retraite'),
      simulatorStep('placement'),
    ],
    branches: [
      { condition: 'PER', steps: [simulatorStep('per')] },
      { condition: 'Crédit', steps: [simulatorStep('credit')] },
      { condition: 'Investissement locatif', steps: [simulatorStep('investissement-locatif')] },
    ],
  },
  {
    id: 'immobilier',
    label: 'Immobilier',
    objective: 'Structurer la détention, les revenus et la cession des actifs immobiliers.',
    steps: [
      simulatorStep('budget'),
      simulatorStep('credit'),
      simulatorStep('investissement-locatif'),
      simulatorStep('sci'),
      simulatorStep('revenus-fonciers'),
      simulatorStep('lmnp-lmp'),
      simulatorStep('ir'),
      simulatorStep('ifi'),
      simulatorStep('plus-values-immobilieres'),
      simulatorStep('arbitrage-reemploi'),
    ],
    branches: [
      {
        condition: 'Immobilier existant',
        steps: [
          simulatorStep('actif-passif'),
          simulatorStep('ifi'),
          simulatorStep('revenus-fonciers'),
          simulatorStep('sci'),
          simulatorStep('plus-values-immobilieres'),
          simulatorStep('arbitrage-reemploi'),
          simulatorStep('placement'),
        ],
      },
    ],
  },
  {
    id: 'societe-dirigeant',
    label: 'Société dirigeant',
    objective: 'Piloter la société, la trésorerie et les arbitrages du dirigeant.',
    steps: [
      simulatorStep('organigramme-societe'),
      simulatorStep('valorisation-titres'),
      simulatorStep('projection-comptable'),
      simulatorStep('tresorerie-societe'),
      simulatorStep('remuneration'),
      simulatorStep('sortie-capitaux'),
      simulatorStep('ir'),
      simulatorStep('budget'),
      simulatorStep('retraite'),
      simulatorStep('placement'),
    ],
    branches: [
      { condition: 'Placement trésorerie', steps: [simulatorStep('tresorerie-societe')] },
      {
        condition: 'Holding',
        steps: [simulatorStep('tresorerie-societe'), simulatorStep('holding')],
      },
      {
        condition: 'Cession de titres',
        steps: [simulatorStep('cession-titres'), simulatorStep('holding')],
      },
    ],
  },
  {
    id: 'transmission-entreprise',
    label: 'Transmission entreprise',
    objective: 'Préparer la transmission d’entreprise familiale ou la cession avec réemploi.',
    steps: [
      simulatorStep('filiation'),
      simulatorStep('regime-matrimonial'),
      simulatorStep('organigramme-societe'),
      simulatorStep('valorisation-titres'),
      simulatorStep('pacte-dutreil'),
      simulatorStep('donation-demembrement'),
      simulatorStep('succession'),
      simulatorStep('prevoyance'),
    ],
    branches: [
      {
        condition: 'Enfant repreneur',
        steps: [simulatorStep('pacte-dutreil'), simulatorStep('donation-demembrement')],
      },
      {
        condition: 'Pas de repreneur familial',
        steps: [simulatorStep('cession-titres'), simulatorStep('placement')],
      },
      { condition: 'Holding', steps: [simulatorStep('holding')] },
    ],
  },
  {
    id: 'cession-reemploi',
    label: 'Cession / réemploi',
    objective: 'Comparer les sorties d’actifs et le réemploi patrimonial ou société.',
    steps: [
      simulatorStep('plus-values-immobilieres'),
      simulatorStep('cession-titres'),
      simulatorStep('arbitrage-reemploi'),
      simulatorStep('placement'),
      simulatorStep('retraite'),
      simulatorStep('succession'),
    ],
    branches: [
      {
        condition: 'Placements financiers',
        steps: [simulatorStep('placement'), simulatorStep('ir'), simulatorStep('succession')],
      },
      {
        condition: 'Société',
        steps: [
          simulatorStep('valorisation-titres'),
          simulatorStep('cession-titres'),
          simulatorStep('holding'),
        ],
      },
    ],
  },
] as const;

export interface DirectChainage {
  simulator: SimulatorDefinition;
  upstream: SimulatorDefinition[];
  next: SimulatorDefinition[];
}

export interface JourneyPosition {
  journey: BusinessJourney;
  current: BusinessJourneyStep;
  previous: BusinessJourneyStep[];
  next: BusinessJourneyStep[];
  branches: BusinessJourney['branches'];
}

export function getDirectChainage(simulatorId: string): DirectChainage {
  const simulator = getOptionalSimulatorDefinition(simulatorId);
  if (!simulator) {
    throw new Error(`Chainage simulateur introuvable : ${simulatorId}`);
  }

  return {
    simulator,
    upstream: simulator.upstream
      .map((id) => getOptionalSimulatorDefinition(id))
      .filter((definition): definition is SimulatorDefinition => Boolean(definition)),
    next: simulator.next
      .map((id) => getOptionalSimulatorDefinition(id))
      .filter((definition): definition is SimulatorDefinition => Boolean(definition)),
  };
}

export function getJourneyPosition(
  simulatorId: string,
  preferredJourneyId?: BusinessJourney['id'],
): JourneyPosition | null {
  const journeys = preferredJourneyId
    ? BUSINESS_JOURNEYS.filter((journey) => journey.id === preferredJourneyId)
    : BUSINESS_JOURNEYS;

  for (const journey of journeys) {
    const currentIndex = journey.steps.findIndex(
      (step) => step.type === 'simulator' && step.simulatorId === simulatorId,
    );
    if (currentIndex >= 0) {
      const current = journey.steps[currentIndex];
      if (!current) continue;

      return {
        journey,
        current,
        previous: journey.steps.slice(0, currentIndex),
        next: journey.steps.slice(currentIndex + 1),
        branches: journey.branches,
      };
    }
  }

  return null;
}
