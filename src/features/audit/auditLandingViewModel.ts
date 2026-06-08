/**
 * View model de la landing /audit (UX-01).
 *
 * Logique de lecture pure du dossier patrimonial F1 : aucun React, aucun calcul
 * métier, aucune donnée inventée. Le pilotage stratégique réel dépend de F6 et
 * reste « à venir » (pas de radar, pas de score, pas de scénario activable).
 */

import type {
  DossierContraintePriority,
  DossierOperationStatus,
  DossierPatrimonial,
  DossierRegimeMatrimonialCode,
  DossierRequiredField,
  DossierSituationFamilialeStatut,
} from '@/domain/dossier';
import { DOSSIER_PATRIMONIAL_COMPLETION_LABELS } from '@/domain/dossier';

export type AuditLandingState = 'vide' | 'partiel' | 'complet' | 'a-completer' | 'a-venir';

export interface AuditLandingFact {
  id: string;
  label: string;
  /** Valeur réelle du dossier, ou libellé d'absence (`à compléter`, `inconnu`, `sans objet`). */
  value: string;
  /** `false` quand la donnée n'est pas renseignée : à présenter comme un manque, jamais un défaut. */
  known: boolean;
}

export interface AuditLandingMissing {
  id: string;
  label: string;
}

export interface AuditLandingObjectifItem {
  id: string;
  label: string;
  priority: number;
}

export interface AuditLandingContrainteItem {
  id: string;
  label: string;
  priorityLabel: string;
}

export interface AuditLandingOperationItem {
  id: string;
  label: string;
  statusLabel: string;
}

export interface AuditLandingSyntheseCard {
  state: Exclude<AuditLandingState, 'a-venir'>;
  stateLabel: string;
  title: string;
  facts: AuditLandingFact[];
  missing: AuditLandingMissing[];
}

export interface AuditLandingPilotageCard {
  state: Extract<AuditLandingState, 'a-venir'>;
  stateLabel: string;
  dependsOn: string;
  description: string;
  /** Capacités à venir, listées honnêtement comme non disponibles. */
  upcoming: string[];
}

export interface AuditLandingObjectifsCard {
  state: Exclude<AuditLandingState, 'a-venir'>;
  stateLabel: string;
  objectifs: AuditLandingObjectifItem[];
  contraintes: AuditLandingContrainteItem[];
  operationsPrevues: AuditLandingOperationItem[];
}

export interface AuditLandingViewModel {
  synthese: AuditLandingSyntheseCard;
  pilotage: AuditLandingPilotageCard;
  objectifs: AuditLandingObjectifsCard;
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

const CONTRAINTE_PRIORITY_LABELS: Record<DossierContraintePriority, string> = {
  haute: 'priorité haute',
  moyenne: 'priorité moyenne',
  basse: 'priorité basse',
};

const OPERATION_STATUS_LABELS: Record<DossierOperationStatus, string> = {
  planned: 'planifiée',
  in_progress: 'en cours',
  done: 'réalisée',
  cancelled: 'annulée',
};

const MISSING_FIELD_LABELS: Record<DossierRequiredField, string> = {
  membre_principal: 'Membre principal incomplet (prénom, nom, date de naissance)',
  objectifs_prioritaires: 'Objectifs prioritaires non renseignés',
};

/** Les situations impliquant un conjoint/partenaire dans le dossier. */
const COUPLE_STATUTS: ReadonlySet<DossierSituationFamilialeStatut> = new Set([
  'marie',
  'pacse',
  'concubinage',
]);

export const AUDIT_LANDING_STATE_LABELS: Record<AuditLandingState, string> = {
  vide: 'vide',
  partiel: 'partiel',
  complet: 'complet',
  'a-completer': 'à compléter',
  'a-venir': 'à venir',
};

export function buildAuditLandingViewModel(dossier: DossierPatrimonial): AuditLandingViewModel {
  return {
    synthese: buildSyntheseCard(dossier),
    pilotage: buildPilotageCard(),
    objectifs: buildObjectifsCard(dossier),
  };
}

function buildSyntheseCard(dossier: DossierPatrimonial): AuditLandingSyntheseCard {
  const state = mapCompletionStatusToState(dossier.completion.status);

  return {
    state,
    stateLabel: DOSSIER_PATRIMONIAL_COMPLETION_LABELS[dossier.completion.status],
    title: dossier.foyer.label,
    facts: buildSyntheseFacts(dossier),
    missing: dossier.completion.missingRequiredFields.map((field) => ({
      id: field,
      label: MISSING_FIELD_LABELS[field],
    })),
  };
}

function buildSyntheseFacts(dossier: DossierPatrimonial): AuditLandingFact[] {
  const facts: AuditLandingFact[] = [];

  facts.push({
    id: 'situation-familiale',
    label: 'Situation familiale',
    value: SITUATION_FAMILIALE_LABELS[dossier.situationFamiliale.statut],
    known: true,
  });

  const principal = dossier.membres.find((membre) => membre.id === dossier.foyer.membrePrincipalId);
  const principalKnown = Boolean(
    principal?.prenom.trim() && principal.nom?.trim() && principal.dateNaissance?.trim(),
  );
  facts.push({
    id: 'membre-principal',
    label: 'Membre principal',
    value: principalKnown && principal ? formatMembreName(principal) : 'à compléter',
    known: principalKnown,
  });

  if (COUPLE_STATUTS.has(dossier.situationFamiliale.statut)) {
    const conjoint = dossier.membres.find((membre) => membre.id === dossier.foyer.conjointId);
    const conjointKnown = Boolean(conjoint?.prenom.trim());
    facts.push({
      id: 'conjoint',
      label: 'Conjoint / partenaire',
      value: conjointKnown && conjoint ? formatMembreName(conjoint) : 'à compléter',
      known: conjointKnown,
    });

    const regime = dossier.regimeMatrimonial;
    facts.push({
      id: 'regime-matrimonial',
      label: 'Régime matrimonial',
      value: regime ? REGIME_MATRIMONIAL_LABELS[regime.regime] : 'à compléter',
      known: Boolean(regime),
    });
  }

  const nombreEnfants = dossier.situationFamiliale.nombreEnfants;
  facts.push({
    id: 'enfants',
    label: 'Enfants',
    value: formatCount(nombreEnfants, 'enfant', 'enfants', 'aucun enfant'),
    known: true,
  });

  const donations = dossier.donationsSynthetiques.length;
  facts.push({
    id: 'donations',
    label: 'Donations antérieures',
    value: formatCount(donations, 'donation', 'donations', 'aucune donation'),
    known: true,
  });

  return facts;
}

function buildPilotageCard(): AuditLandingPilotageCard {
  return {
    state: 'a-venir',
    stateLabel: AUDIT_LANDING_STATE_LABELS['a-venir'],
    dependsOn: 'F6',
    description:
      'Le pilotage stratégique réel (radar d’arbitrages, pistes à vérifier, versioning de stratégie) dépend de la fondation F6. Aucun score ni scénario n’est calculé tant qu’elle n’est pas livrée.',
    upcoming: [
      'Radar d’arbitrages (situation actuelle vs scénario)',
      'Pistes à vérifier déterministes',
      'Versioning et activation de stratégie',
    ],
  };
}

function buildObjectifsCard(dossier: DossierPatrimonial): AuditLandingObjectifsCard {
  const objectifs = [...dossier.objectifs]
    .sort((a, b) => a.priority - b.priority)
    .map((objectif) => ({ id: objectif.id, label: objectif.label, priority: objectif.priority }));
  const contraintes = dossier.contraintes.map((contrainte) => ({
    id: contrainte.id,
    label: contrainte.label,
    priorityLabel: CONTRAINTE_PRIORITY_LABELS[contrainte.priority],
  }));
  const operationsPrevues = dossier.operationsPrevues.map((operation) => ({
    id: operation.id,
    label: operation.label,
    statusLabel: OPERATION_STATUS_LABELS[operation.status],
  }));

  const state = mapObjectifsToState(objectifs.length, contraintes.length, operationsPrevues.length);

  return {
    state,
    stateLabel: AUDIT_LANDING_STATE_LABELS[state],
    objectifs,
    contraintes,
    operationsPrevues,
  } satisfies AuditLandingObjectifsCard;
}

function mapCompletionStatusToState(
  status: DossierPatrimonial['completion']['status'],
): Exclude<AuditLandingState, 'a-venir'> {
  if (status === 'complete') return 'complet';
  if (status === 'partial') return 'partiel';
  return 'a-completer';
}

function mapObjectifsToState(
  objectifsCount: number,
  contraintesCount: number,
  operationsCount: number,
): Exclude<AuditLandingState, 'a-venir'> {
  if (objectifsCount === 0) return 'vide';
  if (contraintesCount > 0 || operationsCount > 0) return 'complet';
  return 'partiel';
}

function formatMembreName(membre: { prenom: string; nom?: string }): string {
  return [membre.prenom.trim(), membre.nom?.trim()].filter(Boolean).join(' ');
}

function formatCount(count: number, singular: string, plural: string, emptyLabel: string): string {
  if (count <= 0) return emptyLabel;
  return `${count} ${count === 1 ? singular : plural}`;
}
