import {
  DOSSIER_PATRIMONIAL_COMPLETION_LABELS,
  evaluateDossierPatrimonialCompletion,
  type DossierCompletionStatus,
  type DossierPatrimonial,
} from '@/domain/dossier';

import type { AuditLandingMember, AuditLandingSyntheseCard } from './auditLandingViewModel';

export type AuditSectionStatus =
  | 'vide'
  | 'partiel'
  | 'complet'
  | 'a-verifier'
  | 'alerte'
  | 'masque';

export type AuditSectionAvailability = 'available' | 'gated';
export type AuditFoundation = 'F1' | 'F1.1' | 'F2' | 'F3' | 'F5' | 'F6';

export interface AuditProgressSection {
  id: string;
  label: string;
  foundation: AuditFoundation;
  availability: AuditSectionAvailability;
  status: AuditSectionStatus | null;
  conditional: boolean;
  statusLabel: string;
}

export type AuditStatusBarItemId = 'f1' | 'points' | 'parts' | 'calculs' | 'strategie';
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

const TAX_COUPLE_STATUTS = new Set(['marie', 'pacse']);

const SECTION_STATUS_LABELS: Record<AuditSectionStatus, string> = {
  vide: 'À compléter',
  partiel: 'Partiel',
  complet: 'Complet',
  'a-verifier': 'À vérifier',
  alerte: 'Alerte',
  masque: 'Masqué',
};

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

  return [
    availableSection(
      'dossier',
      'Dossier',
      'F1',
      statusFromCompletion(completion.status),
      statusLabelFromCompletion(completion.status),
    ),
    availableSection(
      'situation-familiale',
      'Situation familiale',
      'F1',
      !engaged ? 'vide' : synthese.situationLabel ? 'complet' : 'partiel',
    ),
    availableSection(
      'filiation',
      'Filiation',
      'F1',
      !synthese.filiationHasData
        ? 'vide'
        : principal && synthese.enfants.every((enfant) => enfant.prenom.trim().length > 0)
          ? 'complet'
          : 'partiel',
    ),
    availableSection(
      'regime-donations',
      'Régime matrimonial & donations',
      'F1',
      dossier.regimeMatrimonial || dossier.donationsSynthetiques.length > 0
        ? 'complet'
        : TAX_COUPLE_STATUTS.has(dossier.situationFamiliale.statut)
          ? 'partiel'
          : 'vide',
    ),
    availableSection(
      'situation-professionnelle',
      'Situation professionnelle',
      'F1',
      statusFromProfessionalData(foyerMembers),
    ),
    gatedSection('budget-capacite', 'Budget & capacité', 'F1.1'),
    gatedSection('societes-organigramme', 'Sociétés / organigramme', 'F5', true),
    gatedSection('patrimoine', 'Patrimoine', 'F3'),
    gatedSection('actifs', 'Actifs', 'F3'),
    gatedSection('passifs', 'Passifs', 'F3'),
    gatedSection('fiscalite', 'Fiscalité', 'F1.1'),
    gatedSection('ifi-conditionnel', 'IFI conditionnel', 'F3', true),
    gatedSection('succession', 'Succession', 'F3'),
    gatedSection('prevoyance', 'Prévoyance', 'F3', true),
    gatedSection('retraite', 'Retraite', 'F1.1', true),
    gatedSection('placements', 'Placements', 'F3'),
    availableSection(
      'objectifs',
      'Objectifs',
      'F1',
      dossier.objectifs.length > 0 ? 'complet' : 'vide',
    ),
    availableSection(
      'synthese',
      'Synthèse',
      'F1',
      statusFromCompletion(completion.status),
      statusLabelFromCompletion(completion.status),
    ),
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
        label: 'Dossier renseigné',
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
        id: 'calculs',
        label: 'IR · Patrimoine',
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
  id: string,
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
    status,
    conditional: false,
    statusLabel: explicitStatusLabel ?? SECTION_STATUS_LABELS[status],
  };
}

function gatedSection(
  id: string,
  label: string,
  foundation: AuditFoundation,
  conditional = false,
): AuditProgressSection {
  return {
    id,
    label,
    foundation,
    availability: 'gated',
    status: null,
    conditional,
    statusLabel: 'À venir',
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
  const professionsCount = membres.filter((membre) => membre.profession).length;
  if (professionsCount === membres.length) return 'complet';
  if (professionsCount > 0 || membres.length > 0) return 'partiel';
  return 'vide';
}

function formatParts(parts: number): string {
  return Number.isInteger(parts)
    ? String(parts)
    : parts
        .toFixed(2)
        .replace(/\.?0+$/, '')
        .replace('.', ',');
}
