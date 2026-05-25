import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CreditLoanTabs } from './CreditLoanTabs';

describe('CreditLoanTabs', () => {
  it('rend la suppression de prêt avec le bouton action partagé', () => {
    const html = renderToStaticMarkup(
      <CreditLoanTabs
        activeTab={1}
        onChangeTab={vi.fn()}
        hasPret2
        hasPret3={false}
        onAddPret2={vi.fn()}
        onAddPret3={vi.fn()}
        onRemovePret2={vi.fn()}
        onRemovePret3={vi.fn()}
      />,
    );

    expect(html).toContain('sim-action-btn--close');
    expect(html).toContain('aria-label="Supprimer Prêt 2"');
  });
});
