import { describe, expect, it } from 'vitest';
import { buildSuccessionStudyDeck } from '@/pptx/presets/successionDeckBuilder';
import { buildSuccessionHypothesesLayout } from '@/pptx/slides/buildSuccessionHypotheses';
import { buildSuccessionFamilyContextExport } from '../hooks/useSuccessionOutcomePptx.helpers';
import { DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT } from '../successionDraft';
import { makeCivil } from './fixtures';
import { THEME_COLORS } from './successionExportHypotheses.testUtils';

describe('Succession export - hypothèses actives PPTX', () => {
  it('restitue la participation aux acquêts dans la slide Hypothèses PPTX', () => {
    const spec = buildSuccessionStudyDeck(
      {
        actifNetSuccession: 500000,
        totalDroits: 0,
        tauxMoyenGlobal: 0,
        heritiers: [],
        predecesChronologie: {
          applicable: true,
          order: 'epoux1',
          firstDecedeLabel: 'Époux 1',
          secondDecedeLabel: 'Époux 2',
          step1: null,
          step2: null,
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
          totalDroits: 0,
          warnings: [],
        },
      },
      THEME_COLORS,
    );

    const hypothesesSlide = spec.slides.find((slide) => slide.type === 'succession-hypotheses');

    expect(hypothesesSlide).toBeDefined();
    if (hypothesesSlide?.type === 'succession-hypotheses') {
      expect(hypothesesSlide.items.join(' ')).toContain('Participation aux acquêts');
    }
  });

  it('résume les actes donation-partage et l’usufruit successif dans les dispositions PPTX', () => {
    const familyContext = buildSuccessionFamilyContextExport({
      civilContext: makeCivil({ situationMatrimoniale: 'marie' }),
      devolutionContext: {
        nbEnfantsNonCommuns: 0,
        choixLegalConjointSansDDV: null,
        testamentsBySide: {
          epoux1: {
            active: false,
            dispositionType: null,
            beneficiaryRef: null,
            quotePartPct: 100,
            particularLegacies: [],
          },
          epoux2: {
            active: false,
            dispositionType: null,
            beneficiaryRef: null,
            quotePartPct: 100,
            particularLegacies: [],
          },
        },
        ascendantsSurvivantsBySide: { epoux1: false, epoux2: false },
      },
      patrimonialContext: DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
      donationsContext: [],
      donationPartageActs: [
        {
          id: 'dp-1',
          date: '2020-06',
          donateur: 'epoux1',
          avecReserveUsufruit: true,
          usufruitSuccessif: true,
          usufruitSuccessifBeneficiaire: 'epoux2',
          lots: [
            { id: 'lot-1', enfantId: 'E1', valeur: 300_000, accepted: true },
            { id: 'lot-2', enfantId: 'E2', valeur: 200_000, accepted: true },
            { id: 'lot-3', enfantId: 'E3', valeur: 100_000, accepted: true },
          ],
          soultes: [
            { id: 's1', payeurEnfantId: 'E1', receveurEnfantId: 'E3', montant: 100_000 },
            { id: 's2', payeurEnfantId: 'E1', receveurEnfantId: 'E2', montant: 50_000 },
          ],
        },
      ],
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
        { id: 'E3', rattachement: 'commun' },
      ],
      familyMembers: [],
    });

    expect(familyContext.dispositions).toContain(
      'Donations antérieures : 1 donation-partage : 3 lots, 2 soultes pour 150 000 EUR',
    );
    expect(familyContext.dispositions).toContain(
      'Usufruit successif au conjoint/partenaire sur 1 donation',
    );
  });

  it('place le groupe d’hypothèses le plus dense à droite dans la slide PPTX', () => {
    const layout = buildSuccessionHypothesesLayout([
      { title: 'Points d’attention', items: ['Attention courte.'] },
      {
        title: 'Hypothèses fiscales',
        items: [
          'Barèmes DMTG et abattements appliqués depuis les paramètres de l’application.',
          'Usufruit successif selon CGI 669, CGI 796-0 bis et CGI 1133.',
          'Donation-partage : valeur gelée CCV 1078.',
        ],
      },
      { title: 'Limites de l’étude', items: ['Liquidation notariale exhaustive non modélisée.'] },
      { title: 'Cadre de calcul', items: ['Succession directe simulée.'] },
    ]);

    const fiscal = layout.find((group) => group.title === 'Hypothèses fiscales');
    const leftGroups = layout.filter((group) => group.title !== 'Hypothèses fiscales');

    expect(fiscal?.emphasis).toBe('large');
    expect(fiscal?.rect.h).toBeGreaterThan(leftGroups[0].rect.h);
    expect(fiscal?.rect.x).toBeGreaterThan(leftGroups[0].rect.x);
    expect(leftGroups).toHaveLength(3);
    expect(leftGroups.every((group) => group.emphasis === 'compact')).toBe(true);
  });

  it('garde le plus gros volume de texte à droite même si ce n’est pas fiscal', () => {
    const layout = buildSuccessionHypothesesLayout([
      {
        title: 'Points d’attention',
        items: [
          'Avertissement long sur la situation civile, la chronologie, les dates manquantes et les limites de projection.',
          'Second avertissement long sur les données incohérentes détectées dans la simulation exportée.',
        ],
      },
      {
        title: 'Hypothèses fiscales',
        items: [
          'Barème DMTG appliqué avec les abattements, les paramètres transmis au module fiscal et les règles de rappel disponibles.',
        ],
      },
      { title: 'Limites de l’étude', items: ['Limite courte.'] },
      { title: 'Cadre de calcul', items: ['Cadre court.'] },
    ]);

    const largeGroup = layout.find((group) => group.emphasis === 'large');
    const compactTitles = layout
      .filter((group) => group.emphasis === 'compact')
      .map((group) => group.title);

    expect(largeGroup?.title).toBe('Points d’attention');
    expect(compactTitles).toEqual(['Limites de l’étude', 'Cadre de calcul', 'Hypothèses fiscales']);
  });

  it('donne plus de hauteur au cadre gauche le plus chargé', () => {
    const layout = buildSuccessionHypothesesLayout([
      { title: 'Points d’attention', items: ['Attention courte.'] },
      {
        title: 'Hypothèses fiscales',
        items: [
          'Barème DMTG, donation-partage, usufruit successif, CGI 669, CGI 1133, CGI 796-0 bis, CCV 1078.',
          'Valorisation fiscale des transmissions et rappels de donations avec les paramètres transmis au module.',
          'Exonérations du conjoint ou partenaire PACS et réunion au nu-propriétaire sans droits nouveaux.',
        ],
      },
      {
        title: 'Limites de l’étude',
        items: [
          'La lecture civile reste simplifiée et ne remplace pas une liquidation notariale exhaustive.',
          'L’intégration chiffrée fine du rapport civil, de la réduction et de l’imputation sur la réserve n’est pas modélisée.',
          'Le résultat est indicatif et doit être confirmé par une analyse patrimoniale et notariale.',
        ],
      },
      { title: 'Cadre de calcul', items: ['Cadre court.'] },
    ]);

    const limits = layout.find((group) => group.title === 'Limites de l’étude');
    const attention = layout.find((group) => group.title === 'Points d’attention');
    const cadre = layout.find((group) => group.title === 'Cadre de calcul');

    expect(limits?.emphasis).toBe('compact');
    expect(limits?.rect.h).toBeGreaterThan(attention?.rect.h ?? 0);
    expect(limits?.rect.h).toBeGreaterThan(cadre?.rect.h ?? 0);
  });
});
