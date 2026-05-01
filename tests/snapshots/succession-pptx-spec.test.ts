import { describe, expect, it } from 'vitest';
import { calculateSuccession } from '../../src/engine/succession';
import { buildSuccessionStudyDeck } from '../../src/pptx/presets/successionDeckBuilder';
import { DEFAULT_COLORS } from '../../src/settings/theme';
import { normalizeForSnapshot } from './normalize';

describe('snapshots/succession: PPTX deck spec', () => {
  it('buildSuccessionStudyDeck() garde la structure visuelle attendue', () => {
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
        assumptions: ['Simulation sans donations antérieures saisies.'],
        clientName: 'NOM Prénom',
        familyContext: {
          situationLabel: 'Marié(e)',
          regimeLabel: 'Communauté réduite aux acquêts (Légal depuis 1966)',
          dispositions: ['Aucune disposition particulière renseignée.'],
          filiation: {
            nodes: [
              { id: 'epoux1', label: 'Époux 1', x: 60, y: 50, kind: 'epoux' },
              { id: 'epoux2', label: 'Époux 2', x: 180, y: 50, kind: 'epoux' },
              { id: 'enfant-1', label: 'E1', x: 120, y: 120, kind: 'enfant_commun' },
            ],
            edges: [
              { x1: 140, y1: 62, x2: 180, y2: 62 },
              { x1: 160, y1: 62, x2: 160, y2: 120 },
            ],
            groups: [{ x: 108, y: 108, w: 104, h: 40 }],
            svgWidth: 300,
            svgHeight: 180,
          },
        },
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
      DEFAULT_COLORS,
    );

    const sanitized = normalizeForSnapshot({
      ...spec,
      cover: {
        ...spec.cover,
        leftMeta: '<DATE>',
      },
    });

    expect(sanitized).toMatchSnapshot();
  });
});
