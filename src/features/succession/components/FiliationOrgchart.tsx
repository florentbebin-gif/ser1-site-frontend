/**
 * FiliationOrgchart — Organigramme SVG de la filiation familiale.
 *
 * Le layout est partagé avec l'export PPTX pour garder le même schéma.
 */

import React, { useMemo } from 'react';
import type { SuccessionCivilContext, SuccessionEnfant, FamilyMember } from '../successionDraft';
import {
  FILIATION_NODE_HEIGHT,
  FILIATION_NODE_WIDTH,
  computeFiliationOrgchartLayout,
  getFiliationNodeCenterX,
  getFiliationNodeCenterY,
  type FiliationOrgNode,
} from '../filiationOrgchartLayout';

function nodeStyle(kind: FiliationOrgNode['kind'], deceased?: boolean): React.SVGProps<SVGRectElement> {
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
    () => computeFiliationOrgchartLayout(civilContext, enfantsContext, familyMembers),
    [civilContext, enfantsContext, familyMembers],
  );

  const isEmpty = nodes.length === 0;
  const hasDeceasedChild = enfantsContext.some((enfant) => enfant.deceased);

  return (
    <div className="premium-card sc-card sc-card--guide sim-card--guide sc-filiation-card">
      <header className="sc-card__header sim-card__header sim-card__header--bleed">
        <div className="sc-card__title-row sim-card__title sim-card__title-row">
          <div className="sim-card__icon">
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
      <div className="sc-card__divider sc-card__divider--tight sim-divider sim-divider--tight" />

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
            {groups.map((group, index) => (
              <rect
                key={`group-${index}`}
                x={group.x}
                y={group.y}
                width={group.w}
                height={group.h}
                fill="none"
                stroke="var(--color-c8)"
                strokeWidth={1.5}
                rx={12}
                strokeDasharray="6 3"
              />
            ))}

            {edges.map((edge, index) => (
              <line
                key={`edge-${index}`}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke="var(--color-c8)"
                strokeWidth={1}
                strokeDasharray={edge.dashed ? '4 3' : undefined}
              />
            ))}

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
                    x={node.x}
                    y={node.y}
                    width={FILIATION_NODE_WIDTH}
                    height={FILIATION_NODE_HEIGHT}
                    {...style}
                  />
                  <text
                    x={getFiliationNodeCenterX(node)}
                    y={getFiliationNodeCenterY(node)}
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
