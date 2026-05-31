// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import StepPassif from '../components/steps/StepPassif';
import { createEmptyDossier } from '@/domain/audit/types';

describe('StepPassif', () => {
  it('ajoute un emprunt immobilier par défaut', async () => {
    const dossier = createEmptyDossier();
    const updateDossier = vi.fn();

    render(<StepPassif dossier={dossier} updateDossier={updateDossier} />);

    expect(screen.getByText(/Total emprunts CRD/)).toHaveTextContent('0 €');

    await userEvent.click(screen.getByRole('button', { name: '+ Ajouter un emprunt' }));

    expect(updateDossier).toHaveBeenCalledWith({
      passif: expect.objectContaining({
        emprunts: [
          expect.objectContaining({
            libelle: '',
            type: 'immobilier',
            capitalRestantDu: 0,
          }),
        ],
      }),
    });
  });

  it('met à jour et supprime un emprunt existant', async () => {
    const dossier = createEmptyDossier();
    dossier.passif.emprunts = [
      {
        id: 'emprunt-1',
        libelle: '',
        type: 'immobilier',
        capitalInitial: 200000,
        capitalRestantDu: 150000,
        mensualite: 900,
        tauxInteret: 2,
        dateDebut: '2024-01-01',
        dateFin: '2044-01-01',
      },
    ];
    const updateDossier = vi.fn();

    render(<StepPassif dossier={dossier} updateDossier={updateDossier} />);

    expect(screen.getByText(/Total emprunts CRD/)).toHaveTextContent('150 000 €');

    fireEvent.change(screen.getByLabelText('Libellé'), { target: { value: 'Résidence' } });

    expect(updateDossier).toHaveBeenCalledWith({
      passif: expect.objectContaining({
        emprunts: [
          expect.objectContaining({
            id: 'emprunt-1',
            libelle: 'Résidence',
          }),
        ],
      }),
    });

    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(updateDossier).toHaveBeenCalledWith({
      passif: expect.objectContaining({
        emprunts: [],
      }),
    });
  });
});
