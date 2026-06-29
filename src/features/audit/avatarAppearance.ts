import type { AuditAvatarAge, AuditAvatarAppearance, AuditAvatarKind } from '@/domain/audit/types';

export type AuditAvatarSubject = 'adulte' | 'enfant';

export interface AuditAvatarChoice {
  id: string;
  kind: AuditAvatarKind;
  age: AuditAvatarAge;
  label: string;
}

export const DEFAULT_AUDIT_AVATAR_APPEARANCE: AuditAvatarAppearance = {
  skinTone: 'clair',
  age: 'adulte',
};

const ADULT_CHOICES: AuditAvatarChoice[] = [
  avatarChoice('homme', 'adulte', 'Homme'),
  avatarChoice('femme', 'adulte', 'Femme'),
  avatarChoice('homme', 'senior', 'Grand-père'),
  avatarChoice('femme', 'senior', 'Grand-mère'),
];

const CHILD_CHOICES: AuditAvatarChoice[] = [
  avatarChoice('garcon', 'adulte', 'Garçon', 'garcon'),
  avatarChoice('fille', 'adulte', 'Fille', 'fille'),
];

export function normalizeAvatarAppearance(
  appearance: AuditAvatarAppearance | undefined,
  subject: AuditAvatarSubject,
): AuditAvatarAppearance {
  const normalized: AuditAvatarAppearance = {
    skinTone: appearance?.skinTone === 'fonce' ? 'fonce' : 'clair',
    age: normalizeAvatarAge(appearance?.age),
  };

  if (subject === 'enfant') return { ...normalized, age: 'adulte' };
  return normalized;
}

export function normalizeAvatarKind(
  kind: AuditAvatarKind | undefined,
  subject: AuditAvatarSubject,
): AuditAvatarKind {
  if (kind && optionsForAvatarSubject(subject).some((option) => option.kind === kind)) return kind;
  return subject === 'enfant' ? 'fille' : 'homme';
}

export function optionsForAvatarSubject(subject: AuditAvatarSubject): AuditAvatarChoice[] {
  return subject === 'adulte' ? ADULT_CHOICES : CHILD_CHOICES;
}

export function appearanceForAvatarChoice(
  choice: AuditAvatarChoice | undefined,
  currentAppearance: AuditAvatarAppearance | undefined,
): AuditAvatarAppearance {
  const normalized = normalizeAvatarAppearance(currentAppearance, 'adulte');
  return {
    skinTone: normalized.skinTone,
    age: choice?.age ?? DEFAULT_AUDIT_AVATAR_APPEARANCE.age,
  };
}

function avatarChoice(
  kind: AuditAvatarKind,
  age: AuditAvatarAge,
  label: string,
  id = `${kind}-${age}`,
): AuditAvatarChoice {
  return {
    id,
    kind,
    age,
    label,
  };
}

function normalizeAvatarAge(age: AuditAvatarAge | undefined): AuditAvatarAge {
  return age === 'senior' ? 'senior' : 'adulte';
}
