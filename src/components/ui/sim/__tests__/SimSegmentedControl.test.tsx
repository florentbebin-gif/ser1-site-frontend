// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
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

  it('permet la navigation clavier entre options radio', async () => {
    function Harness() {
      const [value, setValue] = useState<'rente' | 'capital' | 'fractionne'>('rente');

      return (
        <SimSegmentedControl
          ariaLabel="Type de sortie"
          value={value}
          options={[
            { value: 'rente', label: 'Rente' },
            { value: 'capital', label: 'Capital' },
            { value: 'fractionne', label: 'Fractionné' },
          ]}
          onChange={setValue}
        />
      );
    }

    render(<Harness />);

    screen.getByRole('radio', { name: 'Rente' }).focus();
    await userEvent.keyboard('{ArrowRight}');

    expect(screen.getByRole('radio', { name: 'Capital' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Capital' })).toHaveFocus();

    await userEvent.keyboard('{End}');

    expect(screen.getByRole('radio', { name: 'Fractionné' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await userEvent.keyboard('{Home}');

    expect(screen.getByRole('radio', { name: 'Rente' })).toHaveAttribute('aria-checked', 'true');
  });
});
