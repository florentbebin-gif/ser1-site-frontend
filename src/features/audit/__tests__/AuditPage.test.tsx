// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AuditPage from '../AuditPage';

vi.mock('@/settings/ThemeProvider', () => ({
  useTheme: () => ({ colors: {} }),
}));

vi.mock('@/hooks/useDossierPatrimonialPersistence', () => ({
  useDossierPatrimonialPersistence: () => ({
    ownerUserId: null,
    saving: false,
    loading: false,
    lastSavedAt: null,
    lastLoadedAt: null,
    currentDossier: null,
    error: null,
    saveDossier: vi.fn(),
    loadDossier: vi.fn(),
    loadLatestDossier: vi.fn().mockResolvedValue({ ok: false, reason: 'missing-user' }),
    listDossiers: vi.fn(),
  }),
}));

describe('AuditPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('affiche d’abord l’état nouvelle analyse, pas le formulaire', () => {
    render(<AuditPage />);

    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Nouvelle analyse patrimoniale' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: 'Points à confirmer' })).toBeNull();
    expect(screen.queryByRole('heading', { level: 2, name: 'Objectifs' })).toBeNull();
    expect(screen.queryByRole('heading', { level: 2, name: 'Stratégie' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Situation familiale' })).not.toBeInTheDocument();
  });

  it('ouvre la page Foyer & famille sans wizard puis revient par le rail', async () => {
    render(<AuditPage />);

    await userEvent.click(screen.getByRole('button', { name: /^Commencer par le client/ }));

    expect(screen.getByRole('heading', { level: 1, name: 'Foyer & famille' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Situation familiale' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Filiation' })).toBeInTheDocument();
    expect(screen.queryByText(/Étape\s+1\s+sur\s+6/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Précédent/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Suivant/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Dossier/ }));

    expect(
      screen.getByRole('heading', { level: 2, name: 'Nouvelle analyse patrimoniale' }),
    ).toBeInTheDocument();
  });

  it('rend chaque page cockpit atteignable depuis le rail gauche', async () => {
    render(<AuditPage />);

    await userEvent.click(screen.getByRole('button', { name: /Situation familiale/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'Foyer & famille' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Actifs — Inventaire déclaratif/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'Actifs / passifs' })).toBeInTheDocument();
    expect(screen.getByText(/données partielles/)).toBeInTheDocument();
    expect(screen.queryByText(/patrimoine net/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Fiscalité — Déclaratif/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'Fiscalité' })).toBeInTheDocument();
    expect(screen.getByText(/sans calcul IR runtime depuis \/audit/i)).toBeInTheDocument();
    expect(screen.queryByText(/TMI calculée/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Objectifs/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'Objectifs' })).toBeInTheDocument();
    expect(screen.queryByText(/stratégie activable/i)).not.toBeInTheDocument();
  });

  it('ouvre un drawer canonique depuis une carte F1', async () => {
    render(<AuditPage />);

    await userEvent.click(screen.getByRole('button', { name: /^Commencer par le client/ }));
    await userEvent.click(screen.getAllByRole('button', { name: 'Compléter' })[0]!);

    expect(screen.getByRole('dialog', { name: 'Situation familiale' })).toHaveClass(
      'sim-drawer',
      'sim-drawer--xl',
    );
  });

  it('boucle le focus clavier dans le drawer et restaure le focus à la fermeture', async () => {
    render(<AuditPage />);

    await userEvent.click(screen.getByRole('button', { name: /^Commencer par le client/ }));
    const opener = screen.getAllByRole('button', { name: 'Compléter' })[0]!;
    await userEvent.click(opener);

    const closeButton = screen.getByRole('button', { name: 'Fermer' });
    await waitFor(() => expect(closeButton).toHaveFocus());

    await userEvent.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toHaveFocus();

    await userEvent.tab();
    expect(closeButton).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });

  it('ne propose pas l’étape Objectifs avant le démarrage du dossier', () => {
    render(<AuditPage />);

    expect(screen.queryByRole('button', { name: /^Définir les objectifs client/ })).toBeNull();
  });
});
