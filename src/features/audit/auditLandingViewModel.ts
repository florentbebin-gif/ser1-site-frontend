/**
 * View model de la landing /audit (UX-01).
 *
 * Lecture pure du dossier patrimonial F1 : aucune donnée inventée, aucune valeur
 * par défaut présentée comme certitude. Les parts fiscales sont dérivées de la
 * composition du foyer F1 via le moteur IR (pas de duplication de règle). La TMI
 * dépend des revenus (hors F1) et reste « à venir ». Les blocs masses
 * successorales (F3) et organigramme société (F5) restent des placeholders
 * honnêtes. Aucun jargon interne, aucun radar ni score.
 */

import { computeAutoPartsWithChildren } from '@/engine/ir/parts';
import {
  evaluateDossierPatrimonialCompletion,
  type DossierCompletionStatus,
  type DossierMembre,
  type DossierPatrimonial,
} from '@/domain/dossier';

import {
  buildAuditPointsAConfirmer,
  type AuditPointAConfirmer,
} from './auditLandingPointsViewModel';
import {
  buildAuditProgressSections,
  buildStatusBar,
  type AuditProgressSection,
  type AuditStatusBarViewModel,
} from './auditLandingProgressViewModel';

export type { AuditPointAConfirmer, AuditPointAConfirmerTone } from './auditLandingPointsViewModel';

export type {
  AuditFoundation,
  AuditProgressSection,
  AuditSectionAvailability,
  AuditSectionStatus,
  AuditStatusBarItem,
  AuditStatusBarItemId,
  AuditStatusBarTone,
  AuditStatusBarViewModel,
} from './auditLandingProgressViewModel';

export type AuditLandingDestination = 'dossier' | 'civil' | 'objectifs';

export interface AuditLandingAction {
  destination: AuditLandingDestination;
}

export type AuditLandingMemberRole = 'principal' | 'conjoint' | 'enfant';
export type AuditLandingAvatarKind = 'homme' | 'femme' | 'garcon' | 'fille';

export interface AuditLandingCompletionHint {
  ratio: number;
  /** Nombre de contrôles satisfaits (réutilisable pour agréger d'autres jauges). */
  completed: number;
  /** Nombre total de contrôles évalués. */
  total: number;
  label: string;
}

export interface AuditLandingMember {
  id: string;
  fullName: string;
  prenom: string;
  nom: string | null;
  age: number | null;
  profession: string | null;
  role: AuditLandingMemberRole;
  estCommun: boolean;
  avatarKind: AuditLandingAvatarKind;
}

export interface AuditLandingSyntheseCard {
  hasData: boolean;
  principal: AuditLandingMember | null;
  conjoint: AuditLandingMember | null;
  enfants: AuditLandingMember[];
  situationLabel: string | null;
  /** Parts de quotient familial dérivées de F1 (hypothèse enfants à charge). */
  partsFiscales: number | null;
  /** La TMI dépend des revenus, absents de F1. */
  tmiLabel: string;
  filiationHasData: boolean;
  etatCivilCompletion: AuditLandingCompletionHint;
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
  visibleObjectifs: AuditLandingObjectifItem[];
  totalObjectifs: number;
  overflowCount: number;
  emptyLabel: string;
  note?: string;
  action: AuditLandingAction;
  ariaLabel: string;
}

export type AuditPreviewSlideId = 'masses' | 'societe' | 'ir';
export type AuditPreviewSlideStatus = 'soon' | 'locked';

export interface AuditPreviewSlide {
  id: AuditPreviewSlideId;
  title: string;
  eyebrow: string;
  badgeLabel: string;
  status: AuditPreviewSlideStatus;
  description: string;
  caption: string;
}

export type AuditStrategyPrerequisiteStatus = 'satisfied' | 'missing' | 'future';

export interface AuditStrategyPrerequisite {
  id: string;
  label: string;
  status: AuditStrategyPrerequisiteStatus;
  statusLabel: string;
}

export interface AuditLandingPilotageCard {
  title: string;
  description: string;
  caption: string;
  prerequis: AuditStrategyPrerequisite[];
}

export interface AuditLandingViewModel {
  hasDossier: boolean;
  isNewAnalysisEmpty: boolean;
  clientName: string | null;
  dossierClientLabel: string | null;
  synthese: AuditLandingSyntheseCard;
  objectifs: AuditLandingObjectifsCard;
  pilotage: AuditLandingPilotageCard;
  pointsAConfirmer: AuditPointAConfirmer[];
  previewSlides: AuditPreviewSlide[];
  statusBar: AuditStatusBarViewModel;
  progress: AuditProgressSection[];
}

interface BuildOptions {
  now?: Date;
}

const SITUATION_FAMILIALE_LABELS: Record<
  DossierPatrimonial['situationFamiliale']['statut'],
  string
> = {
  marie: 'Marié(e)',
  pacse: 'Pacsé(e)',
  concubinage: 'Concubinage',
  celibataire: 'Célibataire',
  divorce: 'Divorcé(e)',
  veuf: 'Veuf/Veuve',
};

/** Couple au sens du quotient familial (les concubins forment deux foyers). */
const TAX_COUPLE_STATUTS = new Set(['marie', 'pacse']);
/** Couple au sens civil (présence d'un conjoint/partenaire dans le foyer). */
const COUPLE_STATUTS = new Set(['marie', 'pacse', 'concubinage']);

export function buildAuditLandingViewModel(
  dossier: DossierPatrimonial,
  options: BuildOptions = {},
): AuditLandingViewModel {
  const now = options.now ?? new Date();
  const engaged = isFamilyEngaged(dossier);
  const synthese = buildSyntheseCard(dossier, now, engaged);
  const objectifs = buildObjectifsCard(dossier);
  const progress = buildAuditProgressSections(dossier, synthese, now, engaged);
  const completion = evaluateDossierPatrimonialCompletion(dossier, { now: now.toISOString() });

  return {
    hasDossier: engaged,
    isNewAnalysisEmpty: isNewAnalysisEmptyDossier(dossier, synthese, completion.status),
    clientName: synthese.principal?.fullName ?? null,
    dossierClientLabel: buildDossierClientLabel(synthese),
    synthese,
    objectifs,
    pilotage: buildPilotageCard(dossier),
    pointsAConfirmer: buildAuditPointsAConfirmer(dossier, progress, now),
    previewSlides: buildPreviewSlides(),
    statusBar: buildStatusBar(progress, synthese, dossier, now),
    progress,
  };
}

function buildSyntheseCard(
  dossier: DossierPatrimonial,
  now: Date,
  engaged: boolean,
): AuditLandingSyntheseCard {
  const statut = dossier.situationFamiliale.statut;
  const isCouple = COUPLE_STATUTS.has(statut);
  const principalRaw = findMembre(dossier, dossier.foyer.membrePrincipalId);
  const conjointRaw = isCouple ? findMembre(dossier, dossier.foyer.conjointId) : undefined;
  const enfantsRaw = dossier.membres.filter((membre) => membre.role === 'enfant');

  const principal = principalRaw ? toMember(principalRaw, 'principal', now) : null;
  const conjoint = conjointRaw ? toMember(conjointRaw, 'conjoint', now) : null;
  const enfants = enfantsRaw.map((enfant) => toMember(enfant, 'enfant', now));

  const partsFiscales = engaged ? computeParts(statut, enfants.length) : null;
  const situationLabel = engaged ? SITUATION_FAMILIALE_LABELS[statut] : null;

  return {
    hasData: engaged,
    principal,
    conjoint,
    enfants,
    situationLabel,
    partsFiscales,
    tmiLabel: 'à venir',
    filiationHasData: Boolean(principal) || enfants.length > 0,
    etatCivilCompletion: buildEtatCivilCompletion({
      principal,
      conjoint,
      enfants,
      situationLabel,
      partsFiscales,
      isCouple,
    }),
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
  const visibleObjectifs = objectifs.slice(0, 3);
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
    visibleObjectifs,
    totalObjectifs: objectifs.length,
    overflowCount: Math.max(0, objectifs.length - visibleObjectifs.length),
    emptyLabel: 'Aucun objectif consigné',
    note,
    action: { destination: 'objectifs' },
    ariaLabel:
      objectifs.length === 0
        ? 'Objectifs — définir les objectifs du client'
        : 'Objectifs — compléter les objectifs du client',
  };
}

function buildPreviewSlides(): AuditPreviewSlide[] {
  return [
    {
      id: 'masses',
      title: 'Masses successorales',
      eyebrow: 'Répartition des masses successorales',
      badgeLabel: 'À venir · F3',
      status: 'soon',
      description: 'Aperçu disponible après structuration du patrimoine.',
      caption: 'F3 absent : aucune valeur patrimoniale ni calcul successoral affiché.',
    },
    {
      id: 'societe',
      title: 'Organigramme société',
      eyebrow: 'Structure de détention',
      badgeLabel: 'À venir · F5',
      status: 'soon',
      description: 'Aperçu disponible après raccordement du modèle société.',
      caption: 'F5 absent : aucun lien de détention réel n’est représenté.',
    },
    {
      id: 'ir',
      title: 'Impôt sur le revenu',
      eyebrow: 'Fiscalité',
      badgeLabel: 'Verrouillé · IR',
      status: 'locked',
      description: 'Disponible après raccordement audit vers IR.',
      caption: 'IR verrouillé : aucune estimation affichée sans raccordement validé.',
    },
  ];
}

function buildPilotageCard(dossier: DossierPatrimonial): AuditLandingPilotageCard {
  return {
    title: 'Stratégie',
    description: 'Verrouillée tant que les prérequis métier ne sont pas disponibles.',
    caption: 'Aucun scénario disponible à ce stade.',
    prerequis: [
      {
        id: 'objectifs',
        label: 'Objectifs définis',
        status: dossier.objectifs.length > 0 ? 'satisfied' : 'missing',
        statusLabel: dossier.objectifs.length > 0 ? 'Renseigné' : 'À compléter',
      },
      {
        id: 'contraintes',
        label: 'Contraintes précisées',
        status: dossier.contraintes.length > 0 ? 'satisfied' : 'missing',
        statusLabel: dossier.contraintes.length > 0 ? 'Renseigné' : 'À compléter',
      },
      {
        id: 'patrimoine-f3',
        label: 'Patrimoine structuré',
        status: 'future',
        statusLabel: 'À venir',
      },
      {
        id: 'scenarios-f6',
        label: 'Scénarios disponibles',
        status: 'future',
        statusLabel: 'À venir',
      },
    ],
  };
}

/** Parts de quotient familial dérivées du foyer F1 (réutilise le moteur IR). */
function computeParts(statut: string, enfantsCount: number): number {
  return computeAutoPartsWithChildren({
    status: TAX_COUPLE_STATUTS.has(statut) ? 'couple' : 'single',
    children: Array.from({ length: enfantsCount }, () => ({ mode: 'charge' as const })),
  });
}

function isFamilyEngaged(dossier: DossierPatrimonial): boolean {
  return isFoyerStarted(dossier) || dossier.objectifs.length > 0;
}

function isFoyerStarted(dossier: DossierPatrimonial): boolean {
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
    dossier.donationsSynthetiques.length > 0
  );
}

function isNewAnalysisEmptyDossier(
  dossier: DossierPatrimonial,
  synthese: AuditLandingSyntheseCard,
  completionStatus: DossierCompletionStatus,
): boolean {
  return (
    !isFoyerStarted(dossier) &&
    !synthese.principal?.fullName.trim() &&
    dossier.objectifs.length === 0 &&
    completionStatus === 'empty'
  );
}

function findMembre(dossier: DossierPatrimonial, id: string | null): DossierMembre | undefined {
  if (!id) return undefined;
  return dossier.membres.find((membre) => membre.id === id);
}

function toMember(
  membre: DossierMembre,
  role: AuditLandingMemberRole,
  now: Date,
): AuditLandingMember {
  const prenom = membre.prenom.trim();
  const nom = membre.nom?.trim() || null;
  return {
    id: membre.id,
    fullName: [prenom, nom].filter(Boolean).join(' ') || prenom || nom || '',
    prenom: prenom || nom || '—',
    nom,
    age: computeAge(membre.dateNaissance, now),
    profession: membre.profession?.trim() || null,
    role,
    estCommun: membre.estCommun ?? true,
    avatarKind: inferAvatarKind(role, prenom || nom || ''),
  };
}

function buildDossierClientLabel(synthese: AuditLandingSyntheseCard): string | null {
  const principal = synthese.principal;
  if (!principal) return null;

  const membersCount = 1 + (synthese.conjoint ? 1 : 0) + synthese.enfants.length;
  if (membersCount > 1) {
    return principal.nom ? `Famille ${principal.nom}` : 'Famille à renseigner';
  }

  return principal.prenom.trim() && principal.nom ? `${principal.prenom} ${principal.nom}` : null;
}

function buildEtatCivilCompletion({
  principal,
  conjoint,
  enfants,
  situationLabel,
  partsFiscales,
  isCouple,
}: {
  principal: AuditLandingMember | null;
  conjoint: AuditLandingMember | null;
  enfants: AuditLandingMember[];
  situationLabel: string | null;
  partsFiscales: number | null;
  isCouple: boolean;
}): AuditLandingCompletionHint {
  const checks = [
    Boolean(principal?.fullName.trim()),
    principal?.age != null,
    Boolean(situationLabel),
    !isCouple || Boolean(conjoint),
    enfants.every((enfant) => enfant.prenom.trim().length > 0),
    partsFiscales != null,
  ];
  const completed = checks.filter(Boolean).length;
  const ratio = checks.length === 0 ? 0 : completed / checks.length;

  return {
    ratio,
    completed,
    total: checks.length,
    label: `Données état civil renseignées : ${completed}/${checks.length}`,
  };
}

function inferAvatarKind(role: AuditLandingMemberRole, label: string): AuditLandingAvatarKind {
  if (role === 'principal') return 'homme';
  if (role === 'conjoint') return 'femme';

  const normalized = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
  const feminineFirstNames = new Set([
    'alice',
    'camille',
    'chloe',
    'claire',
    'emma',
    'jade',
    'julie',
    'lea',
    'louise',
    'marie',
    'sophie',
  ]);
  const masculineFirstNames = new Set([
    'gabriel',
    'hugo',
    'louis',
    'marc',
    'noah',
    'paul',
    'pierre',
    'thomas',
    'tom',
  ]);

  if (feminineFirstNames.has(normalized)) return 'fille';
  if (masculineFirstNames.has(normalized)) return 'garcon';
  return normalized.endsWith('a') || normalized.endsWith('e') ? 'fille' : 'garcon';
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
