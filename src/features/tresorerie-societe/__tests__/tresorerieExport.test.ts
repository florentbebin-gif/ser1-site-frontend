import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { DEFAULT_COLORS } from '@/settings/theme';
import { fingerprintPptxExport } from '@/utils/export/exportFingerprint';
import type { TresoInputsV2, TresoProjectionRow } from '@/engine/tresorerie/types';
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

const INPUTS: TresoInputsV2 = {
  version: 2,
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
    shareCapital: 10000,
    sharePremium: 0,
    reservesInitial: 8000,
    treasuryInitial: 150000,
    annualStructureCosts: 3000,
    reducedCorporateTaxEligible: true,
    associates: [{
      id: 'associe-1',
      label: 'Associé 1',
      ownershipLots: [{ right: 'pleine_propriete', capitalPct: 100, economicRightsPct: 100 }],
      roles: ['associe_sans_statut'],
      ccaInitial: 90000,
      ccaAnnualContribution: 12000,
      ccaContributionEndYear: 2037,
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
      holdingOwnershipPct: 80,
      annualServicesRevenue: 0,
      annualDividends: 18000,
      motherDaughterEligible: true,
      fiscalIntegrationEstimateEnabled: false,
    }],
  },
  allocationMatrix: {
    sweepThreshold: 50000,
    pockets: [
      {
        id: 'distribution-1',
        kind: 'distribution',
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
        kind: 'capitalisation',
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
};

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
      hasDistribution: true,
      hasCapitalisation: true,
      hasCreditIS: true,
      hasHolding: true,
      hasAllocationMatrix: true,
    });
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
    expect(workbookXml).toContain('Hypothèses');
    expect(projectionXml).toContain('Trésorerie fin d&apos;année');
    expect(revenusXml).toContain('Remboursement CCA');
    expect(hypothesesXml).toContain('Taux fiscaux issus des paramètres admin');
  });
});
