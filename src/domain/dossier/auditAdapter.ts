import type { DossierAudit, EnfantInfo, ObjectifClient, PersonInfo } from '@/domain/audit/types';
import { OBJECTIFS_CLIENT_LABELS } from '@/domain/audit/types';
import type { SourceRef } from './types';
import {
  type DossierMembre,
  type DossierPatrimonial,
  evaluateDossierPatrimonialCompletion,
} from './patrimonial';

interface AuditAdapterOptions {
  ownerUserId?: string | null;
  now?: string;
}

export function buildDossierPatrimonialFromAudit(
  audit: DossierAudit,
  options: AuditAdapterOptions = {},
): DossierPatrimonial {
  const sourceRef = buildAuditSourceRef(audit);
  const sourceRefIds = [sourceRef.id];
  const membres: DossierMembre[] = [];
  const principalId = `${audit.id}-mr`;
  const conjointId = audit.situationFamiliale.mme ? `${audit.id}-mme` : null;

  if (hasPersonData(audit.situationFamiliale.mr)) {
    membres.push(
      buildPersonMembre(principalId, 'client', audit.situationFamiliale.mr, sourceRefIds),
    );
  }

  if (audit.situationFamiliale.mme) {
    membres.push(
      buildPersonMembre(
        conjointId ?? `${audit.id}-mme`,
        'conjoint',
        audit.situationFamiliale.mme,
        sourceRefIds,
      ),
    );
  }

  const enfantIds = audit.situationFamiliale.enfants.map(
    (_, index) => `${audit.id}-enfant-${index + 1}`,
  );
  membres.push(
    ...audit.situationFamiliale.enfants.map((enfant, index) =>
      buildEnfantMembre(
        enfantIds[index] ?? `${audit.id}-enfant-${index + 1}`,
        enfant,
        sourceRefIds,
      ),
    ),
  );

  const dossier: DossierPatrimonial = {
    id: audit.id,
    ownerUserId: options.ownerUserId ?? null,
    status: 'draft',
    foyer: {
      id: `foyer-${audit.id}`,
      label: buildFoyerLabel(audit.situationFamiliale.mr),
      situationFamiliale: audit.situationFamiliale.situationMatrimoniale,
      membrePrincipalId: membres.some((membre) => membre.id === principalId) ? principalId : null,
      conjointId: membres.some((membre) => membre.id === conjointId) ? conjointId : null,
      enfantIds,
    },
    membres,
    situationFamiliale: {
      statut: audit.situationFamiliale.situationMatrimoniale,
      dateUnion: audit.situationFamiliale.dateUnion,
      nombreEnfants: audit.situationFamiliale.enfants.length,
    },
    regimeMatrimonial: audit.situationCivile.regimeMatrimonial
      ? {
          regime: audit.situationCivile.regimeMatrimonial,
          contratMariage: audit.situationCivile.contratMariage,
          dateContrat: audit.situationCivile.dateContrat,
          notaire: audit.situationCivile.notaire,
          sourceRefIds,
        }
      : null,
    donationsSynthetiques: audit.situationCivile.donations.map((donation) => ({
      id: donation.id,
      type: donation.type,
      date: donation.date,
      montant: donation.montant,
      beneficiaireLabel: donation.beneficiaire,
      description: donation.description,
      sourceRefIds,
    })),
    objectifs: audit.objectifs.map((objectif, index) => ({
      id: `${audit.id}-objectif-${index + 1}`,
      code: objectif,
      label: OBJECTIFS_CLIENT_LABELS[objectif],
      priority: index + 1,
      sourceRefIds,
    })),
    contraintes: audit.contraintes ?? [],
    operationsPrevues: audit.operationsPrevues ?? [],
    sourceRefs: [sourceRef],
    completion: {
      scope: 'f1_core',
      status: 'empty',
      missingRequiredFields: [],
      updatedAt: audit.dateModification,
    },
    createdAt: audit.dateCreation,
    updatedAt: audit.dateModification,
  };

  return {
    ...dossier,
    completion: evaluateDossierPatrimonialCompletion(dossier, {
      now: options.now ?? audit.dateModification,
    }),
  };
}

export function mergeDossierPatrimonialIntoAuditDraft(
  dossier: DossierPatrimonial,
  draft: DossierAudit,
): DossierAudit {
  const membrePrincipal = dossier.membres.find(
    (membre) => membre.id === dossier.foyer.membrePrincipalId,
  );
  const conjoint = dossier.membres.find((membre) => membre.id === dossier.foyer.conjointId);
  const enfants = dossier.foyer.enfantIds
    .map((id) => dossier.membres.find((membre) => membre.id === id))
    .filter((membre): membre is DossierMembre => Boolean(membre));

  return {
    ...draft,
    id: dossier.id,
    dateCreation: dossier.createdAt ?? draft.dateCreation,
    dateModification: dossier.updatedAt ?? draft.dateModification,
    situationFamiliale: {
      mr: membrePrincipal ? buildAuditPerson(membrePrincipal) : draft.situationFamiliale.mr,
      mme: conjoint ? buildAuditPerson(conjoint) : undefined,
      situationMatrimoniale: dossier.situationFamiliale.statut,
      dateUnion: dossier.situationFamiliale.dateUnion,
      enfants: enfants.map((enfant) => ({
        prenom: enfant.prenom,
        dateNaissance: enfant.dateNaissance ?? '',
        estCommun: enfant.estCommun ?? true,
        parentPrincipal: enfant.parentPrincipal === 'conjoint' ? 'mme' : 'mr',
        avatarKind: enfant.avatarKind,
        avatarAppearance: enfant.avatarAppearance,
      })),
    },
    situationCivile: {
      ...draft.situationCivile,
      regimeMatrimonial: dossier.regimeMatrimonial?.regime,
      contratMariage:
        dossier.regimeMatrimonial?.contratMariage ?? draft.situationCivile.contratMariage,
      dateContrat: dossier.regimeMatrimonial?.dateContrat,
      notaire: dossier.regimeMatrimonial?.notaire,
      donations: dossier.donationsSynthetiques.map((donation) => ({
        id: donation.id,
        type: donation.type,
        date: donation.date,
        montant: donation.montant,
        beneficiaire: donation.beneficiaireLabel,
        description: donation.description,
      })),
    },
    objectifs: dossier.objectifs.map((objectif) => objectif.code).filter(isObjectifClient),
    contraintes: dossier.contraintes,
    operationsPrevues: dossier.operationsPrevues,
  };
}

function buildAuditSourceRef(audit: DossierAudit): SourceRef {
  return {
    id: `audit-${audit.id}-manual`,
    kind: 'manual',
    scope: 'audit',
    label: 'Saisie manuelle Audit',
    fieldPaths: [
      'foyer',
      'membres',
      'situationFamiliale',
      'regimeMatrimonial',
      'donationsSynthetiques',
      'objectifs',
      'contraintes',
      'operationsPrevues',
    ],
    createdAt: audit.dateModification,
    reviewStatus: 'validated',
  };
}

function buildPersonMembre(
  id: string,
  role: 'client' | 'conjoint',
  person: PersonInfo,
  sourceRefIds: string[],
): DossierMembre {
  return {
    id,
    role,
    prenom: person.prenom,
    nom: person.nom,
    dateNaissance: person.dateNaissance,
    profession: person.profession,
    avatarKind: person.avatarKind,
    avatarAppearance: person.avatarAppearance,
    sourceRefIds,
  };
}

function buildEnfantMembre(id: string, enfant: EnfantInfo, sourceRefIds: string[]): DossierMembre {
  return {
    id,
    role: 'enfant',
    prenom: enfant.prenom,
    dateNaissance: enfant.dateNaissance,
    estCommun: enfant.estCommun,
    parentPrincipal: enfant.parentPrincipal === 'mme' ? 'conjoint' : 'client',
    avatarKind: enfant.avatarKind,
    avatarAppearance: enfant.avatarAppearance,
    sourceRefIds,
  };
}

function hasPersonData(person: PersonInfo): boolean {
  return Boolean(person.prenom.trim() || person.nom.trim() || person.dateNaissance.trim());
}

function buildFoyerLabel(person: PersonInfo): string {
  const nom = person.nom.trim();
  return nom ? `Foyer ${nom}` : 'Foyer patrimonial';
}

function buildAuditPerson(membre: DossierMembre): PersonInfo {
  return {
    prenom: membre.prenom,
    nom: membre.nom ?? '',
    dateNaissance: membre.dateNaissance ?? '',
    profession: membre.profession,
    avatarKind: membre.avatarKind,
    avatarAppearance: membre.avatarAppearance,
  };
}

function isObjectifClient(code: string): code is ObjectifClient {
  return code in OBJECTIFS_CLIENT_LABELS;
}
