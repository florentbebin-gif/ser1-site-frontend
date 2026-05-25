import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CreditScheduleTable } from './CreditScheduleTable';
import type { CreditScheduleRow } from '../types';

const rows = [
  {
    mois: 1,
    interet: 120,
    assurance: 20,
    amort: 800,
    mensu: 920,
    mensuTotal: 940,
    crd: 199200,
    assuranceDeces: 200000,
  },
] satisfies CreditScheduleRow[];

describe('CreditScheduleTable', () => {
  it('utilise la primitive disclosure partagée pour l’échéancier', () => {
    const html = renderToStaticMarkup(
      <CreditScheduleTable rows={rows} startYM="2026-01" isAnnual={false} />,
    );

    expect(html).toContain('sim-disclosure-btn');
    expect(html).toContain('aria-expanded="true"');
  });
});
