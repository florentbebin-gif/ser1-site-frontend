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
  });

  it('affiche plusieurs filiales avec cession et base fiscale estimées', () => {
    const html = renderToStaticMarkup(
      <TresoCompanySubsidiariesPanel
        subsidiaries={[
          {
            id: 'filiale-1',
            label: 'Filiale 1',
            holdingOwnershipPct: 80,
            annualServicesRevenue: 10000,
            annualDividends: 15000,
            motherDaughterEligible: true,
            fiscalIntegrationEstimateEnabled: false,
            disposalYear: 2030,
            estimatedDisposalPrice: 300000,
            taxBasis: 180000,
          },
          {
            id: 'filiale-2',
            label: 'Filiale 2',
            holdingOwnershipPct: 60,
            annualServicesRevenue: 5000,
            annualDividends: 0,
            motherDaughterEligible: false,
            fiscalIntegrationEstimateEnabled: true,
            estimatedFiscalResult: -4000,
          },
        ]}
        onChange={() => {}}
      />,
    );

    expect(html).toContain('Filiale 1');
    expect(html).toContain('Filiale 2');
    expect(html).toContain('Année de cession');
    expect(html).toContain('Prix de cession estimé');
    expect(html).toContain('Base fiscale');
    expect(html).toContain('Estimation déclarative d’intégration fiscale');
  });
});
