// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { triggerPageReset } from '@/utils/reset';
import AuditWizard from '../AuditWizard';
import { createEmptyDossier } from '@/domain/audit/types';
import { createEmptyDossierPatrimonial } from '@/domain/dossier';

const loadLatestDossierMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useDossierPatrimonialPersistence', () => ({
  useDossierPatrimonialPersistence: () => ({
    ownerUserId: 'user-1',
    saving: false,
    loading: false,
    lastSavedAt: null,
    lastLoadedAt: '2026-06-07T10:00:00.000Z',
    currentDossier: null,
    error: null,
    saveDossier: vi.fn(),
    loadDossier: vi.fn(),
    loadLatestDossier: loadLatestDossierMock,
    listDossiers: vi.fn(),
  }),
}));

vi.mock('@/settings/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {},
  }),
}));

const SESSION_STORAGE_KEY = 'ser1_audit_draft';

describe('AuditWizard persistance session', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
    loadLatestDossierMock.mockResolvedValue({ ok: false, reason: 'not-found' });
  });

  it('charge un brouillon depuis la session et sauvegarde les modifications', async () => {
    const draft = createEmptyDossier();
    draft.situationFamiliale.mr.prenom = 'Jeanne';
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(draft));

    render(<AuditWizard />);

    expect(screen.getByTestId('audit-dossier-central-status')).toHaveTextContent(
      'Dossier central : partiel',
    );
    expect(screen.getByLabelText('Prénom')).toHaveValue('Jeanne');

    await userEvent.clear(screen.getByLabelText('Prénom'));
    await userEvent.type(screen.getByLabelText('Prénom'), 'Alice');

    expect(screen.getByRole('status')).toHaveTextContent('Modifications non exportées');
    await waitFor(() => {
      expect(JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY) ?? '{}')).toMatchObject({
        situationFamiliale: {
          mr: {
            prenom: 'Alice',
          },
        },
      });
    });
  });

  it('garde le brouillon de session prioritaire sur le dossier central relu', async () => {
    const draft = createEmptyDossier();
    draft.situationFamiliale.mr.prenom = 'Jeanne';
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(draft));
    const dossierCentral = createEmptyDossierPatrimonial({
      id: '00000000-0000-4000-8000-000000000006',
      ownerUserId: 'user-1',
      now: '2026-06-07T10:00:00.000Z',
    });
    dossierCentral.membres.push({
      id: 'membre-central',
      role: 'client',
      prenom: 'Clara',
      nom: 'Durand',
      dateNaissance: '1975-04-12',
      sourceRefIds: [],
    });
    dossierCentral.foyer.membrePrincipalId = 'membre-central';
    dossierCentral.objectifs.push({
      id: 'objectif-central',
      code: 'preparer_transmission',
      label: 'Préparer la transmission',
      priority: 1,
      sourceRefIds: [],
    });
    loadLatestDossierMock.mockResolvedValue({
      ok: true,
      dossier: dossierCentral,
    });

    render(<AuditWizard />);

    expect(screen.getByLabelText('Prénom')).toHaveValue('Jeanne');
    await waitFor(() => expect(loadLatestDossierMock).not.toHaveBeenCalled());
  });

  it('réinitialise le brouillon audit via l’événement global ciblé', async () => {
    const draft = createEmptyDossier();
    draft.situationFamiliale.mr.prenom = 'Jeanne';
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(draft));

    render(<AuditWizard />);

    expect(screen.getByLabelText('Prénom')).toHaveValue('Jeanne');

    triggerPageReset('audit');

    await waitFor(() => expect(screen.getByLabelText('Prénom')).toHaveValue(''));
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('hydrate le brouillon Audit depuis un dossier central relu', async () => {
    const dossierCentral = createEmptyDossierPatrimonial({
      id: '00000000-0000-4000-8000-000000000005',
      ownerUserId: 'user-1',
      now: '2026-06-07T10:00:00.000Z',
    });
    dossierCentral.membres.push({
      id: 'membre-central',
      role: 'client',
      prenom: 'Clara',
      nom: 'Durand',
      dateNaissance: '1975-04-12',
      sourceRefIds: [],
    });
    dossierCentral.foyer.membrePrincipalId = 'membre-central';
    dossierCentral.foyer.label = 'Foyer Durand';
    dossierCentral.objectifs.push({
      id: 'objectif-central',
      code: 'preparer_transmission',
      label: 'Préparer la transmission',
      priority: 1,
      sourceRefIds: [],
    });
    loadLatestDossierMock.mockResolvedValue({
      ok: true,
      dossier: dossierCentral,
    });

    render(<AuditWizard />);

    await waitFor(() => expect(screen.getByLabelText('Prénom')).toHaveValue('Clara'));
    expect(screen.getByLabelText('Nom')).toHaveValue('Durand');
    expect(screen.getByTestId('audit-dossier-central-status')).toHaveTextContent(
      'Dossier central : complet · chargé',
    );
  });
});
