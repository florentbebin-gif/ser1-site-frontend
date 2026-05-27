// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import StepObjectifs from '../components/steps/StepObjectifs';
import { createEmptyDossier } from '../types';

describe('StepObjectifs', () => {
  it('sélectionne et désélectionne un objectif client', async () => {
    const dossier = createEmptyDossier();
    const updateDossier = vi.fn();

    const { rerender } = render(<StepObjectifs dossier={dossier} updateDossier={updateDossier} />);

    await userEvent.click(screen.getByLabelText('Préparer la transmission'));

    expect(updateDossier).toHaveBeenCalledWith({ objectifs: ['preparer_transmission'] });

    rerender(
      <StepObjectifs
        dossier={{
          ...dossier,
          objectifs: ['preparer_transmission'],
        }}
        updateDossier={updateDossier}
      />,
    );

    await userEvent.click(screen.getByLabelText('Préparer la transmission'));

    expect(updateDossier).toHaveBeenCalledWith({ objectifs: [] });
  });

  it('affiche les objectifs entreprise uniquement si un actif entreprise existe', () => {
    const dossier = createEmptyDossier();
    dossier.actifs = [
      {
        id: 'entreprise-1',
        libelle: 'Société',
        valeur: 500000,
        proprietaire: 'mr',
        type: 'entreprise',
      },
    ];

    render(<StepObjectifs dossier={dossier} updateDossier={vi.fn()} />);

    expect(screen.getByText('Protéger mon entreprise')).toBeInTheDocument();
    expect(screen.getByText('Protéger mes associés')).toBeInTheDocument();
  });
});
