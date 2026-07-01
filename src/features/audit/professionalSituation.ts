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

const PROFESSION_DISPLAY_OVERRIDES = new Map<string, string>([
  ['caissiere', 'Caissière'],
  ['radiologue', 'Radiologue'],
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

export function formatProfessionLabel(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const normalizedKey = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR');
  const override = PROFESSION_DISPLAY_OVERRIDES.get(normalizedKey);
  if (override) return override;

  if (
    trimmed === trimmed.toLocaleUpperCase('fr-FR') ||
    trimmed === trimmed.toLocaleLowerCase('fr-FR')
  ) {
    return toSentenceCase(trimmed);
  }

  return trimmed;
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

function toSentenceCase(value: string): string {
  const lower = value.toLocaleLowerCase('fr-FR');
  return `${lower.charAt(0).toLocaleUpperCase('fr-FR')}${lower.slice(1)}`;
}
