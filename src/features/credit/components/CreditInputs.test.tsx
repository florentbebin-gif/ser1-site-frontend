import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CreditEuroField, Select } from './CreditInputs';

describe('champs crédit', () => {
  it('conserve le data-testid du capital et applique les classes partagées', () => {
    const html = renderToStaticMarkup(
      <CreditEuroField
        label="Montant emprunté"
        value={200000}
        onChange={vi.fn()}
        dataTestId="credit-capital-input"
      />,
    );

    expect(html).toContain('data-testid="credit-capital-input"');
    expect(html).toContain('sim-field__control');
    expect(html).toContain('sim-field__unit');
  });

  it('rend le select personnalisé avec les classes de liste partagées', () => {
    const html = renderToStaticMarkup(
      <Select
        label="Type"
        value="amortissable"
        onChange={vi.fn()}
        options={[
          { value: 'amortissable', label: 'Amortissable' },
          { value: 'infine', label: 'In fine' },
        ]}
      />,
    );

    expect(html).toContain('sim-select-wrapper');
    expect(html).toContain('sim-field__select-trigger');
    expect(html).toContain('sim-field__select-value');
  });

  it('évite les doublons data-testid entre le champ et le trigger select', () => {
    const html = renderToStaticMarkup(
      <Select
        label="Type"
        value="amortissable"
        onChange={vi.fn()}
        testId="credit-type"
        options={[
          { value: 'amortissable', label: 'Amortissable' },
          { value: 'infine', label: 'In fine' },
        ]}
      />,
    );

    expect(html.match(/data-testid="credit-type"/g)).toHaveLength(1);
    expect(html).toContain('data-testid="credit-type-trigger"');
  });
});
