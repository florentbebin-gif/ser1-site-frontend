// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import StepFiscalite from '../components/steps/StepFiscalite';
import { createEmptyDossier } from '@/domain/audit/types';

vi.mock('@/hooks/useFiscalContext', () => ({
  useFiscalContext: () => ({
    fiscalContext: {
      irScaleCurrent: [
        { from: 0, to: 10000, rate: 0, deduction: 0 },
        { from: 10001, to: 30000, rate: 7, deduction: 0 },
        { from: 30001, to: null, rate: 42, deduction: 0 },
      ],
    },
    loading: false,
    error: null,
    meta: {
      fromCache: false,
      updatedAt: 0,
      taxUpdatedAt: null,
      psUpdatedAt: null,
      fiscalityUpdatedAt: null,
      passUpdatedAt: null,
    },
  }),
}));

describe('StepFiscalite', () => {
  it('alimente la TMI depuis les paramètres fiscaux centralisés', async () => {
    const dossier = createEmptyDossier();
    const updateDossier = vi.fn();

    render(<StepFiscalite dossier={dossier} updateDossier={updateDossier} />);

    await userEvent.selectOptions(screen.getByLabelText('TMI (%)'), '7');

    expect(updateDossier).toHaveBeenCalledWith({
      situationFiscale: expect.objectContaining({
        tmi: 7,
      }),
    });
  });
});
