// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimSelect } from '../SimSelect';

const OPTIONS = [
  { value: 'a', label: 'Contrat A' },
  { value: 'b', label: 'Contrat B' },
];

const KEYBOARD_OPTIONS = [
  { value: 'a', label: 'Contrat A' },
  { value: 'b', label: 'Contrat B', disabled: true },
  { value: 'c', label: 'Contrat C' },
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
      <SimSelect value="a" onChange={onChange} options={OPTIONS} ariaLabel="Nom du contrat" />,
    );

    screen.getByRole('button', { name: 'Nom du contrat' }).focus();
    await user.keyboard('{Delete}');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('navigue au clavier, ignore les options désactivées et expose aria-activedescendant', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SimSelect
        value="a"
        onChange={onChange}
        options={KEYBOARD_OPTIONS}
        ariaLabel="Nom du contrat"
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Nom du contrat' });
    trigger.focus();

    await user.keyboard('{ArrowDown}');

    const listbox = screen.getByRole('listbox', { name: 'Nom du contrat' });
    const activeId = trigger.getAttribute('aria-activedescendant');
    expect(trigger).toHaveAttribute('aria-controls', listbox.id);
    expect(activeId).toBeTruthy();
    expect(document.getElementById(activeId ?? '')).toHaveTextContent('Contrat C');

    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith('c');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('ne s ouvre pas au clavier quand forced est actif', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SimSelect
        value="a"
        onChange={onChange}
        options={KEYBOARD_OPTIONS}
        ariaLabel="Nom du contrat"
        forced
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Nom du contrat' });
    trigger.focus();
    await user.keyboard('{ArrowDown}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(onChange).not.toHaveBeenCalled();
  });
});
