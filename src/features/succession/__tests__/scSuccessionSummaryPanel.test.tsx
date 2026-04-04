import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ScSuccessionSummaryPanel from '../components/ScSuccessionSummaryPanel';
import { mergeInsuranceBeneficiaryLines, type UnifiedBeneficiaryBlock } from '../useSuccessionOutcomeDerivedValues.helpers';

const baseChainageAnalysis = {
  order: 'epoux1' as const,
  societeAcquets: null,
  participationAcquets: null,
  interMassClaims: null,
  affectedLiabilities: null,
  preciput: null,
  step1: null,
  step2: null,
};

const baseFiscalByAssure = {
  avFiscalByAssure: { epoux1: { totalDroits: 0 }, epoux2: { totalDroits: 0 } },
  perFiscalByAssure: { epoux1: { totalDroits: 0 }, epoux2: { totalDroits: 0 } },
  prevoyanceFiscalByAssure: { epoux1: { totalDroits: 0 }, epoux2: { totalDroits: 0 } },
};

describe('ScSuccessionSummaryPanel', () => {
  it('affiche le tableau unifié avec capitaux décès nets pour un bénéficiaire avec 990I', () => {
    const unifiedBlocks: UnifiedBeneficiaryBlock[] = [{
      id: 'enfant-1',
      label: 'Enfant 1',
      isConjoint: false,
      brut: 100000,
      capitauxDecesNets: 144000,
      droits: 5000,
      transmissionNette: 239000,
    }];

    const markup = renderToStaticMarkup(
      <ScSuccessionSummaryPanel
        displayUsesChainage={false}
        derivedTotalDroits={5000}
        synthDonutTransmis={250000}
        derivedMasseTransmise={250000}
        synthHypothese={null}
        isPacsed={false}
        chainageAnalysis={baseChainageAnalysis}
        {...baseFiscalByAssure}
        unifiedBlocks={unifiedBlocks}
        directDisplay={{
          simulatedDeceased: 'epoux1',
          result: { totalDroits: 5000 },
        }}
      />,
    );

    expect(markup).toContain('Transmission par bénéf');
    expect(markup).toContain('Capitaux décès nets');
    expect(markup).toContain('Transmission nette');
    expect(markup).toContain('Enfant 1');
    expect(markup).not.toContain('Assurances hors succession');
    expect(markup).not.toContain('art. 990 I');
  });

  it('n\'affiche pas « Capitaux décès nets » quand la valeur est 0', () => {
    const unifiedBlocks: UnifiedBeneficiaryBlock[] = [{
      id: 'conjoint',
      label: 'Conjoint survivant',
      isConjoint: true,
      exonerated: true,
      brut: 100000,
      capitauxDecesNets: 0,
      droits: 0,
      transmissionNette: 100000,
    }];

    const markup = renderToStaticMarkup(
      <ScSuccessionSummaryPanel
        displayUsesChainage={false}
        derivedTotalDroits={0}
        synthDonutTransmis={100000}
        derivedMasseTransmise={100000}
        synthHypothese={null}
        isPacsed={false}
        chainageAnalysis={baseChainageAnalysis}
        {...baseFiscalByAssure}
        unifiedBlocks={unifiedBlocks}
        directDisplay={{
          simulatedDeceased: 'epoux1',
          result: { totalDroits: 0 },
        }}
      />,
    );

    expect(markup).toContain('Conjoint survivant');
    expect(markup).not.toContain('Capitaux décès nets');
    expect(markup).toContain('Exonéré');
  });

  it('affiche « — » pour le 2e décès du conjoint en mode chainage', () => {
    const unifiedBlocks: UnifiedBeneficiaryBlock[] = [
      {
        id: 'conjoint',
        label: 'Conjoint survivant',
        isConjoint: true,
        exonerated: true,
        brut: 100000,
        step1Brut: 100000,
        step2Brut: 0,
        capitauxDecesNets: 0,
        step1CapitauxDecesNets: 0,
        step2CapitauxDecesNets: 0,
        droits: 0,
        step1Droits: 0,
        step2Droits: 0,
        transmissionNette: 100000,
        step1TransmissionNette: 100000,
        step2TransmissionNette: 0,
      },
      {
        id: 'enfant-1',
        label: 'Enfant 1',
        isConjoint: false,
        brut: 350000,
        step1Brut: 150000,
        step2Brut: 200000,
        capitauxDecesNets: 230500,
        step1CapitauxDecesNets: 230500,
        step2CapitauxDecesNets: 0,
        droits: 26388,
        step1Droits: 8194,
        step2Droits: 18194,
        transmissionNette: 554112,
        step1TransmissionNette: 372306,
        step2TransmissionNette: 181806,
      },
    ];

    const markup = renderToStaticMarkup(
      <ScSuccessionSummaryPanel
        displayUsesChainage
        derivedTotalDroits={26388}
        synthDonutTransmis={700000}
        derivedMasseTransmise={0}
        synthHypothese={null}
        isPacsed={false}
        chainageAnalysis={{
          ...baseChainageAnalysis,
          step1: { droitsEnfants: 8194 },
          step2: { droitsEnfants: 18194 },
        }}
        {...baseFiscalByAssure}
        unifiedBlocks={unifiedBlocks}
        directDisplay={{
          simulatedDeceased: 'epoux1',
          result: null,
        }}
      />,
    );

    expect(markup).toContain('1er décès');
    expect(markup).toContain('2e décès');
    expect(markup).toContain('Conjoint survivant');
    expect(markup).toContain('Enfant 1');
    expect(markup).toContain('Capitaux décès nets');
    expect(markup).toContain('Transmission nette');
    // Le conjoint affiche « — » au 2e décès
    expect(markup).toContain('—');
    expect(markup).not.toContain('Assurances hors succession');
    expect(markup).not.toContain('art. 757 B');
    // KPIs chainage renommés
    expect(markup).toContain('Cumul transmis au 1er décès');
    expect(markup).toContain('Cumul transmis au 2ème décès');
  });

  it("affiche la section liquidation societe d'acquets en mode chainage", () => {
    const markup = renderToStaticMarkup(
      <ScSuccessionSummaryPanel
        displayUsesChainage
        derivedTotalDroits={20000}
        synthDonutTransmis={700000}
        derivedMasseTransmise={0}
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
        {...baseFiscalByAssure}
        unifiedBlocks={[]}
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

  it('affiche la participation aux acquets quand une créance est configurée', () => {
    const markup = renderToStaticMarkup(
      <ScSuccessionSummaryPanel
        displayUsesChainage
        derivedTotalDroits={22000}
        synthDonutTransmis={650000}
        derivedMasseTransmise={0}
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
        {...baseFiscalByAssure}
        unifiedBlocks={[]}
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

  it('affiche les récompenses et le passif affecté quand configurés', () => {
    const markup = renderToStaticMarkup(
      <ScSuccessionSummaryPanel
        displayUsesChainage
        derivedTotalDroits={15000}
        synthDonutTransmis={500000}
        derivedMasseTransmise={0}
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
        {...baseFiscalByAssure}
        unifiedBlocks={[]}
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

  it('mergeInsuranceBeneficiaryLines — AV 990I pur : aucun double-comptage dans le chemin 757B', () => {
    // Régression : bug 480 500 € — une AV purement avant 70 ans ne doit générer aucune ligne 757B
    const avLine = {
      id: 'enfant-1',
      label: 'Enfant 1',
      lien: 'enfant' as const,
      capitauxAvant70: 250000,
      capitauxApres70: 0,
      taxable990I: 97500,
      droits990I: 19500,
      taxable757B: 0,
      droits757B: 0,
      totalDroits: 19500,
      netTransmis: 230500,
    };
    const { lines990I, lines757B } = mergeInsuranceBeneficiaryLines([avLine], [], []);
    expect(lines990I).toHaveLength(1);
    expect(lines990I[0].netTransmis).toBe(230500);
    // Aucune ligne 757B pour un contrat purement avant 70 ans
    expect(lines757B).toHaveLength(0);
  });
});
