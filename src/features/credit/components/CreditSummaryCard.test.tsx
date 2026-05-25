import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CreditSummaryCard, SummaryDonut } from './CreditSummaryCard';
import type { CreditSynthesis } from '../types';

const synthese = {
  totalInterets: 18000,
  totalAssurance: 2400,
  coutTotalCredit: 20400,
  mensualiteTotaleM1: 920,
  primeAssMensuelle: 40,
  capitalEmprunte: 160000,
  diffDureesMois: 0,
} satisfies CreditSynthesis;

describe('CreditSummaryCard', () => {
  it('rend la mensualité avec la primitive métrique partagée', () => {
    const html = renderToStaticMarkup(
      <CreditSummaryCard synthese={synthese} isAnnual={false} lisserPret1={false} />,
    );

    expect(html).toContain('sim-metric--hero');
    expect(html).toContain('data-testid="credit-mensu-totale-avec-ass"');
  });

  it('rend le badge hors assurance et les deltas de lissage', () => {
    const html = renderToStaticMarkup(
      <CreditSummaryCard
        synthese={{ ...synthese, diffDureesMois: 6 }}
        isAnnual={false}
        lisserPret1
        isExpert={false}
        lissageCoutDelta={1200}
      />,
    );

    expect(html).toContain('sim-status-badge--info');
    expect(html).toContain('Hors assurance');
    expect(html).toContain('sim-delta--positive');
  });

  it('rend le donut avec les classes de matrice couleurs', () => {
    const html = renderToStaticMarkup(<SummaryDonut capital={160000} interets={18000} />);

    expect(html).toContain('cv-donut__capital');
    expect(html).toContain('cv-donut__interest');
  });
});
