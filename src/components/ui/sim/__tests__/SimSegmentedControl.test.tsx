// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SimSegmentedControl } from '../SimSegmentedControl';

describe('SimSegmentedControl', () => {
  it('rend des boutons radio accessibles', () => {
    render(
      <SimSegmentedControl
        ariaLabel="Type de sortie"
        value="rente"
        options={[
          { value: 'rente', label: 'Rente' },
          { value: 'capital', label: 'Capital' },
          { value: 'fractionne', label: 'Fractionné' },
        ]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('radiogroup', { name: 'Type de sortie' })).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'Rente' }).getAttribute('aria-checked')).toBe('true');
  });

  it('notifie le changement au clic', async () => {
    const onChange = vi.fn();
    render(
      <SimSegmentedControl
        ariaLabel="Type de sortie"
        value="rente"
        options={[
          { value: 'rente', label: 'Rente' },
          { value: 'capital', label: 'Capital' },
        ]}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole('radio', { name: 'Capital' }));

    expect(onChange).toHaveBeenCalledWith('capital');
  });
});
