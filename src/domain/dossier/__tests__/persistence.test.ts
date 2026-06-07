import { describe, expect, it } from 'vitest';
import { buildDossierPatrimonialFromAudit } from '../auditAdapter';
import {
  DOSSIERS_PATRIMONIAUX_TABLE,
  fromDossierPatrimonialRow,
  toDossierPatrimonialRow,
} from '../persistence';
import { createEmptyDossier } from '@/domain/audit/types';

describe('persistence dossier patrimonial', () => {
  it('sérialise le dossier central vers la table Supabase dédiée', () => {
    const audit = createEmptyDossier();
    audit.id = 'audit-1';
    audit.situationFamiliale.mr.prenom = 'Alice';
    audit.situationFamiliale.mr.nom = 'Martin';
    audit.situationFamiliale.mr.dateNaissance = '1980-01-01';
    audit.objectifs = ['developper_patrimoine'];

    const dossier = buildDossierPatrimonialFromAudit(audit, {
      ownerUserId: 'user-1',
      now: '2026-06-07T10:00:00.000Z',
    });

    const row = toDossierPatrimonialRow(dossier, 'user-1');

    expect(DOSSIERS_PATRIMONIAUX_TABLE).toBe('dossiers_patrimoniaux');
    expect(row).toMatchObject({
      id: 'audit-1',
      user_id: 'user-1',
      title: 'Foyer Martin',
      status: 'draft',
      completion_status: 'complete',
      source_refs: dossier.sourceRefs,
    });
    expect(row.data).toMatchObject({
      foyer: {
        label: 'Foyer Martin',
      },
      membres: expect.arrayContaining([
        expect.objectContaining({
          prenom: 'Alice',
          nom: 'Martin',
        }),
      ]),
      objectifs: expect.arrayContaining([
        expect.objectContaining({
          code: 'developper_patrimoine',
        }),
      ]),
    });
  });

  it('désérialise une ligne Supabase en dossier central typé', () => {
    const audit = createEmptyDossier();
    audit.id = 'audit-2';
    audit.situationFamiliale.mr.prenom = 'Alice';
    audit.situationFamiliale.mr.nom = 'Martin';
    audit.situationFamiliale.mr.dateNaissance = '1980-01-01';
    audit.objectifs = ['developper_patrimoine'];
    const dossier = buildDossierPatrimonialFromAudit(audit, {
      ownerUserId: 'user-1',
      now: '2026-06-07T10:00:00.000Z',
    });

    const restored = fromDossierPatrimonialRow(toDossierPatrimonialRow(dossier, 'user-1'));

    expect(restored).toMatchObject({
      id: 'audit-2',
      ownerUserId: 'user-1',
      foyer: {
        label: 'Foyer Martin',
      },
      completion: {
        status: 'complete',
      },
    });
  });
});
