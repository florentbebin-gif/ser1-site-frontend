import { describe, expect, it } from 'vitest';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import { DMTG_SETTINGS } from './successionChainage.regimes.fixtures';
import {
  makeCivil,
  makeLiquidation,
  makeDevolution,
} from './successionChainage.test.helpers';

describe('buildSuccessionChainageAnalysis - audit et choix légal', () => {
  it("SA active + preciputMode cible sans selection : preciputMontant gouverne societeAcquets.preciputAmount (usesGlobalFallback)", () => {
    // preciputMode:'cible' sans sélection active → usesGlobalFallback=true
    // SA.preciputAmount = min(preciputMontant=60k, totalSA=400k) = 60k
    // reliquat SA = 340k ; quotes 50/50 → firstEstateContribution = 170k
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens_societe_acquets' }),
      liquidation: makeLiquidation({ actifEpoux1: 300_000, actifEpoux2: 200_000, actifCommun: 400_000, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DMTG_SETTINGS,
      societeAcquetsNetValue: 400_000,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }, { id: 'E2', rattachement: 'commun' }],
      familyMembers: [],
      patrimonial: {
        attributionIntegrale: false,
        donationEntreEpouxActive: false,
        donationEntreEpouxOption: 'usufruit_total',
        preciputMode: 'cible',
        preciputMontant: 60_000,
        societeAcquets: {
          active: true,
          liquidationMode: 'quotes',
          quoteEpoux1Pct: 50,
          quoteEpoux2Pct: 50,
          attributionSurvivantPct: 0,
        },
      },
    });

    expect(analysis.societeAcquets?.preciputAmount).toBe(60_000);
    expect(analysis.societeAcquets?.firstEstateContribution).toBe(170_000);
    expect(analysis.preciput?.usesGlobalFallback).toBe(true);
    expect(analysis.warnings.some((w) => w.includes('preciput'))).toBe(true);
  });

  it("T9 [audit] SA préciput cible avec sélection active : usesGlobalFallback=false, preciputAmount=min(selection,asset)", () => {
    // Scénario cible réel (G7) : sélection active sur asset SA-1 (150k) pour 80k.
    // preciputPatrimonial.preciputMontant = resolvedPreciput.requestedAmount = 80k
    // SA total = 400k ; preciput = 80k ; reliquat = 320k ; quotes 50/50 → firstEstateContribution = 160k
    // step1.actifTransmis = propres époux1 (300k) + 160k = 460k
    // Le warning fallback NE doit PAS apparaître.
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens_societe_acquets' }),
      liquidation: makeLiquidation({ actifEpoux1: 300_000, actifEpoux2: 200_000, actifCommun: 400_000, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DMTG_SETTINGS,
      societeAcquetsNetValue: 400_000,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }, { id: 'E2', rattachement: 'commun' }],
      familyMembers: [],
      assetEntries: [
        { id: 'SA-1', pocket: 'societe_acquets', category: 'financier', subCategory: 'Compte épargne', amount: 150_000 },
      ],
      patrimonial: {
        attributionIntegrale: false,
        donationEntreEpouxActive: false,
        donationEntreEpouxOption: 'usufruit_total',
        preciputMode: 'cible',
        preciputMontant: 0,
        preciputSelections: [
          { id: 'sel-1', sourceType: 'asset', sourceId: 'SA-1', labelSnapshot: 'SA-1', pocket: 'societe_acquets', amount: 80_000, enabled: true },
        ],
        societeAcquets: { active: true, liquidationMode: 'quotes', quoteEpoux1Pct: 50, quoteEpoux2Pct: 50, attributionSurvivantPct: 0 },
      },
    });

    expect(analysis.preciput?.mode).toBe('cible');
    expect(analysis.preciput?.usesGlobalFallback).toBe(false);
    expect(analysis.preciput?.appliedAmount).toBe(80_000);
    expect(analysis.societeAcquets?.preciputAmount).toBe(80_000);
    expect(analysis.societeAcquets?.firstEstateContribution).toBe(160_000);
    expect(analysis.step1?.actifTransmis).toBe(460_000);
    // Warning cible présent, warning fallback absent
    expect(analysis.warnings.some((w) => w.includes('Preciput cible:') && w.includes('80'))).toBe(true);
    expect(analysis.warnings.some((w) => w.includes('repli sur le montant global'))).toBe(false);
  });

  it('T6a [audit] choixLegal usufruit + date fournie : usufruit CGI 669 appliqué, carryOver=0', () => {
    // CL, époux1 décédé, firstEstate = 200k + 200k = 400k, survivorBase = 400k
    // dateNaissanceEpoux2='1975-01-01', refDate='2026-01-01' → âge=51 → taux 0.5 (bracket <61)
    // conjointPart = 400k × 0.5 = 200k ; enfantsPart = 200k ; carryOver = 0
    // step2.actifTransmis = survivorBase(400k) + carryOver(0) = 400k
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ dateNaissanceEpoux2: '1975-01-01' }),
      liquidation: makeLiquidation({ actifEpoux1: 200_000, actifEpoux2: 200_000, actifCommun: 400_000, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DMTG_SETTINGS,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }, { id: 'E2', rattachement: 'commun' }],
      familyMembers: [],
      devolution: makeDevolution({ choixLegalConjointSansDDV: 'usufruit', nbEnfantsNonCommuns: 0 }),
      referenceDate: new Date('2026-01-01'),
    });

    expect(analysis.step1?.partConjoint).toBe(200_000);
    expect(analysis.step1?.partEnfants).toBe(200_000);
    expect(analysis.step2?.actifTransmis).toBe(400_000);
    expect(analysis.warnings.some((w) => w.includes('Choix legal du conjoint') && w.includes('669'))).toBe(true);
    // Pas de warning hypothèse moteur
    expect(analysis.warnings.some((w) => w.includes('Hypothese simplifiee'))).toBe(false);
  });

  it('T6b [audit] choixLegal quart_pp : 1/4 PP explicite avec warning art. 757 CC', () => {
    // CL, même scénario, choix explicite 1/4 PP
    // conjointPart = 400k × 0.25 = 100k ; carryOver = 100k
    // step2.actifTransmis = 400k + 100k = 500k
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ dateNaissanceEpoux2: '1975-01-01' }),
      liquidation: makeLiquidation({ actifEpoux1: 200_000, actifEpoux2: 200_000, actifCommun: 400_000, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DMTG_SETTINGS,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }, { id: 'E2', rattachement: 'commun' }],
      familyMembers: [],
      devolution: makeDevolution({ choixLegalConjointSansDDV: 'quart_pp', nbEnfantsNonCommuns: 0 }),
      referenceDate: new Date('2026-01-01'),
    });

    expect(analysis.step1?.partConjoint).toBe(100_000);
    expect(analysis.step2?.actifTransmis).toBe(500_000);
    expect(analysis.warnings.some((w) => w.includes('1/4 en pleine propriete retenu (art. 757 CC)'))).toBe(true);
    expect(analysis.warnings.some((w) => w.includes('Hypothese simplifiee'))).toBe(false);
  });

  it('T6c [audit] choixLegal usufruit sans date de naissance : fallback 1/4 PP + warning date manquante', () => {
    // Pas de dateNaissanceEpoux2 → valorisation CGI 669 impossible → repli 1/4 PP
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil(),
      liquidation: makeLiquidation({ actifEpoux1: 200_000, actifEpoux2: 200_000, actifCommun: 400_000, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DMTG_SETTINGS,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }, { id: 'E2', rattachement: 'commun' }],
      familyMembers: [],
      devolution: makeDevolution({ choixLegalConjointSansDDV: 'usufruit', nbEnfantsNonCommuns: 0 }),
      referenceDate: new Date('2026-01-01'),
    });

    expect(analysis.step1?.partConjoint).toBe(100_000);
    expect(analysis.warnings.some((w) => w.includes('date de naissance') && w.includes('manquante'))).toBe(true);
  });

  it('T6d [audit] choixLegal usufruit + enfant non commun : usufruit ignoré, 1/4 PP forcé (art. 757 CC)', () => {
    // Présence d'enfant non commun → usufruit legal inapplicable
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ dateNaissanceEpoux2: '1975-01-01' }),
      liquidation: makeLiquidation({ actifEpoux1: 200_000, actifEpoux2: 200_000, actifCommun: 400_000, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DMTG_SETTINGS,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }, { id: 'E2', rattachement: 'commun' }],
      familyMembers: [],
      devolution: makeDevolution({ choixLegalConjointSansDDV: 'usufruit', nbEnfantsNonCommuns: 1 }),
      referenceDate: new Date('2026-01-01'),
    });

    expect(analysis.step1?.partConjoint).toBe(100_000);
    expect(analysis.warnings.some((w) => w.includes("enfant(s) non commun(s)"))).toBe(true);
    expect(analysis.warnings.some((w) => w.includes('Choix legal du conjoint') && w.includes('669'))).toBe(false);
  });
});
