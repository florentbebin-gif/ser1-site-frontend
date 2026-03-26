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
        chainageAnalysis={{ order: 'epoux1', societeAcquets: null, step1: null, step2: null }}
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
        chainageAnalysis={{ order: 'epoux1', societeAcquets: null, step1: null, step2: null }}
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
});
