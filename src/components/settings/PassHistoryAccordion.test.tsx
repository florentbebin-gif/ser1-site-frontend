// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PassHistoryAccordion from './PassHistoryAccordion';
import type { PassHistoryRow } from '@/hooks/settings/usePassHistory';

const rows: PassHistoryRow[] = [
  { year: 2025, pass_amount: 47100 },
  { year: 2026, pass_amount: 48200 },
];

describe('PassHistoryAccordion', () => {
  it('délègue les modifications sans bouton de sauvegarde local', () => {
    const onChange = vi.fn();

    render(
      <PassHistoryAccordion
        rows={rows}
        loading={false}
        isOpen
        onToggle={vi.fn()}
        onChange={onChange}
        isAdmin
      />,
    );

    expect(screen.queryByRole('button', { name: /Enregistrer le PASS/i })).not.toBeInTheDocument();

    const passInputs = screen.getAllByPlaceholderText('À renseigner');
    fireEvent.change(passInputs[0], { target: { value: '47200' } });

    expect(onChange).toHaveBeenLastCalledWith(0, '47200');
  });
});
