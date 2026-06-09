/**
 * FoyerFiliation — schéma de filiation premium dérivé du dossier F1.
 *
 * SVG autonome (connecteurs en courbes de Bézier, pastilles de largeur égale,
 * micro-avatars à initiale). Lecture seule : seuls les membres réellement
 * présents dans le dossier sont rendus. La distinction fine des enfants d'une
 * première union sera reprise plus tard (voir roadmap famille).
 */

import type { ReactElement } from 'react';

import type { AuditLandingMember } from '../auditLandingViewModel';

interface FoyerFiliationProps {
  principal: AuditLandingMember | null;
  conjoint: AuditLandingMember | null;
  enfants: AuditLandingMember[];
  hasData: boolean;
}

const PILL_HEIGHT = 30;
const AVATAR_R = 9;
const Y_PARENTS = 12;
const Y_CHILDREN = 92;
const BOND_GAP = 20;
const CHILD_GAP = 12;
const MARGIN = 8;

type NodeVariant = 'parent' | 'enfant';

interface LaidOutNode {
  x: number;
  label: string;
  initial: string;
  variant: NodeVariant;
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
  const pillWidth = clamp(78, Math.max(...labels.map((label) => label.length)) * 7.2 + 34, 150);

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
      initial: initialOf(member.prenom),
      variant: 'parent',
    });
  });

  const childNodes: LaidOutNode[] = [];
  const childrenStart = (width - childrenWidth) / 2;
  enfants.forEach((member, index) => {
    childNodes.push({
      x: childrenStart + index * (pillWidth + CHILD_GAP),
      label: member.prenom,
      initial: initialOf(member.prenom),
      variant: 'enfant',
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
  const avatarCx = node.x + 6 + AVATAR_R;
  const avatarCy = y + PILL_HEIGHT / 2;
  return (
    <g className={`audit-fil__node audit-fil__node--${node.variant}`}>
      <rect
        x={round(node.x)}
        y={y}
        width={round(width)}
        height={PILL_HEIGHT}
        rx={PILL_HEIGHT / 2}
      />
      <circle className="audit-fil__avatar" cx={round(avatarCx)} cy={avatarCy} r={AVATAR_R} />
      <text
        className="audit-fil__initial"
        x={round(avatarCx)}
        y={avatarCy}
        dominantBaseline="central"
        textAnchor="middle"
      >
        {node.initial}
      </text>
      <text
        className="audit-fil__name"
        x={round(avatarCx + AVATAR_R + 6)}
        y={avatarCy}
        dominantBaseline="central"
      >
        {node.label}
      </text>
    </g>
  );
}

function initialOf(label: string): string {
  return label.trim().charAt(0).toUpperCase() || '—';
}

function clamp(min: number, value: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export default FoyerFiliation;
