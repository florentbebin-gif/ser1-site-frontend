import type { AuditAvatarAge, AuditAvatarAppearance, AuditAvatarKind } from '@/domain/audit/types';

export type AuditAvatarSubject = 'adulte' | 'enfant';

export interface AuditAvatarVariant {
  id: string;
  kind: AuditAvatarKind;
  appearance: AuditAvatarAppearance;
}

export interface AuditAvatarSelection {
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

export function nextAvatarVariant({
  kind,
  appearance,
  subject,
  direction,
}: {
  kind: AuditAvatarKind | undefined;
  appearance: AuditAvatarAppearance | undefined;
  subject: AuditAvatarSubject;
  direction: 1 | -1;
}): AuditAvatarSelection {
  const options = optionsForAvatarSubject(subject);
  const current = {
    kind: normalizeAvatarKind(kind, subject),
    appearance: normalizeAvatarAppearance(appearance, subject),
  };
  const currentIndex = options.findIndex((option) => sameVariant(option, current));
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (safeIndex + direction + options.length) % options.length;
  const next = options[nextIndex] ?? options[0]!;
  return { kind: next.kind, appearance: next.appearance };
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

function sameVariant(first: AuditAvatarSelection, second: AuditAvatarSelection): boolean {
  return (
    first.kind === second.kind &&
    first.appearance.skinTone === second.appearance.skinTone &&
    first.appearance.age === second.appearance.age
  );
}

function normalizeAvatarAge(age: AuditAvatarAge | undefined): AuditAvatarAge {
  return age === 'senior' ? 'senior' : 'adulte';
}
