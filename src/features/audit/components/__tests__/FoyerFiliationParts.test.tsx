// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import { FiliationPill, type FiliationNode } from '../FoyerFiliationParts';

function renderNode(extra: Partial<FiliationNode>) {
  const node: FiliationNode = {
    x: 12,
    label: 'Lou',
    sublabel: '16 ans',
    variant: 'enfant',
    avatarKind: 'fille',
    memberId: 'node-test',
    estCommun: true,
    ...extra,
  };

  return render(
    createElement(
      'svg',
      null,
      createElement(
        'defs',
        null,
        createElement(
          'clipPath',
          { id: 'clip-test' },
          createElement('circle', { cx: 0, cy: 0, r: 115 }),
        ),
      ),
      createElement(FiliationPill, {
        node,
        y: 24,
        width: 132,
        height: 54,
        clipId: 'clip-test',
        compact: true,
      }),
    ),
  );
}

describe('FiliationPill', () => {
  it('expose un ton discret pour un enfant commun', () => {
    const { container } = renderNode({ estCommun: true });

    const group = container.querySelector('.audit-fil__node');
    expect(group).toHaveClass('audit-fil__node--branch-common');
    expect(group).toHaveAttribute('data-branch-tone', 'common');
  });

  it('expose le ton client ou conjoint pour une union précédente', () => {
    const client = renderNode({ estCommun: false, parentPrincipal: 'client' }).container;
    const conjoint = renderNode({ estCommun: false, parentPrincipal: 'conjoint' }).container;

    expect(client.querySelector('.audit-fil__node')).toHaveClass('audit-fil__node--branch-client');
    expect(client.querySelector('.audit-fil__node')).toHaveAttribute('data-branch-tone', 'client');
    expect(conjoint.querySelector('.audit-fil__node')).toHaveClass(
      'audit-fil__node--branch-conjoint',
    );
    expect(conjoint.querySelector('.audit-fil__node')).toHaveAttribute(
      'data-branch-tone',
      'conjoint',
    );
  });
});
