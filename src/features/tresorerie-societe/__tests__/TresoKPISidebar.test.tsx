import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { TresoInputsV2 } from '@/engine/tresorerie/types';
import type { TresoKPIs } from '../hooks/useTresorerieCalculations';
import { TresoKPISidebar } from '../components/TresoKPISidebar';

const KPIS: TresoKPIs = {
  ccaTotalConstitue: 100000,
  isTotalDecaisse: 1000,
  isLatentCapi: 5000,
  revenusNetsRetraite: 24000,
  dureeRemboursementCCA: 6,
  valeurNetteSocieteRetraite: 150000,
  reservesRetraite: 40000,
  capaciteDistribuableAn1: 12000,
  alerteDividendesAn1: false,
  hasRows: true,
  anneeRetraiteIndex: 2,
};

const INPUTS: TresoInputsV2 = {
  version: 2,
  foyer: {
    selectedAssociateId: 'associe-1',
    currentAge: 50,
    retirementAge: 62,
    annualIncomeNeed: 24000,
    projectionStartYear: 2026,
  },
  company: {
    creationType: 'existante',
    legalForm: 'sas',
    shareCapital: 10000,
    sharePremium: 0,
    reservesInitial: 0,
    treasuryInitial: 150000,
    annualStructureCosts: 3000,
    reducedCorporateTaxEligible: true,
    associates: [],
    loans: [],
    subsidiaries: [{
      id: 'filiale-1',
      label: 'Filiale',
      holdingOwnershipPct: 80,
      annualServicesRevenue: 0,
      annualDividends: 18000,
      motherDaughterEligible: true,
      fiscalIntegrationEstimateEnabled: false,
    }],
  },
  allocationMatrix: {
    sweepThreshold: 50000,
    pockets: [{
      id: 'capitalisation-1',
      kind: 'capitalisation',
      durationYears: 8,
      annualReturnRate: 0.035,
      enjoymentDelayMonths: 0,
      initialAllocationPct: 100,
      annualAllocationPct: 100,
      repeatAtTerm: false,
      termDestination: 'treasury',
    }],
  },
};

describe('TresoKPISidebar', () => {
  it('affiche l’IS latent quand la poche capitalisation vient du modèle v2', () => {
    const html = renderToStaticMarkup(<TresoKPISidebar kpis={KPIS} inputs={INPUTS} />);

    expect(html).toContain('IS latent capitalisation');
    expect(html).toContain('Alerte dividendes');
  });

  it('affiche l’alerte dividendes avec un libellé sobre sans pictogramme', () => {
    const html = renderToStaticMarkup(
      <TresoKPISidebar
        kpis={{ ...KPIS, alerteDividendesAn1: true }}
        inputs={INPUTS}
      />,
    );

    expect(html).toContain('Dividendes supérieurs à la capacité distribuable');
    expect(html).not.toContain('⚠');
  });
});
