// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  PREVOYANCE_PAGE_TEST_TIMEOUT_MS,
  creerTroisContrats,
  renderPrevoyancePage,
  resetPrevoyanceStorage,
  saisirDateNaissance,
} from './PrevoyancePage.testUtils';

describe('PrevoyancePage - contrats', () => {
  beforeEach(resetPrevoyanceStorage);

  it(
    'charge le parcours TNS par défaut et permet trois contrats en cartes compactes',
    async () => {
      const user = userEvent.setup();
      renderPrevoyancePage();

      await saisirDateNaissance(user);
      expect((await screen.findAllByText('Frais généraux')).length).toBeGreaterThan(0);
      expect(screen.getAllByText('Frais généraux').length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: 'Ajouter un contrat' })).toHaveClass(
        'sim-action-btn--add',
      );
      expect(screen.queryByText('Comparer')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Modifier Contrat 1/i })).toHaveClass(
        'sim-action-btn--edit',
      );
      expect(screen.getByRole('button', { name: /Dupliquer Contrat 1/i })).toHaveClass(
        'sim-action-btn--duplicate',
      );
      expect(screen.getByRole('button', { name: /Supprimer Contrat 1/i })).toHaveClass(
        'sim-action-btn--delete',
      );
      expect(document.querySelectorAll('.prevoyance-sidebar .sim-metric').length).toBeGreaterThan(
        1,
      );

      await user.click(screen.getByRole('button', { name: 'Ajouter un contrat' }));
      await user.click(await screen.findByRole('button', { name: 'Terminer' }));
      expect(screen.getByText('Comparer')).toBeInTheDocument();
      expect(screen.getByText('Cumuler')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Ajouter un contrat' }));
      await user.click(await screen.findByRole('button', { name: 'Terminer' }));

      await waitFor(() => {
        expect(screen.getAllByRole('heading', { name: /Contrat [123]/i })).toHaveLength(3);
      });
    },
    PREVOYANCE_PAGE_TEST_TIMEOUT_MS,
  );

  it(
    'borne les contrats à trois',
    async () => {
      const user = userEvent.setup();
      renderPrevoyancePage();

      await creerTroisContrats(user);

      expect(screen.getByRole('button', { name: 'Ajouter un contrat' })).toBeDisabled();
    },
    PREVOYANCE_PAGE_TEST_TIMEOUT_MS,
  );
});
