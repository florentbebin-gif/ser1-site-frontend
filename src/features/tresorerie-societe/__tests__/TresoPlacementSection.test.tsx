import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TresoPlacementSection } from '../components/TresoPlacementSection';

const INPUTS = {
  version: 3,
  foyer: {
    selectedAssociateId: 'associe-1',
    currentAge: 50,
    retirementAge: 65,
    annualIncomeNeed: 30000,
    projectionStartYear: 2026,
  },
  company: {
    creationType: 'existante',
    legalForm: 'sas',
    shareCapital: 0,
    sharePremium: 0,
    reservesInitial: 0,
    treasuryInitial: 100000,
    annualStructureCosts: 3000,
    reducedCorporateTaxEligible: true,
    associates: [],
    loans: [],
    subsidiaries: [],
  },
  allocationMatrix: {
    mode: 'strategy' as any,
    sweepThreshold: 10000,
    pockets: [
      {
        id: 'poche-1',
        label: 'Court terme',
        kind: 'distribution',
        horizon: 'court_terme',
        withdrawalPriority: 1,
        durationYears: 5,
        annualReturnRate: 0.04,
        enjoymentDelayMonths: 0,
        initialAllocationPct: 80,
        annualAllocationPct: 60,
        repeatAtTerm: false,
        termDestination: 'treasury',
      },
      {
        id: 'poche-2',
        label: 'Long terme',
        kind: 'capitalisation',
        horizon: 'long_terme',
        withdrawalPriority: 3,
        durationYears: 8,
        annualReturnRate: 0.03,
        enjoymentDelayMonths: 0,
        initialAllocationPct: 40,
        annualAllocationPct: 30,
        repeatAtTerm: false,
        termDestination: 'matrix',
      },
    ],
  },
} as any;

describe('TresoPlacementSection', () => {
  it('affiche les totaux initial et annuel de la matrice', () => {
    const html = renderToStaticMarkup(
      <TresoPlacementSection inputs={INPUTS} onChange={() => {}} />,
    );

    expect(html).toContain('Total initial : 120 %');
    expect(html).toContain('Total annuel : 90 %');
  });

  it('présente les modes placement unique et stratégie multi-poches avec ordre de consommation', () => {
    const html = renderToStaticMarkup(
      <TresoPlacementSection inputs={INPUTS as any} onChange={() => {}} />,
    );

    expect(html).toContain('Placement unique');
    expect(html).toContain('Stratégie multi-poches');
    expect(html).toContain('Court terme');
    expect(html).toContain('Long terme');
    expect(html).toContain('Ordre de consommation');
    expect(html).toContain('BFR inclus dans le seuil de sécurité');
  });
});
