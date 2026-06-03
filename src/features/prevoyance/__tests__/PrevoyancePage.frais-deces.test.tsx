// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  PREVOYANCE_PAGE_TEST_TIMEOUT_MS,
  renderPrevoyancePage,
  resetPrevoyanceStorage,
  saisirDateNaissance,
} from './PrevoyancePage.testUtils';

describe('PrevoyancePage - frais et décès', () => {
  beforeEach(resetPrevoyanceStorage);

  it(
    'ouvre la modale d’estimation des frais généraux sans écraser la garantie',
    async () => {
      const user = userEvent.setup();
      renderPrevoyancePage();

      await saisirDateNaissance(user);
      expect((await screen.findAllByText('Frais généraux')).length).toBeGreaterThan(0);
      await user.click(screen.getByRole('button', { name: /Modifier Contrat 1/i }));
      await user.click(await screen.findByRole('button', { name: 'Frais généraux' }));
      expect(screen.queryByRole('radio', { name: 'Indemnitaire' })).toBeNull();
      expect(screen.queryByRole('radio', { name: 'Forfaitaire' })).toBeNull();
      fireEvent.change(screen.getByLabelText('Montant mensuel frais généraux'), {
        target: { value: '12000' },
      });
      await user.click(
        screen.getByRole('button', { name: /Estimer l’assiette depuis un compte de résultat/i }),
      );

      expect(
        await screen.findByText(
          'Estimation de l’assiette de charges permanentes à maintenir pendant l’arrêt du dirigeant.',
        ),
      ).toBeInTheDocument();
      expect(screen.getByText('Locaux, matériel et véhicules')).toBeInTheDocument();
      expect(screen.getByText('Exploitation et gestion courante')).toBeInTheDocument();
      expect(screen.getByText('Personnel et remplacement')).toBeInTheDocument();
      expect(screen.getByText('Assurances, cotisations et taxes')).toBeInTheDocument();
      expect(screen.getByText('Frais financiers')).toBeInTheDocument();
      expect(screen.getByText('Amortissements et pertes prévues')).toBeInTheDocument();
      expect(screen.getByText(/Comptes indicatifs : 612, 613/)).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText('Locaux, matériel et véhicules'), {
        target: { value: '5000' },
      });
      expect(screen.getByRole('button', { name: 'Valider' })).toHaveClass('sim-modal-btn--primary');
      await user.click(screen.getByRole('button', { name: 'Valider' }));
      expect(screen.getByLabelText('Montant mensuel frais généraux')).toHaveValue('12\u202f000');

      await user.click(screen.getByRole('button', { name: 'Fermer' }));
      await user.click(screen.getByRole('button', { name: 'Ajouter un contrat' }));
      await user.click(await screen.findByRole('button', { name: 'Frais généraux' }));
      await user.click(
        screen.getByRole('button', { name: /Estimer l’assiette depuis un compte de résultat/i }),
      );
      expect(await screen.findByLabelText('Locaux, matériel et véhicules')).toHaveValue(
        '5\u202f000',
      );
    },
    PREVOYANCE_PAGE_TEST_TIMEOUT_MS,
  );

  it('affiche les grands montants dans le besoin décès', async () => {
    const user = userEvent.setup();
    renderPrevoyancePage();

    await saisirDateNaissance(user);
    fireEvent.change(screen.getByLabelText('Revenu imposable à couvrir'), {
      target: { value: '80000' },
    });
    const besoinInput = screen.getByLabelText('Besoin à couvrir');
    expect(screen.queryByRole('button', { name: 'x1' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'x3' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'x5' })).toBeNull();
    expect(besoinInput).toHaveValue('240\u202f000');
    fireEvent.change(besoinInput, { target: { value: '99999999' } });

    expect(besoinInput).toHaveValue('99\u202f999\u202f999');
  });

  it(
    'affiche le capital décès même avec les rentes conjoint et éducation',
    async () => {
      const user = userEvent.setup();
      renderPrevoyancePage();

      await user.click(await screen.findByRole('button', { name: 'Célibataire' }));
      await user.click(await screen.findByRole('option', { name: 'Marié' }));
      fireEvent.change(screen.getByLabelText('Enfants'), { target: { value: '2' } });
      await saisirDateNaissance(user);
      await user.click(screen.getByRole('button', { name: /Modifier Contrat 1/i }));
      await user.click(await screen.findByRole('button', { name: 'Décès' }));
      const decesInputs = document.querySelectorAll<HTMLInputElement>(
        '.prevoyance-mini-section .sim-field__control',
      );
      fireEvent.change(decesInputs[0] as HTMLInputElement, { target: { value: '250000' } });
      fireEvent.change(decesInputs[1] as HTMLInputElement, { target: { value: '12000' } });
      fireEvent.change(decesInputs[2] as HTMLInputElement, { target: { value: '8000' } });
      await user.click(screen.getByRole('button', { name: 'Fermer' }));

      const decesCard = screen.getByRole('heading', { name: 'Décès' }).closest('section');
      expect(decesCard).not.toBeNull();
      const deces = within(decesCard as HTMLElement);
      const decesText = decesCard?.textContent?.replace(/\s/g, ' ') ?? '';
      expect(decesText).toContain('Contrat 1 · Capital');
      expect(decesText).toContain('250 000 €');
      expect(deces.getByText('Rente conjoint')).toBeInTheDocument();
      expect(decesText).toContain('12 000 €');
      expect(deces.getByText('Rente éducation')).toBeInTheDocument();
      expect(decesText).toContain('8 000 €');
    },
    PREVOYANCE_PAGE_TEST_TIMEOUT_MS,
  );
});
