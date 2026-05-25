import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SimAuditTrail } from './SimAuditTrail';

vi.mock('@/hooks/useFiscalContext', () => ({
  useFiscalContext: () => ({
    fiscalContext: {
      irCurrentYearLabel: '2026 (revenus 2025)',
    },
  }),
}));

describe('SimAuditTrail', () => {
  it('rend la date de calcul, le barème IR et la source', () => {
    const html = renderToStaticMarkup(
      <SimAuditTrail calculatedAt={new Date(2026, 4, 25, 14, 32)} />,
    );

    expect(html).toContain('Simulation calculée le 25/05/2026 14:32');
    expect(html).toContain('Barème IR 2026 (revenus 2025)');
    expect(html).toContain('Source Bercy');
  });

  it('accepte une source et une classe complémentaires', () => {
    const html = renderToStaticMarkup(
      <SimAuditTrail
        calculatedAt={new Date(2026, 4, 25, 9, 5)}
        sourceLabel="Source interne"
        className="audit-contextuel"
      />,
    );

    expect(html).toContain('class="sim-audit-trail audit-contextuel"');
    expect(html).toContain('09:05');
    expect(html).toContain('Source interne');
  });
});
