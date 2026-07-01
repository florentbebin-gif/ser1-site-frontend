import {
  DOSSIER_PATRIMONIAL_COMPLETION_LABELS,
  evaluateDossierPatrimonialCompletion,
  type DossierCompletionStatus,
  type DossierPatrimonial,
} from '@/domain/dossier';

import type { AuditLandingMember, AuditLandingSyntheseCard } from './auditLandingViewModel';
import { isProfessionalSituationComplete } from './professionalSituation';

export type AuditSectionStatus =
  | 'vide'
  | 'partiel'
  | 'complet'
  | 'a-verifier'
  | 'alerte'
  | 'masque';

export type AuditProgressSectionId =
  | 'dossier'
  | 'foyer-famille'
  | 'societes-organigramme'
  | 'actifs-passifs'
  | 'fiscalite'
  | 'prevoyance'
  | 'succession'
  | 'objectifs'
  | 'synthese';
export type AuditSectionAvailability = 'available' | 'gated';
export type AuditFoundation = 'F1' | 'F1.1' | 'F2' | 'F3' | 'F5' | 'F6';

export interface AuditProgressSection {
  id: AuditProgressSectionId;
  label: string;
  foundation: AuditFoundation;
  availability: AuditSectionAvailability;
  isNavigable: boolean;
  status: AuditSectionStatus | null;
  conditional: boolean;
  statusLabel: string;
}

export type AuditStatusBarItemId = 'f1' | 'points' | 'parts' | 'ir' | 'patrimoine' | 'strategie';
export type AuditStatusBarTone = 'neutral' | 'success' | 'warning' | 'muted';

export interface AuditStatusBarItem {
  id: AuditStatusBarItemId;
  label: string;
  value: string;
  tone: AuditStatusBarTone;
}

export interface AuditStatusBarViewModel {
  items: AuditStatusBarItem[];
  f1Completed: number | null;
  f1Total: number | null;
  pointsToComplete: number;
}

const SECTION_STATUS_LABELS: Record<AuditSectionStatus, string> = {
  vide: 'À compléter',
  partiel: 'Partiel',
  complet: 'Complet',
  'a-verifier': 'Partiel',
  alerte: 'Partiel',
  masque: 'À venir',
};

export function visibleAuditSectionStatusLabel(status: AuditSectionStatus): string {
  return SECTION_STATUS_LABELS[status];
}

export function buildAuditProgressSections(
  dossier: DossierPatrimonial,
  synthese: AuditLandingSyntheseCard,
  now: Date,
  engaged: boolean,
): AuditProgressSection[] {
  const completion = evaluateDossierPatrimonialCompletion(dossier, { now: now.toISOString() });
  const principal = synthese.principal;
  const conjoint = synthese.conjoint;
  const foyerMembers = [principal, conjoint].filter((membre): membre is AuditLandingMember =>
    Boolean(membre),
  );

  const situationStatus: AuditSectionStatus = !engaged
    ? 'vide'
    : synthese.situationLabel
      ? 'complet'
      : 'partiel';
  const filiationStatus: AuditSectionStatus = !synthese.filiationHasData
    ? 'vide'
    : principal && synthese.enfants.every((enfant) => enfant.prenom.trim().length > 0)
      ? 'complet'
      : 'partiel';
  const regimeStatus: AuditSectionStatus =
    dossier.regimeMatrimonial ||
    dossier.donationsSynthetiques.length > 0 ||
    dossier.testamentsSynthetiques.length > 0
      ? 'complet'
      : dossier.situationFamiliale.statut === 'marie'
        ? 'partiel'
        : 'vide';
  const professionalStatus = statusFromProfessionalData(foyerMembers);

  return [
    availableSection(
      'dossier',
      'Dossier',
      'F1',
      statusFromCompletion(completion.status),
      statusLabelFromCompletion(completion.status),
    ),
    availableSection(
      'foyer-famille',
      'Foyer & famille',
      'F1',
      aggregateStatus([situationStatus, filiationStatus, regimeStatus, professionalStatus]),
    ),
    gatedSection('societes-organigramme', 'Sociétés / organigramme', 'F5', {
      conditional: true,
    }),
    gatedSection('actifs-passifs', 'Actifs / passifs', 'F3', {
      isNavigable: true,
      statusLabel: 'Inventaire déclaratif',
    }),
    gatedSection('fiscalite', 'Fiscalité & budget', 'F1.1', {
      isNavigable: true,
      statusLabel: 'Déclaratif',
    }),
    gatedSection('prevoyance', 'Prévoyance', 'F3', { conditional: true }),
    gatedSection('succession', 'Succession', 'F3'),
    availableSection(
      'objectifs',
      'Objectifs',
      'F1',
      dossier.objectifs.length > 0 ? 'complet' : 'vide',
    ),
    gatedSection('synthese', 'Synthèse & projection', 'F6'),
  ];
}

export function buildStatusBar(
  progress: AuditProgressSection[],
  synthese: AuditLandingSyntheseCard,
  dossier: DossierPatrimonial,
  now: Date,
): AuditStatusBarViewModel {
  const completion = evaluateDossierPatrimonialCompletion(dossier, { now: now.toISOString() });
  const f1Sections = progress.filter(
    (section) => section.foundation === 'F1' && section.availability === 'available',
  );
  const f1Total = f1Sections.length || null;
  const f1Completed =
    f1Total == null ? null : f1Sections.filter((section) => section.status === 'complet').length;
  const sectionsToComplete = f1Sections.filter((section) => section.status !== 'complet').length;
  const pointsToComplete = Math.max(sectionsToComplete, completion.missingRequiredFields.length);

  return {
    f1Completed,
    f1Total,
    pointsToComplete,
    items: [
      {
        id: 'f1',
        label: 'Sections F1 renseignées',
        value: f1Completed == null || f1Total == null ? 'À compléter' : `${f1Completed}/${f1Total}`,
        tone: pointsToComplete === 0 ? 'success' : 'neutral',
      },
      {
        id: 'points',
        label: 'Champs F1 à compléter',
        value: pointsToComplete === 0 ? 'Aucun' : String(pointsToComplete),
        tone: pointsToComplete === 0 ? 'success' : 'warning',
      },
      {
        id: 'parts',
        label: 'Parts fiscales indicatives',
        value:
          synthese.partsFiscales == null
            ? 'À compléter'
            : `${formatParts(synthese.partsFiscales)} parts`,
        tone: synthese.partsFiscales == null ? 'muted' : 'neutral',
      },
      {
        id: 'ir',
        label: 'IR',
        value: 'Disponible',
        tone: 'success',
      },
      {
        id: 'patrimoine',
        label: 'Patrimoine',
        value: 'À venir',
        tone: 'muted',
      },
      {
        id: 'strategie',
        label: 'Stratégie',
        value: 'Verrouillée',
        tone: 'muted',
      },
    ],
  };
}

function availableSection(
  id: AuditProgressSectionId,
  label: string,
  foundation: AuditFoundation,
  status: AuditSectionStatus,
  explicitStatusLabel?: string,
): AuditProgressSection {
  return {
    id,
    label,
    foundation,
    availability: 'available',
    isNavigable: true,
    status,
    conditional: false,
    statusLabel: explicitStatusLabel ?? visibleAuditSectionStatusLabel(status),
  };
}

function gatedSection(
  id: AuditProgressSectionId,
  label: string,
  foundation: AuditFoundation,
  options: {
    conditional?: boolean;
    isNavigable?: boolean;
    statusLabel?: string;
  } = {},
): AuditProgressSection {
  return {
    id,
    label,
    foundation,
    availability: 'gated',
    isNavigable: options.isNavigable ?? false,
    status: null,
    conditional: options.conditional ?? false,
    statusLabel: options.statusLabel ?? 'À venir',
  };
}

function statusFromCompletion(status: DossierCompletionStatus): AuditSectionStatus {
  if (status === 'complete') return 'complet';
  if (status === 'partial') return 'partiel';
  return 'vide';
}

function statusLabelFromCompletion(status: DossierCompletionStatus): string {
  const label = DOSSIER_PATRIMONIAL_COMPLETION_LABELS[status];
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function statusFromProfessionalData(membres: AuditLandingMember[]): AuditSectionStatus {
  if (membres.length === 0) return 'vide';
  const completeCount = membres.filter(isProfessionalSituationComplete).length;
  if (completeCount === membres.length) return 'complet';
  return 'partiel';
}

function aggregateStatus(statuses: AuditSectionStatus[]): AuditSectionStatus {
  if (statuses.every((status) => status === 'complet')) return 'complet';
  if (statuses.every((status) => status === 'vide')) return 'vide';
  return 'partiel';
}

function formatParts(parts: number): string {
  return Number.isInteger(parts)
    ? String(parts)
    : parts
        .toFixed(2)
        .replace(/\.?0+$/, '')
        .replace('.', ',');
}
