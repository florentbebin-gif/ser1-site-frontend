import type { AuditAvatarKind, PersonCivilite } from '@/domain/audit/types';
import type { DossierMembre } from '@/domain/dossier';

type AuditLandingMemberRoleForAvatar = 'principal' | 'conjoint' | 'enfant' | 'proche';

export function inferAvatarKind(
  role: AuditLandingMemberRoleForAvatar,
  civilite?: PersonCivilite,
  lienParente?: DossierMembre['lienParente'],
): AuditAvatarKind {
  if (role === 'enfant' || lienParente === 'petit_enfant') return childAvatarKind(civilite);
  if (civilite === 'madame') return 'femme';
  if (civilite === 'monsieur') return 'homme';
  return role === 'conjoint' ? 'femme' : 'homme';
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

function childAvatarKind(civilite: PersonCivilite | undefined): AuditAvatarKind {
  return civilite === 'madame' ? 'fille' : 'garcon';
}
