import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
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

  describe('Scénarios avec horizon variable (T1)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('T1.1 — Communauté légale + 2 enfants communs + choix légal usufruit + horizon variable', () => {
      const baseProps: UseSuccessionDerivedValuesInput = {
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
          nbEnfants: 2,
        },
        assetEntries: [],
        groupementFoncierEntries: [],
        assuranceVieEntries: DEFAULT_SUCCESSION_ASSURANCE_VIE,
        perEntries: DEFAULT_SUCCESSION_PER,
        prevoyanceDecesEntries: [],
        devolutionContext: {
          ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
          choixLegalConjointSansDDV: 'usufruit',
        },
        patrimonialContext: {
          ...DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
          donationEntreEpouxActive: false,
          decesDansXAns: 0,
        },
        donationsContext: DEFAULT_SUCCESSION_DONATIONS,
        enfantsContext: [
          { id: 'E1', rattachement: 'commun' },
          { id: 'E2', rattachement: 'commun' },
        ],
        familyMembers: DEFAULT_SUCCESSION_FAMILY_MEMBERS,
        fiscalSnapshot: buildSuccessionFiscalSnapshot(null),
        chainOrder: 'epoux1',
        canExport: false,
      };

      const derived0 = renderSuccessionDerivedValues(baseProps);
      expect(derived0.chainageAnalysis.step1?.partConjoint).toBe(200_000); // 50% de 400_000 (age 51 ans)

      const derived15 = renderSuccessionDerivedValues({
        ...baseProps,
        patrimonialContext: {
          ...baseProps.patrimonialContext,
          decesDansXAns: 15,
        },
      });
      expect(derived15.chainageAnalysis.step1?.partConjoint).toBe(160_000); // 40% de 400_000 (age 66 ans)
    });

    it('T1.2 — PACS + testament partenaire actif → chaînage applicable', () => {
      const derived = renderSuccessionDerivedValues({
        civilContext: {
          ...DEFAULT_SUCCESSION_CIVIL_CONTEXT,
          situationMatrimoniale: 'pacse',
          pacsConvention: 'separation',
        },
        liquidationContext: {
          ...DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
          actifEpoux1: 600_000,
          actifEpoux2: 0,
          actifCommun: 0,
          nbEnfants: 2,
        },
        assetEntries: [],
        groupementFoncierEntries: [],
        assuranceVieEntries: DEFAULT_SUCCESSION_ASSURANCE_VIE,
        perEntries: DEFAULT_SUCCESSION_PER,
        prevoyanceDecesEntries: [],
        devolutionContext: {
          ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
          testamentsBySide: {
            epoux1: {
              active: true,
              dispositionType: 'legs_universel',
              beneficiaryRef: 'principal:epoux2',
              quotePartPct: 100,
              particularLegacies: [],
            },
            epoux2: { active: false, dispositionType: 'legs_universel', beneficiaryRef: 'principal:epoux1', quotePartPct: 100, particularLegacies: [] },
          },
        },
        patrimonialContext: {
          ...DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
          decesDansXAns: 0,
        },
        donationsContext: DEFAULT_SUCCESSION_DONATIONS,
        enfantsContext: [
          { id: 'E1', rattachement: 'commun' },
          { id: 'E2', rattachement: 'commun' },
        ],
        familyMembers: DEFAULT_SUCCESSION_FAMILY_MEMBERS,
        fiscalSnapshot: buildSuccessionFiscalSnapshot(null),
        chainOrder: 'epoux1',
        canExport: false,
      });

      expect(derived.chainageAnalysis.applicable).toBe(true);
      // 1/3 quotité disponible de 600_000 transmis au partenaire via testament
      expect(derived.chainageAnalysis.step1?.partConjoint).toBe(200_000);
      // Le partenaire PACS bénéficie de l'exonération CGI 796-0 bis → droits = 0
      const partenaire = derived.chainageAnalysis.step1?.beneficiaries.find(
        (b) => b.id === 'partenaire-pacse' || b.lien === 'conjoint',
      );
      expect(partenaire?.droits).toBe(0);
    });

    it('T1.3 — Communauté universelle + attribution intégrale → step1 = 0', () => {
      const derived = renderSuccessionDerivedValues({
        civilContext: {
          ...DEFAULT_SUCCESSION_CIVIL_CONTEXT,
          situationMatrimoniale: 'marie',
          regimeMatrimonial: 'communaute_universelle',
        },
        liquidationContext: {
          ...DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
          actifEpoux1: 300_000,
          actifEpoux2: 200_000,
          actifCommun: 500_000,
          nbEnfants: 2,
        },
        assetEntries: [],
        groupementFoncierEntries: [],
        assuranceVieEntries: DEFAULT_SUCCESSION_ASSURANCE_VIE,
        perEntries: DEFAULT_SUCCESSION_PER,
        prevoyanceDecesEntries: [],
        devolutionContext: {
          ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
        },
        patrimonialContext: {
          ...DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
          attributionIntegrale: true,
          decesDansXAns: 0,
        },
        donationsContext: DEFAULT_SUCCESSION_DONATIONS,
        enfantsContext: [
          { id: 'E1', rattachement: 'commun' },
          { id: 'E2', rattachement: 'commun' },
        ],
        familyMembers: DEFAULT_SUCCESSION_FAMILY_MEMBERS,
        fiscalSnapshot: buildSuccessionFiscalSnapshot(null),
        chainOrder: 'epoux1',
        canExport: false,
      });

      expect(derived.chainageAnalysis.step1?.actifTransmis).toBe(0);
      expect(derived.chainageAnalysis.step2?.actifTransmis).toBe(1_000_000);
      expect(derived.chainageAnalysis.step1?.droitsEnfants).toBe(0);
      expect(derived.chainageAnalysis.warnings.some(w => w.includes('attribution integrale') || w.includes('attribution intégrale'))).toBe(true);
    });

    it('T1.4 — simulatedDeathDate transmise à applySuccessionDonationRecallToHeirs → fenêtre rappel variable', () => {
      // Régression : si referenceDate = simulatedDeathDate n'était pas transmise au moteur de rappel,
      // la fenêtre serait calculée depuis today → rappel actif même à horizon 16 ans.
      const baseProps: UseSuccessionDerivedValuesInput = {
        civilContext: {
          ...DEFAULT_SUCCESSION_CIVIL_CONTEXT,
          situationMatrimoniale: 'celibataire',
        },
        liquidationContext: {
          ...DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
          actifEpoux1: 200_000, // actif non nul pour produire des droits non nuls
        },
        assetEntries: [],
        groupementFoncierEntries: [],
        assuranceVieEntries: DEFAULT_SUCCESSION_ASSURANCE_VIE,
        perEntries: DEFAULT_SUCCESSION_PER,
        prevoyanceDecesEntries: [],
        devolutionContext: DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
        patrimonialContext: {
          ...DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
          decesDansXAns: 10,
        },
        donationsContext: [
          {
            id: 'D1',
            type: 'rapportable',
            montant: 50_000,
            date: '2026-01', // donation du jour (clock figée à 2026-01-01)
            donateur: 'epoux1',
            donataire: 'E1',
            donSommeArgentExonere: false,
          },
        ],
        enfantsContext: [{ id: 'E1', rattachement: 'epoux1' }],
        familyMembers: DEFAULT_SUCCESSION_FAMILY_MEMBERS,
        fiscalSnapshot: buildSuccessionFiscalSnapshot(null),
        chainOrder: 'epoux1',
        canExport: false,
      };

      // horizon 10 → décès simulé 2036-01-01 → donation 2026-01 dans la fenêtre 15 ans → rappel actif
      const derived10 = renderSuccessionDerivedValues(baseProps);
      // horizon 20 → décès simulé 2046-01-01 → donation 2026-01 hors fenêtre 15 ans → rappel inactif
      const derived20 = renderSuccessionDerivedValues({
        ...baseProps,
        patrimonialContext: { ...baseProps.patrimonialContext, decesDansXAns: 20 },
      });

      // Preuve directe : baseHistoriqueTaxee est posé par applySuccessionDonationRecallToHeirs
      // avant que la base taxable soit calculée. Lorsque assetEntries=[], transmissionBasis
      // est un objet vide (non null) qui force taxablePartSuccession=0, donc totalDroits=0 dans
      // les deux cas — ce champ est la seule observable du câblage referenceDate→rappel fiscal.
      expect(derived10.directDisplayAnalysis.heirs[0]?.baseHistoriqueTaxee).toBe(50_000);
      expect(derived20.directDisplayAnalysis.heirs[0]?.baseHistoriqueTaxee ?? 0).toBe(0);
    });
  });
});
