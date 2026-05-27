// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  PREVOYANCE_PAGE_TEST_TIMEOUT_MS,
  ouvrirDecoupageArret,
  renderPrevoyancePage,
  resetPrevoyanceStorage,
  saisirDateNaissance,
} from './PrevoyancePage.testUtils';

describe('PrevoyancePage - arrêt et invalidité', () => {
  beforeEach(resetPrevoyanceStorage);

  it(
    'ouvre le découpage arrêt depuis l’édition du contrat',
    async () => {
      const user = userEvent.setup();
      renderPrevoyancePage();

      await saisirDateNaissance(user);
      await ouvrirDecoupageArret(user);

      await user.click(screen.getByRole('button', { name: /Ajouter une période/i }));
      const periodInputs = document.querySelectorAll<HTMLInputElement>(
        '.prevoyance-period-row input',
      );
      expect(periodInputs).toHaveLength(6);

      fireEvent.change(periodInputs[1], { target: { value: '90' } });
      expect(periodInputs[3]).toHaveValue(91);

      fireEvent.change(periodInputs[3], { target: { value: '31' } });
      expect(periodInputs[1]).toHaveValue(30);
    },
    PREVOYANCE_PAGE_TEST_TIMEOUT_MS,
  );

  it(
    'verrouille la dernière période arrêt à 1 095 jours',
    async () => {
      const user = userEvent.setup();
      renderPrevoyancePage();

      await saisirDateNaissance(user);
      await ouvrirDecoupageArret(user);
      await user.click(screen.getByRole('button', { name: /Ajouter une période/i }));

      await user.click(screen.getByRole('button', { name: /Ajouter une période/i }));
      const threePeriodInputs = document.querySelectorAll<HTMLInputElement>(
        '.prevoyance-period-row input',
      );
      expect(threePeriodInputs).toHaveLength(9);

      fireEvent.change(threePeriodInputs[6] as HTMLInputElement, { target: { value: '3' } });
      expect(threePeriodInputs[6]).toHaveValue(3);

      fireEvent.change(threePeriodInputs[6] as HTMLInputElement, { target: { value: '365' } });
      expect(threePeriodInputs[4]).toHaveValue(364);
      expect(threePeriodInputs[6]).toHaveValue(365);
      expect(threePeriodInputs[7]).toHaveValue(1095);
      expect(threePeriodInputs[7]).toBeDisabled();
      expect(threePeriodInputs[7]).toHaveAttribute('title', 'Verrouillée à 1 095 jours');
    },
    PREVOYANCE_PAGE_TEST_TIMEOUT_MS,
  );

  it(
    'permet de supprimer un palier invalidité ajouté',
    async () => {
      const user = userEvent.setup();
      renderPrevoyancePage();

      await saisirDateNaissance(user);
      await user.click(screen.getByRole('button', { name: /Modifier Contrat 1/i }));
      await user.click(await screen.findByRole('button', { name: 'Invalidité' }));
      await user.click(screen.getByRole('radio', { name: 'Forfaitaire' }));
      expect(screen.getByRole('radio', { name: 'Forfaitaire' })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      await user.click(
        await screen.findByRole('button', {
          name: 'Ajouter un palier invalidité au contrat 1',
        }),
      );

      expect(
        screen.getAllByRole('button', { name: /Supprimer le palier invalidité/i }),
      ).toHaveLength(2);
      expect(
        screen.getAllByRole('button', { name: /Supprimer le palier invalidité/i })[0],
      ).toHaveClass('sim-action-btn--delete');

      await user.click(
        screen.getAllByRole('button', { name: /Supprimer le palier invalidité/i })[0],
      );

      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: /Supprimer le palier invalidité/i }),
        ).toBeNull();
      });

      await user.click(screen.getByRole('button', { name: 'Arrêt de travail' }));
      expect(screen.getByRole('radio', { name: 'Indemnitaire' })).toHaveAttribute(
        'aria-checked',
        'true',
      );
    },
    PREVOYANCE_PAGE_TEST_TIMEOUT_MS,
  );
});
