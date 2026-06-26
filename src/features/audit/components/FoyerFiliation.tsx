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

import type { ProcheLien } from '@/domain/audit/types';

import type { AuditLandingMember } from '../auditLandingViewModel';

import { FoyerAvatarClipDef } from './FoyerAvatarArt';
import {
  FiliationPill,
  type FiliationNode,
  type FiliationNodeVariant,
} from './FoyerFiliationParts';

interface FoyerFiliationProps {
  principal: AuditLandingMember | null;
  conjoint: AuditLandingMember | null;
  enfants: AuditLandingMember[];
  proches?: AuditLandingMember[];
  hasData: boolean;
  mode?: 'landing' | 'compact';
}

const PILL_HEIGHT = 42;
const Y_PARENTS = 12;
const BOND_GAP = 20;
const CHILD_GAP = 12;
const MARGIN = 8;

export function FoyerFiliation({
  principal,
  conjoint,
  enfants,
  proches = [],
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
  const ascendants = proches.filter((member) => member.lienParente !== 'petit_enfant');
  const petitsEnfants = proches.filter((member) => member.lienParente === 'petit_enfant');
  const labels = [...parents, ...enfants, ...proches].flatMap((member) => [
    labelForMember(member, member.role === 'enfant' ? 'enfant' : 'parent', isCompact),
    ageLabel(member),
    member.lienParente ? relationLabel(member.lienParente) : '',
  ]);
  const pillWidth = isCompact
    ? clamp(132, Math.max(...labels.map((label) => label.length)) * 5.8 + 58, 172)
    : clamp(66, Math.max(...labels.map((label) => label.length)) * 6.2 + 30, 86);
  const pillHeight = isCompact ? 54 : PILL_HEIGHT;
  const hasAscendants = ascendants.length > 0;
  const hasPetitsEnfants = petitsEnfants.length > 0;
  const yAscendants = MARGIN;
  const yParents = hasAscendants ? (isCompact ? 84 : 68) : Y_PARENTS;
  const yChildren = enfants.length > 0 ? yParents + (isCompact ? 116 : 96) : 0;
  const yPetitsEnfants = hasPetitsEnfants
    ? enfants.length > 0
      ? yChildren + (isCompact ? 88 : 64)
      : yParents + (isCompact ? 116 : 96)
    : 0;

  const parentsWidth =
    parents.length === 2 ? pillWidth * 2 + BOND_GAP : parents.length === 1 ? pillWidth : 0;
  const ascendantsWidth = groupWidth(ascendants.length, pillWidth);
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
  const petitsEnfantsWidth = groupWidth(petitsEnfants.length, pillWidth);
  const groupPadding = isCompact && commonMembers.length > 0 ? 12 : 0;
  const innerWidth = Math.max(
    ascendantsWidth,
    parentsWidth,
    childrenWidth,
    petitsEnfantsWidth,
    pillWidth,
  );
  const width = innerWidth + MARGIN * 2 + groupPadding * 2;
  const height = Math.max(
    hasPetitsEnfants ? yPetitsEnfants + pillHeight + MARGIN : 0,
    enfants.length > 0 ? yChildren + pillHeight + MARGIN + groupPadding : 0,
    yParents + pillHeight + MARGIN,
  );

  const ascendantNodes: FiliationNode[] = [];
  const ascendantsStart = (width - ascendantsWidth) / 2;
  ascendants.forEach((member, index) => {
    ascendantNodes.push({
      x: ascendantsStart + index * (pillWidth + CHILD_GAP),
      label: labelForMember(member, 'parent', isCompact),
      sublabel: sublabelForProche(member),
      variant: 'proche',
      avatarKind: member.avatarKind,
      avatarAppearance: member.avatarAppearance,
      memberId: member.id,
      localId: member.localId,
      lienParente: member.lienParente,
      parentPrincipal: member.parentPrincipal,
      rattachementBranche: member.rattachementBranche,
    });
  });

  const parentNodes: FiliationNode[] = [];
  const parentsStart = (width - parentsWidth) / 2;
  parents.forEach((member, index) => {
    parentNodes.push({
      x: parentsStart + index * (pillWidth + BOND_GAP),
      label: labelForMember(member, 'parent', isCompact),
      sublabel: isCompact ? ageLabel(member) : null,
      variant: 'parent',
      avatarKind: member.avatarKind,
      avatarAppearance: member.avatarAppearance,
      memberId: member.id,
      localId: member.localId,
    });
  });

  const childNodes: FiliationNode[] = [];
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
    nodes: FiliationNode[],
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
        memberId: member.id,
        localId: member.localId,
        estCommun: member.estCommun,
        parentPrincipal: member.parentPrincipal,
      });
    });
  }

  const petitEnfantNodes: FiliationNode[] = [];
  const petitsEnfantsStart = (width - petitsEnfantsWidth) / 2;
  petitsEnfants.forEach((member, index) => {
    petitEnfantNodes.push({
      x: petitsEnfantsStart + index * (pillWidth + CHILD_GAP),
      label: labelForMember(member, 'enfant', isCompact),
      sublabel: sublabelForProche(member),
      variant: 'proche',
      avatarKind: member.avatarKind,
      avatarAppearance: member.avatarAppearance,
      memberId: member.id,
      localId: member.localId,
      lienParente: member.lienParente,
      parentEnfantId: member.parentEnfantId,
    });
  });

  const junctionX = width / 2;
  const junctionY = yParents + pillHeight;
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

      {ascendantNodes.map((node, index) => {
        const target = targetParentFor(node, parentA, parentB);
        if (!target) return null;
        return (
          <path
            key={`ascendant-edge-${index}`}
            className="audit-fil__edge audit-fil__edge--proche"
            d={verticalCurve(
              node.x + pillWidth / 2,
              yAscendants + pillHeight,
              target.x + pillWidth / 2,
              yParents,
            )}
          />
        );
      })}

      {parentA && parentB && (
        <path
          className="audit-fil__edge"
          d={`M ${round(parentA.x + pillWidth)} ${yParents + pillHeight / 2} H ${round(parentB.x)}`}
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
        const startY = parentSource ? yParents + pillHeight : junctionY;
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

      {petitEnfantNodes.map((node, index) => {
        const parentSource =
          childNodes.find(
            (child) =>
              child.memberId === node.parentEnfantId || child.localId === node.parentEnfantId,
          ) ?? null;
        const startX = parentSource ? parentSource.x + pillWidth / 2 : junctionX;
        const startY = parentSource ? yChildren + pillHeight : yParents + pillHeight;
        return (
          <path
            key={`petit-enfant-edge-${index}`}
            className="audit-fil__edge audit-fil__edge--proche"
            d={verticalCurve(startX, startY, node.x + pillWidth / 2, yPetitsEnfants)}
          />
        );
      })}

      {[
        ...ascendantNodes.map((node) => ({ node, y: yAscendants })),
        ...parentNodes.map((node) => ({ node, y: yParents })),
        ...childNodes.map((node) => ({ node, y: yChildren })),
        ...petitEnfantNodes.map((node) => ({ node, y: yPetitsEnfants })),
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

function clamp(min: number, value: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function groupWidth(count: number, pillWidth: number): number {
  return count > 0 ? count * pillWidth + (count - 1) * CHILD_GAP : 0;
}

function labelForMember(
  member: AuditLandingMember,
  variant: FiliationNodeVariant,
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

function sublabelForProche(member: AuditLandingMember): string {
  const relation = member.lienParente ? relationLabel(member.lienParente) : 'Proche';
  const age = ageLabel(member);
  return age === 'Âge à compléter' ? relation : `${relation} · ${age}`;
}

function relationLabel(lien: ProcheLien): string {
  if (lien === 'petit_enfant') return 'Petit-enfant';
  if (lien === 'parent') return 'Parent';
  if (lien === 'frere_soeur') return 'Frère/Sœur';
  if (lien === 'oncle_tante') return 'Oncle/Tante';
  return 'Proche';
}

function targetParentFor(
  node: FiliationNode,
  principal: FiliationNode | undefined,
  conjoint: FiliationNode | undefined,
): FiliationNode | undefined {
  if (node.parentPrincipal === 'conjoint') return conjoint ?? principal;
  if (node.rattachementBranche?.startsWith('conjoint')) return conjoint ?? principal;
  return principal ?? conjoint;
}

function verticalCurve(startX: number, startY: number, endX: number, endY: number): string {
  const c1 = startY + (endY - startY) * 0.45;
  const c2 = endY - (endY - startY) * 0.45;
  return `M ${round(startX)} ${round(startY)} C ${round(startX)} ${round(c1)} ${round(endX)} ${round(c2)} ${round(endX)} ${round(endY)}`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export default FoyerFiliation;
