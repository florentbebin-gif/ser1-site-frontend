// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import StepFiscalite from '../components/steps/StepFiscalite';
import { createEmptyDossier } from '@/domain/audit/types';

describe('StepFiscalite', () => {
  it('alimente la TMI depuis les paramètres fiscaux centralisés', async () => {
    const dossier = createEmptyDossier();
    const updateDossier = vi.fn();

    render(<StepFiscalite dossier={dossier} updateDossier={updateDossier} />);

    await userEvent.selectOptions(screen.getByLabelText('TMI (%)'), '11');

    expect(updateDossier).toHaveBeenCalledWith({
      situationFiscale: expect.objectContaining({
        tmi: 11,
      }),
    });
  });
});
