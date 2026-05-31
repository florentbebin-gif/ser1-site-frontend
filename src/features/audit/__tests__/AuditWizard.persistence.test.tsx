// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { triggerPageReset } from '@/utils/reset';
import AuditWizard from '../AuditWizard';
import { createEmptyDossier } from '@/domain/audit/types';

vi.mock('@/settings/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {},
  }),
}));

const SESSION_STORAGE_KEY = 'ser1_audit_draft';

describe('AuditWizard persistance session', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('charge un brouillon depuis la session et sauvegarde les modifications', async () => {
    const draft = createEmptyDossier();
    draft.situationFamiliale.mr.prenom = 'Jeanne';
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(draft));

    render(<AuditWizard />);

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
});
