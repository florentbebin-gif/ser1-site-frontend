import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useSuccessionDerivedValues } from '../hooks/useSuccessionDerivedValues';
import { buildSuccessionFiscalSnapshot } from '../successionFiscalContext';
import {
  DEFAULT_SUCCESSION_ASSURANCE_VIE,
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  DEFAULT_SUCCESSION_DONATIONS,
  DEFAULT_SUCCESSION_FAMILY_MEMBERS,
  DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  DEFAULT_SUCCESSION_PER,
} from '../successionDraft';

type UseSuccessionDerivedValuesInput = Parameters<typeof useSuccessionDerivedValues>[0];
type SuccessionDerivedValues = ReturnType<typeof useSuccessionDerivedValues>;

function renderSuccessionDerivedValues(input: UseSuccessionDerivedValuesInput): SuccessionDerivedValues {
  let captured: SuccessionDerivedValues | null = null;

  function Probe() {
    captured = useSuccessionDerivedValues(input);
    return null;
  }

  renderToStaticMarkup(<Probe />);
  if (!captured) throw new Error('useSuccessionDerivedValues non rendu');
  return captured;
}

describe('useSuccessionDerivedValues', () => {
  it('injecte les enfants non communs dérivés dans le chaînage même si le contexte de dévolution est périmé', () => {
    const derived = renderSuccessionDerivedValues({
      civilContext: {
        ...DEFAULT_SUCCESSION_CIVIL_CONTEXT,
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'communaute_legale',
        dateNaissanceEpoux1: '1970-01-01',
        dateNaissanceEpoux2: '1975-01-01',
      },
      liquidationContext: {
        ...DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
        actifEpoux1: 200_000,
        actifEpoux2: 200_000,
        actifCommun: 400_000,
        nbEnfants: 1,
      },
      assetEntries: [],
      groupementFoncierEntries: [],
      assuranceVieEntries: DEFAULT_SUCCESSION_ASSURANCE_VIE,
      perEntries: DEFAULT_SUCCESSION_PER,
      prevoyanceDecesEntries: [],
      devolutionContext: {
        ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
        nbEnfantsNonCommuns: 0,
        choixLegalConjointSansDDV: 'usufruit',
      },
      patrimonialContext: {
        ...DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
        donationEntreEpouxActive: false,
      },
      donationsContext: DEFAULT_SUCCESSION_DONATIONS,
      enfantsContext: [{ id: 'E1', rattachement: 'epoux1' }],
      familyMembers: DEFAULT_SUCCESSION_FAMILY_MEMBERS,
      fiscalSnapshot: buildSuccessionFiscalSnapshot(null),
      chainOrder: 'epoux1',
      canExport: false,
    });

    expect(derived.nbEnfantsNonCommuns).toBe(1);
    expect(derived.chainageAnalysis.step1?.partConjoint).toBe(100_000);
    expect(derived.chainageAnalysis.warnings.some((warning) => warning.includes("enfant(s) non commun(s)"))).toBe(true);
    expect(derived.chainageAnalysis.warnings.some((warning) => warning.includes('669'))).toBe(false);
  });
});
