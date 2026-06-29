import type { AuditAvatarAppearance } from '@/domain/audit/types';

import type { AuditLandingAvatarKind } from '../auditLandingViewModel';
import avatarBoyOutline from '../assets/avatars/avatar-boy-outline.png';
import avatarGirlOutline from '../assets/avatars/avatar-girl-outline.png';
import avatarGrandfatherOutline from '../assets/avatars/avatar-grandfather-outline.png';
import avatarGrandmotherOutline from '../assets/avatars/avatar-grandmother-outline.png';
import avatarManOutline from '../assets/avatars/avatar-man-outline.png';
import avatarWomanOutline from '../assets/avatars/avatar-woman-outline.png';

export type FamilyAvatarVariant = 'man' | 'woman' | 'boy' | 'girl' | 'grandfather' | 'grandmother';

export const FAMILY_AVATAR_ASSETS = {
  man: avatarManOutline,
  woman: avatarWomanOutline,
  boy: avatarBoyOutline,
  girl: avatarGirlOutline,
  grandfather: avatarGrandfatherOutline,
  grandmother: avatarGrandmotherOutline,
} satisfies Record<FamilyAvatarVariant, string>;

export const FAMILY_AVATAR_LABELS = {
  man: 'Homme',
  woman: 'Femme',
  boy: 'Garçon',
  girl: 'Fille',
  grandfather: 'Grand-père',
  grandmother: 'Grand-mère',
} satisfies Record<FamilyAvatarVariant, string>;

export function resolveFamilyAvatarVariant(
  kind: AuditLandingAvatarKind,
  appearance?: AuditAvatarAppearance,
): FamilyAvatarVariant {
  if (kind === 'homme') return appearance?.age === 'senior' ? 'grandfather' : 'man';
  if (kind === 'femme') return appearance?.age === 'senior' ? 'grandmother' : 'woman';
  if (kind === 'garcon') return 'boy';
  return 'girl';
}
