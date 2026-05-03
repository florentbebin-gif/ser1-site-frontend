import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import { buildSuccessionChainageExportPayload } from '../hooks/useSuccessionOutcomeExportPayload';
import { exportSuccessionXlsx } from '../export/successionXlsx';
import { buildSuccessionStudyDeck } from '@/pptx/presets/successionDeckBuilder';
import { DEFAULT_COLORS } from '@/settings/theme';
import { makeCivil, makeLiquidation } from './fixtures';
import { DEFAULT_DMTG } from '../../../engine/civil';
import { buildSuccessionFiscalSnapshot } from '../successionFiscalContext';
import { buildSuccessionAvFiscalAnalysis } from '../successionAvFiscal';
import { buildSuccessionPerFiscalAnalysis } from '../successionPerFiscal';
import { buildSuccessionPrevoyanceFiscalAnalysis } from '../successionPrevoyanceFiscal';

const THEME_COLORS = DEFAULT_COLORS;

async function getSheetXmlByName(zip: JSZip, sheetName: string): Promise<string | null> {
  const workbook = await zip.file('xl/workbook.xml')?.async('string') ?? '';
  const idMatch = workbook.match(new RegExp(`<sheet[^>]+name="${sheetName}"[^>]+r:id="(rId\\d+)"`));
  if (!idMatch) return null;
  const rels = await zip.file('xl/_rels/workbook.xml.rels')?.async('string') ?? '';
  const targetMatch = rels.match(new RegExp(`Id="${idMatch[1]}"[^>]+Target="([^"]+)"`));
  if (!targetMatch) return null;
  const target = targetMatch[1].replace(/^\/xl\//, '');
  return await zip.file(`xl/${target}`)?.async('string') ?? null;
}

describe('Succession export - Chronologie et cas particuliers', () => {
  it('T2.1 — Ordre inversé : chaîne moteur réelle → XLSX, oracle numérique', async () => {
    const civil = makeCivil({ situationMatrimoniale: 'marie', regimeMatrimonial: 'separation_biens' });
    const liquidation = makeLiquidation({ actifEpoux1: 800_000, actifEpoux2: 200_000, actifCommun: 0, nbEnfants: 2 });
    const enfantsContext = [
      { id: 'E1', rattachement: 'commun' as const, dateNaissance: '2000-01-01', decede: false },
      { id: 'E2', rattachement: 'commun' as const, dateNaissance: '2002-01-01', decede: false }
    ];

    const analysis_e2 = buildSuccessionChainageAnalysis({
      civil,
      liquidation,
      regimeUsed: 'separation_biens',
      order: 'epoux2',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext,
      familyMembers: []
    });

    expect(analysis_e2.step1?.actifTransmis).toBe(200_000);
    expect(analysis_e2.step1?.partConjoint).toBe(50_000);

    const snapshot = buildSuccessionFiscalSnapshot(null);
    const zeroFiscal = buildSuccessionAvFiscalAnalysis([], civil, [], [], snapshot);
    const zeroPer = buildSuccessionPerFiscalAnalysis([], civil, [], [], snapshot, new Date());
    const zeroPrevoyance = buildSuccessionPrevoyanceFiscalAnalysis([], civil, [], [], snapshot, new Date());
    
    const payload = buildSuccessionChainageExportPayload({
      displayUsesChainage: true,
      chainageAnalysis: analysis_e2,
      assuranceVieByAssure: { epoux1: 0, epoux2: 0 },
      perByAssure: { epoux1: 0, epoux2: 0 },
      prevoyanceByAssure: { epoux1: 0, epoux2: 0 },
      assuranceVieTotale: 0,
      perTotale: 0,
      prevoyanceTotale: 0,
      avFiscalAnalysis: zeroFiscal,
      perFiscalAnalysis: zeroPer,
      prevoyanceFiscalAnalysis: zeroPrevoyance,
      derivedTotalDroits: analysis_e2.totalDroits,
      isPacsed: false,
      directDisplayWarnings: [],
    });

    const blob = await exportSuccessionXlsx(
      { actifNetSuccession: 1_000_000, nbHeritiers: 2, heritiers: [] },
      null,
      THEME_COLORS.c1,
      'test',
      payload
    );

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const chronXml = await getSheetXmlByName(zip, 'Chronologie') ?? '';

    // Ordre simulé correct
    expect(chronXml).toContain('Époux 2 décède en premier');
    // Masse successorale civile step1 = actifEpoux2 = 200 000
    expect(chronXml).toContain('<v>200000</v>');
    // Part conjoint / partenaire step1 = 1/4 PP de 200 000 = 50 000
    expect(chronXml).toContain('<v>50000</v>');
  });

  it('T2.2 — Ordre inversé → PPTX bénéficiaires corrects', async () => {
    const civil = makeCivil({ situationMatrimoniale: 'marie', regimeMatrimonial: 'separation_biens' });
    const liquidation = makeLiquidation({ actifEpoux1: 800_000, actifEpoux2: 200_000, actifCommun: 0, nbEnfants: 2 });
    const enfantsContext = [
      { id: 'E1', rattachement: 'commun' as const, dateNaissance: '2000-01-01', decede: false },
      { id: 'E2', rattachement: 'commun' as const, dateNaissance: '2002-01-01', decede: false }
    ];

    const analysis_e2 = buildSuccessionChainageAnalysis({
      civil,
      liquidation,
      regimeUsed: 'separation_biens',
      order: 'epoux2',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext,
      familyMembers: []
    });

    const snapshot = buildSuccessionFiscalSnapshot(null);
    const zeroFiscal = buildSuccessionAvFiscalAnalysis([], civil, [], [], snapshot);
    const zeroPer = buildSuccessionPerFiscalAnalysis([], civil, [], [], snapshot, new Date());
    const zeroPrevoyance = buildSuccessionPrevoyanceFiscalAnalysis([], civil, [], [], snapshot, new Date());
    
    const payload = buildSuccessionChainageExportPayload({
      displayUsesChainage: true,
      chainageAnalysis: analysis_e2,
      assuranceVieByAssure: { epoux1: 0, epoux2: 0 },
      perByAssure: { epoux1: 0, epoux2: 0 },
      prevoyanceByAssure: { epoux1: 0, epoux2: 0 },
      assuranceVieTotale: 0,
      perTotale: 0,
      prevoyanceTotale: 0,
      avFiscalAnalysis: zeroFiscal,
      perFiscalAnalysis: zeroPer,
      prevoyanceFiscalAnalysis: zeroPrevoyance,
      derivedTotalDroits: analysis_e2.totalDroits,
      isPacsed: false,
      directDisplayWarnings: [],
    });

    const spec = buildSuccessionStudyDeck({
      actifNetSuccession: 1_000_000,
      totalDroits: analysis_e2.totalDroits,
      tauxMoyenGlobal: 0,
      heritiers: [],
      predecesChronologie: payload
    }, THEME_COLORS);

    const chronSlide = spec.slides.find(s => s.type === 'succession-chronology');
    if (chronSlide?.type === 'succession-chronology') {
      const survivant = chronSlide.steps[0].beneficiaries.find(b => b.exonerated);
      expect(survivant).toBeDefined();
      expect(survivant?.label).toMatch(/poux 1|survivant/i);
    } else {
      throw new Error("Slide chronologie introuvable ou mauvais type");
    }
  });

  it('P2-A — Abattement RP : réduit step1 mais pas step2', async () => {
    const civil = makeCivil({ situationMatrimoniale: 'marie', regimeMatrimonial: 'separation_biens' });
    const liquidation = makeLiquidation({ actifEpoux1: 800_000, actifEpoux2: 200_000, actifCommun: 0, nbEnfants: 2 });
    const enfantsContext = [
      { id: 'E1', rattachement: 'commun' as const, dateNaissance: '2000-01-01', decede: false },
      { id: 'E2', rattachement: 'commun' as const, dateNaissance: '2002-01-01', decede: false }
    ];

    // transmissionBasis requis : c'est via residencePrincipaleEntry que la valeur RP
    // entre dans SuccessionEstateTaxableBasis.residencePrincipaleValeur
    // (successionTransmissionBasis.ts:105-108 + successionChainage.ts:343-345)
    const transmissionBasis = {
      ordinaryTaxableAssetsParPocket: {
        epoux1: 800_000, epoux2: 200_000, communaute: 0, societe_acquets: 0,
        indivision_pacse: 0, indivision_concubinage: 0, indivision_separatiste: 0,
      },
      passifsParPocket: {
        epoux1: 0, epoux2: 0, communaute: 0, societe_acquets: 0,
        indivision_pacse: 0, indivision_concubinage: 0, indivision_separatiste: 0,
      },
      groupementFoncierEntries: [],
      hasBeneficiaryLevelGfAdjustment: false,
      residencePrincipaleEntry: { pocket: 'epoux1' as const, valeurTotale: 500_000 },
    };

    const analysis = buildSuccessionChainageAnalysis({
      civil,
      liquidation,
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext,
      familyMembers: [],
      abattementResidencePrincipale: true,
      transmissionBasis,
    });

    const analysisNoRP = buildSuccessionChainageAnalysis({
      civil,
      liquidation,
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext,
      familyMembers: [],
      abattementResidencePrincipale: false,
      transmissionBasis,
    });

    // L'abattement RP (20 % × 500 000 = 100 000) réduit la base taxable step1 → droits enfants plus bas
    expect(analysis.step1?.droitsEnfants).toBeLessThan(analysisNoRP.step1?.droitsEnfants ?? 0);
    // step2 : residencePrincipaleValeur figé à 0 (successionChainage.ts:394) → droits identiques
    expect(analysis.step2?.droitsEnfants).toBe(analysisNoRP.step2?.droitsEnfants);

    const snapshot = buildSuccessionFiscalSnapshot(null);
    const zeroFiscal = buildSuccessionAvFiscalAnalysis([], civil, [], [], snapshot);
    const zeroPer = buildSuccessionPerFiscalAnalysis([], civil, [], [], snapshot, new Date());
    const zeroPrevoyance = buildSuccessionPrevoyanceFiscalAnalysis([], civil, [], [], snapshot, new Date());

    const payload = buildSuccessionChainageExportPayload({
      displayUsesChainage: true,
      chainageAnalysis: analysis,
      assuranceVieByAssure: { epoux1: 0, epoux2: 0 },
      perByAssure: { epoux1: 0, epoux2: 0 },
      prevoyanceByAssure: { epoux1: 0, epoux2: 0 },
      assuranceVieTotale: 0,
      perTotale: 0,
      prevoyanceTotale: 0,
      avFiscalAnalysis: zeroFiscal,
      perFiscalAnalysis: zeroPer,
      prevoyanceFiscalAnalysis: zeroPrevoyance,
      derivedTotalDroits: analysis.totalDroits,
      isPacsed: false,
      directDisplayWarnings: [],
    });

    const blob = await exportSuccessionXlsx(
      { actifNetSuccession: 1_000_000, nbHeritiers: 2, heritiers: [] },
      null,
      THEME_COLORS.c1,
      'test',
      payload
    );

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const chronXml = await getSheetXmlByName(zip, 'Chronologie') ?? '';
    const hypothesesXml = await getSheetXmlByName(zip, 'Hypothèses') ?? '';

    // Export text : l'onglet Hypothèses mentionne la RP
    expect(/sidence principale|abattement/i.test(hypothesesXml)).toBe(true);
    // Export montants : les droits step1 (réduits par l'abattement RP) sont dans la feuille Chronologie
    expect(chronXml).toContain(`<v>${analysis.step1!.droitsEnfants}</v>`);
    // Les droits step2 (RP non appliquée) sont également reflétés correctement
    expect(chronXml).toContain(`<v>${analysis.step2!.droitsEnfants}</v>`);
  });

  it('P2-D — Forfait mobilier (mode pct) via chaîne', async () => {
    const civil = makeCivil({ situationMatrimoniale: 'marie', regimeMatrimonial: 'separation_biens' });
    const liquidation = makeLiquidation({ actifEpoux1: 800_000, actifEpoux2: 200_000, actifCommun: 0, nbEnfants: 2 });

    // transmissionBasis requis : forfaitMobilierMode n'est appliqué que quand
    // transmissionBasis est fourni (successionChainage.helpers.ts:385-391)
    const transmissionBasis = {
      ordinaryTaxableAssetsParPocket: {
        epoux1: 800_000, epoux2: 200_000, communaute: 0, societe_acquets: 0,
        indivision_pacse: 0, indivision_concubinage: 0, indivision_separatiste: 0,
      },
      passifsParPocket: {
        epoux1: 0, epoux2: 0, communaute: 0, societe_acquets: 0,
        indivision_pacse: 0, indivision_concubinage: 0, indivision_separatiste: 0,
      },
      groupementFoncierEntries: [],
      hasBeneficiaryLevelGfAdjustment: false,
      residencePrincipaleEntry: null,
    };

    const enfantsContext = [
      { id: 'E1', rattachement: 'commun' as const },
      { id: 'E2', rattachement: 'commun' as const },
    ];

    const analysis = buildSuccessionChainageAnalysis({
      civil,
      liquidation,
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext,
      familyMembers: [],
      forfaitMobilierMode: 'pct' as const,
      forfaitMobilierPct: 5, // 5 % de 800 000 = 40 000
      transmissionBasis,
    });

    const analysisNoForfait = buildSuccessionChainageAnalysis({
      civil,
      liquidation,
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext,
      familyMembers: [],
      transmissionBasis,
    });

    // Le forfait mobilier (5 % = 40 000 €) augmente la base taxable (présomption de meubles) → droits plus élevés
    expect(analysis.step1?.droitsEnfants).toBeGreaterThan(analysisNoForfait.step1?.droitsEnfants ?? 0);

    const snapshot = buildSuccessionFiscalSnapshot(null);
    const zeroFiscal = buildSuccessionAvFiscalAnalysis([], civil, [], [], snapshot);
    const zeroPer = buildSuccessionPerFiscalAnalysis([], civil, [], [], snapshot, new Date());
    const zeroPrevoyance = buildSuccessionPrevoyanceFiscalAnalysis([], civil, [], [], snapshot, new Date());

    const payload = buildSuccessionChainageExportPayload({
      displayUsesChainage: true,
      chainageAnalysis: analysis,
      assuranceVieByAssure: { epoux1: 0, epoux2: 0 },
      perByAssure: { epoux1: 0, epoux2: 0 },
      prevoyanceByAssure: { epoux1: 0, epoux2: 0 },
      assuranceVieTotale: 0,
      perTotale: 0,
      prevoyanceTotale: 0,
      avFiscalAnalysis: zeroFiscal,
      perFiscalAnalysis: zeroPer,
      prevoyanceFiscalAnalysis: zeroPrevoyance,
      derivedTotalDroits: analysis.totalDroits,
      isPacsed: false,
      directDisplayWarnings: [],
    });

    const blob = await exportSuccessionXlsx(
      { actifNetSuccession: 1_000_000, nbHeritiers: 2, heritiers: [] },
      null,
      THEME_COLORS.c1,
      'test',
      payload
    );

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const chronXml = await getSheetXmlByName(zip, 'Chronologie') ?? '';

    // Les droits step1 avec forfait mobilier sont bien reflétés dans l'export
    expect(chronXml).toContain(`<v>${analysis.step1!.droitsEnfants}</v>`);
  });

  it('P3-A — Smoke PPTX collatéral frère (célibataire sans enfants)', async () => {
    const spec = buildSuccessionStudyDeck({
      actifNetSuccession: 500_000,
      totalDroits: 100_000,
      tauxMoyenGlobal: 20,
      heritiers: [
        { lien: 'frere_soeur', partBrute: 500_000, abattement: 15_932, baseImposable: 484_068, droits: 100_000, tauxMoyen: 20 }
      ],
    }, THEME_COLORS);

    const annexSlide = spec.slides.find(s => s.type === 'succession-annex-table');
    expect(annexSlide).toBeDefined();
    if (annexSlide?.type === 'succession-annex-table') {
      const frereRow = annexSlide.steps[0]?.beneficiaries.find(b => b.label.includes('Frère'));
      expect(frereRow).toBeDefined();
      expect(frereRow?.droitsSuccession).toBe(100_000);
    }
  });
});