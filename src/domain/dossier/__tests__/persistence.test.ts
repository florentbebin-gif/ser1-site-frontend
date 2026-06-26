import { describe, expect, it } from 'vitest';
import { buildDossierPatrimonialFromAudit } from '../auditAdapter';
import {
  DOSSIERS_PATRIMONIAUX_TABLE,
  fromDossierPatrimonialRow,
  toDossierPatrimonialUpsertRow,
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

    const row = toDossierPatrimonialUpsertRow(dossier, 'user-1');

    expect(DOSSIERS_PATRIMONIAUX_TABLE).toBe('dossiers_patrimoniaux');
    expect(row).toMatchObject({
      id: 'audit-1',
      user_id: 'user-1',
      title: 'Foyer Martin',
      status: 'draft',
      completion_status: 'complete',
      source_refs: dossier.sourceRefs,
    });
    expect(row).not.toHaveProperty('created_at');
    expect(row).not.toHaveProperty('updated_at');
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
    expect(row.data).not.toHaveProperty('completion');
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

    const restored = fromDossierPatrimonialRow({
      ...toDossierPatrimonialUpsertRow(dossier, 'user-1'),
      created_at: '2026-06-07T10:00:00.000Z',
      updated_at: '2026-06-07T10:01:00.000Z',
    });

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

  it('normalise les anciennes valeurs DDV dans le payload Supabase', () => {
    const audit = createEmptyDossier();
    audit.id = 'audit-legacy-ddv';
    audit.situationFamiliale.mr.prenom = 'Alice';
    audit.situationFamiliale.mr.nom = 'Martin';
    audit.situationFamiliale.mr.dateNaissance = '1980-01-01';
    audit.objectifs = ['developper_patrimoine'];
    audit.situationCivile.donationDernierVivantMr = true;
    const dossier = buildDossierPatrimonialFromAudit(audit, {
      ownerUserId: 'user-1',
      now: '2026-06-07T10:00:00.000Z',
    });
    const row = toDossierPatrimonialUpsertRow(dossier, 'user-1');
    row.data.regimeMatrimonial = {
      contratMariage: false,
      donationDernierVivantMr: true,
      donationDernierVivantMme: true,
      ddvOptionMr: 'quotite_disponible_pp',
      ddvOptionMme: 'mixte_quart_pp_trois_quarts_us',
      sourceRefIds: [],
    } as unknown as typeof row.data.regimeMatrimonial;

    const restored = fromDossierPatrimonialRow({
      ...row,
      created_at: '2026-06-07T10:00:00.000Z',
      updated_at: '2026-06-07T10:01:00.000Z',
    });

    expect(restored.regimeMatrimonial).toMatchObject({
      ddvOptionMr: 'pleine_propriete_quotite',
      ddvOptionMme: 'mixte',
    });
  });

  it('refuse une ligne Supabase dont la colonne de complétude diverge du modèle', () => {
    const audit = createEmptyDossier();
    audit.id = 'audit-3';
    audit.situationFamiliale.mr.prenom = 'Alice';
    audit.situationFamiliale.mr.nom = 'Martin';
    audit.situationFamiliale.mr.dateNaissance = '1980-01-01';
    audit.objectifs = ['developper_patrimoine'];
    const dossier = buildDossierPatrimonialFromAudit(audit, {
      ownerUserId: 'user-1',
      now: '2026-06-07T10:00:00.000Z',
    });

    expect(() =>
      fromDossierPatrimonialRow({
        ...toDossierPatrimonialUpsertRow(dossier, 'user-1'),
        completion_status: 'partial',
        created_at: '2026-06-07T10:00:00.000Z',
        updated_at: '2026-06-07T10:01:00.000Z',
      }),
    ).toThrow('Complétude dossier incohérente');
  });
});
