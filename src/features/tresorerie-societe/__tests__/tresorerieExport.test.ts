import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { DEFAULT_COLORS } from '@/settings/theme';
import { fingerprintPptxExport } from '@/utils/export/exportFingerprint';
import type { TresoInputs, TresoProjectionRow } from '@/engine/tresorerie/types';
import type { TresoKPIs } from '../hooks/useTresorerieCalculations';
import { buildTresorerieXlsxBlob } from '../export/tresorerieExcelExport';
import { buildTresorerieStudyDeck } from '../export/tresoreriePptxWrapper';

const INPUTS: TresoInputs = {
  typeCreation: 'newco',
  ageActuel: 50,
  ageRetraite: 62,
  besoinsRetraiteAnnuels: 24000,
  fraisStructureAnnuels: 3000,
  ccaInitial: 90000,
  apportAnnuelCCA: 12000,
  dureeActiveAns: 12,
  tresorerieInitiale: 15000,
  reservesInitiales: 8000,
  anneeCivileDebut: 2026,
  distribution: {
    montant: 70000,
    rendementDistribue: 0.045,
  },
  capitalisation: {
    montant: 60000,
    rendementAnnuel: 0.035,
  },
};

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

function makeRow(year: number): TresoProjectionRow {
  return {
    year,
    apportCCA: year <= INPUTS.dureeActiveAns ? INPUTS.apportAnnuelCCA : 0,
    ccaCumule: INPUTS.ccaInitial + Math.min(year, INPUTS.dureeActiveAns) * INPUTS.apportAnnuelCCA,
    ccaRestant: Math.max(0, 234000 - Math.max(0, year - INPUTS.dureeActiveAns) * 24000),
    retraitsCCA: year > INPUTS.dureeActiveAns ? 24000 : 0,
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
    chargesStructure: INPUTS.fraisStructureAnnuels,
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
    revenusNets: year > INPUTS.dureeActiveAns ? 24000 : 0,
    deltaBesoin: year > INPUTS.dureeActiveAns ? 0 : -INPUTS.besoinsRetraiteAnnuels,
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
      projectionPages: deck.slides
        .filter((slide) => slide.type === 'treso-projection')
        .map((slide) => ({
          pageIndex: slide.pageIndex,
          yearsForPage: slide.yearsForPage,
          rowsCount: slide.rows.length,
        })),
    };

    expect(slideTypes).toEqual(['treso-schema', 'treso-projection', 'treso-projection', 'content']);
    expect(JSON.stringify(deck)).not.toContain('FCB');
    expect(fingerprintPptxExport(manifest)).toBe('d8957cf232eaf71b');
  });

  it('génère un XLSX valide avec les onglets Projection puis Hypothèses', async () => {
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
    const hypothesesXml = await zip.file('xl/worksheets/sheet2.xml')?.async('string');

    expect(workbookXml).toContain('Projection');
    expect(workbookXml).toContain('Hypothèses');
    expect(projectionXml).toContain('Trésorerie fin d&apos;année');
    expect(hypothesesXml).toContain('Taux fiscaux issus des paramètres admin');
  });
});
