import type { ReactElement } from 'react';

import type { AuditAvatarAppearance, ProcheLien } from '@/domain/audit/types';

import type { AuditLandingAvatarKind } from '../auditLandingViewModel';

import { FOYER_AVATAR_ART_RADIUS, FoyerAvatarArt } from './FoyerAvatarArt';

export type FiliationNodeVariant = 'parent' | 'enfant' | 'proche';

export interface FiliationNode {
  x: number;
  label: string;
  sublabel: string | null;
  variant: FiliationNodeVariant;
  avatarKind: AuditLandingAvatarKind;
  avatarAppearance?: AuditAvatarAppearance;
  memberId: string;
  localId?: string;
  estCommun?: boolean;
  parentPrincipal?: 'client' | 'conjoint';
  lienParente?: ProcheLien;
  parentEnfantId?: string;
  rattachementBranche?: string;
}

export function FiliationPill({
  node,
  y,
  width,
  height,
  clipId,
  compact,
}: {
  node: FiliationNode;
  y: number;
  width: number;
  height: number;
  clipId: string;
  compact: boolean;
}): ReactElement {
  const avatarCx = compact ? node.x + 22 : node.x + width / 2;
  const avatarCy = compact ? y + height / 2 : y + 16;
  const textX = compact ? node.x + width / 2 + 12 : node.x + width / 2;
  return (
    <g
      className={`audit-fil__node audit-fil__node--${node.variant} audit-fil__node--${node.avatarKind}`}
    >
      <rect x={round(node.x)} y={y} width={round(width)} height={height} rx={height / 2} />
      <FiliationAvatar
        kind={node.avatarKind}
        appearance={node.avatarAppearance}
        cx={avatarCx}
        cy={avatarCy}
        clipId={clipId}
        compact={compact}
      />
      <text
        className="audit-fil__name"
        x={round(textX)}
        y={compact ? y + height / 2 - 5 : y + height - 9}
        dominantBaseline="central"
        textAnchor="middle"
      >
        {node.label}
      </text>
      {compact && node.sublabel ? (
        <text
          className="audit-fil__age"
          x={round(textX)}
          y={y + height / 2 + 10}
          dominantBaseline="central"
          textAnchor="middle"
        >
          {node.sublabel}
        </text>
      ) : null}
    </g>
  );
}

function FiliationAvatar({
  kind,
  appearance,
  cx,
  cy,
  clipId,
  compact,
}: {
  kind: AuditLandingAvatarKind;
  appearance?: AuditAvatarAppearance;
  cx: number;
  cy: number;
  clipId: string;
  compact: boolean;
}): ReactElement {
  const scale = (compact ? 10 : 12) / FOYER_AVATAR_ART_RADIUS;

  return (
    <g
      className={`audit-fil__avatar audit-fil__avatar--${kind}`}
      transform={`translate(${round(cx)} ${round(cy)}) scale(${scale})`}
    >
      <g className={`audit-fil__avatar-image audit-fil__avatar-image--${kind}`}>
        <FoyerAvatarArt kind={kind} clipId={clipId} appearance={appearance} />
      </g>
    </g>
  );
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
