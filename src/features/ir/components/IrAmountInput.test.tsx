import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { IrAmountInput } from './IrAmountInput';

describe('IrAmountInput', () => {
  it('keeps the data-testid on the input and uses the shared control shell', () => {
    const html = renderToStaticMarkup(
      <IrAmountInput value="45000" onChange={() => {}} testId="ir-salary-d1-input" />,
    );

    expect(html).toContain('data-testid="ir-salary-d1-input"');
    expect(html).toContain('class="sim-field__control"');
    expect(html).toContain('ir-table-input__unit sim-field__unit');
  });
});
