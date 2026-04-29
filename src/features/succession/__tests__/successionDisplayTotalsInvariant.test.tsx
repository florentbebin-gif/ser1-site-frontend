import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { buildSuccessionAvFiscalAnalysis } from '../successionAvFiscal';
import type { buildSuccessionChainageAnalysis } from '../successionChainage';
import type { buildSuccessionPerFiscalAnalysis } from '../successionPerFiscal';
import type { buildSuccessionPrevoyanceFiscalAnalysis } from '../successionPrevoyanceFiscal';
import ScDeathTimelinePanel from '../components/ScDeathTimelinePanel';
import ScSuccessionSummaryPanel from '../components/ScSuccessionSummaryPanel';
import { buildSuccessionChainageExportPayload } from '../hooks/useSuccessionOutcomeExportPayload';
import {
  buildSuccessionDisplayTotals,
  type SuccessionDisplayTotals,
} from '../hooks/useSuccessionOutcomeDerivedValues.helpers';
import { fmt } from '../successionSimulator.helpers';

type SuccessionSide = 'epoux1' | 'epoux2';
type AvFiscalAnalysis = ReturnType<typeof buildSuccessionAvFiscalAnalysis>;
type PerFiscalAnalysis = ReturnType<typeof buildSuccessionPerFiscalAnalysis>;
type PrevoyanceFiscalAnalysis = ReturnType<typeof buildSuccessionPrevoyanceFiscalAnalysis>;
type ChainageAnalysis = ReturnType<typeof buildSuccessionChainageAnalysis>;

interface ScenarioInput {
  displayUsesChainage: boolean;
  hasSecondSubject: boolean;
  isPacsed?: boolean;
  directSimulatedDeceased: SuccessionSide;
  directSuccessionDroits: number;
  chainageOrder: SuccessionSide;
  chainageStep1Droits: number;
  chainageStep2Droits: number;
  avDroits: Record<SuccessionSide, number>;
  perDroits: Record<SuccessionSide, number>;
  prevoyanceDroits: Record<SuccessionSide, number>;
}

function makeFiscalAnalysis<T>(byAssure: Record<SuccessionSide, number>): T {
  return {
    totalDroits: byAssure.epoux1 + byAssure.epoux2,
    lines: [],
    warnings: [],
    byAssure: {
      epoux1: { totalDroits: byAssure.epoux1, lines: [] },
      epoux2: { totalDroits: byAssure.epoux2, lines: [] },
    },
  } as unknown as T;
}

function makeChainageAnalysis({
  order,
  step1Droits,
  step2Droits,
}: {
  order: SuccessionSide;
  step1Droits: number;
  step2Droits: number;
}): ChainageAnalysis {
  return {
    applicable: true,
    order,
    firstDecedeLabel: order === 'epoux1' ? 'Epoux 1' : 'Epoux 2',
    secondDecedeLabel: order === 'epoux1' ? 'Epoux 2' : 'Epoux 1',
    step1: {
      actifTransmis: 1000,
      partConjoint: 0,
      partEnfants: 1000,
      droitsEnfants: step1Droits,
      beneficiaries: [],
    },
    step2: {
      actifTransmis: 2000,
      partConjoint: 0,
      partEnfants: 2000,
      droitsEnfants: step2Droits,
      beneficiaries: [],
    },
    totalDroits: step1Droits + step2Droits,
    warnings: [],
    societeAcquets: null,
    participationAcquets: null,
    interMassClaims: null,
    affectedLiabilities: null,
    preciput: null,
  } as unknown as ChainageAnalysis;
}

function buildScenario(input: ScenarioInput) {
  const avFiscalAnalysis = makeFiscalAnalysis<AvFiscalAnalysis>(input.avDroits);
  const perFiscalAnalysis = makeFiscalAnalysis<PerFiscalAnalysis>(input.perDroits);
  const prevoyanceFiscalAnalysis = makeFiscalAnalysis<PrevoyanceFiscalAnalysis>(input.prevoyanceDroits);
  const chainageAnalysis = makeChainageAnalysis({
    order: input.chainageOrder,
    step1Droits: input.chainageStep1Droits,
    step2Droits: input.chainageStep2Droits,
  });
  const displayTotals = buildSuccessionDisplayTotals({
    shouldRenderSuccessionComputationSections: true,
    displayUsesChainage: input.displayUsesChainage,
    hasSecondSubject: input.hasSecondSubject,
    chainageOrder: input.chainageOrder,
    chainageStep1Droits: input.chainageStep1Droits,
    chainageStep2Droits: input.chainageStep2Droits,
    chainageTotalDroits: input.chainageStep1Droits + input.chainageStep2Droits,
    directSimulatedDeceased: input.directSimulatedDeceased,
    directSuccessionDroits: input.directSuccessionDroits,
    avFiscalAnalysis,
    perFiscalAnalysis,
    prevoyanceFiscalAnalysis,
  });

  return {
    ...input,
    avFiscalAnalysis,
    perFiscalAnalysis,
    prevoyanceFiscalAnalysis,
    chainageAnalysis,
    displayTotals,
  };
}

function extractSummaryKpiValue(markup: string, label: string): string | undefined {
  const matches = markup.matchAll(
    /<span class="sc-synth-kpi__label">([^<]+)<\/span><strong class="sc-synth-kpi__value">([^<]+)<\/strong>/g,
  );
  for (const match of matches) {
    if (match[1] === label) return match[2];
  }
  return undefined;
}

function extractSummaryHeroValue(markup: string): string | undefined {
  return markup.match(/<div class="sc-synth-hero__value">([^<]+)<\/div>/)?.[1];
}

function extractChronologyTotal(markup: string): string | undefined {
  return markup.match(/<div class="sc-chrono-total"><span>Total cumule des droits<\/span><strong>([^<]+)<\/strong><\/div>/)?.[1];
}

function renderSummary({
  displayUsesChainage,
  displayTotals,
  chainageAnalysis,
  isPacsed = false,
}: {
  displayUsesChainage: boolean;
  displayTotals: SuccessionDisplayTotals;
  chainageAnalysis: ChainageAnalysis;
  isPacsed?: boolean;
}) {
  return renderToStaticMarkup(
    <ScSuccessionSummaryPanel
      displayUsesChainage={displayUsesChainage}
      derivedTotalDroits={displayTotals.droitsCumulesProjetes}
      displayTotals={displayTotals}
      synthDonutTransmis={5000}
      derivedMasseTransmise={5000}
      synthHypothese={null}
      isPacsed={isPacsed}
      chainageAnalysis={chainageAnalysis}
      unifiedBlocks={[]}
    />,
  );
}

function renderTimeline({
  displayUsesChainage,
  displayTotals,
  chainageAnalysis,
  avFiscalAnalysis,
  perFiscalAnalysis,
  prevoyanceFiscalAnalysis,
  directSimulatedDeceased,
  directSuccessionDroits,
  isPacsed = false,
}: ReturnType<typeof buildScenario>) {
  return renderToStaticMarkup(
    <ScDeathTimelinePanel
      chainOrder={chainageAnalysis.order}
      onToggleOrder={() => {}}
      showOrderToggle
      displayUsesChainage={displayUsesChainage}
      derivedMasseTransmise={3000}
      displayTotals={displayTotals}
      isPacsed={isPacsed}
      showDeathHorizonControl={false}
      decesDansXAns={0}
      onChangeDecesDansXAns={() => {}}
      chainageAnalysis={chainageAnalysis}
      assuranceVieByAssure={{ epoux1: 0, epoux2: 0 }}
      avFiscalByAssure={avFiscalAnalysis.byAssure}
      perByAssure={{ epoux1: 0, epoux2: 0 }}
      perFiscalByAssure={perFiscalAnalysis.byAssure}
      prevoyanceByAssure={{ epoux1: 0, epoux2: 0 }}
      prevoyanceFiscalByAssure={prevoyanceFiscalAnalysis.byAssure}
      directDisplay={{
        simulatedDeceased: directSimulatedDeceased,
        result: { totalDroits: directSuccessionDroits },
      }}
    />,
  );
}

function buildExportTotal({
  displayUsesChainage,
  displayTotals,
  chainageAnalysis,
  avFiscalAnalysis,
  perFiscalAnalysis,
  prevoyanceFiscalAnalysis,
  isPacsed = false,
}: ReturnType<typeof buildScenario>): number {
  const payload = buildSuccessionChainageExportPayload({
    displayUsesChainage,
    chainageAnalysis,
    assuranceVieByAssure: { epoux1: 0, epoux2: 0 },
    perByAssure: { epoux1: 0, epoux2: 0 },
    prevoyanceByAssure: { epoux1: 0, epoux2: 0 },
    assuranceVieTotale: 0,
    perTotale: 0,
    prevoyanceTotale: 0,
    avFiscalAnalysis,
    perFiscalAnalysis,
    prevoyanceFiscalAnalysis,
    derivedTotalDroits: displayTotals.droitsCumulesProjetes,
    isPacsed,
    directDisplayWarnings: [],
  });

  return payload.totalDroits;
}

function expectInvariant(
  scenario: ReturnType<typeof buildScenario>,
  options: { summaryKpiLabel?: string } = {},
) {
  const summaryMarkup = renderSummary(scenario);
  const timelineMarkup = renderTimeline(scenario);
  const expected = scenario.displayTotals.droitsCumulesProjetes;
  const summaryValue = options.summaryKpiLabel
    ? extractSummaryKpiValue(summaryMarkup, options.summaryKpiLabel)
    : extractSummaryHeroValue(summaryMarkup);

  expect(summaryValue).toBe(fmt(expected));
  expect(extractChronologyTotal(timelineMarkup)).toBe(fmt(expected));
  expect(buildExportTotal(scenario)).toBe(expected);
}

describe('invariants droits affiches succession', () => {
  it('aligne Synthese, Chronologie et export en mode direct concubinage avec deux assures', () => {
    const scenario = buildScenario({
      displayUsesChainage: false,
      hasSecondSubject: true,
      directSimulatedDeceased: 'epoux1',
      directSuccessionDroits: 100,
      chainageOrder: 'epoux1',
      chainageStep1Droits: 0,
      chainageStep2Droits: 0,
      avDroits: { epoux1: 10, epoux2: 100 },
      perDroits: { epoux1: 30, epoux2: 300 },
      prevoyanceDroits: { epoux1: 50, epoux2: 500 },
    });

    expect(scenario.displayTotals.decesSimule.totalDroits).toBe(190);
    expect(scenario.displayTotals.projectionAutreAssure?.totalDroits).toBe(900);
    expectInvariant(scenario, { summaryKpiLabel: 'Coût cumulé' });
  });

  it('aligne Synthese, Chronologie et export en mode direct PACS ordre inverse', () => {
    const scenario = buildScenario({
      displayUsesChainage: false,
      hasSecondSubject: true,
      isPacsed: true,
      directSimulatedDeceased: 'epoux2',
      directSuccessionDroits: 80,
      chainageOrder: 'epoux2',
      chainageStep1Droits: 0,
      chainageStep2Droits: 0,
      avDroits: { epoux1: 1, epoux2: 20 },
      perDroits: { epoux1: 2, epoux2: 40 },
      prevoyanceDroits: { epoux1: 3, epoux2: 60 },
    });

    expect(scenario.displayTotals.decesSimule.totalDroits).toBe(200);
    expect(scenario.displayTotals.projectionAutreAssure?.totalDroits).toBe(6);
    expectInvariant(scenario, { summaryKpiLabel: 'Coût cumulé' });
  });

  it('aligne Synthese, Chronologie et export en mode chainage marie', () => {
    const scenario = buildScenario({
      displayUsesChainage: true,
      hasSecondSubject: true,
      directSimulatedDeceased: 'epoux1',
      directSuccessionDroits: 0,
      chainageOrder: 'epoux2',
      chainageStep1Droits: 100,
      chainageStep2Droits: 300,
      avDroits: { epoux1: 10, epoux2: 20 },
      perDroits: { epoux1: 30, epoux2: 40 },
      prevoyanceDroits: { epoux1: 50, epoux2: 60 },
    });

    expect(scenario.displayTotals.decesSimule.totalDroits).toBe(220);
    expect(scenario.displayTotals.secondDeces?.totalDroits).toBe(390);
    expectInvariant(scenario);
  });

  it('aligne Synthese, Chronologie et export quand aucun droit n est du', () => {
    const scenario = buildScenario({
      displayUsesChainage: false,
      hasSecondSubject: true,
      directSimulatedDeceased: 'epoux1',
      directSuccessionDroits: 0,
      chainageOrder: 'epoux1',
      chainageStep1Droits: 0,
      chainageStep2Droits: 0,
      avDroits: { epoux1: 0, epoux2: 0 },
      perDroits: { epoux1: 0, epoux2: 0 },
      prevoyanceDroits: { epoux1: 0, epoux2: 0 },
    });

    expectInvariant(scenario, { summaryKpiLabel: 'Coût cumulé' });
  });

  it.each(['celibataire', 'divorce', 'veuf'] as const)(
    'null la projection autre assuré pour %s et masque le bloc dans la Chronologie',
    () => {
    const scenario = buildScenario({
      displayUsesChainage: false,
      hasSecondSubject: false,
      directSimulatedDeceased: 'epoux1',
      directSuccessionDroits: 100,
      chainageOrder: 'epoux1',
      chainageStep1Droits: 0,
      chainageStep2Droits: 0,
      avDroits: { epoux1: 10, epoux2: 999 },
      perDroits: { epoux1: 20, epoux2: 999 },
      prevoyanceDroits: { epoux1: 30, epoux2: 999 },
    });

    expect(scenario.displayTotals.projectionAutreAssure).toBeNull();

    const timelineMarkup = renderTimeline(scenario);
    expect(timelineMarkup).not.toContain('Projection autre assuré');
    expect(timelineMarkup).not.toContain('La succession patrimoniale future');
    },
  );

  it('expose le bloc Projection autre assuré pour concubinage avec un assuré porteur de droits', () => {
    const scenario = buildScenario({
      displayUsesChainage: false,
      hasSecondSubject: true,
      directSimulatedDeceased: 'epoux1',
      directSuccessionDroits: 0,
      chainageOrder: 'epoux1',
      chainageStep1Droits: 0,
      chainageStep2Droits: 0,
      avDroits: { epoux1: 0, epoux2: 200 },
      perDroits: { epoux1: 0, epoux2: 0 },
      prevoyanceDroits: { epoux1: 0, epoux2: 0 },
    });

    const timelineMarkup = renderTimeline(scenario);
    expect(timelineMarkup).toContain('Projection autre assuré');
    expect(timelineMarkup).toContain('La succession patrimoniale future');
  });
});
