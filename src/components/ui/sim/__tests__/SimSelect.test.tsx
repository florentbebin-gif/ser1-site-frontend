// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimSelect } from '../SimSelect';

const OPTIONS = [
  { value: 'a', label: 'Contrat A' },
  { value: 'b', label: 'Contrat B' },
];

describe('SimSelect', () => {
  it('vide la valeur avec Suppr ou Backspace quand clearable est actif', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SimSelect
        value="a"
        onChange={onChange}
        options={OPTIONS}
        clearable
        ariaLabel="Nom du contrat"
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Nom du contrat' });
    trigger.focus();
    await user.keyboard('{Delete}');
    await user.keyboard('{Backspace}');

    expect(onChange).toHaveBeenCalledWith('');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('ne vide pas la valeur au clavier quand clearable est inactif', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SimSelect
        value="a"
        onChange={onChange}
        options={OPTIONS}
        ariaLabel="Nom du contrat"
      />,
    );

    screen.getByRole('button', { name: 'Nom du contrat' }).focus();
    await user.keyboard('{Delete}');

    expect(onChange).not.toHaveBeenCalled();
  });
});
