import { describe, expect, it } from 'vitest';
import {
  createEmptyDossierPatrimonial,
  DOSSIER_PATRIMONIAL_COMPLETION_LABELS,
  evaluateDossierPatrimonialCompletion,
} from '../patrimonial';

describe('DossierPatrimonial', () => {
  it('crée un dossier central vide avec complétude à compléter', () => {
    const dossier = createEmptyDossierPatrimonial({
      id: 'dossier-1',
      ownerUserId: 'user-1',
      now: '2026-06-07T10:00:00.000Z',
    });

    expect(dossier).toMatchObject({
      id: 'dossier-1',
      ownerUserId: 'user-1',
      foyer: {
        id: 'foyer-dossier-1',
        label: 'Foyer patrimonial',
        membrePrincipalId: null,
      },
      membres: [],
      situationFamiliale: {
        statut: 'celibataire',
        nombreEnfants: 0,
      },
      regimeMatrimonial: null,
      objectifs: [],
      contraintes: [],
      operationsPrevues: [],
      sourceRefs: [],
      createdAt: '2026-06-07T10:00:00.000Z',
      updatedAt: '2026-06-07T10:00:00.000Z',
    });
    expect(dossier.completion.status).toBe('empty');
    expect(dossier.completion.scope).toBe('f1_core');
    expect(DOSSIER_PATRIMONIAL_COMPLETION_LABELS[dossier.completion.status]).toBe('à compléter');
  });

  it('évalue la complétude sans dépendre de settings fiscaux', () => {
    const dossier = createEmptyDossierPatrimonial({
      id: 'dossier-2',
      now: '2026-06-07T10:00:00.000Z',
    });
    dossier.membres.push({
      id: 'membre-principal',
      role: 'client',
      prenom: 'Alice',
      nom: 'Martin',
      dateNaissance: '1980-01-01',
      sourceRefIds: [],
    });
    dossier.foyer.membrePrincipalId = 'membre-principal';
    dossier.objectifs.push({
      id: 'objectif-1',
      code: 'preparer_transmission',
      label: 'Préparer la transmission',
      priority: 1,
      sourceRefIds: [],
    });

    const completion = evaluateDossierPatrimonialCompletion(dossier, {
      now: '2026-06-07T10:01:00.000Z',
    });

    expect(completion).toEqual({
      scope: 'f1_core',
      status: 'complete',
      missingRequiredFields: [],
      updatedAt: '2026-06-07T10:01:00.000Z',
    });
  });
});
