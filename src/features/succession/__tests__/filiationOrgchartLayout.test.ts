import { describe, expect, it } from 'vitest';
import {
  FILIATION_NODE_HEIGHT,
  computeFiliationOrgchartLayout,
  getFiliationNodeCenterX,
} from '../filiationOrgchartLayout';
import type { SuccessionCivilContext, SuccessionEnfant } from '../successionDraft';

const civilContext: SuccessionCivilContext = {
  situationMatrimoniale: 'marie',
  regimeMatrimonial: 'separation_biens',
  pacsConvention: 'separation',
};

describe('filiationOrgchartLayout', () => {
  it('relie les enfants communs par une barre de rattachement sous le couple', () => {
    const enfants: SuccessionEnfant[] = [
      { id: 'enfant-1', rattachement: 'commun' },
      { id: 'enfant-2', rattachement: 'commun' },
    ];

    const layout = computeFiliationOrgchartLayout(civilContext, enfants, []);
    const childNodes = enfants.map((enfant) => {
      const node = layout.nodes.find((candidate) => candidate.id === enfant.id);
      expect(node).toBeDefined();
      return node!;
    });
    const childCenters = childNodes.map(getFiliationNodeCenterX);
    const childTop = Math.min(...childNodes.map((node) => node.y));
    const parentBottom = Math.max(
      ...layout.nodes
        .filter((node) => node.id === 'epoux1' || node.id === 'epoux2')
        .map((node) => node.y + FILIATION_NODE_HEIGHT),
    );

    const attachmentBar = layout.edges.find((edge) => {
      const left = Math.min(edge.x1, edge.x2);
      const right = Math.max(edge.x1, edge.x2);
      return edge.y1 === edge.y2
        && edge.y1 > parentBottom
        && edge.y1 < childTop
        && left <= Math.min(...childCenters)
        && right >= Math.max(...childCenters);
    });

    expect(attachmentBar).toBeDefined();
  });
});
