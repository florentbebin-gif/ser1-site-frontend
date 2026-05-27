// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuditEuroField, AuditNumberField } from './AuditNumberFields';

describe('AuditNumberFields', () => {
  it('arrondit les valeurs quand le champ numérique est entier', async () => {
    const onChange = vi.fn();
    render(
      <AuditNumberField
        id="audit-number-integer"
        label="Nombre entier"
        value={0}
        integer
        onChange={onChange}
      />,
    );

    const input = screen.getByLabelText('Nombre entier');
    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, '2,6');
    await userEvent.tab();

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(3));
  });

  it('respecte les bornes min et max du champ numérique', async () => {
    const onChange = vi.fn();
    render(
      <AuditNumberField
        id="audit-number-clamp"
        label="Nombre borné"
        value={0}
        min={1}
        max={5}
        onChange={onChange}
      />,
    );

    const input = screen.getByLabelText('Nombre borné');
    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, '9');
    await userEvent.tab();

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(5));
  });

  it('formate et remonte les montants euro arrondis', async () => {
    const onChange = vi.fn();
    render(<AuditEuroField id="audit-euro" label="Montant euro" value={0} onChange={onChange} />);

    const input = screen.getByLabelText('Montant euro');

    expect(screen.getByText('€')).toBeInTheDocument();

    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, '1234,4');
    await userEvent.tab();

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(1234));
  });
});
