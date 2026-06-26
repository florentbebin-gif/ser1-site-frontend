import type { ProcheLien } from '@/domain/audit/types';

import type { AuditLandingMember } from '../auditLandingViewModel';

import { buildFiliationEdges } from './FoyerFiliationLayoutEdges';
import type { FiliationNode, FiliationNodeVariant } from './FoyerFiliationParts';

export interface FiliationLayoutNode extends FiliationNode {
  y: number;
  anchorKey: string;
}

export interface FiliationLayoutEdge {
  key: string;
  className: string;
  d: string;
  fromId?: string;
  toId?: string;
}

export interface FiliationCommonGroup {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FiliationLayout {
  width: number;
  height: number;
  pillWidth: number;
  pillHeight: number;
  nodes: FiliationLayoutNode[];
  edges: FiliationLayoutEdge[];
  commonGroup: FiliationCommonGroup | null;
}

interface BuildFiliationLayoutInput {
  principal: AuditLandingMember | null;
  conjoint: AuditLandingMember | null;
  enfants: AuditLandingMember[];
  proches: AuditLandingMember[];
  mode: 'landing' | 'compact';
}

interface DraftNode extends Omit<FiliationLayoutNode, 'x'> {
  centerX: number;
}

const PILL_HEIGHT = 42;
const Y_COUPLE_DEFAULT = 12;
const BOND_GAP = 20;
const CHILD_GAP = 18;
const MARGIN = 8;

export function buildFiliationLayout({
  principal,
  conjoint,
  enfants,
  proches,
  mode,
}: BuildFiliationLayoutInput): FiliationLayout {
  const isCompact = mode === 'compact';
  const members = [principal, conjoint, ...enfants, ...proches].filter(
    (member): member is AuditLandingMember => Boolean(member),
  );
  const labels = members.flatMap((member) => [
    labelForMember(member, member.role === 'enfant' ? 'enfant' : 'parent', isCompact),
    ageLabel(member),
    member.lienParente ? relationLabel(member.lienParente) : '',
  ]);
  const maxLabelLength = Math.max(1, ...labels.map((label) => label.length));
  const pillWidth = isCompact
    ? clamp(132, maxLabelLength * 5.8 + 58, 172)
    : clamp(66, maxLabelLength * 6.2 + 30, 86);
  const pillHeight = isCompact ? 54 : PILL_HEIGHT;

  const relationTop = proches.some(
    (member) =>
      member.lienParente === 'parent' ||
      member.lienParente === 'oncle_tante' ||
      member.lienParente === 'tierce_personne',
  );
  const hasPetitsEnfants = proches.some((member) => member.lienParente === 'petit_enfant');
  const yTop = MARGIN;
  const yCouple = relationTop ? (isCompact ? 86 : 68) : Y_COUPLE_DEFAULT;
  const yChildren = enfants.length > 0 ? yCouple + (isCompact ? 112 : 96) : 0;
  const yPetitsEnfants = hasPetitsEnfants
    ? enfants.length > 0
      ? yChildren + (isCompact ? 96 : 64)
      : yCouple + (isCompact ? 116 : 96)
    : 0;

  const parentGap = pillWidth + BOND_GAP;
  const principalCenter = principal && conjoint ? -parentGap / 2 : 0;
  const conjointCenter = principal && conjoint ? parentGap / 2 : principal ? 0 : 0;
  const coupleFallbackCenter = principal ? principalCenter : conjoint ? conjointCenter : 0;
  const drafts: DraftNode[] = [];

  if (principal) {
    drafts.push(toDraftNode(principal, principalCenter, yCouple, 'parent', 'client', isCompact));
  }
  if (conjoint) {
    drafts.push(toDraftNode(conjoint, conjointCenter, yCouple, 'parent', 'conjoint', isCompact));
  }

  const topParents = proches.filter((member) => member.lienParente === 'parent');
  const parentsClient = topParents.filter((member) => member.parentPrincipal !== 'conjoint');
  const parentsConjoint = topParents.filter((member) => member.parentPrincipal === 'conjoint');
  const parentsClientWidth = groupWidth(parentsClient.length, pillWidth);
  const parentsConjointWidth = groupWidth(parentsConjoint.length, pillWidth);
  let parentsClientCenter = principal ? principalCenter : coupleFallbackCenter;
  let parentsConjointCenter = conjoint ? conjointCenter : coupleFallbackCenter;

  if (parentsClientWidth > 0 && parentsConjointWidth > 0) {
    const expectedDistance = parentsClientWidth / 2 + CHILD_GAP + parentsConjointWidth / 2;
    const currentDistance = parentsConjointCenter - parentsClientCenter;
    if (currentDistance < expectedDistance) {
      const overflow = expectedDistance - currentDistance;
      parentsClientCenter -= overflow / 2;
      parentsConjointCenter += overflow / 2;
    }
  }

  placeCenteredGroup(
    drafts,
    parentsClient,
    parentsClientCenter,
    yTop,
    pillWidth,
    'parent:client',
    'proche',
    isCompact,
  );
  placeCenteredGroup(
    drafts,
    parentsConjoint,
    parentsConjointCenter,
    yTop,
    pillWidth,
    'parent:conjoint',
    'proche',
    isCompact,
  );

  const onclesClient = proches.filter(
    (member) =>
      member.lienParente === 'oncle_tante' && !member.rattachementBranche?.startsWith('conjoint'),
  );
  const onclesConjoint = proches.filter(
    (member) =>
      member.lienParente === 'oncle_tante' && member.rattachementBranche?.startsWith('conjoint'),
  );
  const onclesClientWidth = groupWidth(onclesClient.length, pillWidth);
  const onclesConjointWidth = groupWidth(onclesConjoint.length, pillWidth);
  const parentsClientLeftEdge =
    parentsClientWidth > 0
      ? parentsClientCenter - parentsClientWidth / 2
      : (principal ? principalCenter : coupleFallbackCenter) - pillWidth / 2;
  const parentsConjointRightEdge =
    parentsConjointWidth > 0
      ? parentsConjointCenter + parentsConjointWidth / 2
      : (conjoint ? conjointCenter : coupleFallbackCenter) + pillWidth / 2;
  placeCenteredGroup(
    drafts,
    onclesClient,
    parentsClientLeftEdge - CHILD_GAP - onclesClientWidth / 2,
    yTop,
    pillWidth,
    'oncle:client',
    'proche',
    isCompact,
  );
  placeCenteredGroup(
    drafts,
    onclesConjoint,
    parentsConjointRightEdge + CHILD_GAP + onclesConjointWidth / 2,
    yTop,
    pillWidth,
    'oncle:conjoint',
    'proche',
    isCompact,
  );

  const fratrieClient = proches.filter(
    (member) => member.lienParente === 'frere_soeur' && member.parentPrincipal !== 'conjoint',
  );
  const fratrieConjoint = proches.filter(
    (member) => member.lienParente === 'frere_soeur' && member.parentPrincipal === 'conjoint',
  );
  placeSideGroup(
    drafts,
    fratrieClient,
    principal ? principalCenter : coupleFallbackCenter,
    yCouple,
    pillWidth,
    'left',
    'fratrie:client',
    isCompact,
  );
  placeSideGroup(
    drafts,
    fratrieConjoint,
    conjoint ? conjointCenter : coupleFallbackCenter,
    yCouple,
    pillWidth,
    'right',
    'fratrie:conjoint',
    isCompact,
  );

  const topCenters = drafts
    .filter((node) => node.y === yTop || node.y === yCouple)
    .map((node) => node.centerX);
  const leftCornerCenter = Math.min(coupleFallbackCenter, ...topCenters) - pillWidth - CHILD_GAP;
  const rightCornerCenter = Math.max(coupleFallbackCenter, ...topCenters) + pillWidth + CHILD_GAP;
  let leftTierIndex = 0;
  let rightTierIndex = 0;
  proches
    .filter((member) => member.lienParente === 'tierce_personne')
    .forEach((member, index) => {
      const side = index % 2 === 0 ? 'left' : 'right';
      const stackIndex = side === 'left' ? leftTierIndex++ : rightTierIndex++;
      drafts.push(
        toDraftNode(
          member,
          side === 'left' ? leftCornerCenter : rightCornerCenter,
          yTop + stackIndex * (pillHeight + CHILD_GAP),
          'proche',
          `corner:${side}`,
          isCompact,
        ),
      );
    });

  const commonChildren = enfants.filter((member) => member.estCommun);
  const clientChildren = enfants.filter(
    (member) => !member.estCommun && member.parentPrincipal !== 'conjoint',
  );
  const conjointChildren = enfants.filter(
    (member) => !member.estCommun && member.parentPrincipal === 'conjoint',
  );
  const commonChildrenWidth = groupWidth(commonChildren.length, pillWidth);
  const clientChildrenWidth = groupWidth(clientChildren.length, pillWidth);
  const conjointChildrenWidth = groupWidth(conjointChildren.length, pillWidth);
  placeCenteredGroup(
    drafts,
    commonChildren,
    0,
    yChildren,
    pillWidth,
    'enfants:couple',
    'enfant',
    isCompact,
  );
  placeCenteredGroup(
    drafts,
    clientChildren,
    commonChildren.length > 0
      ? -commonChildrenWidth / 2 - CHILD_GAP - clientChildrenWidth / 2
      : principal
        ? principalCenter
        : coupleFallbackCenter,
    yChildren,
    pillWidth,
    'enfants:client',
    'enfant',
    isCompact,
  );
  placeCenteredGroup(
    drafts,
    conjointChildren,
    commonChildren.length > 0
      ? commonChildrenWidth / 2 + CHILD_GAP + conjointChildrenWidth / 2
      : conjoint
        ? conjointCenter
        : coupleFallbackCenter,
    yChildren,
    pillWidth,
    'enfants:conjoint',
    'enfant',
    isCompact,
  );

  const childCenters = new Map<string, number>();
  drafts
    .filter((node) => node.variant === 'enfant')
    .forEach((node) => {
      childCenters.set(node.memberId, node.centerX);
      if (node.localId) childCenters.set(node.localId, node.centerX);
    });
  const petitsEnfantsByParent = groupByParentEnfant(
    proches.filter((member) => member.lienParente === 'petit_enfant'),
  );
  petitsEnfantsByParent.forEach((membersForParent, parentEnfantId) => {
    placeCenteredGroup(
      drafts,
      membersForParent,
      childCenters.get(parentEnfantId) ?? coupleFallbackCenter,
      yPetitsEnfants,
      pillWidth,
      `petits-enfants:${parentEnfantId}`,
      'proche',
      isCompact,
    );
  });

  const maxAbs = Math.max(
    pillWidth / 2,
    ...drafts.flatMap((node) => [
      Math.abs(node.centerX - pillWidth / 2),
      Math.abs(node.centerX + pillWidth / 2),
    ]),
  );
  const shiftX = maxAbs + MARGIN;
  const nodes = drafts.map(({ centerX, ...node }) => ({
    ...node,
    x: round(centerX - pillWidth / 2 + shiftX),
  }));
  const width = round(maxAbs * 2 + MARGIN * 2);
  const commonChildrenNodes = nodes.filter((node) => node.variant === 'enfant' && node.estCommun);
  const commonGroup =
    isCompact && commonChildrenNodes.length > 0
      ? {
          x: Math.min(...commonChildrenNodes.map((node) => node.x)) - 8,
          y: yChildren - 20,
          width:
            Math.max(...commonChildrenNodes.map((node) => node.x + pillWidth)) -
            Math.min(...commonChildrenNodes.map((node) => node.x)) +
            16,
          height: pillHeight + 28,
        }
      : null;
  const height = Math.max(
    ...nodes.map((node) => node.y + pillHeight + MARGIN),
    commonGroup ? commonGroup.y + commonGroup.height + MARGIN : 0,
    yCouple + pillHeight + MARGIN,
  );
  const edges = buildFiliationEdges({
    nodes,
    pillWidth,
    pillHeight,
    principal,
    conjoint,
    yCouple,
    yChildren,
  });

  return {
    width,
    height: round(height),
    pillWidth,
    pillHeight,
    nodes,
    edges,
    commonGroup,
  };
}

function placeCenteredGroup(
  drafts: DraftNode[],
  members: AuditLandingMember[],
  anchorCenterX: number,
  y: number,
  pillWidth: number,
  anchorKey: string,
  variant: FiliationNodeVariant,
  compact: boolean,
): void {
  const groupWidth = members.length * pillWidth + Math.max(0, members.length - 1) * CHILD_GAP;
  const startCenter = anchorCenterX - groupWidth / 2 + pillWidth / 2;
  members.forEach((member, index) => {
    drafts.push(
      toDraftNode(
        member,
        startCenter + index * (pillWidth + CHILD_GAP),
        y,
        variant,
        anchorKey,
        compact,
      ),
    );
  });
}

function placeSideGroup(
  drafts: DraftNode[],
  members: AuditLandingMember[],
  anchorCenterX: number,
  y: number,
  pillWidth: number,
  side: 'left' | 'right',
  anchorKey: string,
  compact: boolean,
): void {
  members.forEach((member, index) => {
    const offset = (index + 1) * (pillWidth + CHILD_GAP);
    drafts.push(
      toDraftNode(
        member,
        anchorCenterX + (side === 'left' ? -offset : offset),
        y,
        'proche',
        anchorKey,
        compact,
      ),
    );
  });
}

function toDraftNode(
  member: AuditLandingMember,
  centerX: number,
  y: number,
  variant: FiliationNodeVariant,
  anchorKey: string,
  compact = false,
): DraftNode {
  return {
    centerX,
    y,
    anchorKey,
    label: labelForMember(member, variant, compact),
    sublabel:
      member.role === 'proche'
        ? sublabelForProche(member)
        : compact && variant !== 'proche'
          ? ageLabel(member)
          : null,
    variant,
    avatarKind: member.avatarKind,
    avatarAppearance: member.avatarAppearance,
    memberId: member.id,
    localId: member.localId,
    estCommun: member.estCommun,
    parentPrincipal: member.parentPrincipal,
    lienParente: member.lienParente,
    parentEnfantId: member.parentEnfantId,
    rattachementBranche: member.rattachementBranche,
  };
}

function groupByParentEnfant(members: AuditLandingMember[]): Map<string, AuditLandingMember[]> {
  const groups = new Map<string, AuditLandingMember[]>();
  members.forEach((member) => {
    const key = member.parentEnfantId ?? '__missing__';
    groups.set(key, [...(groups.get(key) ?? []), member]);
  });
  return groups;
}

function groupWidth(count: number, pillWidth: number): number {
  return count > 0 ? count * pillWidth + Math.max(0, count - 1) * CHILD_GAP : 0;
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

function clamp(min: number, value: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
