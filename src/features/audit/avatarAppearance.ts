import type { AuditAvatarAge, AuditAvatarAppearance, AuditAvatarKind } from '@/domain/audit/types';

export type AuditAvatarSubject = 'adulte' | 'enfant';

export interface AuditAvatarVariant {
  id: string;
  kind: AuditAvatarKind;
  appearance: AuditAvatarAppearance;
}

export const DEFAULT_AUDIT_AVATAR_APPEARANCE: AuditAvatarAppearance = {
  skinTone: 'clair',
  age: 'adulte',
};

const ADULT_VARIANTS: AuditAvatarVariant[] = [
  avatarVariant('homme', 'clair', 'adulte'),
  avatarVariant('homme', 'fonce', 'adulte'),
  avatarVariant('homme', 'clair', 'senior'),
  avatarVariant('homme', 'fonce', 'senior'),
  avatarVariant('femme', 'clair', 'adulte'),
  avatarVariant('femme', 'fonce', 'adulte'),
  avatarVariant('femme', 'clair', 'senior'),
  avatarVariant('femme', 'fonce', 'senior'),
];

const CHILD_AND_CLOSE_VARIANTS: AuditAvatarVariant[] = [
  avatarVariant('garcon', 'clair', 'adulte'),
  avatarVariant('garcon', 'fonce', 'adulte'),
  avatarVariant('fille', 'clair', 'adulte'),
  avatarVariant('fille', 'fonce', 'adulte'),
  avatarVariant('homme', 'clair', 'adulte'),
  avatarVariant('homme', 'fonce', 'adulte'),
  avatarVariant('femme', 'clair', 'adulte'),
  avatarVariant('femme', 'fonce', 'adulte'),
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

export function optionsForAvatarSubject(subject: AuditAvatarSubject): AuditAvatarVariant[] {
  return subject === 'adulte' ? ADULT_VARIANTS : CHILD_AND_CLOSE_VARIANTS;
}

function avatarVariant(
  kind: AuditAvatarKind,
  skinTone: AuditAvatarAppearance['skinTone'],
  age: AuditAvatarAge,
): AuditAvatarVariant {
  return {
    id: `${kind}-${skinTone}-${age}`,
    kind,
    appearance: { skinTone, age },
  };
}

function normalizeAvatarAge(age: AuditAvatarAge | undefined): AuditAvatarAge {
  return age === 'senior' ? 'senior' : 'adulte';
}
