// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AuditWizard from '../AuditWizard';
import { exportDossierToFile, importDossierFromFile } from '../utils/storage';

vi.mock('../../../settings/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {},
  }),
}));

vi.mock('../utils/storage', async () => {
  const actual = await vi.importActual('../utils/storage');
  return {
    ...(actual as Record<string, unknown>),
    exportDossierToFile: vi.fn(),
    importDossierFromFile: vi.fn(),
  };
});

const exportDossierToFileMock = vi.mocked(exportDossierToFile);
const importDossierFromFileMock = vi.mocked(importDossierFromFile);

describe('AuditWizard import/export JSON', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
    window.history.pushState({}, '', '/audit');
  });

  it('exporte le dossier courant via l’événement global ser1:save', async () => {
    render(<AuditWizard />);

    await userEvent.type(screen.getByLabelText('Prénom'), 'Alice');
    window.dispatchEvent(new Event('ser1:save'));

    await waitFor(() => expect(exportDossierToFileMock).toHaveBeenCalledTimes(1));
    expect(exportDossierToFileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        situationFamiliale: expect.objectContaining({
          mr: expect.objectContaining({
            prenom: 'Alice',
          }),
        }),
      }),
    );
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });

  it('ouvre le sélecteur de fichier via ser1:load et affiche l’erreur de format invalide', async () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const file = new File(['{}'], 'audit.json', { type: 'application/json' });
    importDossierFromFileMock.mockRejectedValue(new Error('Format invalide'));

    render(<AuditWizard />);

    window.dispatchEvent(new Event('ser1:load'));

    expect(click).toHaveBeenCalledTimes(1);

    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { files: [file] } });

    await waitFor(() => expect(importDossierFromFileMock).toHaveBeenCalledWith(file));
    await waitFor(() => expect(alert).toHaveBeenCalledWith('Format invalide'));

    click.mockRestore();
    alert.mockRestore();
  });
});
