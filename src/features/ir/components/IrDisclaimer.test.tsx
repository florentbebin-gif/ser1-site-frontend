import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { IrDisclaimer } from './IrDisclaimer';

describe('IrDisclaimer', () => {
  it('utilise la primitive disclosure partagée pour les hypothèses', () => {
    const html = renderToStaticMarkup(<IrDisclaimer isIsolated={false} />);

    expect(html).toContain('sim-disclosure-btn');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('Hypothèses et limites');
  });
});
