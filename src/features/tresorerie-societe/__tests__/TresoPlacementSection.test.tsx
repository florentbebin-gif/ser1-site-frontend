import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { TresoInputsV2 } from '@/engine/tresorerie/types';
import { TresoPlacementSection } from '../components/TresoPlacementSection';

const INPUTS: TresoInputsV2 = {
  version: 2,
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
    sweepThreshold: 10000,
    pockets: [
      {
        id: 'poche-1',
        kind: 'distribution',
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
        kind: 'capitalisation',
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
};

describe('TresoPlacementSection', () => {
  it('affiche les totaux initial et annuel de la matrice', () => {
    const html = renderToStaticMarkup(
      <TresoPlacementSection inputs={INPUTS} onChange={() => {}} />,
    );

    expect(html).toContain('Total initial : 120 %');
    expect(html).toContain('Total annuel : 90 %');
  });
});
