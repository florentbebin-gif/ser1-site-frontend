import type { ReactElement } from 'react';

import type { AuditAvatarAppearance } from '@/domain/audit/types';

import type { AuditLandingAvatarKind } from '../auditLandingViewModel';
import { FAMILY_AVATAR_ASSETS, resolveFamilyAvatarVariant } from './familyAvatarAssets';

export const FOYER_AVATAR_ART_RADIUS = 115;

interface FoyerAvatarClipDefProps {
  clipId: string;
}

interface FoyerAvatarArtProps {
  kind: AuditLandingAvatarKind;
  clipId: string;
  appearance?: AuditAvatarAppearance;
}

export function FoyerAvatarClipDef({ clipId }: FoyerAvatarClipDefProps): ReactElement {
  return (
    <clipPath id={clipId}>
      <circle cx={0} cy={0} r={FOYER_AVATAR_ART_RADIUS} />
    </clipPath>
  );
}

export function FoyerAvatarArt({ kind, clipId, appearance }: FoyerAvatarArtProps): ReactElement {
  const variant = resolveFamilyAvatarVariant(kind, appearance);
  const diameter = FOYER_AVATAR_ART_RADIUS * 2;
  const ringRadius = FOYER_AVATAR_ART_RADIUS - 7;

  return (
    <>
      <circle
        cx={0}
        cy={0}
        r={FOYER_AVATAR_ART_RADIUS}
        fill="var(--audit-avatar-surface, var(--surface-card))"
      />
      <image
        data-avatar-variant={variant}
        href={FAMILY_AVATAR_ASSETS[variant]}
        x={-FOYER_AVATAR_ART_RADIUS}
        y={-FOYER_AVATAR_ART_RADIUS}
        width={diameter}
        height={diameter}
        preserveAspectRatio="xMidYMid meet"
        clipPath={`url(#${clipId})`}
      />
      <circle
        cx={0}
        cy={0}
        r={ringRadius}
        fill="none"
        stroke="var(--audit-avatar-ring, var(--border-strong))"
        strokeWidth={14}
      />
    </>
  );
}
