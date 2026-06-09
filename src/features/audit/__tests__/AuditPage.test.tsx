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

  it('affiche d’abord la landing 3 cartes, pas le formulaire', () => {
    render(<AuditPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Audit patrimonial' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Synthèse dossier' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Situation familiale' })).not.toBeInTheDocument();
  });

  it('bascule vers le wizard puis revient à la synthèse', async () => {
    render(<AuditPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Saisir le membre principal' }));

    expect(screen.getByRole('heading', { name: 'Situation familiale' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '← Synthèse du dossier' }));

    expect(screen.getByRole('heading', { level: 2, name: 'Synthèse dossier' })).toBeInTheDocument();
  });

  it('ouvre directement l’étape Objectifs depuis la carte Objectifs', async () => {
    render(<AuditPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Ajouter des objectifs' }));

    expect(screen.getByRole('heading', { name: 'Objectifs client' })).toBeInTheDocument();
  });
});
