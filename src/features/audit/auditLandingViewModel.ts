/**
 * View model de la landing /audit (UX-01).
 *
 * Lecture pure du dossier patrimonial F1 : aucun React, aucun calcul métier,
 * aucune donnée inventée. Ton « collecte premium » plutôt que défensif : on
 * valorise ce qui est réuni et l'action suivante, sans présenter une valeur par
 * défaut comme une certitude (un dossier vierge n'affirme pas « célibataire »,
 * « aucun enfant »). Le pilotage stratégique reste verrouillé, sans jargon
 * interne (pas de « F6 », « fondation », « module »), sans radar ni score.
 */

import type {
  DossierPatrimonial,
  DossierRegimeMatrimonialCode,
  DossierSituationFamilialeStatut,
} from '@/domain/dossier';

/** Destination de navigation proposée (mappée vers une étape wizard). */
export type AuditLandingDestination = 'dossier' | 'objectifs';

/** Avancement de collecte d'une carte. */
export type AuditLandingState = 'vide' | 'partiel' | 'complet';

/** Niveau d'exigence d'une donnée clé. */
export type AuditLandingRequirement = 'requis' | 'recommande';

/** Tonalité d'un badge de statut (glyphe + label, jamais la couleur seule). */
export type AuditLandingTone = 'progress' | 'done' | 'todo' | 'locked';

export interface AuditLandingBadge {
  label: string;
  tone: AuditLandingTone;
}

export interface AuditLandingAction {
  label: string;
  destination: AuditLandingDestination;
}

export interface AuditLandingChecklistItem {
  id: string;
  label: string;
  requirement: AuditLandingRequirement;
  requirementLabel: string;
  done: boolean;
  /** Valeur réelle quand `done`, jamais une valeur par défaut non confirmée. */
  value?: string;
  /** Action courte quand la donnée manque (`Saisir`, `Ajouter`, `Préciser`). */
  action?: AuditLandingAction;
}

export interface AuditLandingSummary {
  collecte: AuditLandingBadge;
  keyDataDone: number;
  keyDataTotal: number;
  /** 0–1, pour la jauge (dérivé du view model F1, jamais codé en dur). */
  ratio: number;
  requisRemaining: number;
  recommandeRemaining: number;
  strategy: AuditLandingBadge;
  nextAction: AuditLandingAction;
}

export interface AuditLandingSyntheseCard {
  badge: AuditLandingBadge;
  checklist: AuditLandingChecklistItem[];
  primaryAction: AuditLandingAction;
}

export interface AuditLandingObjectifItem {
  id: string;
  label: string;
  priority: number;
}

export interface AuditLandingObjectifsCard {
  badge: AuditLandingBadge;
  state: AuditLandingState;
  emptyLabel: string;
  objectifs: AuditLandingObjectifItem[];
  /** Notes qualitatives courtes (contraintes / opérations), jamais des « 0 ». */
  notes: string[];
  action: AuditLandingAction;
}

export interface AuditLandingPilotageCard {
  badge: AuditLandingBadge;
  headline: string;
  description: string;
  caption: string;
}

export interface AuditLandingViewModel {
  summary: AuditLandingSummary;
  synthese: AuditLandingSyntheseCard;
  objectifs: AuditLandingObjectifsCard;
  pilotage: AuditLandingPilotageCard;
}

const SITUATION_FAMILIALE_LABELS: Record<DossierSituationFamilialeStatut, string> = {
  marie: 'Marié(e)',
  pacse: 'Pacsé(e)',
  concubinage: 'Concubinage',
  celibataire: 'Célibataire',
  divorce: 'Divorcé(e)',
  veuf: 'Veuf/Veuve',
};

const REGIME_MATRIMONIAL_LABELS: Record<DossierRegimeMatrimonialCode, string> = {
  communaute_legale: 'Communauté réduite aux acquêts',
  communaute_universelle: 'Communauté universelle',
  separation_biens: 'Séparation de biens',
  participation_acquets: 'Participation aux acquêts',
  communaute_meubles_acquets: 'Communauté de meubles et acquêts',
  separation_biens_societe_acquets: 'Séparation de biens avec société d’acquêts',
};

const REQUIREMENT_LABELS: Record<AuditLandingRequirement, string> = {
  requis: 'Requis',
  recommande: 'Recommandé',
};

const COUPLE_STATUTS: ReadonlySet<DossierSituationFamilialeStatut> = new Set([
  'marie',
  'pacse',
  'concubinage',
]);

export function buildAuditLandingViewModel(dossier: DossierPatrimonial): AuditLandingViewModel {
  const checklist = buildFoyerChecklist(dossier);
  const objectifsCard = buildObjectifsCard(dossier);
  const objectifsDone = objectifsCard.objectifs.length > 0;

  // Données clés = checklist foyer + objectifs (compté dans la bande, affiché en carte).
  const keyDataTotal = checklist.length + 1;
  const keyDataDone = checklist.filter((item) => item.done).length + (objectifsDone ? 1 : 0);
  const requisRemaining = countRemaining(checklist, 'requis') + (objectifsDone ? 0 : 1); // objectifs = requis
  const recommandeRemaining = countRemaining(checklist, 'recommande');

  const syntheseComplete = requisRemaining === 0 && recommandeRemaining === 0;
  const collecte: AuditLandingBadge = syntheseComplete
    ? { label: 'Données clés réunies', tone: 'done' }
    : { label: 'Collecte en cours', tone: 'progress' };
  const nextAction = buildNextAction(dossier, objectifsDone);

  return {
    summary: {
      collecte,
      keyDataDone,
      keyDataTotal,
      ratio: keyDataTotal > 0 ? keyDataDone / keyDataTotal : 0,
      requisRemaining,
      recommandeRemaining,
      strategy: { label: 'Stratégie verrouillée', tone: 'locked' },
      nextAction,
    },
    synthese: {
      badge: collecte,
      checklist,
      primaryAction: nextAction,
    },
    objectifs: objectifsCard,
    pilotage: buildPilotageCard(),
  };
}

function isFamilyEngaged(dossier: DossierPatrimonial): boolean {
  const principal = findPrincipal(dossier);
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

function buildFoyerChecklist(dossier: DossierPatrimonial): AuditLandingChecklistItem[] {
  const items: AuditLandingChecklistItem[] = [];
  const principal = findPrincipal(dossier);
  const principalDone = Boolean(
    principal?.prenom.trim() && principal.nom?.trim() && principal.dateNaissance?.trim(),
  );
  items.push(
    item('membre-principal', 'Membre principal', 'requis', principalDone, {
      value: principalDone && principal ? formatMembreName(principal) : undefined,
      actionLabel: 'Saisir',
      destination: 'dossier',
    }),
  );

  const familyEngaged = isFamilyEngaged(dossier);
  items.push(
    item('situation-familiale', 'Situation familiale', 'recommande', familyEngaged, {
      value: familyEngaged
        ? SITUATION_FAMILIALE_LABELS[dossier.situationFamiliale.statut]
        : undefined,
      actionLabel: 'Préciser',
      destination: 'dossier',
    }),
  );

  if (COUPLE_STATUTS.has(dossier.situationFamiliale.statut)) {
    const conjoint = dossier.membres.find((membre) => membre.id === dossier.foyer.conjointId);
    const conjointDone = Boolean(conjoint?.prenom.trim());
    items.push(
      item('conjoint', 'Conjoint / partenaire', 'recommande', conjointDone, {
        value: conjointDone && conjoint ? formatMembreName(conjoint) : undefined,
        actionLabel: 'Saisir',
        destination: 'dossier',
      }),
    );
    const regime = dossier.regimeMatrimonial;
    items.push(
      item('regime-matrimonial', 'Régime matrimonial', 'recommande', Boolean(regime), {
        value: regime ? REGIME_MATRIMONIAL_LABELS[regime.regime] : undefined,
        actionLabel: 'Préciser',
        destination: 'dossier',
      }),
    );
  }

  const enfantsDone = dossier.situationFamiliale.nombreEnfants > 0;
  items.push(
    item('enfants', 'Enfants', 'recommande', enfantsDone, {
      value: enfantsDone
        ? formatCount(dossier.situationFamiliale.nombreEnfants, 'enfant', 'enfants')
        : undefined,
      actionLabel: 'Ajouter',
      destination: 'dossier',
    }),
  );

  const donationsDone = dossier.donationsSynthetiques.length > 0;
  items.push(
    item('donations', 'Donations antérieures', 'recommande', donationsDone, {
      value: donationsDone
        ? formatCount(dossier.donationsSynthetiques.length, 'donation', 'donations')
        : undefined,
      actionLabel: 'Ajouter',
      destination: 'dossier',
    }),
  );

  return items;
}

function buildObjectifsCard(dossier: DossierPatrimonial): AuditLandingObjectifsCard {
  const objectifs = [...dossier.objectifs]
    .sort((a, b) => a.priority - b.priority)
    .map((objectif) => ({ id: objectif.id, label: objectif.label, priority: objectif.priority }));
  const hasContraintes = dossier.contraintes.length > 0;
  const hasOperations = dossier.operationsPrevues.length > 0;

  const state: AuditLandingState =
    objectifs.length === 0 ? 'vide' : hasContraintes || hasOperations ? 'complet' : 'partiel';

  const notes: string[] = [];
  if (objectifs.length > 0) {
    notes.push(
      hasContraintes
        ? formatCount(dossier.contraintes.length, 'contrainte', 'contraintes')
        : 'Contraintes à préciser',
    );
    notes.push(
      hasOperations
        ? formatCount(dossier.operationsPrevues.length, 'opération prévue', 'opérations prévues')
        : 'Aucune opération prévue',
    );
  }

  return {
    badge:
      state === 'vide'
        ? { label: 'À renseigner', tone: 'todo' }
        : state === 'complet'
          ? { label: 'Complet', tone: 'done' }
          : { label: 'En cours', tone: 'progress' },
    state,
    emptyLabel: 'Aucun objectif consigné',
    objectifs,
    notes,
    action:
      objectifs.length > 0
        ? { label: 'Compléter les objectifs', destination: 'objectifs' }
        : { label: 'Ajouter des objectifs', destination: 'objectifs' },
  };
}

function buildPilotageCard(): AuditLandingPilotageCard {
  return {
    badge: { label: 'Verrouillé', tone: 'locked' },
    headline: 'Stratégie verrouillée',
    description:
      'Les projections stratégiques seront disponibles après finalisation des données de base du dossier.',
    caption: 'Comparaison de scénarios · pistes à vérifier · activation future',
  };
}

function buildNextAction(dossier: DossierPatrimonial, objectifsDone: boolean): AuditLandingAction {
  const principal = findPrincipal(dossier);
  const principalDone = Boolean(
    principal?.prenom.trim() && principal.nom?.trim() && principal.dateNaissance?.trim(),
  );
  if (!principalDone) return { label: 'Saisir le membre principal', destination: 'dossier' };
  if (!objectifsDone) return { label: 'Ajouter des objectifs', destination: 'objectifs' };
  if (!isFamilyEngaged(dossier)) {
    return { label: 'Préciser la situation familiale', destination: 'dossier' };
  }
  return { label: 'Reprendre l’audit', destination: 'dossier' };
}

function countRemaining(
  items: AuditLandingChecklistItem[],
  requirement: AuditLandingRequirement,
): number {
  return items.filter((item) => item.requirement === requirement && !item.done).length;
}

function findPrincipal(dossier: DossierPatrimonial) {
  return dossier.membres.find((membre) => membre.id === dossier.foyer.membrePrincipalId);
}

interface ItemOptions {
  value?: string;
  actionLabel: string;
  destination: AuditLandingDestination;
}

function item(
  id: string,
  label: string,
  requirement: AuditLandingRequirement,
  done: boolean,
  options: ItemOptions,
): AuditLandingChecklistItem {
  return {
    id,
    label,
    requirement,
    requirementLabel: REQUIREMENT_LABELS[requirement],
    done,
    value: done ? options.value : undefined,
    action: done ? undefined : { label: options.actionLabel, destination: options.destination },
  };
}

function formatMembreName(membre: { prenom: string; nom?: string }): string {
  return [membre.prenom.trim(), membre.nom?.trim()].filter(Boolean).join(' ');
}

function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
