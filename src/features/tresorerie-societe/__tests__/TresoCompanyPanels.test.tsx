import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  TresoCompanyLoansPanel,
  TresoCompanySubsidiariesPanel,
} from '../components/TresoCompanyPanels';

describe('TresoCompanyPanels', () => {
  it('affiche plusieurs emprunts avec les champs avancés du modèle société', () => {
    const html = renderToStaticMarkup(
      <TresoCompanyLoansPanel
        projectionStartYear={2026}
        loans={[
          {
            id: 'pret-1',
            label: 'Ancien prêt',
            principal: 100000,
            annualRate: 0.03,
            durationMonths: 120,
            startDate: '2024-01',
            existingLoan: true,
            deductibleInterest: true,
            financedAssetKind: 'scpi',
            financedAssetLabel: 'SCPI',
            financedAssetReturnRate: 0.045,
            enjoymentDelayMonths: 6,
          },
          {
            id: 'pret-2',
            label: 'Nouveau prêt',
            principal: 50000,
            annualRate: 0.04,
            durationMonths: 84,
            startDate: '2026-07',
            existingLoan: false,
            deductibleInterest: false,
          },
        ]}
        onChange={() => {}}
      />,
    );

    expect(html).toContain('Ancien prêt');
    expect(html).toContain('Nouveau prêt');
    expect(html).toContain('Emprunt existant');
    expect(html).toContain('Intérêts déductibles');
    expect(html).toContain('Délai de jouissance');
    expect(html).toContain('Nature actif');
    expect(html).toContain('sim-action-btn--delete');
    expect(html).toContain('sim-action-btn--add');
  });

  it('affiche plusieurs filiales comme accès compact vers la modale dédiée', () => {
    const html = renderToStaticMarkup(
      <TresoCompanySubsidiariesPanel
        subsidiaries={[
          {
            id: 'filiale-1',
            label: 'Filiale 1',
            holdingOwnershipPct: 80,
            motherDaughterEligible: true,
            fiscalIntegrationEstimateEnabled: false,
            servicesSchedule: [{ amount: 10000, startYear: 2026 }],
            dividendsSchedule: [{ amount: 15000, startYear: 2026 }],
            disposal: {
              year: 2030,
              estimatedPrice: 300000,
              taxBasis: 180000,
              fees: 0,
              regime: 'auto',
            },
          },
          {
            id: 'filiale-2',
            label: 'Filiale 2',
            holdingOwnershipPct: 60,
            motherDaughterEligible: false,
            fiscalIntegrationEstimateEnabled: true,
            estimatedFiscalResult: -4000,
            servicesSchedule: [{ amount: 5000, startYear: 2026 }],
            dividendsSchedule: [],
          },
        ]}
        onChange={() => {}}
      />,
    );

    expect(html).toContain('Filiale 1');
    expect(html).toContain('Filiale 2');
    expect(html).toContain('Paramétrer');
    expect(html).toContain('sim-action-btn--edit');
    expect(html).toContain('sim-action-btn--delete');
    expect(html).toContain('sim-action-btn--add');
    expect(html).toContain('80 % détenu');
    expect(html).toContain('Cession 2030');
    expect(html).not.toContain('Prix de cession estimé');
    expect(html).not.toContain('Estimation déclarative d’intégration fiscale');
  });
});
