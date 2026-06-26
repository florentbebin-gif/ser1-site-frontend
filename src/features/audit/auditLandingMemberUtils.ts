import type { AuditAvatarKind } from '@/domain/audit/types';
import type { DossierMembre } from '@/domain/dossier';

type AuditLandingMemberRoleForAvatar = 'principal' | 'conjoint' | 'enfant' | 'proche';

export function inferAvatarKind(
  role: AuditLandingMemberRoleForAvatar,
  label: string,
  lienParente?: DossierMembre['lienParente'],
): AuditAvatarKind {
  if (role === 'principal') return 'homme';
  if (role === 'conjoint') return 'femme';
  if (role === 'proche' && lienParente !== 'petit_enfant') return inferAdultAvatarKind(label);

  const normalized = normalizeFirstName(label);
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
    'noe',
    'paul',
    'pierre',
    'thomas',
    'tom',
  ]);

  if (feminineFirstNames.has(normalized)) return 'fille';
  if (masculineFirstNames.has(normalized)) return 'garcon';
  return normalized.endsWith('a') || normalized.endsWith('e') ? 'fille' : 'garcon';
}

export function computeAge(dateNaissance: string | undefined, now: Date): number | null {
  if (!dateNaissance?.trim()) return null;
  const birth = new Date(dateNaissance);
  if (Number.isNaN(birth.getTime())) return null;
  let age = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

function inferAdultAvatarKind(label: string): AuditAvatarKind {
  const normalized = normalizeFirstName(label);
  const feminineFirstNames = new Set(['alice', 'anne', 'camille', 'claire', 'marie', 'sophie']);
  const masculineFirstNames = new Set(['jean', 'marc', 'paul', 'pierre', 'thomas']);
  if (feminineFirstNames.has(normalized)) return 'femme';
  if (masculineFirstNames.has(normalized)) return 'homme';
  return normalized.endsWith('a') || normalized.endsWith('e') ? 'femme' : 'homme';
}

function normalizeFirstName(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
