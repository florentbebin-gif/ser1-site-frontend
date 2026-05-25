// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ModeToggleView } from './ModeToggle';

describe('ModeToggleView', () => {
  it('expose un repère inactif accessible sans déclencher de bascule', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <ModeToggleView
        isExpert={false}
        onToggle={onToggle}
        disabled
        disabledReason="Mode expert affiché comme repère : le parcours simplifié reste à définir."
        testId="mode-toggle"
      />,
    );

    const button = screen.getByRole('button', { name: /mode expert indisponible/i });

    expect(button).toHaveProperty('disabled', true);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('title')).toBe(
      'Mode expert affiché comme repère : le parcours simplifié reste à définir.',
    );
    expect(button.classList.contains('mode-toggle-pill--disabled')).toBe(true);

    await user.click(button);

    expect(onToggle).not.toHaveBeenCalled();
  });
});
