import {
  evaluateDossierPatrimonialCompletion,
  type DossierPatrimonial,
  type DossierRequiredField,
} from '@/domain/dossier';

import type { AuditLandingDestination } from './auditLandingViewModel';
import type { AuditProgressSection } from './auditLandingProgressViewModel';

export type AuditPointAConfirmerTone = 'warning' | 'danger';

export interface AuditPointAConfirmer {
  id: string;
  label: string;
  reason: string;
  action: { destination: AuditLandingDestination } | null;
  tone: AuditPointAConfirmerTone;
}

const REQUIRED_FIELD_POINTS: Record<DossierRequiredField, Omit<AuditPointAConfirmer, 'id'>> = {
  membre_principal: {
    label: 'Client principal à compléter',
    reason: 'Prénom, nom et date de naissance sont requis pour consolider le socle F1.',
    action: { destination: 'dossier' },
    tone: 'warning',
  },
  objectifs_prioritaires: {
    label: 'Objectifs client à définir',
    reason: 'Aucun objectif prioritaire n’est consigné dans le dossier.',
    action: { destination: 'objectifs' },
    tone: 'warning',
  },
};

const SECTION_DESTINATIONS: Partial<Record<string, AuditLandingDestination>> = {
  dossier: 'dossier',
  'situation-familiale': 'dossier',
  filiation: 'dossier',
  'regime-donations': 'civil',
  'situation-professionnelle': 'dossier',
  objectifs: 'objectifs',
  synthese: 'dossier',
};

const REGIME_REQUIRED_STATUTS = new Set(['marie', 'pacse']);

export function buildAuditPointsAConfirmer(
  dossier: DossierPatrimonial,
  progress: AuditProgressSection[],
  now: Date,
): AuditPointAConfirmer[] {
  const completion = evaluateDossierPatrimonialCompletion(dossier, { now: now.toISOString() });
  const points: AuditPointAConfirmer[] = completion.missingRequiredFields.map((field) => ({
    id: `required-${field}`,
    ...REQUIRED_FIELD_POINTS[field],
  }));

  if (
    REGIME_REQUIRED_STATUTS.has(dossier.situationFamiliale.statut) &&
    !dossier.regimeMatrimonial
  ) {
    points.push({
      id: 'regime-matrimonial',
      label: 'Régime matrimonial à confirmer',
      reason: 'Le foyer est marié ou pacsé, mais le régime matrimonial n’est pas renseigné.',
      action: { destination: 'civil' },
      tone: 'warning',
    });
  }

  for (const section of progress) {
    if (
      section.availability !== 'available' ||
      section.foundation !== 'F1' ||
      (section.status !== 'a-verifier' && section.status !== 'alerte')
    ) {
      continue;
    }

    const destination = SECTION_DESTINATIONS[section.id];

    points.push({
      id: `section-${section.id}`,
      label: `${section.label} à vérifier`,
      reason: section.statusLabel,
      action: destination ? { destination } : null,
      tone: section.status === 'alerte' ? 'danger' : 'warning',
    });
  }

  return dedupePoints(points);
}

function dedupePoints(points: AuditPointAConfirmer[]): AuditPointAConfirmer[] {
  const seen = new Set<string>();
  return points.filter((point) => {
    if (seen.has(point.id)) return false;
    seen.add(point.id);
    return true;
  });
}
