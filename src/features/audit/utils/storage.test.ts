// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTrackedObjectURL } from '@/utils/export/createTrackedObjectURL';
import { createEmptyDossier } from '@/domain/audit/types';
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
const EXPORT_DATE = new Date('2026-06-20T08:04:49.096Z');
const IMPORT_DATE = new Date('2026-06-20T08:04:50.096Z');

describe('storage audit', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
    vi.stubGlobal('URL', {
      ...URL,
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
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
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(EXPORT_DATE);

    const dossier = createEmptyDossier();
    dossier.situationFamiliale.mr.nom = 'Martin';

    vi.setSystemTime(IMPORT_DATE);

    const imported = await importDossierFromFile(
      new File([JSON.stringify(dossier)], 'audit.json', { type: 'application/json' }),
    );

    expect(imported.situationFamiliale.mr.nom).toBe('Martin');
    expect(imported.dateModification).toBe(IMPORT_DATE.toISOString());
    expect(imported.dateModification).not.toBe(dossier.dateModification);

    await expect(
      importDossierFromFile(new File(['{"id":"incomplet"}'], 'audit.json')),
    ).rejects.toThrow(
      "Impossible de lire le fichier. Vérifiez qu'il s'agit d'un export audit valide.",
    );
  });
});
