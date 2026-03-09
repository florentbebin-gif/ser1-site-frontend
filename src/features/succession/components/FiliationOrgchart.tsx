/**
 * FiliationOrgchart — Organigramme SVG de la filiation familiale
 *
 * Construit automatiquement à partir du contexte civil, des enfants et des membres de la famille.
 * Aucune dépendance externe — SVG pur avec tokens CSS du projet.
 */

import React, { useMemo } from 'react';
import type { SuccessionCivilContext, SuccessionEnfant, FamilyMember } from '../successionDraft';
import { getEnfantNodeLabel } from '../successionEnfants';

// ─── Constantes de layout ───────────────────────────────────────────────────
const NW = 80;             // node width
const NH = 24;             // node height
const GH = 12;             // horizontal gap between nodes
const GV = 40;             // vertical gap between levels
const PAD = 12;            // canvas padding
const BASELINE_WIDTH = 380; // canvas minimum width (= 2 époux + 4 enfants communs)

// ─── Types internes ─────────────────────────────────────────────────────────
interface OrgNode {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: 'epoux' | 'enfant_commun' | 'enfant_autre' | 'parent' | 'frere_soeur' | 'oncle_tante' | 'petit_enfant' | 'tierce';
  deceased?: boolean;
}

interface OrgEdge {
  x1: number; y1: number;
  x2: number; y2: number;
  dashed?: boolean;
}

interface OrgGroup {
  x: number; y: number; w: number; h: number;
  label: string;
}

interface OrgLayout {
  nodes: OrgNode[];
  edges: OrgEdge[];
  groups: OrgGroup[];
  svgWidth: number;
  svgHeight: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function cx(node: OrgNode): number { return node.x + NW / 2; }
function cy(node: OrgNode): number { return node.y + NH / 2; }
function bottom(node: OrgNode): number { return node.y + NH; }
function top(node: OrgNode): number { return node.y; }
function right(node: OrgNode): number { return node.x + NW; }
function left(node: OrgNode): number { return node.x; }

// ─── Labels par situation matrimoniale ──────────────────────────────────────
function getCoupleLabels(situation: string): { epoux1: string; epoux2: string } {
  if (situation === 'marie')       return { epoux1: 'Époux 1',      epoux2: 'Époux 2' };
  if (situation === 'pacse')       return { epoux1: 'Partenaire 1', epoux2: 'Partenaire 2' };
  if (situation === 'concubinage') return { epoux1: 'Partenaire 1', epoux2: 'Partenaire 2' };
  if (situation === 'divorce')     return { epoux1: 'Défunt(e)',     epoux2: 'Ex-conjoint(e)' };
  return { epoux1: 'Défunt(e)', epoux2: '' };
}

// ─── Calcul du layout ───────────────────────────────────────────────────────
function computeLayout(
  civilContext: SuccessionCivilContext,
  enfantsContext: SuccessionEnfant[],
  familyMembers: FamilyMember[],
): OrgLayout {
  const nodes: OrgNode[] = [];
  const edges: OrgEdge[] = [];
  const groups: OrgGroup[] = [];

  const { situationMatrimoniale } = civilContext;
  const hasPair = ['marie', 'pacse', 'concubinage', 'divorce'].includes(situationMatrimoniale);
  const isDashedCouple = situationMatrimoniale === 'concubinage' || situationMatrimoniale === 'divorce';

  // Membres par catégorie
  const parents1 = familyMembers.filter((m) => m.type === 'parent' && m.branch === 'epoux1');
  const parents2 = familyMembers.filter((m) => m.type === 'parent' && m.branch === 'epoux2');
  const freres1  = familyMembers.filter((m) => m.type === 'frere_soeur' && m.branch === 'epoux1');
  const freres2  = familyMembers.filter((m) => m.type === 'frere_soeur' && m.branch === 'epoux2');
  const oncles1  = familyMembers.filter((m) => m.type === 'oncle_tante' && m.branch === 'epoux1');
  const oncles2  = familyMembers.filter((m) => m.type === 'oncle_tante' && m.branch === 'epoux2');
  const tierces  = familyMembers.filter((m) => m.type === 'tierce_personne');

  // Enfants par rattachement
  const enfCommuns  = enfantsContext.filter((e) => e.rattachement === 'commun');
  const enfEpoux1   = enfantsContext.filter((e) => e.rattachement === 'epoux1');
  const enfEpoux2   = enfantsContext.filter((e) => e.rattachement === 'epoux2');

  // Petits-enfants par parent
  const petitsEnfants = familyMembers.filter((m) => m.type === 'petit_enfant');

  // ── Calcul des niveaux Y ──
  const hasOncles = oncles1.length > 0 || oncles2.length > 0;
  const hasParents = parents1.length > 0 || parents2.length > 0;
  const hasFreres = freres1.length > 0 || freres2.length > 0;
  const hasEnfants = enfantsContext.length > 0;
  const hasPetitsEnfants = petitsEnfants.length > 0;
  const hasTierces = tierces.length > 0;

  let currentY = PAD;
  const yOncle = hasOncles ? currentY : -1;
  if (hasOncles) currentY += NH + GV;

  const yParent = (hasParents || hasFreres) ? currentY : -1;
  if (hasParents || hasFreres) currentY += NH + GV;

  const yEpoux = currentY;
  currentY += NH + GV;

  const yEnfant = hasEnfants ? currentY : -1;
  if (hasEnfants) currentY += NH + GV;

  const yPetit = hasPetitsEnfants ? currentY : -1;
  if (hasPetitsEnfants) currentY += NH + GV;

  const svgHeight = currentY + PAD;

  // ── Positionner les époux au centre ──
  // On calcule d'abord la largeur totale nécessaire pour les enfants communs
  const nCommuns = enfCommuns.length;
  const nEpoux1  = enfEpoux1.length;

  // Largeur zone enfants
  const wCommuns  = nCommuns > 0 ? nCommuns * NW + (nCommuns - 1) * GH : 0;
  const wEpoux1ch = nEpoux1  > 0 ? nEpoux1  * NW + (nEpoux1  - 1) * GH : 0;

  // Centre X des époux = basé sur les enfants communs
  const centerX = PAD + wEpoux1ch + (wEpoux1ch > 0 ? GH * 2 : 0)
    + (wCommuns > 0 ? wCommuns / 2 : NW);

  // Positions des époux
  let epoux1Node: OrgNode | null = null;
  let epoux2Node: OrgNode | null = null;

  const coupleLabels = getCoupleLabels(situationMatrimoniale);

  if (hasPair) {
    const gap = NW + GH * 3;
    epoux1Node = {
      id: 'epoux1', label: coupleLabels.epoux1,
      x: centerX - gap / 2 - NW / 2, y: yEpoux,
      kind: 'epoux',
    };
    epoux2Node = {
      id: 'epoux2', label: coupleLabels.epoux2,
      x: centerX + gap / 2 - NW / 2, y: yEpoux,
      kind: 'epoux',
    };
    nodes.push(epoux1Node, epoux2Node);

    // Ligne horizontale époux1 ↔ époux2 (pointillée pour union libre / divorcé)
    edges.push({
      x1: right(epoux1Node), y1: cy(epoux1Node),
      x2: left(epoux2Node),  y2: cy(epoux2Node),
      dashed: isDashedCouple,
    });
  } else {
    epoux1Node = {
      id: 'epoux1', label: 'Défunt(e)',
      x: centerX - NW / 2, y: yEpoux,
      kind: 'epoux',
    };
    nodes.push(epoux1Node);
  }

  // ── Enfants communs (groupés sous les deux époux) ──
  if (enfCommuns.length > 0) {
    const groupX = PAD + wEpoux1ch + (wEpoux1ch > 0 ? GH * 2 : 0);
    const groupPad = 8;

    // Encadré groupe
    groups.push({
      x: groupX - groupPad, y: yEnfant! - groupPad,
      w: wCommuns + groupPad * 2, h: NH + groupPad * 2,
      label: '',
    });

    enfCommuns.forEach((e, i) => {
      const idx = enfantsContext.findIndex((x) => x.id === e.id);
      const nodeX = groupX + i * (NW + GH);
      const node: OrgNode = {
        id: e.id, label: getEnfantNodeLabel(idx, e.deceased),
        x: nodeX, y: yEnfant!,
        kind: 'enfant_commun',
        deceased: e.deceased,
      };
      nodes.push(node);

      // Ligne depuis jonction époux → enfant commun
      if (epoux1Node && epoux2Node) {
        const junctionX = (right(epoux1Node) + left(epoux2Node)) / 2;
        const junctionY = cy(epoux1Node);
        edges.push({ x1: junctionX, y1: junctionY, x2: junctionX, y2: top(node) - groupPad });
        edges.push({ x1: cx(node), y1: top(node) - groupPad, x2: cx(node), y2: top(node) });
      } else if (epoux1Node) {
        edges.push({ x1: cx(epoux1Node), y1: bottom(epoux1Node), x2: cx(node), y2: top(node) });
      }

      // Petits-enfants sous cet enfant
      const peChildren = petitsEnfants.filter((p) => p.parentEnfantId === e.id);
      peChildren.forEach((pe, pi) => {
        const peX = nodeX + pi * (NW + GH) - (peChildren.length - 1) * (NW + GH) / 2;
        const peNode: OrgNode = {
          id: pe.id, label: `PE`,
          x: peX, y: yPetit!,
          kind: 'petit_enfant',
        };
        nodes.push(peNode);
        edges.push({ x1: cx(node), y1: bottom(node), x2: cx(peNode), y2: top(peNode) });
      });
    });
  }

  // ── Enfants époux 1 (à gauche) ──
  if (enfEpoux1.length > 0 && epoux1Node) {
    const startX = PAD;
    enfEpoux1.forEach((e, i) => {
      const idx = enfantsContext.findIndex((x) => x.id === e.id);
      const nodeX = startX + i * (NW + GH);
      const node: OrgNode = {
        id: e.id, label: getEnfantNodeLabel(idx, e.deceased),
        x: nodeX, y: yEnfant!,
        kind: 'enfant_autre',
        deceased: e.deceased,
      };
      nodes.push(node);
      edges.push({ x1: cx(epoux1Node!), y1: bottom(epoux1Node!), x2: cx(node), y2: top(node) });

      // Petits-enfants
      const peChildren = petitsEnfants.filter((p) => p.parentEnfantId === e.id);
      peChildren.forEach((pe, pi) => {
        const peX = nodeX + pi * (NW + GH);
        const peNode: OrgNode = { id: pe.id, label: 'PE', x: peX, y: yPetit!, kind: 'petit_enfant' };
        nodes.push(peNode);
        edges.push({ x1: cx(node), y1: bottom(node), x2: cx(peNode), y2: top(peNode) });
      });
    });
  }

  // ── Enfants époux 2 (à droite) ──
  if (enfEpoux2.length > 0 && epoux2Node) {
    const startX = PAD + wEpoux1ch + (wEpoux1ch > 0 ? GH * 2 : 0) + wCommuns + (wCommuns > 0 ? GH * 2 : 0);
    enfEpoux2.forEach((e, i) => {
      const idx = enfantsContext.findIndex((x) => x.id === e.id);
      const nodeX = startX + i * (NW + GH);
      const node: OrgNode = {
        id: e.id, label: getEnfantNodeLabel(idx, e.deceased),
        x: nodeX, y: yEnfant!,
        kind: 'enfant_autre',
        deceased: e.deceased,
      };
      nodes.push(node);
      edges.push({ x1: cx(epoux2Node!), y1: bottom(epoux2Node!), x2: cx(node), y2: top(node) });

      // Petits-enfants
      const peChildren = petitsEnfants.filter((p) => p.parentEnfantId === e.id);
      peChildren.forEach((pe, pi) => {
        const peX = nodeX + pi * (NW + GH);
        const peNode: OrgNode = { id: pe.id, label: 'PE', x: peX, y: yPetit!, kind: 'petit_enfant' };
        nodes.push(peNode);
        edges.push({ x1: cx(node), y1: bottom(node), x2: cx(peNode), y2: top(peNode) });
      });
    });
  }

  // ── Parents (niveau -1, au-dessus des époux) ──
  if (yParent >= 0) {
    parents1.forEach((p, i) => {
      const nodeX = epoux1Node ? left(epoux1Node) - (i + 1) * (NW + GH) : PAD + i * (NW + GH);
      const node: OrgNode = { id: p.id, label: 'Parent', x: nodeX, y: yParent, kind: 'parent' };
      nodes.push(node);
      if (epoux1Node) edges.push({ x1: cx(node), y1: bottom(node), x2: cx(epoux1Node), y2: top(epoux1Node) });
    });
    parents2.forEach((p, i) => {
      const nodeX = epoux2Node ? right(epoux2Node) + i * (NW + GH) : PAD + i * (NW + GH);
      const node: OrgNode = { id: p.id, label: 'Parent', x: nodeX, y: yParent, kind: 'parent' };
      nodes.push(node);
      if (epoux2Node) edges.push({ x1: cx(node), y1: bottom(node), x2: cx(epoux2Node), y2: top(epoux2Node) });
    });

    // ── Frères/sœurs (niveau -1, à côté des époux) ──
    freres1.forEach((f, i) => {
      const nodeX = epoux1Node ? left(epoux1Node) - (parents1.length + i + 1) * (NW + GH) : PAD + i * (NW + GH);
      const node: OrgNode = { id: f.id, label: 'Frère/Sœur', x: nodeX, y: yParent, kind: 'frere_soeur' };
      nodes.push(node);
      if (epoux1Node) {
        edges.push({ x1: right(node), y1: cy(node), x2: left(epoux1Node) - (parents1.length) * (NW + GH), y2: cy(node) });
      }
    });
    freres2.forEach((f, i) => {
      const nodeX = epoux2Node ? right(epoux2Node) + (parents2.length + i) * (NW + GH) : PAD + i * (NW + GH);
      const node: OrgNode = { id: f.id, label: 'Frère/Sœur', x: nodeX, y: yParent, kind: 'frere_soeur' };
      nodes.push(node);
      if (epoux2Node) {
        edges.push({ x1: left(node), y1: cy(node), x2: right(epoux2Node) + (parents2.length) * (NW + GH), y2: cy(node) });
      }
    });
  }

  // ── Oncles/tantes (niveau -2) ──
  if (yOncle >= 0) {
    oncles1.forEach((o, i) => {
      const refX = epoux1Node ? left(epoux1Node) - (parents1.length) * (NW + GH) : PAD;
      const nodeX = refX - (i + 1) * (NW + GH);
      const node: OrgNode = { id: o.id, label: 'Oncle/Tante', x: nodeX, y: yOncle, kind: 'oncle_tante' };
      nodes.push(node);
    });
    oncles2.forEach((o, i) => {
      const refX = epoux2Node ? right(epoux2Node) + (parents2.length) * (NW + GH) : PAD;
      const nodeX = refX + i * (NW + GH);
      const node: OrgNode = { id: o.id, label: 'Oncle/Tante', x: nodeX, y: yOncle, kind: 'oncle_tante' };
      nodes.push(node);
    });
  }

  // ── Tierce personne (flottant bas-droite) ──
  if (hasTierces) {
    const maxX = nodes.reduce((acc, n) => Math.max(acc, right(n)), 0);
    tierces.forEach((t, i) => {
      const node: OrgNode = {
        id: t.id, label: 'Tierce personne',
        x: maxX + GH * 2 + i * (NW + GH), y: yEpoux,
        kind: 'tierce',
      };
      nodes.push(node);
    });
  }

  // ── Normalisation : s'assurer qu'aucun nœud ne sort à gauche ──
  const minNodeX = nodes.reduce((acc, n) => Math.min(acc, n.x), Infinity);
  const leftShift = minNodeX < PAD ? PAD - minNodeX : 0;
  if (leftShift > 0) {
    nodes.forEach((n) => { n.x += leftShift; });
    edges.forEach((e) => { e.x1 += leftShift; e.x2 += leftShift; });
    groups.forEach((g) => { g.x += leftShift; });
  }

  // ── Canvas de référence + centrage horizontal ──
  const maxNodeRight = nodes.reduce((acc, n) => Math.max(acc, right(n)), 0);
  const naturalWidth = maxNodeRight + PAD;
  const svgWidth = Math.max(naturalWidth, BASELINE_WIDTH);
  if (naturalWidth < svgWidth) {
    const centerShift = (svgWidth - naturalWidth) / 2;
    nodes.forEach((n) => { n.x += centerShift; });
    edges.forEach((e) => { e.x1 += centerShift; e.x2 += centerShift; });
    groups.forEach((g) => { g.x += centerShift; });
  }

  return { nodes, edges, groups, svgWidth, svgHeight };
}

// ─── Styles par kind ────────────────────────────────────────────────────────
function nodeStyle(kind: OrgNode['kind'], deceased?: boolean): React.SVGProps<SVGRectElement> {
  if (deceased) {
    return {
      fill: 'var(--color-c8)',
      stroke: 'var(--color-c9)',
      strokeWidth: 0.9,
      strokeDasharray: '4 3',
      strokeOpacity: 0.65,
      rx: 8,
    };
  }
  if (kind === 'epoux') {
    return {
      fill: 'var(--color-c7)',
      stroke: 'var(--color-c1)',
      strokeWidth: 1,
      strokeOpacity: 0.35,
      rx: 10,
    };
  }
  if (kind === 'tierce') {
    return {
      fill: 'var(--color-c7)',
      stroke: 'var(--color-c9)',
      strokeWidth: 0.75,
      strokeDasharray: '3 2',
      strokeOpacity: 0.6,
      rx: 8,
    };
  }
  if (kind === 'enfant_commun') {
    return { fill: 'var(--color-c6)', rx: 8 };
  }
  return { fill: 'var(--color-c7)', stroke: 'var(--color-c8)', strokeWidth: 0.75, rx: 8 };
}

// ─── Composant ──────────────────────────────────────────────────────────────
interface FiliationOrgchartProps {
  civilContext: SuccessionCivilContext;
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
}

export function FiliationOrgchart({
  civilContext,
  enfantsContext,
  familyMembers,
}: FiliationOrgchartProps): React.ReactElement {
  const { nodes, edges, groups, svgWidth, svgHeight } = useMemo(
    () => computeLayout(civilContext, enfantsContext, familyMembers),
    [civilContext, enfantsContext, familyMembers],
  );

  const isEmpty = nodes.length === 0;
  const hasDeceasedChild = enfantsContext.some((enfant) => enfant.deceased);

  return (
    <div className="premium-card sc-card sc-card--guide sc-filiation-card">
      <header className="sc-card__header">
        <div className="sc-card__title-row">
          <div className="sc-section-icon-wrapper">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </div>
          <h2 className="sc-card__title">
            Filiation
            {hasDeceasedChild && <span className="sc-filiation-deceased-mark"> †</span>}
          </h2>
        </div>
      </header>
      <div className="sc-card__divider" />

      {isEmpty ? (
        <p className="sc-hint">
          Ajoutez des membres de la famille pour visualiser la filiation.
        </p>
      ) : (
        <div>
          <svg
            width="100%"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="xMidYMin meet"
            style={{ display: 'block' }}
            aria-label="Organigramme de filiation"
          >
            {/* Groupes (encadrés enfants communs) */}
            {groups.map((g, i) => (
              <rect
                key={`group-${i}`}
                x={g.x} y={g.y} width={g.w} height={g.h}
                fill="none"
                stroke="var(--color-c8)"
                strokeWidth={1.5}
                rx={12}
                strokeDasharray="6 3"
              />
            ))}

            {/* Lignes de connexion */}
            {edges.map((e, i) => (
              <line
                key={`edge-${i}`}
                x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                stroke="var(--color-c8)"
                strokeWidth={1}
                strokeDasharray={e.dashed ? '4 3' : undefined}
              />
            ))}

            {/* Nœuds */}
            {nodes.map((node) => {
              const style = nodeStyle(node.kind, node.deceased);
              return (
                <g
                  key={node.id}
                  style={{
                    filter: node.kind === 'epoux'
                      ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.14))'
                      : 'drop-shadow(0 1px 3px rgba(0,0,0,0.07))',
                  }}
                >
                  <rect
                    x={node.x} y={node.y}
                    width={NW} height={NH}
                    {...style}
                  />
                  <text
                    x={cx(node)} y={cy(node)}
                    dominantBaseline="central"
                    textAnchor="middle"
                    fontSize={node.kind === 'epoux' ? 10 : 9}
                    fontWeight={node.kind === 'epoux' ? 600 : 400}
                    fill={node.kind === 'epoux' ? 'var(--color-c1)' : node.deceased ? 'var(--color-c1)' : 'var(--color-c9)'}
                    style={{ userSelect: 'none' }}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
