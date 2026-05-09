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
      ccaInitial: 90000,
      ccaAnnualContribution: 12000,
      ccaContributionEndYear: 2037,
      cca: {
        currentBalance: 90000,
        exceptionalContributions: [{ year: 2028, amount: 15000 }],
        annualContribution: { amount: 12000, startYear: 2026, endYear: 2037 },
        remunerationRate: 0.04,
      },
      remunerationAnnualCost: 0,
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
      displayOrder: 0,
      holdingOwnershipPct: 80,
      annualServicesRevenue: 0,
      annualDividends: 18000,
      motherDaughterEligible: true,
      fiscalIntegrationEstimateEnabled: false,
    }],
  },
  allocationMatrix: {
    mode: 'strategy',
    sweepThreshold: 50000,
    pockets: [
      {
        id: 'distribution-1',
        label: 'Court terme',
        kind: 'distribution',
        horizon: 'court_terme',
        withdrawalPriority: 1,
        durationYears: 5,
        annualReturnRate: 0.045,
        enjoymentDelayMonths: 0,
        initialAllocationPct: 60,
        annualAllocationPct: 70,
        repeatAtTerm: false,
        termDestination: 'treasury',
      },
      {
        id: 'capitalisation-1',
        label: 'Long terme',
        kind: 'capitalisation',
        horizon: 'long_terme',
        withdrawalPriority: 3,
        durationYears: 8,
        annualReturnRate: 0.035,
        enjoymentDelayMonths: 0,
        initialAllocationPct: 40,
        annualAllocationPct: 30,
        repeatAtTerm: false,
        termDestination: 'treasury',
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
    const schema = deck.slides[0];

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
              displayOrder: 1,
              holdingOwnershipPct: 51,
              annualServicesRevenue: 0,
              annualDividends: 0,
              motherDaughterEligible: true,
              fiscalIntegrationEstimateEnabled: false,
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
              displayOrder: 1,
              holdingOwnershipPct: 51,
              annualServicesRevenue: 0,
              annualDividends: 0,
              motherDaughterEligible: true,
              fiscalIntegrationEstimateEnabled: false,
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
  });
});
