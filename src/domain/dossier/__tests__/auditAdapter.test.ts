import { describe, expect, it } from 'vitest';
import { createEmptyDossier } from '@/domain/audit/types';
import {
  buildDossierPatrimonialFromAudit,
  mergeDossierPatrimonialIntoAuditDraft,
} from '../auditAdapter';

describe('buildDossierPatrimonialFromAudit', () => {
  it('projette le brouillon Audit dans le socle dossier central', () => {
    const audit = createEmptyDossier();
    audit.id = 'audit-1';
    audit.dateCreation = '2026-06-07T09:00:00.000Z';
    audit.dateModification = '2026-06-07T10:00:00.000Z';
    audit.situationFamiliale = {
      mr: {
        prenom: 'Alice',
        nom: 'Martin',
        dateNaissance: '1980-01-01',
        profession: 'Dirigeante',
        avatarKind: 'femme',
        avatarAppearance: { skinTone: 'fonce', age: 'senior' },
      },
      mme: {
        prenom: 'Camille',
        nom: 'Martin',
        dateNaissance: '1982-02-02',
      },
      situationMatrimoniale: 'marie',
      dateUnion: '2005-06-01',
      enfants: [
        {
          prenom: 'Lou',
          dateNaissance: '2010-03-03',
          estCommun: true,
          avatarKind: 'garcon',
          avatarAppearance: { skinTone: 'clair', age: 'adulte' },
        },
      ],
    };
    audit.situationCivile = {
      regimeMatrimonial: 'separation_biens',
      contratMariage: true,
      dateContrat: '2005-05-01',
      donations: [
        {
          id: 'donation-1',
          type: 'donation_simple',
          date: '2020-01-01',
          montant: 15000,
          beneficiaire: 'Lou',
        },
      ],
      testaments: [],
    };
    audit.objectifs = ['preparer_transmission', 'proteger_conjoint'];

    const dossier = buildDossierPatrimonialFromAudit(audit, {
      ownerUserId: 'user-1',
      now: '2026-06-07T10:30:00.000Z',
    });

    expect(dossier.id).toBe('audit-1');
    expect(dossier.ownerUserId).toBe('user-1');
    expect(dossier.foyer).toMatchObject({
      label: 'Foyer Martin',
      situationFamiliale: 'marie',
      membrePrincipalId: 'audit-1-mr',
      conjointId: 'audit-1-mme',
      enfantIds: ['audit-1-enfant-1'],
    });
    expect(dossier.membres).toEqual([
      expect.objectContaining({
        id: 'audit-1-mr',
        role: 'client',
        prenom: 'Alice',
        nom: 'Martin',
        avatarKind: 'femme',
        avatarAppearance: { skinTone: 'fonce', age: 'senior' },
      }),
      expect.objectContaining({
        id: 'audit-1-mme',
        role: 'conjoint',
        prenom: 'Camille',
      }),
      expect.objectContaining({
        id: 'audit-1-enfant-1',
        role: 'enfant',
        prenom: 'Lou',
        avatarKind: 'garcon',
        avatarAppearance: { skinTone: 'clair', age: 'adulte' },
      }),
    ]);
    expect(dossier.regimeMatrimonial).toMatchObject({
      regime: 'separation_biens',
      contratMariage: true,
      dateContrat: '2005-05-01',
    });
    expect(dossier.donationsSynthetiques).toEqual([
      expect.objectContaining({
        id: 'donation-1',
        type: 'donation_simple',
        date: '2020-01-01',
        montant: 15000,
        beneficiaireLabel: 'Lou',
      }),
    ]);
    expect(dossier.objectifs.map((objectif) => objectif.code)).toEqual([
      'preparer_transmission',
      'proteger_conjoint',
    ]);
    expect(dossier.sourceRefs[0]).toMatchObject({
      kind: 'manual',
      scope: 'audit',
      reviewStatus: 'validated',
      fieldPaths: expect.arrayContaining(['foyer', 'membres', 'objectifs']),
    });
    expect(dossier.completion.status).toBe('complete');
  });

  it('réhydrate un brouillon Audit depuis le dossier central sans écraser les données audit locales', () => {
    const audit = createEmptyDossier();
    audit.id = 'audit-2';
    audit.dateCreation = '2026-06-07T09:00:00.000Z';
    audit.dateModification = '2026-06-07T10:00:00.000Z';
    audit.situationFamiliale.mr = {
      prenom: 'Alice',
      nom: 'Martin',
      dateNaissance: '1980-01-01',
      avatarKind: 'femme',
      avatarAppearance: { skinTone: 'fonce', age: 'senior' },
    };
    audit.situationFamiliale.enfants = [
      {
        prenom: 'Lou',
        dateNaissance: '2010-03-03',
        estCommun: true,
        avatarKind: 'homme',
        avatarAppearance: { skinTone: 'fonce', age: 'adulte' },
      },
    ];
    audit.situationCivile.donations = [
      {
        id: 'donation-1',
        type: 'donation_simple',
        date: '2020-01-01',
        montant: 15000,
        beneficiaire: 'Lou',
      },
    ];
    audit.objectifs = ['developper_patrimoine'];
    audit.situationFiscale.revenuFiscalReference = 75000;

    const dossier = buildDossierPatrimonialFromAudit(audit, {
      ownerUserId: 'user-1',
      now: '2026-06-07T10:30:00.000Z',
    });
    const draft = createEmptyDossier();
    draft.id = 'draft-local';
    draft.situationFiscale.revenuFiscalReference = 42000;

    const restored = mergeDossierPatrimonialIntoAuditDraft(dossier, draft);

    expect(restored.id).toBe('audit-2');
    expect(restored.situationFamiliale.mr).toMatchObject({
      prenom: 'Alice',
      nom: 'Martin',
      dateNaissance: '1980-01-01',
      avatarKind: 'femme',
      avatarAppearance: { skinTone: 'fonce', age: 'senior' },
    });
    expect(restored.situationFamiliale.enfants[0]).toMatchObject({
      prenom: 'Lou',
      avatarKind: 'homme',
      avatarAppearance: { skinTone: 'fonce', age: 'adulte' },
    });
    expect(restored.situationCivile.donations).toEqual([
      expect.objectContaining({
        id: 'donation-1',
        beneficiaire: 'Lou',
      }),
    ]);
    expect(restored.objectifs).toEqual(['developper_patrimoine']);
    expect(restored.situationFiscale.revenuFiscalReference).toBe(42000);
  });
});
