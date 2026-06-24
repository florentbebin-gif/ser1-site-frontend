/**
 * FoyerFiliation — schéma de filiation premium dérivé du dossier F1.
 *
 * SVG autonome (connecteurs en courbes de Bézier, pastilles de largeur égale,
 * avatars vectoriels {@link FoyerAvatarArt}). Lecture seule : seuls les membres
 * réellement présents dans le dossier sont rendus. Le mode compact ajoute un
 * marqueur visuel pour distinguer les enfants communs des enfants d'une union
 * précédente sans introduire de calcul métier.
 */

import { useId, type ReactElement } from 'react';

import type { AuditAvatarAppearance } from '@/domain/audit/types';

import type { AuditLandingAvatarKind, AuditLandingMember } from '../auditLandingViewModel';

import { FOYER_AVATAR_ART_RADIUS, FoyerAvatarArt, FoyerAvatarClipDef } from './FoyerAvatarArt';

interface FoyerFiliationProps {
  principal: AuditLandingMember | null;
  conjoint: AuditLandingMember | null;
  enfants: AuditLandingMember[];
  hasData: boolean;
  mode?: 'landing' | 'compact';
}

const PILL_HEIGHT = 42;
const AVATAR_R = 12;
const Y_PARENTS = 12;
const Y_CHILDREN = 108;
const BOND_GAP = 20;
const CHILD_GAP = 12;
const MARGIN = 8;
type NodeVariant = 'parent' | 'enfant';

interface LaidOutNode {
  x: number;
  label: string;
  sublabel: string | null;
  variant: NodeVariant;
  avatarKind: AuditLandingAvatarKind;
  avatarAppearance?: AuditAvatarAppearance;
  estCommun?: boolean;
  parentPrincipal?: 'client' | 'conjoint';
}

export function FoyerFiliation({
  principal,
  conjoint,
  enfants,
  hasData,
  mode = 'landing',
}: FoyerFiliationProps): ReactElement {
  const clipId = useId();
  const isCompact = mode === 'compact';

  if (!hasData) {
    return <p className="audit-tile__empty">Filiation à renseigner</p>;
  }

  const parents = [principal, conjoint].filter((member): member is AuditLandingMember =>
    Boolean(member),
  );
  const labels = [...parents, ...enfants].flatMap((member) => [
    labelForMember(member, member.role === 'enfant' ? 'enfant' : 'parent', isCompact),
    ageLabel(member),
  ]);
  const pillWidth = isCompact
    ? clamp(132, Math.max(...labels.map((label) => label.length)) * 5.8 + 58, 172)
    : clamp(66, Math.max(...labels.map((label) => label.length)) * 6.2 + 30, 86);
  const pillHeight = isCompact ? 54 : PILL_HEIGHT;
  const yChildren = isCompact ? 128 : Y_CHILDREN;

  const parentsWidth =
    parents.length === 2 ? pillWidth * 2 + BOND_GAP : parents.length === 1 ? pillWidth : 0;
  const commonMembers = enfants.filter((member) => member.estCommun);
  const clientPreviousMembers = enfants.filter(
    (member) => !member.estCommun && member.parentPrincipal !== 'conjoint',
  );
  const conjointPreviousMembers = enfants.filter(
    (member) => !member.estCommun && member.parentPrincipal === 'conjoint',
  );
  const commonWidth = groupWidth(commonMembers.length, pillWidth);
  const clientPreviousWidth = groupWidth(clientPreviousMembers.length, pillWidth);
  const conjointPreviousWidth = groupWidth(conjointPreviousMembers.length, pillWidth);
  const sideWidth = Math.max(
    clientPreviousWidth ? clientPreviousWidth + CHILD_GAP : 0,
    conjointPreviousWidth ? conjointPreviousWidth + CHILD_GAP : 0,
  );
  const centeredChildrenWidth =
    commonWidth > 0
      ? commonWidth + sideWidth * 2
      : clientPreviousWidth +
        conjointPreviousWidth +
        (clientPreviousWidth > 0 && conjointPreviousWidth > 0 ? CHILD_GAP : 0);
  const childrenWidth = enfants.length > 0 ? centeredChildrenWidth : 0;
  const groupPadding = isCompact && commonMembers.length > 0 ? 12 : 0;
  const innerWidth = Math.max(parentsWidth, childrenWidth, pillWidth);
  const width = innerWidth + MARGIN * 2 + groupPadding * 2;
  const height =
    enfants.length > 0
      ? yChildren + pillHeight + MARGIN + groupPadding
      : Y_PARENTS + pillHeight + MARGIN;

  const parentNodes: LaidOutNode[] = [];
  const parentsStart = (width - parentsWidth) / 2;
  parents.forEach((member, index) => {
    parentNodes.push({
      x: parentsStart + index * (pillWidth + BOND_GAP),
      label: labelForMember(member, 'parent', isCompact),
      sublabel: isCompact ? ageLabel(member) : null,
      variant: 'parent',
      avatarKind: member.avatarKind,
      avatarAppearance: member.avatarAppearance,
    });
  });

  const childNodes: LaidOutNode[] = [];
  const centerX = width / 2;
  if (commonMembers.length > 0) {
    const commonStart = centerX - commonWidth / 2;
    pushChildNodes(childNodes, commonMembers, commonStart, pillWidth);
    if (clientPreviousMembers.length > 0) {
      pushChildNodes(
        childNodes,
        clientPreviousMembers,
        commonStart - CHILD_GAP - clientPreviousWidth,
        pillWidth,
      );
    }
    if (conjointPreviousMembers.length > 0) {
      pushChildNodes(
        childNodes,
        conjointPreviousMembers,
        commonStart + commonWidth + CHILD_GAP,
        pillWidth,
      );
    }
  } else {
    const previousGroupsGap =
      clientPreviousMembers.length > 0 && conjointPreviousMembers.length > 0 ? CHILD_GAP : 0;
    const previousStart =
      centerX - (clientPreviousWidth + previousGroupsGap + conjointPreviousWidth) / 2;
    pushChildNodes(childNodes, clientPreviousMembers, previousStart, pillWidth);
    pushChildNodes(
      childNodes,
      conjointPreviousMembers,
      previousStart + clientPreviousWidth + previousGroupsGap,
      pillWidth,
    );
  }

  function pushChildNodes(
    nodes: LaidOutNode[],
    members: AuditLandingMember[],
    startX: number,
    nodeWidth: number,
  ): void {
    members.forEach((member, index) => {
      nodes.push({
        x: startX + index * (nodeWidth + CHILD_GAP),
        label: labelForMember(member, 'enfant', isCompact),
        sublabel: isCompact ? ageLabel(member) : null,
        variant: 'enfant',
        avatarKind: member.avatarKind,
        avatarAppearance: member.avatarAppearance,
        estCommun: member.estCommun,
        parentPrincipal: member.parentPrincipal,
      });
    });
  }

  const junctionX = width / 2;
  const junctionY = Y_PARENTS + pillHeight;
  const childTopY = yChildren;
  const [parentA, parentB] = parentNodes;
  const commonChildNodes = childNodes.filter((node) => node.estCommun);
  const commonGroup =
    isCompact && commonChildNodes.length > 0
      ? {
          x: Math.min(...commonChildNodes.map((node) => node.x)) - 8,
          y: childTopY - 20,
          width:
            Math.max(...commonChildNodes.map((node) => node.x + pillWidth)) -
            Math.min(...commonChildNodes.map((node) => node.x)) +
            16,
          height: pillHeight + 28,
        }
      : null;
  const commonEdge = commonGroup
    ? {
        startX: junctionX,
        startY: junctionY,
        endX: commonGroup.x + commonGroup.width / 2,
        endY: commonGroup.y,
      }
    : null;

  return (
    <svg
      className={`audit-fil audit-fil--${mode}`}
      viewBox={`0 0 ${round(width)} ${round(height)}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Schéma de filiation du foyer"
    >
      <defs>
        <FoyerAvatarClipDef clipId={clipId} />
      </defs>

      {parentA && parentB && (
        <path
          className="audit-fil__edge"
          d={`M ${round(parentA.x + pillWidth)} ${Y_PARENTS + pillHeight / 2} H ${round(parentB.x)}`}
        />
      )}

      {commonGroup ? (
        <>
          {commonEdge ? (
            <path
              className="audit-fil__edge audit-fil__edge--commun"
              d={`M ${round(commonEdge.startX)} ${round(commonEdge.startY)} C ${round(commonEdge.startX)} ${round(commonEdge.startY + 16)} ${round(commonEdge.endX)} ${round(commonEdge.endY - 14)} ${round(commonEdge.endX)} ${round(commonEdge.endY)}`}
            />
          ) : null}
          <rect
            className="audit-fil__common-zone"
            x={round(commonGroup.x)}
            y={round(commonGroup.y)}
            width={round(commonGroup.width)}
            height={round(commonGroup.height)}
            rx={16}
          />
          <text
            className="audit-fil__common-label"
            x={round(commonGroup.x + commonGroup.width / 2)}
            y={round(commonGroup.y + 9)}
            dominantBaseline="central"
            textAnchor="middle"
          >
            ENFANTS COMMUNS
          </text>
        </>
      ) : null}

      {childNodes.map((node, index) => {
        if (node.estCommun && commonGroup) return null;
        const cx = node.x + pillWidth / 2;
        const parentSource =
          node.estCommun || parentNodes.length < 2
            ? null
            : node.parentPrincipal === 'conjoint'
              ? (parentB ?? parentA)
              : (parentA ?? parentB);
        const startX = parentSource ? parentSource.x + pillWidth / 2 : junctionX;
        const startY = parentSource ? Y_PARENTS + pillHeight : junctionY;
        const c1 = startY + (childTopY - startY) * 0.45;
        const c2 = childTopY - (childTopY - startY) * 0.45;
        return (
          <path
            key={`edge-${index}`}
            className={`audit-fil__edge ${
              node.estCommun ? 'audit-fil__edge--commun' : 'audit-fil__edge--precedent'
            }`}
            d={`M ${round(startX)} ${startY} C ${round(startX)} ${round(c1)} ${round(cx)} ${round(c2)} ${round(cx)} ${childTopY}`}
          />
        );
      })}

      {[
        ...parentNodes.map((node) => ({ node, y: Y_PARENTS })),
        ...childNodes.map((node) => ({ node, y: yChildren })),
      ].map(({ node, y }, index) => (
        <FiliationPill
          key={`node-${index}`}
          node={node}
          y={y}
          width={pillWidth}
          height={pillHeight}
          clipId={clipId}
          compact={isCompact}
        />
      ))}
    </svg>
  );
}

interface FiliationPillProps {
  node: LaidOutNode;
  y: number;
  width: number;
  height: number;
  clipId: string;
  compact: boolean;
}

function FiliationPill({
  node,
  y,
  width,
  height,
  clipId,
  compact,
}: FiliationPillProps): ReactElement {
  const avatarCx = compact ? node.x + 22 : node.x + width / 2;
  const avatarCy = compact ? y + height / 2 : y + AVATAR_R + 4;
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

interface FiliationAvatarProps {
  kind: AuditLandingAvatarKind;
  appearance?: AuditAvatarAppearance;
  cx: number;
  cy: number;
  clipId: string;
  compact: boolean;
}

function FiliationAvatar({
  kind,
  appearance,
  cx,
  cy,
  clipId,
  compact,
}: FiliationAvatarProps): ReactElement {
  const scale = (compact ? 10 : AVATAR_R) / FOYER_AVATAR_ART_RADIUS;

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

function clamp(min: number, value: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function groupWidth(count: number, pillWidth: number): number {
  return count > 0 ? count * pillWidth + (count - 1) * CHILD_GAP : 0;
}

function labelForMember(
  member: AuditLandingMember,
  variant: NodeVariant,
  compact: boolean,
): string {
  if (!compact) return member.prenom;
  if (variant === 'enfant') return member.prenom || 'Enfant';
  if (member.nom)
    return `${member.prenom || 'À compléter'} ${member.nom.toLocaleUpperCase('fr-FR')}`;
  return member.fullName || member.prenom || 'À compléter';
}

function ageLabel(member: AuditLandingMember): string {
  return member.age == null ? 'Âge à compléter' : `${member.age} ans`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export default FoyerFiliation;
