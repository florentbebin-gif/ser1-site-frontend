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
        civilite: 'madame',
        nomNaissance: 'Durand',
        lieuNaissance: 'Nantes',
        departementNaissance: '44',
        communeNaissance: 'Nantes',
        paysNaissance: 'France',
        nationalite: 'Française',
        handicap: true,
        profession: 'Dirigeante',
        csp: 'dirigeant',
        natureActivite: 'tns_independant',
        statutSocial: 'tns_article_62',
        caisseRetraite: 'cipav',
        statutConventionnel: 'non_applicable',
        tauxPriseEnChargeCpam: 80,
        avatarKind: 'femme',
        avatarAppearance: { skinTone: 'fonce', age: 'senior' },
      },
      mme: {
        prenom: 'Camille',
        nom: 'Martin',
        dateNaissance: '1982-02-02',
        civilite: 'monsieur',
        lieuNaissance: 'Rennes',
        nationalite: 'Française',
      },
      situationMatrimoniale: 'marie',
      dateUnion: '2005-06-01',
      lieuUnion: 'Brest',
      impositionSepareeAnneeUnion: true,
      nonResidentFiscal: false,
      dureeMariagesPrecedents: 2,
      enfants: [
        {
          prenom: 'Lou',
          nom: 'Martin',
          dateNaissance: '2010-03-03',
          estCommun: true,
          lienParente: 'enfant_commun',
          civilite: 'monsieur',
          lieuNaissance: 'Quimper',
          fiscalementACharge: true,
          ageLimiteCharge: 25,
          anneesSupplementairesCharge: 1,
          niveauScolaire: 'enseignement_superieur',
          handicap: false,
          adopte: true,
          renoncantSuccession: false,
          avatarKind: 'garcon',
          avatarAppearance: { skinTone: 'clair', age: 'adulte' },
        },
      ],
      proches: [],
    };
    audit.situationCivile = {
      regimeMatrimonial: 'separation_biens',
      contratMariage: true,
      dateContrat: '2005-05-01',
      donationDernierVivantMr: true,
      ddvOptionMr: 'usufruit_total',
      avantagesMatrimoniaux: ['partage_inegal'],
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
        civilite: 'madame',
        nomNaissance: 'Durand',
        lieuNaissance: 'Nantes',
        departementNaissance: '44',
        communeNaissance: 'Nantes',
        paysNaissance: 'France',
        nationalite: 'Française',
        handicap: true,
        csp: 'dirigeant',
        natureActivite: 'tns_independant',
        statutSocial: 'tns_article_62',
        caisseRetraite: 'cipav',
        statutConventionnel: 'non_applicable',
        tauxPriseEnChargeCpam: 80,
        avatarKind: 'femme',
        avatarAppearance: { skinTone: 'fonce', age: 'senior' },
      }),
      expect.objectContaining({
        id: 'audit-1-mme',
        role: 'conjoint',
        prenom: 'Camille',
        civilite: 'monsieur',
        lieuNaissance: 'Rennes',
      }),
      expect.objectContaining({
        id: 'audit-1-enfant-1',
        role: 'enfant',
        prenom: 'Lou',
        nom: 'Martin',
        lienParente: 'enfant_commun',
        civilite: 'monsieur',
        lieuNaissance: 'Quimper',
        fiscalementACharge: true,
        ageLimiteCharge: 25,
        anneesSupplementairesCharge: 1,
        niveauScolaire: 'enseignement_superieur',
        adopte: true,
        avatarKind: 'garcon',
        avatarAppearance: { skinTone: 'clair', age: 'adulte' },
      }),
    ]);
    expect(dossier.regimeMatrimonial).toMatchObject({
      regime: 'separation_biens',
      contratMariage: true,
      dateContrat: '2005-05-01',
      donationDernierVivantMr: true,
      ddvOptionMr: 'usufruit_total',
      avantagesMatrimoniaux: ['partage_inegal'],
    });
    expect(dossier.situationFamiliale).toMatchObject({
      dateUnion: '2005-06-01',
      lieuUnion: 'Brest',
      impositionSepareeAnneeUnion: true,
      dureeMariagesPrecedents: 2,
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
      civilite: 'madame',
      nomNaissance: 'Durand',
      lieuNaissance: 'Nantes',
      departementNaissance: '44',
      communeNaissance: 'Nantes',
      paysNaissance: 'France',
      nationalite: 'Française',
      handicap: true,
      avatarKind: 'femme',
      avatarAppearance: { skinTone: 'fonce', age: 'senior' },
    };
    audit.situationFamiliale.enfants = [
      {
        prenom: 'Lou',
        nom: 'Martin',
        dateNaissance: '2010-03-03',
        estCommun: true,
        lienParente: 'enfant_commun',
        fiscalementACharge: true,
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

  it('isole les proches des compteurs enfants et conserve leurs champs au round-trip', () => {
    const audit = createEmptyDossier();
    audit.id = 'audit-3';
    audit.situationFamiliale.enfants = [
      {
        id: 'enfant-a',
        prenom: 'Lou',
        nom: 'Martin',
        dateNaissance: '2010-03-03',
        estCommun: true,
        lienParente: 'enfant_commun',
        fiscalementACharge: true,
        gardeAlternee: true,
        niveauScolaire: 'lycee',
        adopte: true,
        typeAdoption: 'simple',
        renoncantSuccession: true,
        renonciationPortee: 'client',
      },
    ];
    audit.situationFamiliale.proches = [
      {
        id: 'proche-a',
        lienParente: 'petit_enfant',
        prenom: 'Théo',
        nom: 'Martin',
        dateNaissance: '2035-01-01',
        parentEnfantId: 'enfant-a',
        fiscalementACharge: true,
        niveauScolaire: 'college',
      },
      {
        id: 'proche-b',
        lienParente: 'oncle_tante',
        prenom: 'Rémi',
        dateNaissance: '1955-05-05',
        rattachementBranche: 'client_paternelle',
        decede: true,
      },
    ];

    const dossier = buildDossierPatrimonialFromAudit(audit);

    // Les proches ne polluent pas les compteurs/identifiants enfants.
    expect(dossier.foyer.enfantIds).toEqual(['audit-3-enfant-1']);
    expect(dossier.foyer.procheIds).toEqual(['audit-3-proche-1', 'audit-3-proche-2']);
    expect(dossier.situationFamiliale.nombreEnfants).toBe(1);
    expect(dossier.membres.filter((membre) => membre.role === 'enfant')).toHaveLength(1);
    expect(dossier.membres.filter((membre) => membre.role === 'autre')).toHaveLength(2);

    const restored = mergeDossierPatrimonialIntoAuditDraft(dossier, createEmptyDossier());
    expect(restored.situationFamiliale.enfants[0]).toMatchObject({
      id: 'enfant-a',
      gardeAlternee: true,
      typeAdoption: 'simple',
      renonciationPortee: 'client',
    });
    expect(restored.situationFamiliale.proches).toHaveLength(2);
    expect(restored.situationFamiliale.proches[0]).toMatchObject({
      id: 'proche-a',
      lienParente: 'petit_enfant',
      parentEnfantId: 'enfant-a',
      fiscalementACharge: true,
      niveauScolaire: 'college',
    });
    expect(restored.situationFamiliale.proches[1]).toMatchObject({
      id: 'proche-b',
      lienParente: 'oncle_tante',
      rattachementBranche: 'client_paternelle',
      decede: true,
    });
  });
});
