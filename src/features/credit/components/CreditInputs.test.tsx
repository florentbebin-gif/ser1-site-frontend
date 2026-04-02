import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { InputEuro, Select } from './CreditInputs';

describe('CreditInputs', () => {
  it('keeps the data-testid on the capital input and applies shared field classes', () => {
    const html = renderToStaticMarkup(
      <InputEuro
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

  it('renders the custom select with shared dropdown classes', () => {
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
});
