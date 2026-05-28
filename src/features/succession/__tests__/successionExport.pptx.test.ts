/**
 * Tests smoke des exports Succession.
 */

import { describe, expect, it } from 'vitest';
import { calculateSuccession } from '@/engine/succession';
import { buildSuccessionStudyDeck } from '@/pptx/presets/successionDeckBuilder';
import { THEME_COLORS, type SuccessionStudyData } from './successionExport.fixtures';

describe('Succession PPTX Export', () => {
  it('builds a valid deck spec without crash', () => {
    const result = calculateSuccession({
      actifNetSuccession: 500000,
      heritiers: [
        { lien: 'conjoint', partSuccession: 250000 },
        { lien: 'enfant', partSuccession: 125000 },
        { lien: 'enfant', partSuccession: 125000 },
      ],
    });

    const spec = buildSuccessionStudyDeck(
      {
        actifNetSuccession: result.result.actifNetSuccession,
        totalDroits: result.result.totalDroits,
        tauxMoyenGlobal: result.result.tauxMoyenGlobal,
        heritiers: result.result.detailHeritiers,
        assumptions: [
          'Les recompenses entre masses sont restituees comme transferts simplifies.',
          'Le passif affecte minore uniquement la masse rattachee.',
        ],
        predecesChronologie: {
          applicable: true,
          order: 'epoux1',
          firstDecedeLabel: 'Époux 1',
          secondDecedeLabel: 'Époux 2',
          step1: {
            actifTransmis: 300000,
            prevoyanceTransmise: 80000,
            droitsPrevoyance: 6000,
            partConjoint: 75000,
            partEnfants: 225000,
            droitsEnfants: 12500,
            beneficiaries: [
              { label: 'Conjoint survivant', brut: 75000, droits: 0, net: 75000, exonerated: true },
              { label: 'E1', brut: 112500, droits: 6250, net: 106250 },
              { label: 'E2', brut: 112500, droits: 6250, net: 106250 },
            ],
          },
          step2: {
            actifTransmis: 500000,
            prevoyanceTransmise: 40000,
            droitsPrevoyance: 3000,
            partConjoint: 0,
            partEnfants: 500000,
            droitsEnfants: 42000,
            beneficiaries: [
              { label: 'E1', brut: 250000, droits: 21000, net: 229000 },
              { label: 'E2', brut: 250000, droits: 21000, net: 229000 },
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
            patrimoineFinalEpoux1: 300000,
            patrimoineFinalEpoux2: 180000,
            acquetsEpoux1: 200000,
            acquetsEpoux2: 60000,
            creditor: 'epoux2',
            debtor: 'epoux1',
            quoteAppliedPct: 50,
            creanceAmount: 70000,
            firstEstateAdjustment: -70000,
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
            requestedAmount: 50000,
            appliedAmount: 50000,
            usesGlobalFallback: false,
            selections: [
              {
                id: 'prec-1',
                label: 'Portefeuille titres',
                requestedAmount: 50000,
                appliedAmount: 50000,
              },
            ],
          },
          prevoyanceTotale: 120000,
          totalDroits: 54500,
          warnings: ['Module simplifié'],
        },
      },
      THEME_COLORS,
    );

    expect(spec.cover.type).toBe('cover');
    expect(spec.cover.title).toContain('Succession');
    expect(spec.slides.length).toBeGreaterThanOrEqual(4);
    expect(spec.end.type).toBe('end');

    const synthSlide = spec.slides.find((slide) => slide.type === 'succession-synthesis');
    expect(synthSlide).toBeDefined();
    if (synthSlide?.type === 'succession-synthesis') {
      expect(synthSlide.kpis).toHaveLength(4);
      expect(synthSlide.heroValue).toContain('€');
      expect('beneficiaries' in synthSlide).toBe(false);
    }

    const chronologySlide = spec.slides.find((slide) => slide.type === 'succession-chronology');
    expect(chronologySlide).toBeDefined();
    if (chronologySlide?.type === 'succession-chronology') {
      expect(chronologySlide.totalDroits).toContain('54');
      expect(chronologySlide.steps).toHaveLength(2);
      expect(chronologySlide.steps[0].beneficiaries[0].label).toBe('Conjoint survivant');
      expect(chronologySlide.steps[0].droitsHorsSuccession).toBeDefined();
      expect('notes' in chronologySlide).toBe(false);
    }

    const annexSlide = spec.slides.find((slide) => slide.type === 'succession-annex-table');
    expect(annexSlide).toBeDefined();
    if (annexSlide?.type === 'succession-annex-table') {
      // cas avec chronologie applicable : 2 étapes
      expect(annexSlide.steps).toHaveLength(2);
      expect(annexSlide.steps[0].title).toContain('1er décès');
      expect(annexSlide.steps[1].title).toContain('2e décès');
      // chaque étape a des bénéficiaires + une ligne total
      const step1 = annexSlide.steps[0];
      expect(step1.beneficiaries.length).toBeGreaterThanOrEqual(2);
      expect(step1.beneficiaries.some((b) => b.isTotal)).toBe(true);
      // premier bénéficiaire de l'étape 1 : Conjoint survivant exonéré
      const conjoint = step1.beneficiaries.find((b) => b.label === 'Conjoint survivant');
      expect(conjoint).toBeDefined();
      expect(conjoint?.exonerated).toBe(true);
      // valeurs numériques réelles (pas de zéros aberrants)
      expect(step1.beneficiaries[0].transmissionNetteSuccession).toBeGreaterThan(0);
    }

    const hypothesesSlide = spec.slides.find((slide) => slide.type === 'succession-hypotheses');
    expect(hypothesesSlide).toBeDefined();
    if (hypothesesSlide?.type === 'succession-hypotheses') {
      expect(hypothesesSlide.items.join(' ')).toContain('recompenses entre masses');
      expect(hypothesesSlide.items.join(' ')).toContain('Module simplifié');
    }
  });

  it('documents direct succession when chronology is not the primary display source', () => {
    const result = calculateSuccession({
      actifNetSuccession: 320000,
      heritiers: [
        { lien: 'enfant', partSuccession: 160000 },
        { lien: 'enfant', partSuccession: 160000 },
      ],
    });

    const spec = buildSuccessionStudyDeck(
      {
        actifNetSuccession: result.result.actifNetSuccession,
        totalDroits: result.result.totalDroits,
        tauxMoyenGlobal: result.result.tauxMoyenGlobal,
        heritiers: result.result.detailHeritiers,
        predecesChronologie: {
          applicable: false,
          order: 'epoux1',
          firstDecedeLabel: 'Défunt(e)',
          secondDecedeLabel: '—',
          step1: null,
          step2: null,
          totalDroits: result.result.totalDroits,
          warnings: ['Succession directe du défunt simulé.'],
        },
      },
      THEME_COLORS,
    );

    const chronologySlide = spec.slides.find((slide) => slide.type === 'succession-chronology');
    expect(chronologySlide).toBeDefined();
    if (chronologySlide?.type === 'succession-chronology') {
      expect(chronologySlide.applicable).toBe(false);
      expect(chronologySlide.steps).toHaveLength(1);
      expect(chronologySlide.steps[0].masseTransmise).not.toBe('—');
      expect(chronologySlide.steps[0].autresBeneficiaires).not.toBe('—');
      expect('notes' in chronologySlide).toBe(false);
    }

    const hypothesesSlide = spec.slides.find((slide) => slide.type === 'succession-hypotheses');
    expect(hypothesesSlide).toBeDefined();
    if (hypothesesSlide?.type === 'succession-hypotheses') {
      expect(hypothesesSlide.items.join(' ')).toContain('Succession directe du défunt simulé.');
    }

    const annexSlide = spec.slides.find((slide) => slide.type === 'succession-annex-table');
    expect(annexSlide).toBeDefined();
    if (annexSlide?.type === 'succession-annex-table') {
      // succession directe → 1 seule étape
      expect(annexSlide.steps).toHaveLength(1);
      expect(annexSlide.steps[0].title).toContain('Succession directe');
      // pas d'étapes chronologie
      expect(annexSlide.steps[0].title).not.toContain('1er décès');
      // valeurs numériques réelles
      const dataRows = annexSlide.steps[0].beneficiaries.filter((b) => !b.isTotal);
      expect(dataRows.every((b) => b.transmissionNetteSuccession > 0)).toBe(true);
    }
  });

  it('place la slide contexte familial avant la synthèse', () => {
    const data: SuccessionStudyData & {
      familyContext: {
        situationLabel: string;
        regimeLabel: string;
        dispositions: string[];
        filiation: {
          nodes: Array<{ id: string; label: string; x: number; y: number; kind: string }>;
          edges: Array<{ x1: number; y1: number; x2: number; y2: number }>;
          groups: Array<{ x: number; y: number; w: number; h: number }>;
          svgWidth: number;
          svgHeight: number;
        };
      };
    } = {
      actifNetSuccession: 500000,
      totalDroits: 16388,
      tauxMoyenGlobal: 3.28,
      heritiers: [],
      familyContext: {
        situationLabel: 'Marié(e)',
        regimeLabel: 'Séparation de biens',
        dispositions: ['Donation entre époux : Totalité en usufruit'],
        filiation: {
          nodes: [
            { id: 'epoux1', label: 'Époux 1', x: 60, y: 50, kind: 'epoux' },
            { id: 'epoux2', label: 'Époux 2', x: 180, y: 50, kind: 'epoux' },
            { id: 'enfant-1', label: 'E1', x: 120, y: 120, kind: 'enfant_commun' },
          ],
          edges: [{ x1: 140, y1: 62, x2: 180, y2: 62 }],
          groups: [{ x: 108, y: 108, w: 104, h: 40 }],
          svgWidth: 300,
          svgHeight: 180,
        },
      },
    };

    const spec = buildSuccessionStudyDeck(data, THEME_COLORS);
    const slideTypes = spec.slides.map((slide) => slide.type);

    expect(slideTypes).toEqual([
      'chapter',
      'succession-family-context',
      'succession-synthesis',
      'succession-chronology',
      'chapter',
      'succession-annex-table',
      'succession-hypotheses',
    ]);

    const familySlide = spec.slides.find(
      (slide) => (slide as { type?: string }).type === 'succession-family-context',
    ) as
      | {
          situationLabel?: string;
          regimeLabel?: string;
          dispositions?: string[];
          filiation?: { nodes: Array<{ label: string }> };
        }
      | undefined;

    expect(familySlide?.situationLabel).toBe('Marié(e)');
    expect(familySlide?.regimeLabel).toContain('Séparation');
    expect(familySlide?.dispositions?.join(' ')).toContain('Donation entre époux');
    expect(familySlide?.filiation?.nodes.map((node) => node.label)).toContain('Époux 1');
  });

  it('allège la synthèse et prépare l’annexe enrichie par bénéficiaire', () => {
    const data: SuccessionStudyData & {
      annexBeneficiarySteps: Array<{
        title: string;
        beneficiaries: Array<{
          label: string;
          capitauxDecesNets: number;
          droitsAssuranceVie990I: number;
          droitsSuccession: number;
          transmissionNetteSuccession: number;
          isTotal?: boolean;
        }>;
      }>;
    } = {
      actifNetSuccession: 300000,
      totalDroits: 30000,
      tauxMoyenGlobal: 10,
      heritiers: [
        {
          lien: 'enfant',
          partBrute: 200000,
          abattement: 100000,
          baseImposable: 100000,
          droits: 20000,
          tauxMoyen: 10,
        },
      ],
      annexBeneficiarySteps: [
        {
          title: 'Succession directe simulée',
          beneficiaries: [
            {
              label: 'Enfant 1',
              capitauxDecesNets: 120000,
              droitsAssuranceVie990I: 15000,
              droitsSuccession: 25000,
              transmissionNetteSuccession: 295000,
            },
            {
              label: 'Total',
              capitauxDecesNets: 120000,
              droitsAssuranceVie990I: 15000,
              droitsSuccession: 25000,
              transmissionNetteSuccession: 295000,
              isTotal: true,
            },
          ],
        },
      ],
    };

    const spec = buildSuccessionStudyDeck(data, THEME_COLORS);
    const synthesisSlide = spec.slides.find((slide) => slide.type === 'succession-synthesis');
    expect(synthesisSlide).toBeDefined();
    if (synthesisSlide?.type === 'succession-synthesis') {
      expect('beneficiaries' in synthesisSlide).toBe(false);
      expect('beneficiariesNote' in synthesisSlide).toBe(false);
    }

    const annexSlide = spec.slides.find((slide) => slide.type === 'succession-annex-table');
    expect(annexSlide).toBeDefined();
    if (annexSlide?.type === 'succession-annex-table') {
      const firstRow = annexSlide.steps[0].beneficiaries[0] as Record<string, unknown>;
      expect(firstRow.capitauxDecesNets).toBe(120000);
      expect(firstRow.droitsAssuranceVie990I).toBe(15000);
      expect(firstRow.droitsSuccession).toBe(25000);
      expect(firstRow.transmissionNetteSuccession).toBe(295000);
      expect(firstRow).not.toHaveProperty('partBrute');
      expect(firstRow).not.toHaveProperty('droits');
      expect(firstRow).not.toHaveProperty('net');
    }
  });
});
