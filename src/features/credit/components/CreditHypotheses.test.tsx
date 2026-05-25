import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CreditHypotheses } from './CreditHypotheses';

describe('CreditHypotheses', () => {
  it('utilise la primitive disclosure partagée pour les hypothèses', () => {
    const html = renderToStaticMarkup(
      <CreditHypotheses hypothesesOpen={false} onToggle={vi.fn()} />,
    );

    expect(html).toContain('sim-disclosure-btn');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('Hypothèses et limites');
  });
});
