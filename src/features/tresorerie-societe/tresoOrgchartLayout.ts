import type {
  CompanyKind,
  LegalForm,
  OwnershipLotInput,
  OwnershipRight,
  SubsidiaryInput,
} from '@/engine/tresorerie/types';
import {
  getCapitalPct,
  getCompanyKindCode,
  getCompanyKindLabel,
} from './utils/tresorerieSocieteModel';

function ownershipRightCode(right: OwnershipRight): string {
  if (right === 'usufruit') return 'US';
  if (right === 'nue_propriete') return 'NP';
  return 'PP';
}

type OrgAssociate = {
  id: string;
  label: string;
  ownershipLots: OwnershipLotInput[];
};

type OrgCompany = {
  label?: string;
  legalForm: LegalForm;
  companyKind?: CompanyKind;
  associates: OrgAssociate[];
  subsidiaries: SubsidiaryInput[];
};

/**
 * Construit le badge meta de l'associé à partir de ses lots de détention.
 * Cas mono-lot : « PP », « US » ou « NP ».
 * Cas multi-lots (ex. 10 % PP + 90 % US) : concaténation des lots significatifs,
 * tronquée à 24 caractères pour rester lisible dans le nœud SVG.
 */
function buildAssociateMeta(associate: OrgAssociate): string {
  const lots = associate.ownershipLots ?? [];
  if (lots.length === 0) return 'PP';

  const sortedLots = [...lots].sort((a, b) => {
    const aWeight = (a.capitalPct || 0) + (a.economicRightsPct || 0);
    const bWeight = (b.capitalPct || 0) + (b.economicRightsPct || 0);
    return bWeight - aWeight;
  });
  const significant = sortedLots.filter(
    (lot) => (lot.capitalPct || 0) > 0 || (lot.economicRightsPct || 0) > 0,
  );
  const lotsToRender = significant.length > 0 ? significant : sortedLots.slice(0, 1);

  const formatLot = (lot: (typeof lotsToRender)[number]) => {
    const value =
      lot.right === 'usufruit'
        ? Math.round(lot.economicRightsPct || 0)
        : Math.round(lot.capitalPct || 0);
    return `${value}% ${ownershipRightCode(lot.right)}`;
  };

  const fullLabel = lotsToRender.map(formatLot).join(' + ');
  if (fullLabel.length <= 24) return fullLabel;

  // Tronqué : on garde le lot dominant et on suffixe avec un compteur.
  const dominantLot = lotsToRender[0];
  if (!dominantLot) return '';
  const dominant = formatLot(dominantLot);
  const others = lotsToRender.length - 1;
  return others > 0 ? `${dominant} +${others}` : dominant;
}

export const TRESO_ORG_NODE_WIDTH = 184;
export const TRESO_ORG_NODE_HEIGHT = 66;
export const TRESO_ORG_ENTITY_NODE_WIDTH = 104;
export const TRESO_ORG_ENTITY_NODE_HEIGHT = 38;

const GAP_X = 18;
const GAP_Y = 30;
const PAD = 10;

export type TresoOrgNodeKind = 'associate' | 'company' | 'subsidiary';

export interface TresoOrgNode {
  id: string;
  label: string;
  meta?: string;
  detail?: string;
  kind: TresoOrgNodeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  active?: boolean;
}

export interface TresoOrgEdge {
  id: string;
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TresoOrgLabel {
  id: string;
  edgeId: string;
  text: string;
  x: number;
  y: number;
}

export interface TresoOrgchartLayout {
  nodes: TresoOrgNode[];
  edges: TresoOrgEdge[];
  labels: TresoOrgLabel[];
  svgWidth: number;
  svgHeight: number;
}

interface RelativeTree {
  width: number;
  nodes: TresoOrgNode[];
}

function fmtPct(value: number | undefined): string {
  const safeValue = Number.isFinite(value) ? (value ?? 0) : 0;
  return `${Math.round(safeValue * 100) / 100} %`;
}

function centerX(node: TresoOrgNode): number {
  return node.x + node.width / 2;
}

function bottomY(node: TresoOrgNode): number {
  return node.y + node.height;
}

function sortSubsidiaries(subsidiaries: SubsidiaryInput[]): SubsidiaryInput[] {
  return subsidiaries.slice().sort((a, b) => a.label.localeCompare(b.label, 'fr'));
}

function offsetNodes(nodes: TresoOrgNode[], offsetX: number): TresoOrgNode[] {
  return nodes.map((node) => ({ ...node, x: node.x + offsetX }));
}

function buildSubsidiaryTree(
  subsidiaries: SubsidiaryInput[],
  parentId: string,
  y: number,
): RelativeTree {
  const children = sortSubsidiaries(
    subsidiaries.filter((subsidiary) => (subsidiary.parentEntityId ?? 'societe') === parentId),
  );
  if (children.length === 0) return { width: TRESO_ORG_ENTITY_NODE_WIDTH, nodes: [] };

  const nodes: TresoOrgNode[] = [];
  let cursor = 0;

  children.forEach((child) => {
    const childTree = buildSubsidiaryTree(
      subsidiaries,
      child.id,
      y + TRESO_ORG_ENTITY_NODE_HEIGHT + GAP_Y,
    );
    const branchWidth = Math.max(childTree.width, TRESO_ORG_ENTITY_NODE_WIDTH);
    nodes.push({
      id: child.id,
      label: child.label,
      kind: 'subsidiary',
      x: cursor + (branchWidth - TRESO_ORG_ENTITY_NODE_WIDTH) / 2,
      y,
      width: TRESO_ORG_ENTITY_NODE_WIDTH,
      height: TRESO_ORG_ENTITY_NODE_HEIGHT,
    });
    nodes.push(...offsetNodes(childTree.nodes, cursor));
    cursor += branchWidth + GAP_X;
  });

  return {
    width: Math.max(TRESO_ORG_ENTITY_NODE_WIDTH, cursor - GAP_X),
    nodes,
  };
}

function getOwnershipPct(company: OrgCompany, nodeId: string): number {
  const subsidiary = company.subsidiaries.find((candidate) => candidate.id === nodeId);
  return subsidiary?.ownershipPct ?? subsidiary?.holdingOwnershipPct ?? 0;
}

function buildEdge(params: { from: TresoOrgNode; to: TresoOrgNode; label: string }): {
  edge: TresoOrgEdge;
  label: TresoOrgLabel;
} {
  const edge: TresoOrgEdge = {
    id: `${params.from.id}->${params.to.id}`,
    fromId: params.from.id,
    toId: params.to.id,
    x1: centerX(params.from),
    y1: bottomY(params.from),
    x2: centerX(params.to),
    y2: params.to.y,
  };
  return {
    edge,
    label: {
      id: `label-${edge.id}`,
      edgeId: edge.id,
      text: params.label,
      x: (edge.x1 + edge.x2) / 2,
      y: (edge.y1 + edge.y2) / 2,
    },
  };
}

export function computeTresoOrgchartLayout(
  company: OrgCompany,
  selectedAssociateId?: string,
): TresoOrgchartLayout {
  const associates = company.associates;
  const associateRowWidth =
    associates.length > 0
      ? associates.length * TRESO_ORG_ENTITY_NODE_WIDTH + (associates.length - 1) * GAP_X
      : TRESO_ORG_ENTITY_NODE_WIDTH;
  const hasAssociates = associates.length > 0;
  const companyY = hasAssociates ? PAD + TRESO_ORG_ENTITY_NODE_HEIGHT + GAP_Y : PAD;
  const subsidiaryTree = buildSubsidiaryTree(
    company.subsidiaries,
    'societe',
    companyY + TRESO_ORG_NODE_HEIGHT + GAP_Y,
  );
  const contentWidth = Math.max(TRESO_ORG_NODE_WIDTH, associateRowWidth, subsidiaryTree.width);
  const svgWidth = contentWidth + PAD * 2;
  const center = svgWidth / 2;

  const nodes: TresoOrgNode[] = [];
  const associateStartX = center - associateRowWidth / 2;
  associates.forEach((associate, index) => {
    nodes.push({
      id: associate.id,
      label: associate.label,
      meta: buildAssociateMeta(associate),
      kind: 'associate',
      x: associateStartX + index * (TRESO_ORG_ENTITY_NODE_WIDTH + GAP_X),
      y: PAD,
      width: TRESO_ORG_ENTITY_NODE_WIDTH,
      height: TRESO_ORG_ENTITY_NODE_HEIGHT,
      active: associate.id === selectedAssociateId,
    });
  });

  const companyNode: TresoOrgNode = {
    id: 'societe',
    label: company.label?.trim() || 'Société',
    meta: `Forme sociale : ${company.legalForm.toUpperCase()}`,
    detail: `Type société : ${getCompanyKindCode(
      company as Parameters<typeof getCompanyKindCode>[0],
    )}`,
    kind: 'company',
    x: center - TRESO_ORG_NODE_WIDTH / 2,
    y: companyY,
    width: TRESO_ORG_NODE_WIDTH,
    height: TRESO_ORG_NODE_HEIGHT,
  };
  nodes.push(companyNode);

  const subsidiaryStartX = center - subsidiaryTree.width / 2;
  nodes.push(...offsetNodes(subsidiaryTree.nodes, subsidiaryStartX));

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const edges: TresoOrgEdge[] = [];
  const labels: TresoOrgLabel[] = [];

  associates.forEach((associate) => {
    const from = nodeMap.get(associate.id);
    const to = nodeMap.get('societe');
    if (!from || !to) return;
    const relation = buildEdge({
      from,
      to,
      label: fmtPct(getCapitalPct(associate as Parameters<typeof getCapitalPct>[0])),
    });
    edges.push(relation.edge);
    labels.push(relation.label);
  });

  company.subsidiaries.forEach((subsidiary) => {
    const from = nodeMap.get(subsidiary.parentEntityId ?? 'societe');
    const to = nodeMap.get(subsidiary.id);
    if (!from || !to) return;
    const relation = buildEdge({
      from,
      to,
      label: fmtPct(getOwnershipPct(company, subsidiary.id)),
    });
    edges.push(relation.edge);
    labels.push(relation.label);
  });

  const maxNodeBottom = nodes.reduce((max, node) => Math.max(max, bottomY(node)), 0);
  return {
    nodes,
    edges,
    labels,
    svgWidth,
    svgHeight: maxNodeBottom + PAD,
  };
}

export function getTresoOrgchartNodeLabel(node: TresoOrgNode): string {
  if (node.kind === 'company') return 'Paramétrer la société';
  if (node.kind === 'subsidiary') return `Paramétrer ${node.label}`;
  return `Paramétrer ${node.label}`;
}

export function getTresoOrgchartCompanyKindLabel(company: OrgCompany): string {
  return getCompanyKindLabel(company as Parameters<typeof getCompanyKindLabel>[0]);
}
