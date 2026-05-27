// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTrackedObjectURL } from '@/utils/export/createTrackedObjectURL';
import { createEmptyDossier } from '../types';
import {
  clearDraftFromSession,
  exportDossierToFile,
  importDossierFromFile,
  loadDraftFromSession,
  saveDraftToSession,
} from './storage';

vi.mock('@/utils/export/createTrackedObjectURL', () => ({
  createTrackedObjectURL: vi.fn(() => 'blob:audit-test'),
}));

const SESSION_STORAGE_KEY = 'ser1_audit_draft';

describe('storage audit', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
    vi.stubGlobal('URL', {
      ...URL,
      revokeObjectURL: vi.fn(),
    });
  });

  it('sauvegarde, recharge puis efface le brouillon de session', () => {
    const dossier = createEmptyDossier();
    dossier.situationFamiliale.mr.prenom = 'Jeanne';

    saveDraftToSession(dossier);

    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull();
    expect(loadDraftFromSession()).toMatchObject({
      situationFamiliale: {
        mr: {
          prenom: 'Jeanne',
        },
      },
    });

    clearDraftFromSession();

    expect(loadDraftFromSession()).toBeNull();
  });

  it('exporte un JSON local avec le nom fourni', () => {
    const dossier = createEmptyDossier();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    exportDossierToFile(dossier, 'audit-test.json');

    expect(createTrackedObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:audit-test');

    click.mockRestore();
  });

  it('importe un export JSON valide et rejette un fichier invalide', async () => {
    const dossier = createEmptyDossier();
    dossier.situationFamiliale.mr.nom = 'Martin';

    const imported = await importDossierFromFile(
      new File([JSON.stringify(dossier)], 'audit.json', { type: 'application/json' }),
    );

    expect(imported.situationFamiliale.mr.nom).toBe('Martin');
    expect(imported.dateModification).not.toBe(dossier.dateModification);

    await expect(
      importDossierFromFile(new File(['{"id":"incomplet"}'], 'audit.json')),
    ).rejects.toThrow(
      "Impossible de lire le fichier. Vérifiez qu'il s'agit d'un export audit valide.",
    );
  });
});
