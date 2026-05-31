// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import StepFamille from '../components/steps/StepFamille';
import { createEmptyDossier } from '@/domain/audit/types';

describe('StepFamille', () => {
  it('n’affiche les champs partenaire que pour une situation de couple', async () => {
    const dossier = createEmptyDossier();
    const updateDossier = vi.fn();

    const { rerender } = render(<StepFamille dossier={dossier} updateDossier={updateDossier} />);

    expect(screen.queryByRole('heading', { name: 'Madame / Partenaire' })).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Situation matrimoniale'), 'marie');

    expect(updateDossier).toHaveBeenCalledWith({
      situationFamiliale: expect.objectContaining({
        situationMatrimoniale: 'marie',
      }),
    });

    rerender(
      <StepFamille
        dossier={{
          ...dossier,
          situationFamiliale: {
            ...dossier.situationFamiliale,
            situationMatrimoniale: 'marie',
          },
        }}
        updateDossier={updateDossier}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Madame / Partenaire' })).toBeInTheDocument();
  });
});
