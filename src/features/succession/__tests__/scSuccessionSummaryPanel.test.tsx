import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ScSuccessionSummaryPanel from '../components/ScSuccessionSummaryPanel';

describe('ScSuccessionSummaryPanel', () => {
  it('renders insurance beneficiaries in a dedicated section outside succession rows', () => {
    const markup = renderToStaticMarkup(
      <ScSuccessionSummaryPanel
        displayUsesChainage={false}
        derivedTotalDroits={12000}
        synthDonutTransmis={250000}
        derivedMasseTransmise={250000}
        transmissionRows={[{
          id: 'enfant-1',
          label: 'Enfant 1',
          brut: 100000,
          droits: 5000,
          net: 95000,
        }]}
        synthHypothese={null}
        isPacsed={false}
        chainageAnalysis={{ order: 'epoux1', societeAcquets: null, participationAcquets: null, interMassClaims: null, affectedLiabilities: null, preciput: null, step1: null, step2: null }}
        avFiscalByAssure={{ epoux1: { totalDroits: 4000 }, epoux2: { totalDroits: 0 } }}
        perFiscalByAssure={{ epoux1: { totalDroits: 2000 }, epoux2: { totalDroits: 0 } }}
        prevoyanceFiscalByAssure={{ epoux1: { totalDroits: 1000 }, epoux2: { totalDroits: 0 } }}
        insurance990ILines={[{
          id: 'benef-1',
          label: 'Enfant 1',
          capitalTransmis: 150000,
          totalDroits: 6000,
          netTransmis: 144000,
        }]}
        insurance757BLines={[]}
        directDisplay={{
          simulatedDeceased: 'epoux1',
          result: { totalDroits: 5000 },
        }}
      />,
    );

    expect(markup).toContain('Transmission par bénéf');
    expect(markup).toContain('Assurances hors succession');
    expect(markup).toContain('Enfant 1');
  });

  it('renders 757B lines inside transmission section, not as separate section', () => {
    const markup = renderToStaticMarkup(
      <ScSuccessionSummaryPanel
        displayUsesChainage={false}
        derivedTotalDroits={10000}
        synthDonutTransmis={400000}
        derivedMasseTransmise={400000}
        transmissionRows={[{
          id: 'enfant-1',
          label: 'Enfant 1',
          brut: 200000,
          droits: 5000,
          net: 195000,
        }]}
        synthHypothese={null}
        isPacsed={false}
        chainageAnalysis={{ order: 'epoux1', societeAcquets: null, participationAcquets: null, interMassClaims: null, affectedLiabilities: null, preciput: null, step1: null, step2: null }}
        avFiscalByAssure={{ epoux1: { totalDroits: 3000 }, epoux2: { totalDroits: 0 } }}
        perFiscalByAssure={{ epoux1: { totalDroits: 2000 }, epoux2: { totalDroits: 0 } }}
        prevoyanceFiscalByAssure={{ epoux1: { totalDroits: 0 }, epoux2: { totalDroits: 0 } }}
        insurance990ILines={[]}
        insurance757BLines={[{
          id: 'benef-757b',
          label: 'Enfant 1',
          capitalTransmis: 200000,
          totalDroits: 5000,
          netTransmis: 195000,
        }]}
        directDisplay={{
          simulatedDeceased: 'epoux1',
          result: { totalDroits: 5000 },
        }}
      />,
    );

    expect(markup).toContain('Transmission par bénéf');
    expect(markup).toContain('Enfant 1 (art. 757 B)');
    expect(markup).not.toContain('art. 757 B</div>');
  });

  it("renders a dedicated liquidation section for societe d'acquets in chainage mode", () => {
    const markup = renderToStaticMarkup(
      <ScSuccessionSummaryPanel
        displayUsesChainage
        derivedTotalDroits={20000}
        synthDonutTransmis={700000}
        derivedMasseTransmise={0}
        transmissionRows={[]}
        synthHypothese={null}
        isPacsed={false}
        chainageAnalysis={{
          order: 'epoux1',
          societeAcquets: {
            totalValue: 400000,
            firstEstateContribution: 160000,
            survivorShare: 240000,
            preciputAmount: 50000,
            survivorAttributionAmount: 0,
            liquidationMode: 'quotes',
            deceasedQuotePct: 40,
            survivorQuotePct: 60,
            attributionIntegrale: false,
          },
          participationAcquets: null,
          interMassClaims: null,
          affectedLiabilities: null,
          preciput: {
            mode: 'cible',
            appliedAmount: 50000,
            usesGlobalFallback: false,
            selections: [
              { id: 'prec-1', label: 'Portefeuille titres', appliedAmount: 30000 },
              { id: 'prec-2', label: 'GFV familial', appliedAmount: 20000 },
            ],
          },
          step1: { droitsEnfants: 10000 },
          step2: { droitsEnfants: 10000 },
        }}
        avFiscalByAssure={{ epoux1: { totalDroits: 0 }, epoux2: { totalDroits: 0 } }}
        perFiscalByAssure={{ epoux1: { totalDroits: 0 }, epoux2: { totalDroits: 0 } }}
        prevoyanceFiscalByAssure={{ epoux1: { totalDroits: 0 }, epoux2: { totalDroits: 0 } }}
        insurance990ILines={[]}
        insurance757BLines={[]}
        directDisplay={{
          simulatedDeceased: 'epoux1',
          result: null,
        }}
      />,
    );

    expect(markup).toContain('Liquidation societe');
    expect(markup).toContain('Valeur nette de la poche');
    expect(markup).toContain('Preciput preleve');
  });

  it('renders the participation aux acquets section when a claim is configured', () => {
    const markup = renderToStaticMarkup(
      <ScSuccessionSummaryPanel
        displayUsesChainage
        derivedTotalDroits={22000}
        synthDonutTransmis={650000}
        derivedMasseTransmise={0}
        transmissionRows={[]}
        synthHypothese={null}
        isPacsed={false}
        chainageAnalysis={{
          order: 'epoux1',
          societeAcquets: null,
          participationAcquets: {
            active: true,
            patrimoineOriginaireEpoux1: 100000,
            patrimoineOriginaireEpoux2: 120000,
            patrimoineFinalEpoux1: 300000,
            patrimoineFinalEpoux2: 180000,
            acquetsEpoux1: 200000,
            acquetsEpoux2: 60000,
            creditor: 'epoux2',
            debtor: 'epoux1',
            quoteAppliedPct: 50,
            creanceAmount: 70000,
            firstEstateAdjustment: -70000,
          },
          interMassClaims: null,
          affectedLiabilities: null,
          preciput: null,
          step1: { droitsEnfants: 12000 },
          step2: { droitsEnfants: 10000 },
        }}
        avFiscalByAssure={{ epoux1: { totalDroits: 0 }, epoux2: { totalDroits: 0 } }}
        perFiscalByAssure={{ epoux1: { totalDroits: 0 }, epoux2: { totalDroits: 0 } }}
        prevoyanceFiscalByAssure={{ epoux1: { totalDroits: 0 }, epoux2: { totalDroits: 0 } }}
        insurance990ILines={[]}
        insurance757BLines={[]}
        directDisplay={{
          simulatedDeceased: 'epoux1',
          result: null,
        }}
      />,
    );

    expect(markup).toContain('Participation aux acquets');
    expect(markup).toContain('Creance de participation');
    expect(markup).toContain('Epoux 2 / Epoux 1');
  });

  it('renders inter-mass claims and affected liabilities when configured', () => {
    const markup = renderToStaticMarkup(
      <ScSuccessionSummaryPanel
        displayUsesChainage
        derivedTotalDroits={15000}
        synthDonutTransmis={500000}
        derivedMasseTransmise={0}
        transmissionRows={[]}
        synthHypothese={null}
        isPacsed={false}
        chainageAnalysis={{
          order: 'epoux1',
          societeAcquets: null,
          participationAcquets: null,
          interMassClaims: {
            totalRequestedAmount: 80000,
            totalAppliedAmount: 60000,
            claims: [
              {
                id: 'claim-1',
                kind: 'recompense',
                fromPocket: 'communaute',
                toPocket: 'epoux1',
                appliedAmount: 60000,
              },
            ],
          },
          affectedLiabilities: {
            totalAmount: 30000,
            byPocket: [{ pocket: 'epoux1', amount: 30000 }],
          },
          preciput: null,
          step1: { droitsEnfants: 7000 },
          step2: { droitsEnfants: 8000 },
        }}
        avFiscalByAssure={{ epoux1: { totalDroits: 0 }, epoux2: { totalDroits: 0 } }}
        perFiscalByAssure={{ epoux1: { totalDroits: 0 }, epoux2: { totalDroits: 0 } }}
        prevoyanceFiscalByAssure={{ epoux1: { totalDroits: 0 }, epoux2: { totalDroits: 0 } }}
        insurance990ILines={[]}
        insurance757BLines={[]}
        directDisplay={{
          simulatedDeceased: 'epoux1',
          result: null,
        }}
      />,
    );

    expect(markup).toContain('Recompenses / creances entre masses');
    expect(markup).toContain('Passif affecte');
    expect(markup).toContain('Communaute vers Epoux 1');
  });
});
