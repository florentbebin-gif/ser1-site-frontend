import JSZip from 'jszip';
import PptxGenJS from 'pptxgenjs';
import { describe, expect, it } from 'vitest';
import { buildTresorerieSchema } from '@/pptx/slides/buildTresorerieSchema';
import { defineSlideMasters } from '@/pptx/template/loadBaseTemplate';
import { getPptxThemeFromUiSettings } from '@/pptx/theme/getPptxThemeFromUiSettings';
import type { ExportContext, TresorerieSchemaSlideSpec } from '@/pptx/theme/types';
import { DEFAULT_COLORS } from '@/settings/theme';
import { fingerprintPptxExport } from '@/utils/export/exportFingerprint';
import type { TresoProjectionRow } from '@/engine/tresorerie/types';
import type { TresoKPIs } from '../hooks/useTresorerieCalculations';
import { buildTresorerieXlsxBlob } from '../export/tresorerieExcelExport';
import { buildTresorerieStudyDeck } from '../export/tresoreriePptxWrapper';

const KPIS: TresoKPIs = {
  ccaTotalConstitue: 234000,
  isTotalDecaisse: 14500,
  isLatentCapi: 7200,
  revenusNetsRetraite: 26000,
  dureeRemboursementCCA: 10,
  valeurNetteSocieteRetraite: 188000,
  reservesRetraite: 42000,
  capaciteDistribuableAn1: 6500,
  alerteDividendesAn1: false,
  deficitBancaireMax: 0,
  compteBancaireFinHorizon: 0,
  ccaRestantFinHorizon: 0,
  ccaRembourseTotal: 0,
  alerteTresorerieBancaire: false,
  premiereAnneeDeficitBancaire: null,
  hasRows: true,
  anneeRetraiteIndex: 12,
};

const INPUTS = {
  version: 3,
  selectedAssociateId: 'associe-1',
  foyer: {
    selectedAssociateId: 'associe-1',
    currentAge: 50,
    retirementAge: 62,
    annualIncomeNeed: 24000,
    projectionStartYear: 2026,
  },
  company: {
    creationType: 'newco',
    legalForm: 'sas',
    companyKind: 'holding_patrimoniale',
    shareCapital: 10000,
    sharePremium: 0,
    reservesInitial: 8000,
    treasuryInitial: 150000,
    annualStructureCosts: 3000,
    incomeStatement: {
      annualRevenue: 0,
      annualStructureCosts: 3000,
      workingCapitalRequirement: 50000,
    },
    reducedCorporateTaxEligible: true,
    associates: [{
      id: 'associe-1',
      label: 'Associé 1',
      kind: 'pp',
      profile: {
        currentAge: 50,
        retirementAge: 62,
        annualIncomeNeed: 24000,
        projectionStartYear: 2026,
      },
      ownershipLots: [{ right: 'pleine_propriete', capitalPct: 100, economicRightsPct: 100 }],
      roles: ['associe_sans_statut'],
      cca: {
        currentBalance: 90000,
        exceptionalContributions: [{ year: 2028, amount: 15000 }],
        annualContribution: { amount: 12000, startYear: 2026, endYear: 2037 },
        remunerationRate: 0.04,
      },
      remuneration: { source: 'holding', loadedAnnualCost: 0, socialChargeRate: 0 },
      revenuePhases: [
        {
          id: 'phase-remu',
          label: 'Rémunération holding',
          startYear: 2026,
          source: 'holding',
          loadedAnnualCost: 80000,
          socialChargeRate: 0.3,
          annualNetIncomeNeed: 0,
          useCcaForCompletion: true,
        },
        {
          id: 'phase-besoin',
          label: 'Besoin complémentaire',
          startYear: 2031,
          source: 'none',
          loadedAnnualCost: 0,
          socialChargeRate: 0,
          annualNetIncomeNeed: 40000,
          useCcaForCompletion: false,
        },
      ],
    }],
    loans: [{
      id: 'pret-1',
      label: 'Emprunt société',
      principal: 90000,
      annualRate: 0.035,
      durationMonths: 120,
      startDate: '2026-01',
      existingLoan: false,
      deductibleInterest: true,
    }],
    subsidiaries: [{
      id: 'filiale-1',
      label: 'Filiale',
      parentEntityId: 'societe',
      ownershipPct: 80,
      holdingOwnershipPct: 80,
      motherDaughterEligible: true,
      fiscalIntegrationEstimateEnabled: false,
      servicesSchedule: [],
      dividendsSchedule: [{ amount: 18000, startYear: 2026 }],
    }],
  },
  allocationMatrix: {
    sweepThreshold: 50000,
    pockets: [
      {
        id: 'distribution-1',
        label: 'Court terme',
        kind: 'distribution',
        horizon: 'court_terme',
        durationYears: 5,
        annualReturnRate: 0.045,
        enjoymentDelayMonths: 0,
        initialAllocationPct: 60,
        annualAllocationPct: 70,
        repeatAtTerm: false,
      },
      {
        id: 'capitalisation-1',
        label: 'Long terme',
        kind: 'capitalisation',
        horizon: 'long_terme',
        durationYears: 8,
        annualReturnRate: 0.035,
        enjoymentDelayMonths: 0,
        initialAllocationPct: 40,
        annualAllocationPct: 30,
        repeatAtTerm: false,
      },
    ],
  },
} as any;

function makeRow(year: number): TresoProjectionRow {
  const retirementOffset = INPUTS.foyer.retirementAge - INPUTS.foyer.currentAge;
  const activeYears = Math.max(1, retirementOffset);
  return {
    year,
    apportCCA: year <= activeYears ? 12000 : 0,
    ccaCumule: 90000 + Math.min(year, activeYears) * 12000,
    ccaRestant: Math.max(0, 234000 - Math.max(0, year - activeYears) * 24000),
    retraitsCCA: year > activeYears ? 24000 : 0,
    capitalDistrib: 70000,
    revenuDistrib: 3150,
    capitalCapi: 60000,
    valeurCapi: 60000 + year * 2100,
    gainCapiN: 0,
    isLatentCapi: year * 600,
    montantRachatCapi: 0,
    dividendesFiliales: 0,
    dividendesFilialesExoneres: 0,
    quotePartTaxable: 0,
    cessionFilialesCash: 0,
    cessionFilialesPlusValueBrute: 0,
    cessionFilialesQuotePartTaxable: 0,
    chargesStructure: INPUTS.company.annualStructureCosts,
    interetsCCA: 0,
    interetsCCADeductibles: 0,
    interetsCCANonDeductibles: 0,
    interetsCreditIS: 0,
    resultatComptableAvantIS: 150,
    resultatFiscalAvantIS: 150,
    baseIS: 150,
    is: 22,
    resultatNetComptable: 128,
    dividendesBrutsCreditIRDemandes: 0,
    dividendesComplementairesBrutsDemandes: 0,
    dividendesDemandesTotaux: 0,
    dividendesAssociesBruts: 0,
    pfu: 0,
    reservesDebut: 8000 + year * 128,
    reserveLegaleDebut: 0,
    dotationReserveLegale: 0,
    reserveLegaleFin: 0,
    capaciteDistribuable: 6500 + year * 100,
    miseEnReserve: 128,
    reservesFin: 8128 + year * 128,
    alerteDividendesSuperieursCapacite: false,
    annuiteCreditIS: 0,
    revenusActifFinance: 0,
    revenusNets: year > activeYears ? 24000 : 0,
    deltaBesoin: year > activeYears ? 0 : -INPUTS.foyer.annualIncomeNeed,
    revenusParAssocie: year >= activeYears
      ? [{
        associateId: 'associe-1',
        label: 'Associé 1',
        source: 'cca',
        remuneration: 0,
        ccaRepaid: 24000,
        grossDividends: 0,
        dividendTax: 0,
        tnsSocialCharges: 0,
        netRevenue: 24000,
      }]
      : [],
    tresorerieDebut: 15000 + year * 1000,
    tresorerieFin: 16000 + year * 1000,
  };
}

const ROWS = Array.from({ length: 12 }, (_, index) => makeRow(index + 1));

function buildPptxContext(): ExportContext {
  return {
    theme: getPptxThemeFromUiSettings(DEFAULT_COLORS),
    locale: 'fr-FR',
    generatedAt: new Date('2026-01-01T00:00:00.000Z'),
    footerDisclaimer: '',
    showSlideNumbers: true,
  };
}

describe('Exports Trésorerie société', () => {
  it('construit un deck PPTX paginé avec un fingerprint stable', () => {
    const deck = buildTresorerieStudyDeck({ rows: ROWS, kpis: KPIS, inputs: INPUTS });
    const slideTypes = deck.slides.map((slide) => slide.type);
    const manifest = {
      cover: deck.cover.title,
      slideTypes,
      projectionRows: deck.slides
        .filter((slide) => slide.type === 'treso-projection')
        .flatMap((slide) => slide.rows.map(row => row.label)),
      projectionPages: deck.slides
        .filter((slide) => slide.type === 'treso-projection')
        .map((slide) => ({
          pageIndex: slide.pageIndex,
          yearsForPage: slide.yearsForPage,
          rowsCount: slide.rows.length,
        })),
    };

    expect(slideTypes).toEqual(['treso-schema', 'treso-projection', 'treso-projection', 'content']);
    expect(manifest.projectionRows).toEqual(expect.arrayContaining([
      'Capital placé — matrice distribution',
      'Valeur — matrice capitalisation',
      'Revenus des filiales',
      'Charges sociales TNS estimées',
    ]));
    expect(JSON.stringify(deck)).not.toContain('FCB');
    expect(fingerprintPptxExport(manifest)).toBe('ebc6f1bcebc81a9b');
  });

  it('déduit les flags PPTX directement depuis le modèle v2', () => {
    const deck = buildTresorerieStudyDeck({
      rows: ROWS,
      kpis: KPIS,
      inputs: INPUTS,
    });
    const schema = deck.slides[0] as TresorerieSchemaSlideSpec;

    expect(schema).toMatchObject({
      type: 'treso-schema',
      companyKindLabel: 'Holding patrimoniale',
      companyKindCode: 'HP',
      hasDistribution: true,
      hasCapitalisation: true,
      hasCreditIS: true,
      hasHolding: true,
      hasAllocationMatrix: true,
    });
    expect(JSON.stringify(schema)).toContain('Associé 1');
    expect(JSON.stringify(schema)).toContain('Filiale');
    expect(JSON.stringify(schema)).toContain('80 %');
    expect(schema.revenuePhases).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: 'Rémunération holding',
        periodLabel: '2026-2030',
      }),
      expect.objectContaining({
        label: 'Besoin complémentaire',
        useCcaForCompletion: false,
      }),
    ]));
  });

  it('prépare le schéma PPTX avec filiales imbriquées et matrice vide', () => {
    const deck = buildTresorerieStudyDeck({
      rows: ROWS,
      kpis: KPIS,
      inputs: {
        ...INPUTS,
        company: {
          ...INPUTS.company,
          subsidiaries: [
            ...INPUTS.company.subsidiaries,
            {
              id: 'filiale-2',
              label: 'Filiale B',
              parentEntityId: 'filiale-1',
              ownershipPct: 51,
              holdingOwnershipPct: 51,
              motherDaughterEligible: true,
              fiscalIntegrationEstimateEnabled: false,
              servicesSchedule: [],
              dividendsSchedule: [],
            },
          ],
        },
        allocationMatrix: {
          ...INPUTS.allocationMatrix,
          pockets: [],
        },
      },
    });
    const schema = deck.slides[0] as TresorerieSchemaSlideSpec;

    expect(schema).toMatchObject({
      type: 'treso-schema',
      hasAllocationMatrix: false,
    });
    expect(schema.subsidiaries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: 'Filiale B',
        parentEntityId: 'filiale-1',
        ownershipPct: '51 %',
      }),
    ]));
  });

  it('rend le schéma PPTX en organigramme avec KPIs à droite', async () => {
    const deck = buildTresorerieStudyDeck({
      rows: ROWS,
      kpis: KPIS,
      inputs: {
        ...INPUTS,
        company: {
          ...INPUTS.company,
          subsidiaries: [
            ...INPUTS.company.subsidiaries,
            {
              id: 'filiale-2',
              label: 'Filiale B',
              parentEntityId: 'filiale-1',
              ownershipPct: 51,
              holdingOwnershipPct: 51,
              motherDaughterEligible: true,
              fiscalIntegrationEstimateEnabled: false,
              servicesSchedule: [],
              dividendsSchedule: [],
            },
          ],
        },
      },
    });
    const ctx = buildPptxContext();
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    defineSlideMasters(pptx, ctx.theme);

    buildTresorerieSchema(pptx, deck.slides[0] as TresorerieSchemaSlideSpec, ctx, 1);

    const blob = await pptx.write({ outputType: 'blob' }) as Blob;
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const slideXml = await zip.file('ppt/slides/slide1.xml')?.async('string');

    expect(slideXml).toBeDefined();
    expect(slideXml).toContain('Filiale B');
    expect(slideXml).toContain('51 %');
    expect(slideXml).toContain('CCA total constitué');
    expect(slideXml).toContain('Parcours de revenus associé actif');
    expect(slideXml).toContain('Besoin complémentaire');
    expect(slideXml).not.toContain('Phase 1');
    expect(slideXml).not.toMatch(/\bc[xy]="-/);
  });

  it('génère un XLSX valide avec les onglets Projection, Revenus associés puis Hypothèses', async () => {
    const blob = await buildTresorerieXlsxBlob(
      ROWS,
      KPIS,
      INPUTS,
      DEFAULT_COLORS.c1,
      DEFAULT_COLORS.c7,
    );

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const workbookXml = await zip.file('xl/workbook.xml')?.async('string');
    const projectionXml = await zip.file('xl/worksheets/sheet1.xml')?.async('string');
    const revenusXml = await zip.file('xl/worksheets/sheet2.xml')?.async('string');
    const hypothesesXml = await zip.file('xl/worksheets/sheet3.xml')?.async('string');

    expect(workbookXml).toContain('Projection');
    expect(workbookXml).toContain('Revenus associés');
    expect(workbookXml).toContain('Structure société');
    expect(workbookXml).toContain('Hypothèses');
    expect(projectionXml).toContain('Trésorerie fin d&apos;année');
    expect(projectionXml).toContain('Déficit bancaire vs solde minimum + BFR');
    expect(revenusXml).toContain('Remboursement CCA');
    expect(hypothesesXml).toContain('Taux maximum déductible');
    expect(hypothesesXml).toContain('BFR inclus dans le seuil de sécurité');
  });

  it('mentionne la trésorerie conservée sur compte bancaire quand la matrice Excel est vide', async () => {
    const blob = await buildTresorerieXlsxBlob(
      ROWS,
      KPIS,
      {
        ...INPUTS,
        allocationMatrix: {
          ...INPUTS.allocationMatrix,
          pockets: [],
        },
      },
      DEFAULT_COLORS.c1,
      DEFAULT_COLORS.c7,
    );

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const structureXml = await zip.file('xl/worksheets/sheet4.xml')?.async('string');

    expect(structureXml).toContain('Trésorerie conservée sur compte bancaire');
    expect(structureXml).toContain('Parcours de revenus');
    expect(structureXml).toContain('Besoin complémentaire');
    expect(structureXml).toContain('Court terme');
    expect(structureXml).toContain('Moyen terme');
    expect(structureXml).toContain('Long terme');
  });
});
