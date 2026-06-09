/**
 * View model de la landing /audit (UX-01).
 *
 * Lecture pure du dossier patrimonial F1 : aucun React, aucun calcul métier,
 * aucune donnée inventée. On restitue la donnée réelle quand elle existe (état
 * civil, filiation) sans jamais présenter une valeur par défaut comme certitude.
 * Les blocs qui dépendent de fondations non livrées (masses successorales = F3,
 * organigramme société = F5, gestion des versions = F6) restent des placeholders
 * honnêtes « à venir », sans jargon interne, sans radar ni score.
 */

import type {
  DossierMembre,
  DossierPatrimonial,
  DossierSituationFamilialeStatut,
} from '@/domain/dossier';

/** Destination de navigation proposée (mappée vers une étape wizard). */
export type AuditLandingDestination = 'dossier' | 'objectifs';

export interface AuditLandingAction {
  destination: AuditLandingDestination;
}

export interface AuditLandingEtatCivil {
  principalName: string | null;
  principalAge: number | null;
  situationLabel: string | null;
  conjointName: string | null;
  enfantsPrenoms: string[];
}

export interface AuditLandingFiliationNode {
  id: string;
  label: string;
}

export interface AuditLandingFiliation {
  principal: AuditLandingFiliationNode | null;
  conjoint: AuditLandingFiliationNode | null;
  enfants: AuditLandingFiliationNode[];
  hasData: boolean;
}

export interface AuditLandingSyntheseCard {
  hasData: boolean;
  etatCivil: AuditLandingEtatCivil;
  filiation: AuditLandingFiliation;
  action: AuditLandingAction;
  ariaLabel: string;
}

export interface AuditLandingObjectifItem {
  id: string;
  label: string;
  priority: number;
}

export interface AuditLandingObjectifsCard {
  objectifs: AuditLandingObjectifItem[];
  emptyLabel: string;
  note?: string;
  action: AuditLandingAction;
  ariaLabel: string;
}

export interface AuditLandingPilotageCard {
  title: string;
  description: string;
  caption: string;
}

export interface AuditLandingViewModel {
  hasDossier: boolean;
  synthese: AuditLandingSyntheseCard;
  objectifs: AuditLandingObjectifsCard;
  pilotage: AuditLandingPilotageCard;
}

interface BuildOptions {
  now?: Date;
}

const SITUATION_FAMILIALE_LABELS: Record<DossierSituationFamilialeStatut, string> = {
  marie: 'Marié(e)',
  pacse: 'Pacsé(e)',
  concubinage: 'Concubinage',
  celibataire: 'Célibataire',
  divorce: 'Divorcé(e)',
  veuf: 'Veuf/Veuve',
};

const COUPLE_STATUTS: ReadonlySet<DossierSituationFamilialeStatut> = new Set([
  'marie',
  'pacse',
  'concubinage',
]);

export function buildAuditLandingViewModel(
  dossier: DossierPatrimonial,
  options: BuildOptions = {},
): AuditLandingViewModel {
  const now = options.now ?? new Date();
  const engaged = isFamilyEngaged(dossier);

  return {
    hasDossier: engaged,
    synthese: buildSyntheseCard(dossier, now, engaged),
    objectifs: buildObjectifsCard(dossier),
    pilotage: buildPilotageCard(),
  };
}

function buildSyntheseCard(
  dossier: DossierPatrimonial,
  now: Date,
  engaged: boolean,
): AuditLandingSyntheseCard {
  const principal = findMembre(dossier, dossier.foyer.membrePrincipalId);
  const conjoint = findMembre(dossier, dossier.foyer.conjointId);
  const enfants = dossier.membres.filter((membre) => membre.role === 'enfant');
  const isCouple = COUPLE_STATUTS.has(dossier.situationFamiliale.statut);

  const etatCivil: AuditLandingEtatCivil = {
    principalName: fullName(principal),
    principalAge: computeAge(principal?.dateNaissance, now),
    situationLabel: engaged ? SITUATION_FAMILIALE_LABELS[dossier.situationFamiliale.statut] : null,
    conjointName: isCouple ? fullName(conjoint) : null,
    enfantsPrenoms: enfants.map((enfant) => enfant.prenom.trim()).filter(Boolean),
  };

  const filiation: AuditLandingFiliation = {
    principal: principal ? toNode(principal, 'Membre principal') : null,
    conjoint: isCouple && conjoint ? toNode(conjoint, 'Conjoint') : null,
    enfants: enfants
      .map((enfant, index) => toNode(enfant, `Enfant ${index + 1}`))
      .filter((node): node is AuditLandingFiliationNode => node !== null),
    hasData: Boolean(principal) || enfants.length > 0,
  };

  return {
    hasData: engaged,
    etatCivil,
    filiation,
    action: { destination: 'dossier' },
    ariaLabel: engaged
      ? 'Synthèse dossier — ouvrir et compléter le foyer'
      : 'Synthèse dossier — initialiser le dossier du foyer',
  };
}

function buildObjectifsCard(dossier: DossierPatrimonial): AuditLandingObjectifsCard {
  const objectifs = [...dossier.objectifs]
    .sort((a, b) => a.priority - b.priority)
    .map((objectif) => ({ id: objectif.id, label: objectif.label, priority: objectif.priority }));
  const hasContraintes = dossier.contraintes.length > 0;
  const hasOperations = dossier.operationsPrevues.length > 0;

  const note =
    objectifs.length === 0
      ? undefined
      : hasContraintes || hasOperations
        ? 'Contraintes et opérations renseignées'
        : 'Contraintes à préciser';

  return {
    objectifs,
    emptyLabel: 'Aucun objectif consigné',
    note,
    action: { destination: 'objectifs' },
    ariaLabel:
      objectifs.length === 0
        ? 'Objectifs — définir les objectifs du client'
        : 'Objectifs — compléter les objectifs du client',
  };
}

function buildPilotageCard(): AuditLandingPilotageCard {
  return {
    title: 'Stratégie',
    description: 'Disponible après structuration du dossier.',
    caption: 'Scénarios · pistes à vérifier · activation future',
  };
}

function isFamilyEngaged(dossier: DossierPatrimonial): boolean {
  const principal = findMembre(dossier, dossier.foyer.membrePrincipalId);
  const principalHasData = Boolean(
    principal?.prenom.trim() || principal?.nom?.trim() || principal?.dateNaissance?.trim(),
  );
  return (
    principalHasData ||
    Boolean(dossier.foyer.conjointId) ||
    dossier.membres.some((membre) => membre.role === 'enfant') ||
    dossier.situationFamiliale.statut !== 'celibataire' ||
    dossier.situationFamiliale.nombreEnfants > 0 ||
    dossier.regimeMatrimonial !== null ||
    dossier.donationsSynthetiques.length > 0 ||
    dossier.objectifs.length > 0
  );
}

function findMembre(dossier: DossierPatrimonial, id: string | null): DossierMembre | undefined {
  if (!id) return undefined;
  return dossier.membres.find((membre) => membre.id === id);
}

function fullName(membre: DossierMembre | undefined): string | null {
  if (!membre) return null;
  const name = [membre.prenom.trim(), membre.nom?.trim()].filter(Boolean).join(' ');
  return name || null;
}

function toNode(membre: DossierMembre, fallback: string): AuditLandingFiliationNode {
  const label = membre.prenom.trim() || membre.nom?.trim() || fallback;
  return { id: membre.id, label };
}

function computeAge(dateNaissance: string | undefined, now: Date): number | null {
  if (!dateNaissance?.trim()) return null;
  const birth = new Date(dateNaissance);
  if (Number.isNaN(birth.getTime())) return null;
  let age = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}
