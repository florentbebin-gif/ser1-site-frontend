import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DECES_DANS_X_ANS_OPTIONS } from '../successionSimulator.constants';
import ScDeathTimelinePanel from '../components/ScDeathTimelinePanel';

function buildProps() {
  return {
    chainOrder: 'epoux1' as const,
    onToggleOrder: () => {},
    displayUsesChainage: false,
    derivedMasseTransmise: 300000,
    derivedTotalDroits: 20000,
    isPacsed: false,
    showDeathHorizonControl: true,
    decesDansXAns: 50 as const,
    onChangeDecesDansXAns: () => {},
    chainageAnalysis: {
      order: 'epoux1' as const,
      firstDecedeLabel: 'epoux 1',
      secondDecedeLabel: 'epoux 2',
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
});
