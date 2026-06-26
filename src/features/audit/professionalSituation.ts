import type { PersonInfo, StatutSocial } from '@/domain/audit/types';

export interface ProfessionalSituationLike {
  profession?: string | null;
  statutSocial?: StatutSocial | null;
}

const STATUTS_SANS_PROFESSION = new Set<StatutSocial>([
  'chomage',
  'maladie_invalidite',
  'retraite',
  'militaire',
  'sans_activite',
]);

export function shouldShowProfessionForStatut(
  statutSocial: StatutSocial | null | undefined,
): boolean {
  return Boolean(statutSocial && !STATUTS_SANS_PROFESSION.has(statutSocial));
}

export function isProfessionalSituationComplete(person: ProfessionalSituationLike): boolean {
  if (!person.statutSocial) return false;
  if (!shouldShowProfessionForStatut(person.statutSocial)) return true;
  return Boolean(person.profession?.trim());
}

export function professionalSituationMissingLabel(
  person: PersonInfo,
  fallbackName: string,
): string {
  const suffix = fallbackName.toLowerCase();
  if (!person.statutSocial) return `Statut professionnel ${suffix}`;
  if (shouldShowProfessionForStatut(person.statutSocial)) return `Profession (libellé) ${suffix}`;
  return `Situation professionnelle ${suffix}`;
}
