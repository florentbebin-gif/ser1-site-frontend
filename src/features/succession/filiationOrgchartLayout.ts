import type { SuccessionCivilContext, SuccessionEnfant, FamilyMember } from './successionDraft';
import { getEnfantNodeLabel } from './successionEnfants';

export const FILIATION_NODE_WIDTH = 80;
export const FILIATION_NODE_HEIGHT = 24;
const GH = 12;
const GV = 40;
const PAD = 12;
const BASELINE_WIDTH = 380;

export type FiliationOrgNodeKind =
  | 'epoux'
  | 'enfant_commun'
  | 'enfant_autre'
  | 'parent'
  | 'frere_soeur'
  | 'oncle_tante'
  | 'petit_enfant'
  | 'tierce';

export interface FiliationOrgNode {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: FiliationOrgNodeKind;
  deceased?: boolean;
}

export interface FiliationOrgEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dashed?: boolean;
}

export interface FiliationOrgGroup {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

export interface FiliationOrgLayout {
  nodes: FiliationOrgNode[];
  edges: FiliationOrgEdge[];
  groups: FiliationOrgGroup[];
  svgWidth: number;
  svgHeight: number;
}

function cx(node: FiliationOrgNode): number { return node.x + FILIATION_NODE_WIDTH / 2; }
function cy(node: FiliationOrgNode): number { return node.y + FILIATION_NODE_HEIGHT / 2; }
function bottom(node: FiliationOrgNode): number { return node.y + FILIATION_NODE_HEIGHT; }
function top(node: FiliationOrgNode): number { return node.y; }
function right(node: FiliationOrgNode): number { return node.x + FILIATION_NODE_WIDTH; }
function left(node: FiliationOrgNode): number { return node.x; }

function addAttachmentBus(
  edges: FiliationOrgEdge[],
  parentX: number,
  parentY: number,
  childNodes: FiliationOrgNode[],
  busY: number,
): void {
  if (childNodes.length === 0) return;

  const childCenters = childNodes.map(cx);
  const minX = Math.min(parentX, ...childCenters);
  const maxX = Math.max(parentX, ...childCenters);

  edges.push({ x1: parentX, y1: parentY, x2: parentX, y2: busY });
  if (maxX > minX) {
    edges.push({ x1: minX, y1: busY, x2: maxX, y2: busY });
  }
  childNodes.forEach((node) => {
    edges.push({ x1: cx(node), y1: busY, x2: cx(node), y2: top(node) });
  });
}

function getCoupleLabels(situation: string): { epoux1: string; epoux2: string } {
  if (situation === 'marie') return { epoux1: 'Époux 1', epoux2: 'Époux 2' };
  if (situation === 'pacse') return { epoux1: 'Partenaire 1', epoux2: 'Partenaire 2' };
  if (situation === 'concubinage') return { epoux1: 'Partenaire 1', epoux2: 'Partenaire 2' };
  if (situation === 'divorce') return { epoux1: 'Vous', epoux2: 'Ex-conjoint(e)' };
  return { epoux1: 'Vous', epoux2: '' };
}

export function getFiliationNodeCenterX(node: FiliationOrgNode): number {
  return cx(node);
}

export function getFiliationNodeCenterY(node: FiliationOrgNode): number {
  return cy(node);
}

export function computeFiliationOrgchartLayout(
  civilContext: SuccessionCivilContext,
  enfantsContext: SuccessionEnfant[],
  familyMembers: FamilyMember[],
): FiliationOrgLayout {
  const nodes: FiliationOrgNode[] = [];
  const edges: FiliationOrgEdge[] = [];
  const groups: FiliationOrgGroup[] = [];

  const { situationMatrimoniale } = civilContext;
  const hasPair = ['marie', 'pacse', 'concubinage', 'divorce'].includes(situationMatrimoniale);
  const isDashedCouple = situationMatrimoniale === 'concubinage' || situationMatrimoniale === 'divorce';

  const parents1 = familyMembers.filter((m) => m.type === 'parent' && m.branch === 'epoux1');
  const parents2 = familyMembers.filter((m) => m.type === 'parent' && m.branch === 'epoux2');
  const freres1 = familyMembers.filter((m) => m.type === 'frere_soeur' && m.branch === 'epoux1');
  const freres2 = familyMembers.filter((m) => m.type === 'frere_soeur' && m.branch === 'epoux2');
  const oncles1 = familyMembers.filter((m) => m.type === 'oncle_tante' && m.branch === 'epoux1');
  const oncles2 = familyMembers.filter((m) => m.type === 'oncle_tante' && m.branch === 'epoux2');
  const tierces = familyMembers.filter((m) => m.type === 'tierce_personne');

  const enfCommuns = enfantsContext.filter((e) => e.rattachement === 'commun');
  const enfEpoux1 = enfantsContext.filter((e) => e.rattachement === 'epoux1');
  const enfEpoux2 = enfantsContext.filter((e) => e.rattachement === 'epoux2');
  const petitsEnfants = familyMembers.filter((m) => m.type === 'petit_enfant');

  const hasOncles = oncles1.length > 0 || oncles2.length > 0;
  const hasParents = parents1.length > 0 || parents2.length > 0;
  const hasFreres = freres1.length > 0 || freres2.length > 0;
  const hasEnfants = enfantsContext.length > 0;
  const hasPetitsEnfants = petitsEnfants.length > 0;
  const hasTierces = tierces.length > 0;

  let currentY = PAD;
  const yOncle = hasOncles ? currentY : -1;
  if (hasOncles) currentY += FILIATION_NODE_HEIGHT + GV;

  const yParent = (hasParents || hasFreres) ? currentY : -1;
  if (hasParents || hasFreres) currentY += FILIATION_NODE_HEIGHT + GV;

  const yEpoux = currentY;
  currentY += FILIATION_NODE_HEIGHT + GV;

  const yEnfant = hasEnfants ? currentY : -1;
  if (hasEnfants) currentY += FILIATION_NODE_HEIGHT + GV;

  const yPetit = hasPetitsEnfants ? currentY : -1;
  if (hasPetitsEnfants) currentY += FILIATION_NODE_HEIGHT + GV;

  const svgHeight = currentY + PAD;
  const nCommuns = enfCommuns.length;
  const nEpoux1 = enfEpoux1.length;
  const wCommuns = nCommuns > 0 ? nCommuns * FILIATION_NODE_WIDTH + (nCommuns - 1) * GH : 0;
  const wEpoux1ch = nEpoux1 > 0 ? nEpoux1 * FILIATION_NODE_WIDTH + (nEpoux1 - 1) * GH : 0;
  const centerX = PAD + wEpoux1ch + (wEpoux1ch > 0 ? GH * 2 : 0)
    + (wCommuns > 0 ? wCommuns / 2 : FILIATION_NODE_WIDTH);

  let epoux1Node: FiliationOrgNode | null = null;
  let epoux2Node: FiliationOrgNode | null = null;
  const coupleLabels = getCoupleLabels(situationMatrimoniale);

  if (hasPair) {
    const gap = FILIATION_NODE_WIDTH + GH * 3;
    epoux1Node = {
      id: 'epoux1',
      label: coupleLabels.epoux1,
      x: centerX - gap / 2 - FILIATION_NODE_WIDTH / 2,
      y: yEpoux,
      kind: 'epoux',
    };
    epoux2Node = {
      id: 'epoux2',
      label: coupleLabels.epoux2,
      x: centerX + gap / 2 - FILIATION_NODE_WIDTH / 2,
      y: yEpoux,
      kind: 'epoux',
    };
    nodes.push(epoux1Node, epoux2Node);
    edges.push({
      x1: right(epoux1Node),
      y1: cy(epoux1Node),
      x2: left(epoux2Node),
      y2: cy(epoux2Node),
      dashed: isDashedCouple,
    });
  } else {
    epoux1Node = {
      id: 'epoux1',
      label: 'Vous',
      x: centerX - FILIATION_NODE_WIDTH / 2,
      y: yEpoux,
      kind: 'epoux',
    };
    nodes.push(epoux1Node);
  }

  if (enfCommuns.length > 0) {
    const groupX = PAD + wEpoux1ch + (wEpoux1ch > 0 ? GH * 2 : 0);
    const groupPad = 8;
    const commonChildNodes: FiliationOrgNode[] = [];
    groups.push({
      x: groupX - groupPad,
      y: yEnfant - groupPad,
      w: wCommuns + groupPad * 2,
      h: FILIATION_NODE_HEIGHT + groupPad * 2,
      label: '',
    });

    enfCommuns.forEach((enfant, index) => {
      const idx = enfantsContext.findIndex((candidate) => candidate.id === enfant.id);
      const nodeX = groupX + index * (FILIATION_NODE_WIDTH + GH);
      const node: FiliationOrgNode = {
        id: enfant.id,
        label: getEnfantNodeLabel(idx, enfant.deceased),
        x: nodeX,
        y: yEnfant,
        kind: 'enfant_commun',
        deceased: enfant.deceased,
      };
      nodes.push(node);
      commonChildNodes.push(node);

      const peChildren = petitsEnfants.filter((petitEnfant) => petitEnfant.parentEnfantId === enfant.id);
      const grandChildNodes: FiliationOrgNode[] = [];
      peChildren.forEach((petitEnfant, petitIndex) => {
        const peX = nodeX + petitIndex * (FILIATION_NODE_WIDTH + GH)
          - (peChildren.length - 1) * (FILIATION_NODE_WIDTH + GH) / 2;
        const peNode: FiliationOrgNode = {
          id: petitEnfant.id,
          label: 'PE',
          x: peX,
          y: yPetit,
          kind: 'petit_enfant',
        };
        nodes.push(peNode);
        grandChildNodes.push(peNode);
      });
      addAttachmentBus(edges, cx(node), bottom(node), grandChildNodes, top(node) + FILIATION_NODE_HEIGHT + groupPad);
    });

    if (epoux1Node && epoux2Node) {
      const junctionX = (right(epoux1Node) + left(epoux2Node)) / 2;
      addAttachmentBus(edges, junctionX, cy(epoux1Node), commonChildNodes, yEnfant - groupPad);
    } else if (epoux1Node) {
      addAttachmentBus(edges, cx(epoux1Node), bottom(epoux1Node), commonChildNodes, yEnfant - groupPad);
    }
  }

  if (enfEpoux1.length > 0 && epoux1Node) {
    const startX = PAD;
    const childNodes: FiliationOrgNode[] = [];
    const groupPad = 8;
    enfEpoux1.forEach((enfant, index) => {
      const idx = enfantsContext.findIndex((candidate) => candidate.id === enfant.id);
      const nodeX = startX + index * (FILIATION_NODE_WIDTH + GH);
      const node: FiliationOrgNode = {
        id: enfant.id,
        label: getEnfantNodeLabel(idx, enfant.deceased),
        x: nodeX,
        y: yEnfant,
        kind: 'enfant_autre',
        deceased: enfant.deceased,
      };
      nodes.push(node);
      childNodes.push(node);

      const peChildren = petitsEnfants.filter((petitEnfant) => petitEnfant.parentEnfantId === enfant.id);
      const grandChildNodes: FiliationOrgNode[] = [];
      peChildren.forEach((petitEnfant, petitIndex) => {
        const peX = nodeX + petitIndex * (FILIATION_NODE_WIDTH + GH);
        const peNode: FiliationOrgNode = {
          id: petitEnfant.id,
          label: 'PE',
          x: peX,
          y: yPetit,
          kind: 'petit_enfant',
        };
        nodes.push(peNode);
        grandChildNodes.push(peNode);
      });
      addAttachmentBus(edges, cx(node), bottom(node), grandChildNodes, top(node) + FILIATION_NODE_HEIGHT + groupPad);
    });
    addAttachmentBus(edges, cx(epoux1Node), bottom(epoux1Node), childNodes, yEnfant - groupPad);
  }

  if (enfEpoux2.length > 0 && epoux2Node) {
    const startX = PAD + wEpoux1ch + (wEpoux1ch > 0 ? GH * 2 : 0)
      + wCommuns + (wCommuns > 0 ? GH * 2 : 0);
    const childNodes: FiliationOrgNode[] = [];
    const groupPad = 8;
    enfEpoux2.forEach((enfant, index) => {
      const idx = enfantsContext.findIndex((candidate) => candidate.id === enfant.id);
      const nodeX = startX + index * (FILIATION_NODE_WIDTH + GH);
      const node: FiliationOrgNode = {
        id: enfant.id,
        label: getEnfantNodeLabel(idx, enfant.deceased),
        x: nodeX,
        y: yEnfant,
        kind: 'enfant_autre',
        deceased: enfant.deceased,
      };
      nodes.push(node);
      childNodes.push(node);

      const peChildren = petitsEnfants.filter((petitEnfant) => petitEnfant.parentEnfantId === enfant.id);
      const grandChildNodes: FiliationOrgNode[] = [];
      peChildren.forEach((petitEnfant, petitIndex) => {
        const peX = nodeX + petitIndex * (FILIATION_NODE_WIDTH + GH);
        const peNode: FiliationOrgNode = {
          id: petitEnfant.id,
          label: 'PE',
          x: peX,
          y: yPetit,
          kind: 'petit_enfant',
        };
        nodes.push(peNode);
        grandChildNodes.push(peNode);
      });
      addAttachmentBus(edges, cx(node), bottom(node), grandChildNodes, top(node) + FILIATION_NODE_HEIGHT + groupPad);
    });
    addAttachmentBus(edges, cx(epoux2Node), bottom(epoux2Node), childNodes, yEnfant - groupPad);
  }

  if (yParent >= 0) {
    parents1.forEach((parent, index) => {
      const nodeX = epoux1Node ? left(epoux1Node) - (index + 1) * (FILIATION_NODE_WIDTH + GH) : PAD + index * (FILIATION_NODE_WIDTH + GH);
      const node: FiliationOrgNode = { id: parent.id, label: 'Parent', x: nodeX, y: yParent, kind: 'parent' };
      nodes.push(node);
      if (epoux1Node) edges.push({ x1: cx(node), y1: bottom(node), x2: cx(epoux1Node), y2: top(epoux1Node) });
    });
    parents2.forEach((parent, index) => {
      const nodeX = epoux2Node ? right(epoux2Node) + index * (FILIATION_NODE_WIDTH + GH) : PAD + index * (FILIATION_NODE_WIDTH + GH);
      const node: FiliationOrgNode = { id: parent.id, label: 'Parent', x: nodeX, y: yParent, kind: 'parent' };
      nodes.push(node);
      if (epoux2Node) edges.push({ x1: cx(node), y1: bottom(node), x2: cx(epoux2Node), y2: top(epoux2Node) });
    });

    freres1.forEach((frere, index) => {
      const nodeX = epoux1Node
        ? left(epoux1Node) - (parents1.length + index + 1) * (FILIATION_NODE_WIDTH + GH)
        : PAD + index * (FILIATION_NODE_WIDTH + GH);
      const node: FiliationOrgNode = { id: frere.id, label: 'Frère/Sœur', x: nodeX, y: yParent, kind: 'frere_soeur' };
      nodes.push(node);
      if (epoux1Node) {
        edges.push({
          x1: right(node),
          y1: cy(node),
          x2: left(epoux1Node) - parents1.length * (FILIATION_NODE_WIDTH + GH),
          y2: cy(node),
        });
      }
    });
    freres2.forEach((frere, index) => {
      const nodeX = epoux2Node
        ? right(epoux2Node) + (parents2.length + index) * (FILIATION_NODE_WIDTH + GH)
        : PAD + index * (FILIATION_NODE_WIDTH + GH);
      const node: FiliationOrgNode = { id: frere.id, label: 'Frère/Sœur', x: nodeX, y: yParent, kind: 'frere_soeur' };
      nodes.push(node);
      if (epoux2Node) {
        edges.push({
          x1: left(node),
          y1: cy(node),
          x2: right(epoux2Node) + parents2.length * (FILIATION_NODE_WIDTH + GH),
          y2: cy(node),
        });
      }
    });
  }

  if (yOncle >= 0) {
    oncles1.forEach((oncle, index) => {
      const refX = epoux1Node ? left(epoux1Node) - parents1.length * (FILIATION_NODE_WIDTH + GH) : PAD;
      const nodeX = refX - (index + 1) * (FILIATION_NODE_WIDTH + GH);
      nodes.push({ id: oncle.id, label: 'Oncle/Tante', x: nodeX, y: yOncle, kind: 'oncle_tante' });
    });
    oncles2.forEach((oncle, index) => {
      const refX = epoux2Node ? right(epoux2Node) + parents2.length * (FILIATION_NODE_WIDTH + GH) : PAD;
      const nodeX = refX + index * (FILIATION_NODE_WIDTH + GH);
      nodes.push({ id: oncle.id, label: 'Oncle/Tante', x: nodeX, y: yOncle, kind: 'oncle_tante' });
    });
  }

  if (hasTierces) {
    const maxX = nodes.reduce((acc, node) => Math.max(acc, right(node)), 0);
    tierces.forEach((tierce, index) => {
      nodes.push({
        id: tierce.id,
        label: 'Tierce personne',
        x: maxX + GH * 2 + index * (FILIATION_NODE_WIDTH + GH),
        y: yEpoux,
        kind: 'tierce',
      });
    });
  }

  const minNodeX = nodes.reduce((acc, node) => Math.min(acc, node.x), Infinity);
  const leftShift = minNodeX < PAD ? PAD - minNodeX : 0;
  if (leftShift > 0) {
    nodes.forEach((node) => { node.x += leftShift; });
    edges.forEach((edge) => {
      edge.x1 += leftShift;
      edge.x2 += leftShift;
    });
    groups.forEach((group) => { group.x += leftShift; });
  }

  const maxNodeRight = nodes.reduce((acc, node) => Math.max(acc, right(node)), 0);
  const naturalWidth = maxNodeRight + PAD;
  const svgWidth = Math.max(naturalWidth, BASELINE_WIDTH);
  if (naturalWidth < svgWidth) {
    const centerShift = (svgWidth - naturalWidth) / 2;
    nodes.forEach((node) => { node.x += centerShift; });
    edges.forEach((edge) => {
      edge.x1 += centerShift;
      edge.x2 += centerShift;
    });
    groups.forEach((group) => { group.x += centerShift; });
  }

  return { nodes, edges, groups, svgWidth, svgHeight };
}
