// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { triggerPageReset } from '@/utils/reset';
import {
  PREVOYANCE_PAGE_TEST_TIMEOUT_MS,
  choisirRegime,
  renderPrevoyancePage,
  resetPrevoyanceStorage,
  saisirDateNaissance,
} from './PrevoyancePage.testUtils';

describe('PrevoyancePage - parcours', () => {
  beforeEach(resetPrevoyanceStorage);

  it(
    'affiche le parcours salarié sans frais généraux après choix du régime',
    async () => {
      const user = userEvent.setup();
      renderPrevoyancePage();

      expect(
        await screen.findByText('Choix du régime obligatoire et des ayants droit'),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Enfants')).toHaveValue(null);
      expect(screen.queryByText('Parcours')).toBeNull();
      expect(screen.queryByRole('radio', { name: 'Salarié' })).toBeNull();
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /Artisan \/ commerçant — SSI/i }),
        ).toBeInTheDocument(),
      );
      expect(screen.getByLabelText('Revenu imposable à couvrir')).toHaveValue('');
      await choisirRegime(user, /Salarié secteur privé — CPAM/i);
      await waitFor(() => expect(screen.getByLabelText('Salaire brut annuel')).toHaveValue(''));
      expect(
        screen.queryByText('Garanties souscrites hors régime obligatoire'),
      ).not.toBeInTheDocument();
      await saisirDateNaissance(user);
      expect(screen.getByRole('button', { name: 'Ajouter un contrat' })).toHaveClass(
        'sim-action-btn--add',
      );
      expect(screen.queryByText('Comparer')).not.toBeInTheDocument();
      expect(screen.queryByText('Frais généraux')).toBeNull();
      expect(screen.getByRole('heading', { name: 'Cotisation' })).toBeInTheDocument();
      expect(screen.getAllByText('RO').length).toBeGreaterThan(0);
      expect(screen.getByText('empl')).toBeInTheDocument();
    },
    PREVOYANCE_PAGE_TEST_TIMEOUT_MS,
  );

  it(
    'masque les options TNS dans l’édition d’un contrat salarié',
    async () => {
      const user = userEvent.setup();
      renderPrevoyancePage();

      await choisirRegime(user, /Salarié secteur privé — CPAM/i);
      await saisirDateNaissance(user);
      await user.click(screen.getByRole('button', { name: /Modifier Contrat 1/i }));
      expect(screen.queryByRole('button', { name: 'Frais généraux' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Acte juridique' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Ajouter une période arrêt de travail au contrat 1' }),
      ).toHaveClass('sim-action-btn--add');
      await user.click(screen.getByRole('button', { name: 'Invalidité' }));
      expect(
        screen.getByRole('button', { name: 'Ajouter un seuil invalidité au contrat 1' }),
      ).toHaveClass('sim-action-btn--add');
      await user.click(screen.getByRole('button', { name: 'Acte juridique' }));
      expect(screen.getAllByText('Acte juridique').length).toBeGreaterThan(0);
      await user.click(screen.getByRole('button', { name: 'Fermer' }));
      await user.click(screen.getByRole('button', { name: /Salarié secteur privé — CPAM/i }));
      expect(screen.getByText('Salarié agricole — MSA')).toBeInTheDocument();
      expect(screen.queryByText('MSA salariés')).not.toBeInTheDocument();
    },
    PREVOYANCE_PAGE_TEST_TIMEOUT_MS,
  );

  it(
    'réinitialise le parcours prévoyance',
    async () => {
      const user = userEvent.setup();
      renderPrevoyancePage();

      await choisirRegime(user, /Salarié secteur privé — CPAM/i);
      await waitFor(() => expect(screen.getByLabelText('Salaire brut annuel')).toBeInTheDocument());
      act(() => {
        triggerPageReset('prevoyance');
      });
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /Artisan \/ commerçant — SSI/i }),
        ).toBeInTheDocument(),
      );
      expect(screen.getByLabelText('Revenu imposable à couvrir')).toBeInTheDocument();
    },
    PREVOYANCE_PAGE_TEST_TIMEOUT_MS,
  );

  it('affiche les repères header, un état vide utile et les hypothèses avant saisie complète', async () => {
    renderPrevoyancePage();

    expect(await screen.findByText('Mode expert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mode expert indisponible/i })).toBeDisabled();
    expect(
      screen.getByText(
        'Renseignez le régime et la date de naissance pour afficher la synthèse de garanties.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Arrêt de travail' })).toBeNull();
    expect(screen.getByRole('button', { name: /HYPOTHÈSES ET LIMITES/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: /Hypothèses et limites/i })).toHaveClass(
      'sim-disclosure-btn',
    );
  });
});
