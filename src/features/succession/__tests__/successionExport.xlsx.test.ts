/**
 * Tests smoke des exports Succession.
 */

import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { calculateSuccession } from '../../../engine/succession';
import { exportSuccessionXlsx } from '../export/successionXlsx';
import { THEME_COLORS } from './successionExport.fixtures';
import { buildSuccessionFiscalSnapshot } from '../successionFiscalContext';

describe('Succession Excel Export - XLSX direct', () => {
  it('generates a valid XLSX blob (PK header)', async () => {
    const result = calculateSuccession({
      actifNetSuccession: 400000,
      heritiers: [
        { lien: 'enfant', partSuccession: 200000 },
        { lien: 'enfant', partSuccession: 200000 },
      ],
    });

    const blob = await exportSuccessionXlsx(
      {
        actifNetSuccession: 400000,
        nbHeritiers: 2,
        heritiers: [
          { lien: 'enfant', partSuccession: 200000 },
          { lien: 'enfant', partSuccession: 200000 },
        ],
      },
      result.result,
      THEME_COLORS.c1,
      'Simulation-Succession',
      {
        applicable: true,
        order: 'epoux1',
        firstDecedeLabel: 'Époux 1',
        secondDecedeLabel: 'Époux 2',
        step1: {
          actifTransmis: 250000,
          prevoyanceTransmise: 70000,
          droitsPrevoyance: 5500,
          partConjoint: 62500,
          partEnfants: 187500,
          droitsEnfants: 12000,
          beneficiaries: [
            { label: 'Conjoint survivant', brut: 62500, droits: 0, net: 62500, exonerated: true },
            { label: 'E1', brut: 93750, droits: 6000, net: 87750 },
            { label: 'E2', brut: 93750, droits: 6000, net: 87750 },
          ],
        },
        step2: {
          actifTransmis: 380000,
          prevoyanceTransmise: 30000,
          droitsPrevoyance: 2000,
          partConjoint: 0,
          partEnfants: 380000,
          droitsEnfants: 31500,
          beneficiaries: [
            { label: 'E1', brut: 190000, droits: 15750, net: 174250 },
            { label: 'E2', brut: 190000, droits: 15750, net: 174250 },
          ],
        },
        societeAcquets: {
          configured: true,
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
          configured: true,
          active: true,
          useCurrentAssetsAsFinalPatrimony: true,
          patrimoineOriginaireEpoux1: 100000,
          patrimoineOriginaireEpoux2: 120000,
          patrimoineFinalEpoux1: 250000,
          patrimoineFinalEpoux2: 170000,
          acquetsEpoux1: 150000,
          acquetsEpoux2: 50000,
          creditor: 'epoux2',
          debtor: 'epoux1',
          quoteAppliedPct: 50,
          creanceAmount: 50000,
          firstEstateAdjustment: -50000,
        },
        interMassClaims: {
          configured: true,
          totalRequestedAmount: 80000,
          totalAppliedAmount: 60000,
          claims: [
            {
              id: 'claim-1',
              kind: 'recompense',
              fromPocket: 'communaute',
              toPocket: 'epoux1',
              requestedAmount: 80000,
              appliedAmount: 60000,
            },
          ],
        },
        affectedLiabilities: {
          totalAmount: 30000,
          byPocket: [
            { pocket: 'epoux1', amount: 20000 },
            { pocket: 'communaute', amount: 10000 },
          ],
        },
        preciput: {
          mode: 'cible',
          pocket: 'communaute',
          requestedAmount: 50000,
          appliedAmount: 50000,
          usesGlobalFallback: false,
          selections: [
            {
              id: 'prec-1',
              sourceType: 'asset',
              sourceId: 'asset-1',
              label: 'Portefeuille titres',
              pocket: 'communaute',
              requestedAmount: 50000,
              appliedAmount: 50000,
            },
          ],
        },
        prevoyanceTotale: 100000,
        totalDroits: 43500,
        warnings: ['Avertissement de test'],
      },
      undefined,
      [
        'Les recompenses entre masses sont appliquees comme transferts simplifies.',
        'Les passifs detailles rattaches a une poche sont traites comme passifs affectes.',
      ],
    );

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);

    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer.slice(0, 2));
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);

    const zip = await JSZip.loadAsync(buffer);
    expect(zip.file('xl/workbook.xml')).toBeTruthy();
    expect(zip.file('xl/worksheets/sheet5.xml')).toBeTruthy();
    const workbookXml = await zip.file('xl/workbook.xml')?.async('string');
    expect(workbookXml).toContain('Chronologie');
    expect(workbookXml).toContain('Hypothèses');

    const chronologySheet = await zip.file('xl/worksheets/sheet4.xml')?.async('string');
    const hypothesesSheet = await zip.file('xl/worksheets/sheet5.xml')?.async('string');
    const sharedStrings = await zip.file('xl/sharedStrings.xml')?.async('string');
    const xmlPayload = `${chronologySheet ?? ''}\n${hypothesesSheet ?? ''}\n${sharedStrings ?? ''}`;
    expect(xmlPayload).toContain('Conjoint survivant');
    expect(xmlPayload).toContain('E1');
    expect(xmlPayload).toContain('prévoyance décès');
    expect(xmlPayload).toContain('Societe d&apos;acquets');
    expect(xmlPayload).toContain('Preciput');
    expect(xmlPayload).toContain('Participation aux acquets');
    expect(xmlPayload).toContain('Recompenses / creances entre masses');
    expect(xmlPayload).toContain('Passif affecte');
    expect(xmlPayload).toContain('Portefeuille titres');
    expect(xmlPayload).toContain('Hypotheses calculees');
    expect(xmlPayload).toContain('transferts simplifies');
    expect(xmlPayload).toContain('passifs affectes');
  });

  it('generates a simplified chainage-only XLSX when no direct succession result is provided', async () => {
    const blob = await exportSuccessionXlsx(
      {
        actifNetSuccession: 600000,
        nbHeritiers: 2,
        heritiers: [],
      },
      null,
      THEME_COLORS.c1,
      'Simulation-Succession',
      {
        applicable: true,
        order: 'epoux2',
        firstDecedeLabel: 'Époux 2',
        secondDecedeLabel: 'Époux 1',
        step1: {
          actifTransmis: 260000,
          partConjoint: 65000,
          partEnfants: 195000,
          droitsEnfants: 9500,
          beneficiaries: [
            { label: 'Conjoint survivant', brut: 65000, droits: 0, net: 65000, exonerated: true },
            { label: 'E1', brut: 97500, droits: 4750, net: 92750 },
            { label: 'E2', brut: 97500, droits: 4750, net: 92750 },
          ],
        },
        step2: {
          actifTransmis: 405000,
          partConjoint: 0,
          partEnfants: 405000,
          droitsEnfants: 33200,
          beneficiaries: [
            { label: 'E1', brut: 202500, droits: 16600, net: 185900 },
            { label: 'E2', brut: 202500, droits: 16600, net: 185900 },
          ],
        },
        totalDroits: 42700,
        warnings: ['Module simplifié'],
      },
    );

    expect(blob).toBeInstanceOf(Blob);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(zip.file('xl/worksheets/sheet1.xml')).toBeTruthy();
    expect(zip.file('xl/worksheets/sheet2.xml')).toBeTruthy();
    expect(zip.file('xl/worksheets/sheet3.xml')).toBeFalsy();
    const workbookXml = await zip.file('xl/workbook.xml')?.async('string');
    expect(workbookXml).toContain('Chronologie');
    expect(workbookXml).toContain('Hypothèses');
  });

  it('exports the updated direct succession chronology wording in XLSX', async () => {
    const result = calculateSuccession({
      actifNetSuccession: 320000,
      heritiers: [
        { lien: 'enfant', partSuccession: 160000 },
        { lien: 'enfant', partSuccession: 160000 },
      ],
    });

    const blob = await exportSuccessionXlsx(
      {
        actifNetSuccession: 320000,
        nbHeritiers: 2,
        heritiers: [
          { lien: 'enfant', partSuccession: 160000 },
          { lien: 'enfant', partSuccession: 160000 },
        ],
      },
      result.result,
      THEME_COLORS.c1,
      'Simulation-Succession',
      {
        applicable: false,
        order: 'epoux1',
        firstDecedeLabel: 'Défunt(e)',
        secondDecedeLabel: '—',
        step1: null,
        step2: null,
        totalDroits: result.result.totalDroits,
        warnings: ['Succession directe du défunt simulé.'],
      },
    );

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const chronologySheet = await zip.file('xl/worksheets/sheet4.xml')?.async('string');
    const sharedStrings = await zip.file('xl/sharedStrings.xml')?.async('string');
    const xmlPayload = `${chronologySheet ?? ''}\n${sharedStrings ?? ''}`;

    expect(xmlPayload).toContain('Chronologie retenue comme source principale');
    expect(xmlPayload).toContain('Chronologie 2 décès non retenue comme source principale pour la situation saisie');
  });

  it("alimente l'abattement ligne directe depuis le snapshot fiscal transmis", async () => {
    const customAllowance = 123_456;
    const fiscalSnapshot = buildSuccessionFiscalSnapshot(null);
    const customSnapshot = {
      ...fiscalSnapshot,
      dmtgSettings: {
        ...fiscalSnapshot.dmtgSettings,
        ligneDirecte: {
          ...fiscalSnapshot.dmtgSettings.ligneDirecte,
          abattement: customAllowance,
        },
      },
    };

    const blob = await exportSuccessionXlsx(
      {
        actifNetSuccession: 320000,
        nbHeritiers: 2,
        heritiers: [
          { lien: 'enfant', partSuccession: 160000 },
          { lien: 'enfant', partSuccession: 160000 },
        ],
      },
      null,
      THEME_COLORS.c1,
      'Simulation-Succession',
      undefined,
      undefined,
      undefined,
      customSnapshot,
    );

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const hypothesesSheet = await zip.file('xl/worksheets/sheet2.xml')?.async('string');
    const normalizedSheet = (hypothesesSheet ?? '').replace(/\s+/g, ' ');
    const expectedAllowance = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(customAllowance).replace(/\s+/g, ' ');

    expect(normalizedSheet).toContain(`Abattement ligne directe : ${expectedAllowance}`);
    expect(normalizedSheet).not.toContain('Abattement ligne directe : 100 000 EUR');
  });
});
