import type {
  DossierAudit,
  EnfantInfo,
  ObjectifClient,
  PersonInfo,
  ProcheInfo,
  ProcheLien,
  ProcheLienNonEnfant,
  SituationCivile,
} from '@/domain/audit/types';
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

  // Brouillons antérieurs à l'ajout des proches : tolérer l'absence du tableau.
  const prochesSource = audit.situationFamiliale.proches ?? [];
  const procheIds = prochesSource.map((_, index) => `${audit.id}-proche-${index + 1}`);
  membres.push(
    ...prochesSource.map((proche, index) =>
      buildProcheMembre(
        procheIds[index] ?? `${audit.id}-proche-${index + 1}`,
        proche,
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
      procheIds,
    },
    membres,
    situationFamiliale: {
      statut: audit.situationFamiliale.situationMatrimoniale,
      dateUnion: audit.situationFamiliale.dateUnion,
      lieuUnion: audit.situationFamiliale.lieuUnion,
      impositionSepareeAnneeUnion: audit.situationFamiliale.impositionSepareeAnneeUnion,
      nonResidentFiscal: audit.situationFamiliale.nonResidentFiscal,
      dureeMariagesPrecedents: audit.situationFamiliale.dureeMariagesPrecedents,
      nombreEnfants: audit.situationFamiliale.enfants.length,
    },
    regimeMatrimonial: hasRegimeBlockData(audit.situationCivile)
      ? {
          regime: audit.situationCivile.regimeMatrimonial,
          contratMariage: audit.situationCivile.contratMariage,
          dateContrat: audit.situationCivile.dateContrat,
          notaire: audit.situationCivile.notaire,
          donationDernierVivantMr: audit.situationCivile.donationDernierVivantMr,
          donationDernierVivantMme: audit.situationCivile.donationDernierVivantMme,
          ddvOptionMr: audit.situationCivile.ddvOptionMr,
          ddvOptionMme: audit.situationCivile.ddvOptionMme,
          avantagesMatrimoniaux: audit.situationCivile.avantagesMatrimoniaux,
          sourceRefIds,
        }
      : null,
    donationsSynthetiques: audit.situationCivile.donations.map((donation) => ({
      id: donation.id,
      type: donation.type,
      date: donation.date,
      montant: donation.montant,
      beneficiaireLabel: donation.beneficiaire,
      donateur: donation.donateur,
      donataire: donation.donataire,
      qualificationRapport: donation.qualificationRapport,
      valeurActuelle: donation.valeurActuelle,
      avecReserveUsufruit: donation.avecReserveUsufruit,
      usufruitSuccessif: donation.usufruitSuccessif,
      usufruitSuccessifBeneficiaire: donation.usufruitSuccessifBeneficiaire,
      donSommeArgentExonere: donation.donSommeArgentExonere,
      description: donation.description,
      sourceRefIds,
    })),
    testamentsSynthetiques: audit.situationCivile.testaments.map((testament) => ({
      id: testament.id,
      date: testament.date,
      type: testament.type,
      testateur: testament.testateur,
      actif: testament.actif,
      dispositionType: testament.dispositionType,
      beneficiaire: testament.beneficiaire,
      quotePartPct: testament.quotePartPct,
      description: testament.description,
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
  const proches = (dossier.foyer.procheIds ?? [])
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
      lieuUnion: dossier.situationFamiliale.lieuUnion,
      impositionSepareeAnneeUnion: dossier.situationFamiliale.impositionSepareeAnneeUnion,
      nonResidentFiscal: dossier.situationFamiliale.nonResidentFiscal,
      dureeMariagesPrecedents: dossier.situationFamiliale.dureeMariagesPrecedents,
      enfants: enfants.map(buildAuditEnfant),
      proches: proches.map(buildAuditProche),
    },
    situationCivile: {
      ...draft.situationCivile,
      regimeMatrimonial: dossier.regimeMatrimonial?.regime,
      contratMariage:
        dossier.regimeMatrimonial?.contratMariage ?? draft.situationCivile.contratMariage,
      dateContrat: dossier.regimeMatrimonial?.dateContrat,
      notaire: dossier.regimeMatrimonial?.notaire,
      donationDernierVivantMr: dossier.regimeMatrimonial?.donationDernierVivantMr,
      donationDernierVivantMme: dossier.regimeMatrimonial?.donationDernierVivantMme,
      ddvOptionMr: dossier.regimeMatrimonial?.ddvOptionMr,
      ddvOptionMme: dossier.regimeMatrimonial?.ddvOptionMme,
      avantagesMatrimoniaux: dossier.regimeMatrimonial?.avantagesMatrimoniaux,
      donations: dossier.donationsSynthetiques.map((donation) => ({
        id: donation.id,
        type: donation.type,
        date: donation.date,
        montant: donation.montant,
        beneficiaire: donation.beneficiaireLabel,
        donateur: donation.donateur,
        donataire: donation.donataire,
        qualificationRapport: donation.qualificationRapport,
        valeurActuelle: donation.valeurActuelle,
        avecReserveUsufruit: donation.avecReserveUsufruit,
        usufruitSuccessif: donation.usufruitSuccessif,
        usufruitSuccessifBeneficiaire: donation.usufruitSuccessifBeneficiaire,
        donSommeArgentExonere: donation.donSommeArgentExonere,
        description: donation.description,
      })),
      testaments: dossier.testamentsSynthetiques.map((testament) => ({
        id: testament.id,
        date: testament.date,
        type: testament.type,
        testateur: testament.testateur,
        actif: testament.actif,
        dispositionType: testament.dispositionType,
        beneficiaire: testament.beneficiaire,
        quotePartPct: testament.quotePartPct,
        description: testament.description,
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
      'testamentsSynthetiques',
      'objectifs',
      'contraintes',
      'operationsPrevues',
    ],
    createdAt: audit.dateModification,
    reviewStatus: 'validated',
  };
}

function hasRegimeBlockData(situationCivile: SituationCivile): boolean {
  return Boolean(
    situationCivile.regimeMatrimonial ||
    situationCivile.contratMariage ||
    situationCivile.dateContrat ||
    situationCivile.notaire ||
    situationCivile.donationDernierVivantMr ||
    situationCivile.donationDernierVivantMme ||
    situationCivile.ddvOptionMr ||
    situationCivile.ddvOptionMme ||
    situationCivile.avantagesMatrimoniaux?.length,
  );
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
    civilite: person.civilite,
    nomNaissance: person.nomNaissance,
    lieuNaissance: person.lieuNaissance,
    departementNaissance: person.departementNaissance,
    communeNaissance: person.communeNaissance,
    paysNaissance: person.paysNaissance,
    nationalite: person.nationalite,
    handicap: person.handicap,
    profession: person.profession,
    csp: person.csp,
    natureActivite: person.natureActivite,
    statutSocial: person.statutSocial,
    caisseRetraite: person.caisseRetraite,
    statutConventionnel: person.statutConventionnel,
    tauxPriseEnChargeCpam: person.tauxPriseEnChargeCpam,
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
    nom: enfant.nom,
    dateNaissance: enfant.dateNaissance,
    estCommun: enfant.estCommun,
    parentPrincipal: enfant.parentPrincipal === 'mme' ? 'conjoint' : 'client',
    lienParente: enfant.lienParente,
    civilite: enfant.civilite,
    lieuNaissance: enfant.lieuNaissance,
    decede: enfant.decede,
    fiscalementACharge: enfant.fiscalementACharge,
    ageLimiteCharge: enfant.ageLimiteCharge,
    anneesSupplementairesCharge: enfant.anneesSupplementairesCharge,
    niveauScolaire: enfant.niveauScolaire,
    gardeAlternee: enfant.gardeAlternee,
    handicap: enfant.handicap,
    adopte: enfant.adopte,
    typeAdoption: enfant.typeAdoption,
    renoncantSuccession: enfant.renoncantSuccession,
    renonciationPortee: enfant.renonciationPortee,
    avatarKind: enfant.avatarKind,
    avatarAppearance: enfant.avatarAppearance,
    localId: enfant.id,
    sourceRefIds,
  };
}

function buildProcheMembre(id: string, proche: ProcheInfo, sourceRefIds: string[]): DossierMembre {
  return {
    id,
    role: 'autre',
    prenom: proche.prenom,
    nom: proche.nom,
    dateNaissance: proche.dateNaissance,
    lienParente: proche.lienParente,
    decede: proche.decede,
    handicap: proche.handicap,
    fiscalementACharge: proche.fiscalementACharge,
    niveauScolaire: proche.niveauScolaire,
    gardeAlternee: proche.gardeAlternee,
    adopte: proche.adopte,
    typeAdoption: proche.typeAdoption,
    parentPrincipal: proche.rattachement,
    rattachementBranche: proche.rattachementBranche,
    vivantSousMemeToit: proche.vivantSousMemeToit,
    parentEnfantId: proche.parentEnfantId,
    avatarKind: proche.avatarKind,
    avatarAppearance: proche.avatarAppearance,
    localId: proche.id,
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
    civilite: membre.civilite,
    nomNaissance: membre.nomNaissance,
    lieuNaissance: membre.lieuNaissance,
    departementNaissance: membre.departementNaissance,
    communeNaissance: membre.communeNaissance,
    paysNaissance: membre.paysNaissance,
    nationalite: membre.nationalite,
    handicap: membre.handicap,
    profession: membre.profession,
    csp: membre.csp,
    natureActivite: membre.natureActivite,
    statutSocial: membre.statutSocial,
    caisseRetraite: membre.caisseRetraite,
    statutConventionnel: membre.statutConventionnel,
    tauxPriseEnChargeCpam: membre.tauxPriseEnChargeCpam,
    avatarKind: membre.avatarKind,
    avatarAppearance: membre.avatarAppearance,
  };
}

function buildAuditEnfant(membre: DossierMembre): EnfantInfo {
  return {
    id: membre.localId,
    prenom: membre.prenom,
    nom: membre.nom,
    dateNaissance: membre.dateNaissance ?? '',
    estCommun: membre.estCommun ?? true,
    parentPrincipal: membre.parentPrincipal === 'conjoint' ? 'mme' : 'mr',
    lienParente: membre.lienParente,
    civilite: membre.civilite,
    lieuNaissance: membre.lieuNaissance,
    decede: membre.decede,
    fiscalementACharge: membre.fiscalementACharge,
    ageLimiteCharge: membre.ageLimiteCharge,
    anneesSupplementairesCharge: membre.anneesSupplementairesCharge,
    niveauScolaire: membre.niveauScolaire,
    gardeAlternee: membre.gardeAlternee,
    handicap: membre.handicap,
    adopte: membre.adopte,
    typeAdoption: membre.typeAdoption,
    renoncantSuccession: membre.renoncantSuccession,
    renonciationPortee: membre.renonciationPortee,
    avatarKind: membre.avatarKind,
    avatarAppearance: membre.avatarAppearance,
  };
}

function buildAuditProche(membre: DossierMembre): ProcheInfo {
  return {
    id: membre.localId ?? membre.id,
    lienParente: isProcheLienNonEnfant(membre.lienParente) ? membre.lienParente : 'tierce_personne',
    prenom: membre.prenom,
    nom: membre.nom,
    dateNaissance: membre.dateNaissance ?? '',
    decede: membre.decede,
    handicap: membre.handicap,
    parentEnfantId: membre.parentEnfantId,
    rattachement: membre.parentPrincipal,
    rattachementBranche: membre.rattachementBranche,
    vivantSousMemeToit: membre.vivantSousMemeToit,
    fiscalementACharge: membre.fiscalementACharge,
    niveauScolaire: membre.niveauScolaire,
    gardeAlternee: membre.gardeAlternee,
    adopte: membre.adopte,
    typeAdoption: membre.typeAdoption,
    avatarKind: membre.avatarKind,
    avatarAppearance: membre.avatarAppearance,
  };
}

function isProcheLienNonEnfant(value: ProcheLien | undefined): value is ProcheLienNonEnfant {
  return (
    value === 'petit_enfant' ||
    value === 'parent' ||
    value === 'frere_soeur' ||
    value === 'oncle_tante' ||
    value === 'tierce_personne'
  );
}

function isObjectifClient(code: string): code is ObjectifClient {
  return code in OBJECTIFS_CLIENT_LABELS;
}
