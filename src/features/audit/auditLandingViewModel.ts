import { computeAutoPartsWithChildren } from '@/engine/ir/parts';
import type { AuditAvatarAppearance, AuditAvatarKind } from '@/domain/audit/types';
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
import { computeAge, inferAvatarKind } from './auditLandingMemberUtils';

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

export type AuditLandingDestination =
  | 'dossier'
  | 'civil'
  | 'actifs-passifs'
  | 'fiscalite'
  | 'objectifs';

export interface AuditLandingAction {
  destination: AuditLandingDestination;
}

export type AuditLandingMemberRole = 'principal' | 'conjoint' | 'enfant' | 'proche';
export type AuditLandingAvatarKind = AuditAvatarKind;

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
  statutSocial: DossierMembre['statutSocial'] | null;
  role: AuditLandingMemberRole;
  estCommun: boolean;
  parentPrincipal?: 'client' | 'conjoint';
  avatarKind: AuditLandingAvatarKind;
  avatarAppearance?: AuditAvatarAppearance;
  lienParente?: DossierMembre['lienParente'];
  localId?: string;
  parentEnfantId?: string;
  rattachementBranche?: DossierMembre['rattachementBranche'];
}

export interface AuditLandingSyntheseCard {
  hasData: boolean;
  principal: AuditLandingMember | null;
  conjoint: AuditLandingMember | null;
  enfants: AuditLandingMember[];
  proches: AuditLandingMember[];
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
  concubinage: 'Union libre',
  celibataire: 'Célibataire',
  divorce: 'Divorcé(e)',
  veuf: 'Veuf/veuve',
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
  const prochesRaw = collectProches(dossier);

  const principal = principalRaw ? toMember(principalRaw, 'principal', now) : null;
  const conjoint = conjointRaw ? toMember(conjointRaw, 'conjoint', now) : null;
  const enfants = enfantsRaw.map((enfant) => toMember(enfant, 'enfant', now));
  const proches = prochesRaw.map((proche) => toMember(proche, 'proche', now));

  const partsFiscales = engaged ? computeParts(statut, enfants.length) : null;
  const situationLabel = engaged ? SITUATION_FAMILIALE_LABELS[statut] : null;

  return {
    hasData: engaged,
    principal,
    conjoint,
    enfants,
    proches,
    situationLabel,
    partsFiscales,
    tmiLabel: 'à venir',
    filiationHasData: Boolean(principal) || enfants.length > 0 || proches.length > 0,
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
    dossier.donationsSynthetiques.length > 0 ||
    dossier.testamentsSynthetiques.length > 0
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

function collectProches(dossier: DossierPatrimonial): DossierMembre[] {
  const byId = new Map(dossier.membres.map((membre) => [membre.id, membre]));
  const ordered = dossier.foyer.procheIds
    .map((id) => byId.get(id))
    .filter((membre): membre is DossierMembre => Boolean(membre));
  const orderedIds = new Set(ordered.map((membre) => membre.id));
  const remaining = dossier.membres.filter(
    (membre) => membre.role === 'autre' && !orderedIds.has(membre.id),
  );
  return [...ordered, ...remaining];
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
    statutSocial: membre.statutSocial ?? null,
    role,
    estCommun: membre.estCommun ?? true,
    parentPrincipal: membre.parentPrincipal,
    avatarKind: membre.avatarKind ?? inferAvatarKind(role, membre.civilite, membre.lienParente),
    avatarAppearance: membre.avatarAppearance,
    lienParente: membre.lienParente,
    localId: membre.localId,
    parentEnfantId: membre.parentEnfantId,
    rattachementBranche: membre.rattachementBranche,
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
