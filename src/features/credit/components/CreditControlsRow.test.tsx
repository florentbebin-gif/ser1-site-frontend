// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CreditControlsRow } from './CreditControlsRow';

describe('CreditControlsRow', () => {
  it('rend la période Mensuel/Annuel avec le contrôle segmenté accessible', async () => {
    const onChangeViewMode = vi.fn();

    render(
      <CreditControlsRow
        activeTab={0}
        onChangeTab={vi.fn()}
        hasPret2={false}
        hasPret3={false}
        onAddPret2={vi.fn()}
        onAddPret3={vi.fn()}
        onRemovePret2={vi.fn()}
        onRemovePret3={vi.fn()}
        viewMode="mensuel"
        onChangeViewMode={onChangeViewMode}
      />,
    );

    expect(screen.getByTestId('credit-view-toggle')).toContainElement(
      screen.getByRole('radiogroup', { name: 'Période d’affichage' }),
    );
    expect(screen.getByRole('radio', { name: 'Mensuel' })).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(screen.getByRole('radio', { name: 'Annuel' }));

    expect(onChangeViewMode).toHaveBeenCalledWith('annuel');
  });
});
