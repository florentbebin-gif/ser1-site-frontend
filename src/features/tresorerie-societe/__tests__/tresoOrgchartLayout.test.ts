import { describe, expect, it } from 'vitest';
import type { CompanyInput } from '@/engine/tresorerie/types';
import { computeTresoOrgchartLayout } from '../tresoOrgchartLayout';

function makeCompany(overrides: Partial<CompanyInput> = {}): CompanyInput {
  return {
    creationType: 'existante',
    legalForm: 'sas',
    companyKind: 'holding_patrimoniale',
    shareCapital: 10_000,
    sharePremium: 0,
    reservesInitial: 0,
    treasuryInitial: 0,
    annualStructureCosts: 0,
    reducedCorporateTaxEligible: true,
    associates: [
      {
        id: 'associe-1',
        label: 'Associé 1',
        kind: 'pp',
        ownershipLots: [{ right: 'pleine_propriete', capitalPct: 100, economicRightsPct: 100 }],
        roles: ['associe_sans_statut'],
        cca: {
          currentBalance: 0,
          exceptionalContributions: [],
          annualContribution: { amount: 0, startYear: 2026 },
          remunerationRate: 0,
        },
        remuneration: { source: 'holding', loadedAnnualCost: 0, socialChargeRate: 0 },
      },
    ],
    loans: [],
    subsidiaries: [],
    ...overrides,
  };
}

describe('computeTresoOrgchartLayout', () => {
  it('positionne un associé, la société et le lien de détention', () => {
    const layout = computeTresoOrgchartLayout(makeCompany());
    const associate = layout.nodes.find((node) => node.kind === 'associate');
    const company = layout.nodes.find((node) => node.kind === 'company');

    expect(layout.nodes.map((node) => node.id)).toEqual(['associe-1', 'societe']);
    expect(company?.width).toBeGreaterThan(associate?.width ?? 0);
    expect(company?.height).toBeGreaterThan(associate?.height ?? 0);
    expect(company?.width).toBeGreaterThanOrEqual(180);
    expect(company?.height).toBeGreaterThanOrEqual(64);
    expect(layout.svgHeight).toBeLessThanOrEqual(160);
    expect(layout.edges).toEqual(
      expect.arrayContaining([expect.objectContaining({ fromId: 'associe-1', toId: 'societe' })]),
    );
    expect(layout.labels).toEqual(
      expect.arrayContaining([expect.objectContaining({ text: '100 %' })]),
    );
  });

  it('répartit plusieurs associés sur une même rangée', () => {
    const layout = computeTresoOrgchartLayout(
      makeCompany({
        associates: [
          {
            id: 'associe-1',
            label: 'Associé 1',
            kind: 'pp',
            ownershipLots: [{ right: 'pleine_propriete', capitalPct: 60, economicRightsPct: 60 }],
            roles: ['associe_sans_statut'],
            cca: {
              currentBalance: 0,
              exceptionalContributions: [],
              annualContribution: { amount: 0, startYear: 2026 },
              remunerationRate: 0,
            },
            remuneration: { source: 'holding', loadedAnnualCost: 0, socialChargeRate: 0 },
          },
          {
            id: 'associe-2',
            label: 'Associé 2',
            kind: 'pm',
            ownershipLots: [{ right: 'pleine_propriete', capitalPct: 40, economicRightsPct: 40 }],
            roles: ['associe_sans_statut'],
            cca: {
              currentBalance: 0,
              exceptionalContributions: [],
              annualContribution: { amount: 0, startYear: 2026 },
              remunerationRate: 0,
            },
            remuneration: { source: 'holding', loadedAnnualCost: 0, socialChargeRate: 0 },
          },
        ],
      }),
    );

    const associes = layout.nodes.filter((node) => node.kind === 'associate');
    expect(associes).toHaveLength(2);
    expect(associes[0].y).toBe(associes[1].y);
    expect(layout.labels.map((label) => label.text)).toEqual(
      expect.arrayContaining(['60 %', '40 %']),
    );
  });

  it('connecte une filiale et une sous-filiale au bon parent', () => {
    const layout = computeTresoOrgchartLayout(
      makeCompany({
        subsidiaries: [
          {
            id: 'filiale-1',
            label: 'Filiale A',
            parentEntityId: 'societe',
            ownershipPct: 80,
            holdingOwnershipPct: 80,
            motherDaughterEligible: true,
            fiscalIntegrationEstimateEnabled: false,
            servicesSchedule: [],
            dividendsSchedule: [],
          },
          {
            id: 'filiale-2',
            label: 'Filiale B',
            parentEntityId: 'filiale-1',
            ownershipPct: 51,
            holdingOwnershipPct: 51,
            motherDaughterEligible: true,
            fiscalIntegrationEstimateEnabled: false,
            servicesSchedule: [],
            dividendsSchedule: [],
          },
        ],
      }),
    );

    expect(layout.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fromId: 'societe', toId: 'filiale-1' }),
        expect.objectContaining({ fromId: 'filiale-1', toId: 'filiale-2' }),
      ]),
    );
    expect(layout.labels.map((label) => label.text)).toEqual(
      expect.arrayContaining(['80 %', '51 %']),
    );
    layout.labels.forEach((label) => {
      const edge = layout.edges.find((candidate) => candidate.id === label.edgeId);
      expect(edge).toBeDefined();
      expect(label.x).toBeCloseTo(((edge?.x1 ?? 0) + (edge?.x2 ?? 0)) / 2, 5);
    });
  });
});
