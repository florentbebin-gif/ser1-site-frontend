import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { TresoInputsV5, TresoProjectionRow } from '@/engine/tresorerie/types';
import { TresoAssociateInsights } from '../components/TresoAssociateInsights';

const INPUTS: TresoInputsV5 = {
  version: 5,
  selectedAssociateId: 'associe-1',
  foyer: { selectedAssociateId: 'associe-1' },
  company: {
    label: 'Holding',
    projectionStartYear: 2026,
    creationType: 'existante',
    legalForm: 'sas',
    companyKind: 'holding_patrimoniale',
    shareCapital: 10_000,
    sharePremium: 0,
    reservesInitial: 0,
    treasuryInitial: 0,
    annualStructureCosts: 0,
    incomeStatement: {
      annualRevenue: 0,
      annualStructureCosts: 0,
      workingCapitalRequirement: 0,
    },
    reducedCorporateTaxEligible: true,
    associates: [{
      id: 'associe-1',
      label: 'Associé 1',
      kind: 'pp',
      profile: {
        currentAge: 50,
        retirementAge: 65,
        annualIncomeNeed: 0,
        projectionStartYear: 2026,
      },
      ownershipLots: [{ right: 'pleine_propriete', capitalPct: 100, economicRightsPct: 100 }],
      roles: ['associe_sans_statut'],
      cca: {
        currentBalance: 0,
        exceptionalContributions: [],
        annualContribution: { amount: 0, startYear: 2026 },
        remunerationRate: 0,
      },
      revenuePhases: [{
        id: 'phase-besoin',
        startYear: 2026,
        source: 'none',
        loadedAnnualCost: 0,
        socialChargeRate: 0,
        annualNetIncomeNeed: 50_000,
        useCcaForCompletion: true,
      }],
    }],
    loans: [],
    subsidiaries: [],
  },
  allocationMatrix: {
    sweepThreshold: 0,
    minimumBankBalance: 0,
    pockets: [],
  },
};

const ROW = {
  year: 1,
  revenusNets: 45_000,
  deltaBesoin: -5_000,
  revenusParAssocie: [
    {
      associateId: 'associe-1',
      label: 'Associé 1',
      source: 'remuneration',
      remuneration: 20_000,
      ccaRepaid: 0,
      grossDividends: 0,
      dividendTax: 0,
      tnsSocialCharges: 0,
      netRevenue: 20_000,
    },
    {
      associateId: 'associe-1',
      label: 'Associé 1',
      source: 'cca',
      remuneration: 0,
      ccaRepaid: 10_000,
      grossDividends: 0,
      dividendTax: 0,
      tnsSocialCharges: 0,
      netRevenue: 10_000,
    },
    {
      associateId: 'associe-1',
      label: 'Associé 1',
      source: 'dividendes',
      remuneration: 0,
      ccaRepaid: 0,
      grossDividends: 20_000,
      dividendTax: 5_000,
      tnsSocialCharges: 0,
      netRevenue: 15_000,
    },
    {
      associateId: 'associe-1',
      label: 'Associé 1',
      source: 'charges_sociales_tns',
      remuneration: 0,
      ccaRepaid: 0,
      grossDividends: 0,
      dividendTax: 0,
      tnsSocialCharges: 3_000,
      netRevenue: 0,
    },
  ],
} as TresoProjectionRow;

describe('TresoAssociateInsights', () => {
  it('affiche un donut à trois sources sans intégrer le déficit ni les charges TNS', () => {
    const html = renderToStaticMarkup(<TresoAssociateInsights inputs={INPUTS} rows={[ROW]} />);

    expect(html).toContain('Répartition des revenus nets');
    expect(html).toContain('Rémunération nette');
    expect(html).toContain('Remboursement CCA');
    expect(html).toContain('Dividendes nets');
    expect(html).toContain('-5');
    expect(html).toContain('is-warning');
    expect(html).not.toContain('charges sociales');
  });

  it('affiche un surplus de besoin en statut positif', () => {
    const html = renderToStaticMarkup(
      <TresoAssociateInsights inputs={INPUTS} rows={[{ ...ROW, deltaBesoin: 5_000 }]} />,
    );

    expect(html).toContain('+5');
    expect(html).toContain('is-positive');
  });

  it('affiche la moyenne annuelle des revenus récupérés comme une note secondaire', () => {
    const html = renderToStaticMarkup(<TresoAssociateInsights inputs={INPUTS} rows={[ROW]} />);

    expect(html).toContain('Total revenus récupérés');
    expect(html).toContain('Moyenne annuelle');
    expect(html).toContain('ts-associate-kpi-note');
    expect(html).not.toContain('moyenne ');
  });

  it('affiche un état propre pour un associé personne morale', () => {
    const inputs = structuredClone(INPUTS);
    inputs.company.associates[0].kind = 'pm';

    const html = renderToStaticMarkup(<TresoAssociateInsights inputs={inputs} rows={[ROW]} />);

    expect(html).toContain('Une personne morale ne porte pas de revenus personnels');
  });
});
