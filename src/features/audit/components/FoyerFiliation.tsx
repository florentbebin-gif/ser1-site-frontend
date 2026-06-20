/**
 * FoyerFiliation — schéma de filiation premium dérivé du dossier F1.
 *
 * SVG autonome (connecteurs en courbes de Bézier, pastilles de largeur égale,
 * avatars PNG importés). Lecture seule : seuls les membres réellement présents
 * dans le dossier sont rendus. La distinction fine des enfants d'une première
 * union sera reprise plus tard (voir roadmap famille).
 */

import type { ReactElement } from 'react';

import avatarFemmeUrl from '@/assets/audit/avatars/avatar-femme.png';
import avatarFilleUrl from '@/assets/audit/avatars/avatar-fille.png';
import avatarGarconUrl from '@/assets/audit/avatars/avatar-garcon.png';
import avatarHommeUrl from '@/assets/audit/avatars/avatar-homme.png';

import type { AuditLandingAvatarKind, AuditLandingMember } from '../auditLandingViewModel';

interface FoyerFiliationProps {
  principal: AuditLandingMember | null;
  conjoint: AuditLandingMember | null;
  enfants: AuditLandingMember[];
  hasData: boolean;
}

const PILL_HEIGHT = 42;
const AVATAR_R = 12;
const AVATAR_IMAGE_SIZE = AVATAR_R * 2;
const Y_PARENTS = 12;
const Y_CHILDREN = 108;
const BOND_GAP = 20;
const CHILD_GAP = 12;
const MARGIN = 8;
const AVATAR_URLS: Record<AuditLandingAvatarKind, string> = {
  homme: avatarHommeUrl,
  femme: avatarFemmeUrl,
  garcon: avatarGarconUrl,
  fille: avatarFilleUrl,
};
type NodeVariant = 'parent' | 'enfant';

interface LaidOutNode {
  x: number;
  label: string;
  variant: NodeVariant;
  avatarKind: AuditLandingAvatarKind;
}

export function FoyerFiliation({
  principal,
  conjoint,
  enfants,
  hasData,
}: FoyerFiliationProps): ReactElement {
  if (!hasData) {
    return <p className="audit-tile__empty">Filiation à renseigner</p>;
  }

  const parents = [principal, conjoint].filter((member): member is AuditLandingMember =>
    Boolean(member),
  );
  const labels = [...parents, ...enfants].map((member) => member.prenom);
  const pillWidth = clamp(66, Math.max(...labels.map((label) => label.length)) * 6.2 + 30, 86);

  const parentsWidth =
    parents.length === 2 ? pillWidth * 2 + BOND_GAP : parents.length === 1 ? pillWidth : 0;
  const childrenWidth =
    enfants.length > 0 ? enfants.length * pillWidth + (enfants.length - 1) * CHILD_GAP : 0;
  const innerWidth = Math.max(parentsWidth, childrenWidth, pillWidth);
  const width = innerWidth + MARGIN * 2;
  const height =
    enfants.length > 0 ? Y_CHILDREN + PILL_HEIGHT + MARGIN : Y_PARENTS + PILL_HEIGHT + MARGIN;

  const parentNodes: LaidOutNode[] = [];
  const parentsStart = (width - parentsWidth) / 2;
  parents.forEach((member, index) => {
    parentNodes.push({
      x: parentsStart + index * (pillWidth + BOND_GAP),
      label: member.prenom,
      variant: 'parent',
      avatarKind: member.avatarKind,
    });
  });

  const childNodes: LaidOutNode[] = [];
  const childrenStart = (width - childrenWidth) / 2;
  enfants.forEach((member, index) => {
    childNodes.push({
      x: childrenStart + index * (pillWidth + CHILD_GAP),
      label: member.prenom,
      variant: 'enfant',
      avatarKind: member.avatarKind,
    });
  });

  const junctionX = width / 2;
  const junctionY = Y_PARENTS + PILL_HEIGHT;
  const childTopY = Y_CHILDREN;
  const [parentA, parentB] = parentNodes;

  return (
    <svg
      className="audit-fil"
      viewBox={`0 0 ${round(width)} ${round(height)}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Schéma de filiation du foyer"
    >
      {parentA && parentB && (
        <path
          className="audit-fil__edge"
          d={`M ${round(parentA.x + pillWidth)} ${Y_PARENTS + PILL_HEIGHT / 2} H ${round(parentB.x)}`}
        />
      )}

      {childNodes.map((node, index) => {
        const cx = node.x + pillWidth / 2;
        const c1 = junctionY + (childTopY - junctionY) * 0.45;
        const c2 = childTopY - (childTopY - junctionY) * 0.45;
        return (
          <path
            key={`edge-${index}`}
            className="audit-fil__edge"
            d={`M ${round(junctionX)} ${junctionY} C ${round(junctionX)} ${round(c1)} ${round(cx)} ${round(c2)} ${round(cx)} ${childTopY}`}
          />
        );
      })}

      {[
        ...parentNodes.map((node) => ({ node, y: Y_PARENTS })),
        ...childNodes.map((node) => ({ node, y: Y_CHILDREN })),
      ].map(({ node, y }, index) => (
        <FiliationPill key={`node-${index}`} node={node} y={y} width={pillWidth} />
      ))}
    </svg>
  );
}

interface FiliationPillProps {
  node: LaidOutNode;
  y: number;
  width: number;
}

function FiliationPill({ node, y, width }: FiliationPillProps): ReactElement {
  const avatarCx = node.x + width / 2;
  const avatarCy = y + AVATAR_R + 4;
  return (
    <g
      className={`audit-fil__node audit-fil__node--${node.variant} audit-fil__node--${node.avatarKind}`}
    >
      <rect
        x={round(node.x)}
        y={y}
        width={round(width)}
        height={PILL_HEIGHT}
        rx={PILL_HEIGHT / 2}
      />
      <FiliationAvatar kind={node.avatarKind} cx={avatarCx} cy={avatarCy} />
      <text
        className="audit-fil__name"
        x={round(node.x + width / 2)}
        y={y + PILL_HEIGHT - 9}
        dominantBaseline="central"
        textAnchor="middle"
      >
        {node.label}
      </text>
    </g>
  );
}

interface FiliationAvatarProps {
  kind: AuditLandingAvatarKind;
  cx: number;
  cy: number;
}

function FiliationAvatar({ kind, cx, cy }: FiliationAvatarProps): ReactElement {
  const imageX = cx - AVATAR_IMAGE_SIZE / 2;
  const imageY = cy - AVATAR_IMAGE_SIZE / 2;

  return (
    <g className={`audit-fil__avatar audit-fil__avatar--${kind}`}>
      <image
        className={`audit-fil__avatar-image audit-fil__avatar-image--${kind}`}
        href={AVATAR_URLS[kind]}
        x={round(imageX)}
        y={round(imageY)}
        width={round(AVATAR_IMAGE_SIZE)}
        height={round(AVATAR_IMAGE_SIZE)}
        preserveAspectRatio="xMidYMid meet"
      />
    </g>
  );
}

function clamp(min: number, value: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export default FoyerFiliation;
