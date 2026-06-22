// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
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

  it('bascule vers le wizard puis revient à la synthèse', async () => {
    render(<AuditPage />);

    await userEvent.click(screen.getByRole('button', { name: /^Commencer par le client/ }));

    expect(screen.getByRole('heading', { name: 'Situation familiale' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '← Synthèse du dossier' }));

    expect(
      screen.getByRole('heading', { level: 2, name: 'Nouvelle analyse patrimoniale' }),
    ).toBeInTheDocument();
  });

  it('ne propose pas l’étape Objectifs avant le démarrage du dossier', () => {
    render(<AuditPage />);

    expect(screen.queryByRole('button', { name: /^Définir les objectifs client/ })).toBeNull();
  });
});
