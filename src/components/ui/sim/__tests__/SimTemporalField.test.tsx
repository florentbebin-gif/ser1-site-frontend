// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SimTemporalField } from '../SimTemporalField';

describe('SimTemporalField', () => {
  it('rend un champ date avec valeur ISO et styles simulateur', () => {
    render(
      <SimTemporalField
        ariaLabel="Date de l’acte"
        testId="date-acte"
        value="2026-06-02"
        onChange={vi.fn()}
      />,
    );

    const input = screen.getByLabelText('Date de l’acte') as HTMLInputElement;

    expect(input).toHaveAttribute('type', 'date');
    expect(input).toHaveClass('sim-field__control', 'sim-field__control--temporal');
    expect(input).toHaveValue('2026-06-02');
    expect(screen.getByTestId('date-acte')).toBe(input);
  });

  it('rend un champ mois et remonte la valeur ISO sélectionnée', () => {
    const onChange = vi.fn();
    render(
      <SimTemporalField
        ariaLabel="Mois d’effet"
        granularity="month"
        value="2026-06"
        onChange={onChange}
      />,
    );

    const input = screen.getByLabelText('Mois d’effet') as HTMLInputElement;

    expect(input).toHaveAttribute('type', 'month');
    expect(input).toHaveValue('2026-06');

    fireEvent.change(input, { target: { value: '2026-07' } });

    expect(onChange).toHaveBeenCalledWith('2026-07');
  });

  it('transmet bornes et état désactivé au contrôle natif', () => {
    render(
      <SimTemporalField
        ariaLabel="Date bornée"
        value=""
        min="2026-01-01"
        max="2026-12-31"
        disabled
        onChange={vi.fn()}
      />,
    );

    const input = screen.getByLabelText('Date bornée');

    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('min', '2026-01-01');
    expect(input).toHaveAttribute('max', '2026-12-31');
  });
});
