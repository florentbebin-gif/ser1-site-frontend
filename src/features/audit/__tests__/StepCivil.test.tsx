// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import StepCivil from '../components/steps/StepCivil';
import { createEmptyDossier } from '../types';

describe('StepCivil', () => {
  it('affiche et met à jour le régime matrimonial pour un couple marié', async () => {
    const dossier = createEmptyDossier();
    dossier.situationFamiliale.situationMatrimoniale = 'marie';
    const updateDossier = vi.fn();

    render(<StepCivil dossier={dossier} updateDossier={updateDossier} />);

    await userEvent.selectOptions(screen.getByLabelText('Régime'), 'separation_biens');

    expect(updateDossier).toHaveBeenCalledWith({
      situationCivile: expect.objectContaining({
        regimeMatrimonial: 'separation_biens',
      }),
    });

    await userEvent.click(screen.getByLabelText('Contrat de mariage'));

    expect(updateDossier).toHaveBeenCalledWith({
      situationCivile: expect.objectContaining({
        contratMariage: true,
      }),
    });
  });

  it('ajoute une donation antérieure depuis l’étape civile', async () => {
    const dossier = createEmptyDossier();
    const updateDossier = vi.fn();

    render(<StepCivil dossier={dossier} updateDossier={updateDossier} />);

    await userEvent.click(screen.getByRole('button', { name: '+ Ajouter une donation' }));

    expect(updateDossier).toHaveBeenCalledWith({
      situationCivile: expect.objectContaining({
        donations: [
          expect.objectContaining({
            type: 'donation_simple',
            montant: 0,
          }),
        ],
      }),
    });
  });
});
