// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import StepActifs from '../components/steps/StepActifs';
import { createEmptyDossier } from '@/domain/audit/types';

describe('StepActifs', () => {
  it('ajoute un actif financier par défaut', async () => {
    const dossier = createEmptyDossier();
    const updateDossier = vi.fn();

    render(<StepActifs dossier={dossier} updateDossier={updateDossier} />);

    expect(screen.getByText(/Total actifs/)).toHaveTextContent('0 €');

    await userEvent.click(screen.getByRole('button', { name: '+ Ajouter un actif' }));

    expect(updateDossier).toHaveBeenCalledWith({
      actifs: [
        expect.objectContaining({
          libelle: '',
          valeur: 0,
          proprietaire: 'commun',
          type: 'autre_financier',
        }),
      ],
    });
  });

  it('met à jour et supprime un actif existant', async () => {
    const dossier = createEmptyDossier();
    dossier.actifs = [
      {
        id: 'actif-1',
        libelle: '',
        valeur: 250000,
        proprietaire: 'commun',
        type: 'autre_financier',
      },
    ];
    const updateDossier = vi.fn();

    render(<StepActifs dossier={dossier} updateDossier={updateDossier} />);

    expect(screen.getByText(/Total actifs/)).toHaveTextContent('250 000 €');

    fireEvent.change(screen.getByLabelText('Libellé'), { target: { value: 'Résidence' } });

    expect(updateDossier).toHaveBeenCalledWith({
      actifs: [
        expect.objectContaining({
          id: 'actif-1',
          libelle: 'Résidence',
        }),
      ],
    });

    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(updateDossier).toHaveBeenCalledWith({ actifs: [] });
  });
});
