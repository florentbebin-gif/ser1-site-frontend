import type { AuditLandingMember } from '../auditLandingViewModel';

import type { FiliationLayoutEdge, FiliationLayoutNode } from './FoyerFiliationLayout';

export function buildFiliationEdges({
  nodes,
  pillWidth,
  pillHeight,
  principal,
  conjoint,
  yCouple,
  yChildren,
}: {
  nodes: FiliationLayoutNode[];
  pillWidth: number;
  pillHeight: number;
  principal: AuditLandingMember | null;
  conjoint: AuditLandingMember | null;
  yCouple: number;
  yChildren: number;
}): FiliationLayoutEdge[] {
  const byId = new Map(nodes.map((node) => [node.memberId, node]));
  const edges: FiliationLayoutEdge[] = [];
  const principalNode = principal ? byId.get(principal.id) : undefined;
  const conjointNode = conjoint ? byId.get(conjoint.id) : undefined;
  if (principalNode && conjointNode) {
    edges.push({
      key: 'couple',
      className: 'audit-fil__edge',
      fromId: principalNode.memberId,
      toId: conjointNode.memberId,
      d: `M ${round(principalNode.x + pillWidth)} ${yCouple + pillHeight / 2} H ${round(
        conjointNode.x,
      )}`,
    });
  }

  nodes
    .filter((node) => node.lienParente === 'parent')
    .forEach((node) => {
      const target = targetParentFor(node, principalNode, conjointNode);
      if (!target) return;
      edges.push({
        key: `proche-${node.memberId}`,
        className: 'audit-fil__edge audit-fil__edge--proche',
        fromId: node.memberId,
        toId: target.memberId,
        d: verticalCurve(
          node.x + pillWidth / 2,
          node.y + pillHeight,
          target.x + pillWidth / 2,
          target.y,
        ),
      });
    });

  nodes
    .filter((node) => node.variant === 'enfant')
    .forEach((node) => {
      const parentSource =
        node.estCommun || !principalNode || !conjointNode
          ? null
          : node.parentPrincipal === 'conjoint'
            ? conjointNode
            : principalNode;
      const sourceId =
        parentSource?.memberId ??
        (principalNode && conjointNode ? 'couple' : (principalNode ?? conjointNode)?.memberId);
      const startX = parentSource
        ? parentSource.x + pillWidth / 2
        : principalNode && conjointNode
          ? (principalNode.x + pillWidth / 2 + conjointNode.x + pillWidth / 2) / 2
          : ((principalNode ?? conjointNode)?.x ?? 0) + pillWidth / 2;
      const startY = yCouple + pillHeight;
      const c1 = startY + (yChildren - startY) * 0.45;
      const c2 = yChildren - (yChildren - startY) * 0.45;
      const relationClass = node.estCommun
        ? 'audit-fil__edge--commun'
        : node.parentPrincipal === 'conjoint'
          ? 'audit-fil__edge--precedent-conjoint'
          : 'audit-fil__edge--precedent-client';
      edges.push({
        key: `child-${node.memberId}`,
        className: `audit-fil__edge ${relationClass}`,
        fromId: sourceId,
        toId: node.memberId,
        d: `M ${round(startX)} ${round(startY)} C ${round(startX)} ${round(c1)} ${round(
          node.x + pillWidth / 2,
        )} ${round(c2)} ${round(node.x + pillWidth / 2)} ${round(yChildren)}`,
      });
    });

  nodes
    .filter((node) => node.lienParente === 'petit_enfant')
    .forEach((node) => {
      const parentSource =
        nodes.find(
          (child) =>
            child.memberId === node.parentEnfantId || child.localId === node.parentEnfantId,
        ) ?? null;
      if (!parentSource) return;
      edges.push({
        key: `petit-enfant-${node.memberId}`,
        className: 'audit-fil__edge audit-fil__edge--proche',
        fromId: parentSource.memberId,
        toId: node.memberId,
        d: verticalCurve(
          parentSource.x + pillWidth / 2,
          parentSource.y + pillHeight,
          node.x + pillWidth / 2,
          node.y,
        ),
      });
    });

  return edges;
}

function targetParentFor(
  node: FiliationLayoutNode,
  principal: FiliationLayoutNode | undefined,
  conjoint: FiliationLayoutNode | undefined,
): FiliationLayoutNode | undefined {
  if (node.parentPrincipal === 'conjoint') return conjoint ?? principal;
  if (node.rattachementBranche?.startsWith('conjoint')) return conjoint ?? principal;
  return principal ?? conjoint;
}

function verticalCurve(startX: number, startY: number, endX: number, endY: number): string {
  const c1 = startY + (endY - startY) * 0.45;
  const c2 = endY - (endY - startY) * 0.45;
  return `M ${round(startX)} ${round(startY)} C ${round(startX)} ${round(c1)} ${round(
    endX,
  )} ${round(c2)} ${round(endX)} ${round(endY)}`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
