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
        chainageAnalysis={{ order: 'epoux1', step1: null, step2: null }}
        avFiscalByAssure={{ epoux1: { totalDroits: 4000 }, epoux2: { totalDroits: 0 } }}
        perFiscalByAssure={{ epoux1: { totalDroits: 2000 }, epoux2: { totalDroits: 0 } }}
        prevoyanceFiscalByAssure={{ epoux1: { totalDroits: 1000 }, epoux2: { totalDroits: 0 } }}
        insuranceBeneficiaryLines={[{
          id: 'benef-1',
          label: 'Enfant 1',
          capitalTransmis: 150000,
          totalDroits: 6000,
          netTransmis: 144000,
        }]}
        directDisplay={{
          simulatedDeceased: 'epoux1',
          result: { totalDroits: 5000 },
        }}
      />,
    );

    expect(markup).toContain('Transmission par bénéficiaire');
    expect(markup).toContain('Assurances hors succession par bénéficiaire');
    expect(markup).toContain('Enfant 1');
  });
});
