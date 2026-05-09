import type { CompanyInput, SubsidiaryInput } from '@/engine/tresorerie/types';
import {
  getCapitalPct,
  getCompanyKindCode,
  getCompanyKindLabel,
} from './utils/tresorerieSocieteModel';

export const TRESO_ORG_NODE_WIDTH = 132;
export const TRESO_ORG_NODE_HEIGHT = 46;

const GAP_X = 22;
const GAP_Y = 42;
const PAD = 12;

export type TresoOrgNodeKind = 'associate' | 'company' | 'subsidiary';

export interface TresoOrgNode {
  id: string;
  label: string;
  meta?: string;
  kind: TresoOrgNodeKind;
  x: number;
  y: number;
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
  const safeValue = Number.isFinite(value) ? value ?? 0 : 0;
  return `${Math.round(safeValue * 100) / 100} %`;
}

function centerX(node: TresoOrgNode): number {
  return node.x + TRESO_ORG_NODE_WIDTH / 2;
}

function bottomY(node: TresoOrgNode): number {
  return node.y + TRESO_ORG_NODE_HEIGHT;
}

function sortSubsidiaries(subsidiaries: SubsidiaryInput[]): SubsidiaryInput[] {
  return subsidiaries.slice().sort((a, b) => {
    const order = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    if (order !== 0) return order;
    return a.label.localeCompare(b.label, 'fr');
  });
}

function offsetNodes(nodes: TresoOrgNode[], offsetX: number): TresoOrgNode[] {
  return nodes.map(node => ({ ...node, x: node.x + offsetX }));
}

function buildSubsidiaryTree(
  subsidiaries: SubsidiaryInput[],
  parentId: string,
  y: number,
): RelativeTree {
  const children = sortSubsidiaries(
    subsidiaries.filter(subsidiary => (subsidiary.parentEntityId ?? 'societe') === parentId),
  );
  if (children.length === 0) return { width: TRESO_ORG_NODE_WIDTH, nodes: [] };

  const nodes: TresoOrgNode[] = [];
  let cursor = 0;

  children.forEach(child => {
    const childTree = buildSubsidiaryTree(subsidiaries, child.id, y + TRESO_ORG_NODE_HEIGHT + GAP_Y);
    const branchWidth = Math.max(childTree.width, TRESO_ORG_NODE_WIDTH);
    nodes.push({
      id: child.id,
      label: child.label,
      kind: 'subsidiary',
      x: cursor + (branchWidth - TRESO_ORG_NODE_WIDTH) / 2,
      y,
    });
    nodes.push(...offsetNodes(childTree.nodes, cursor));
    cursor += branchWidth + GAP_X;
  });

  return {
    width: Math.max(TRESO_ORG_NODE_WIDTH, cursor - GAP_X),
    nodes,
  };
}

function getOwnershipPct(company: CompanyInput, nodeId: string): number {
  const subsidiary = company.subsidiaries.find(candidate => candidate.id === nodeId);
  return subsidiary?.ownershipPct ?? subsidiary?.holdingOwnershipPct ?? 0;
}

function buildEdge(params: {
  from: TresoOrgNode;
  to: TresoOrgNode;
  label: string;
}): { edge: TresoOrgEdge; label: TresoOrgLabel } {
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
  company: CompanyInput,
  selectedAssociateId?: string,
): TresoOrgchartLayout {
  const associates = company.associates;
  const associateRowWidth = associates.length > 0
    ? associates.length * TRESO_ORG_NODE_WIDTH + (associates.length - 1) * GAP_X
    : TRESO_ORG_NODE_WIDTH;
  const hasAssociates = associates.length > 0;
  const companyY = hasAssociates ? PAD + TRESO_ORG_NODE_HEIGHT + GAP_Y : PAD;
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
      meta: (associate.kind ?? 'pp').toUpperCase(),
      kind: 'associate',
      x: associateStartX + index * (TRESO_ORG_NODE_WIDTH + GAP_X),
      y: PAD,
      active: associate.id === selectedAssociateId,
    });
  });

  const companyNode: TresoOrgNode = {
    id: 'societe',
    label: company.creationType === 'existante' ? 'Société existante' : 'Société à créer',
    meta: `${getCompanyKindCode(company)} · ${company.legalForm.toUpperCase()}`,
    kind: 'company',
    x: center - TRESO_ORG_NODE_WIDTH / 2,
    y: companyY,
  };
  nodes.push(companyNode);

  const subsidiaryStartX = center - subsidiaryTree.width / 2;
  nodes.push(...offsetNodes(subsidiaryTree.nodes, subsidiaryStartX));

  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const edges: TresoOrgEdge[] = [];
  const labels: TresoOrgLabel[] = [];

  associates.forEach(associate => {
    const from = nodeMap.get(associate.id);
    const to = nodeMap.get('societe');
    if (!from || !to) return;
    const relation = buildEdge({ from, to, label: fmtPct(getCapitalPct(associate)) });
    edges.push(relation.edge);
    labels.push(relation.label);
  });

  company.subsidiaries.forEach(subsidiary => {
    const from = nodeMap.get(subsidiary.parentEntityId ?? 'societe');
    const to = nodeMap.get(subsidiary.id);
    if (!from || !to) return;
    const relation = buildEdge({ from, to, label: fmtPct(getOwnershipPct(company, subsidiary.id)) });
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

export function getTresoOrgchartCompanyKindLabel(company: CompanyInput): string {
  return getCompanyKindLabel(company);
}
