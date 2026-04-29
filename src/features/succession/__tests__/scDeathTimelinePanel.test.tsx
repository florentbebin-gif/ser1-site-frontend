import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DECES_DANS_X_ANS_OPTIONS } from '../successionSimulator.constants';
import ScDeathTimelinePanel from '../components/ScDeathTimelinePanel';

function buildProps() {
  return {
    chainOrder: 'epoux1' as const,
    onToggleOrder: () => {},
    showOrderToggle: true,
    displayUsesChainage: false,
    derivedMasseTransmise: 300000,
    isPacsed: false,
    showDeathHorizonControl: true,
    decesDansXAns: 50 as const,
    onChangeDecesDansXAns: () => {},
    chainageAnalysis: {
      order: 'epoux1' as const,
      firstDecedeLabel: 'epoux 1',
      secondDecedeLabel: 'epoux 2',
      societeAcquets: null,
      participationAcquets: null,
      interMassClaims: null,
      affectedLiabilities: null,
      preciput: null,
      step1: { actifTransmis: 100000, droitsEnfants: 5000 },
      step2: { actifTransmis: 200000, droitsEnfants: 15000 },
    },
    assuranceVieByAssure: { epoux1: 0, epoux2: 0 },
    avFiscalByAssure: {
      epoux1: { totalDroits: 0 },
      epoux2: { totalDroits: 0 },
    },
    perByAssure: { epoux1: 0, epoux2: 0 },
    perFiscalByAssure: {
      epoux1: { totalDroits: 0 },
      epoux2: { totalDroits: 0 },
    },
    prevoyanceByAssure: { epoux1: 0, epoux2: 0 },
    prevoyanceFiscalByAssure: {
      epoux1: { totalDroits: 0 },
      epoux2: { totalDroits: 0 },
    },
    displayTotals: {
      decesSimule: {
        side: 'epoux1' as const,
        droitsSuccession: 20000,
        droitsHorsSuccession: { assuranceVie: 0, per: 0, prevoyance: 0, total: 0 },
        totalDroits: 20000,
      },
      secondDeces: null,
      projectionAutreAssure: {
        side: 'epoux2' as const,
        droitsHorsSuccession: { assuranceVie: 0, per: 0, prevoyance: 0, total: 0 },
        totalDroits: 0,
      },
      droitsCumulesProjetes: 20000,
      droitsChronologie: 20000,
    },
    directDisplay: {
      simulatedDeceased: 'epoux1' as const,
      result: { totalDroits: 20000 },
    },
  };
}

describe('ScDeathTimelinePanel', () => {
  it('exposes death horizon options through 50 years in expert mode', () => {
    const markup = renderToStaticMarkup(<ScDeathTimelinePanel {...buildProps()} />);
    const lastOption = DECES_DANS_X_ANS_OPTIONS[DECES_DANS_X_ANS_OPTIONS.length - 1];

    expect(lastOption?.value).toBe(50);
    expect(markup).toContain('Horizon du deces simule');
    expect(markup).toContain('Dans 50 ans');
  });

  it('hides the death horizon control outside expert mode', () => {
    const markup = renderToStaticMarkup(
      <ScDeathTimelinePanel
        {...buildProps()}
        showDeathHorizonControl={false}
      />,
    );

    expect(markup).toContain('Chronologie des deces');
    expect(markup).not.toContain('Horizon du deces simule');
  });

  it('hides the order toggle outside couple scenarios', () => {
    const markup = renderToStaticMarkup(
      <ScDeathTimelinePanel
        {...buildProps()}
        showOrderToggle={false}
      />,
    );

    expect(markup).not.toContain('Ordre inverse');
  });

  it("affiche la projection autre assuré quand elle explique le coût cumulé direct", () => {
    const markup = renderToStaticMarkup(
      <ScDeathTimelinePanel
        {...buildProps()}
        avFiscalByAssure={{
          epoux1: { totalDroits: 10 },
          epoux2: { totalDroits: 100 },
        }}
        perFiscalByAssure={{
          epoux1: { totalDroits: 30 },
          epoux2: { totalDroits: 300 },
        }}
        prevoyanceFiscalByAssure={{
          epoux1: { totalDroits: 50 },
          epoux2: { totalDroits: 500 },
        }}
        displayTotals={{
          decesSimule: {
            side: 'epoux1',
            droitsSuccession: 100,
            droitsHorsSuccession: { assuranceVie: 10, per: 30, prevoyance: 50, total: 90 },
            totalDroits: 190,
          },
          secondDeces: null,
          projectionAutreAssure: {
            side: 'epoux2',
            droitsHorsSuccession: { assuranceVie: 100, per: 300, prevoyance: 500, total: 900 },
            totalDroits: 900,
          },
          droitsCumulesProjetes: 1090,
          droitsChronologie: 1090,
        }}
        directDisplay={{
          simulatedDeceased: 'epoux1',
          result: { totalDroits: 100 },
        }}
      />,
    );

    expect(markup).toContain('Projection autre assuré');
    expect(markup).toContain('Droits assurance-vie');
    expect(markup).toContain('Total cumule des droits');
    expect(markup).toContain('1 090');
  });

  it("shows societe d'acquets details inside the chronology when chainage uses that pocket", () => {
    const baseProps = buildProps();
    const markup = renderToStaticMarkup(
      <ScDeathTimelinePanel
        {...baseProps}
        displayUsesChainage
        chainageAnalysis={{
          ...baseProps.chainageAnalysis,
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
          participationAcquets: {
            active: true,
            creditor: 'epoux2',
            debtor: 'epoux1',
            quoteAppliedPct: 50,
            creanceAmount: 70000,
            firstEstateAdjustment: -70000,
          },
          interMassClaims: {
            totalAppliedAmount: 25000,
            claims: [
              {
                id: 'claim-1',
                kind: 'recompense',
                fromPocket: 'communaute',
                toPocket: 'epoux1',
                appliedAmount: 25000,
              },
            ],
          },
          affectedLiabilities: {
            totalAmount: 15000,
            byPocket: [{ pocket: 'epoux1', amount: 15000 }],
          },
          preciput: {
            mode: 'cible',
            appliedAmount: 50000,
            usesGlobalFallback: false,
            selections: [{ id: 'prec-1', label: 'Portefeuille titres', appliedAmount: 50000 }],
          },
        }}
      />,
    );

    expect(markup).toContain('part 1er deces');
    expect(markup).toContain('part survivant');
    expect(markup).toContain('Preciput applique');
    expect(markup).toContain('Creance de participation');
    expect(markup).toContain('Creances entre masses appliquees');
    expect(markup).toContain('Passif affecte rattache');
  });
});
