import type { KeyboardEvent } from 'react';
import type { CompanyInput } from '@/engine/tresorerie/types';
import {
  getTresoOrgchartCompanyKindLabel,
  getTresoOrgchartNodeLabel,
  TRESO_ORG_NODE_HEIGHT,
  TRESO_ORG_NODE_WIDTH,
  computeTresoOrgchartLayout,
  type TresoOrgNode,
} from '../../tresoOrgchartLayout';

interface TresoOrgChartProps {
  company: CompanyInput;
  selectedAssociateId: string;
  onCompanyClick: () => void;
  onAssociateClick: (associateId: string) => void;
  onSubsidiaryClick: (subsidiaryId: string) => void;
}

function handleKeyboardActivation(
  event: KeyboardEvent<SVGGElement>,
  callback: () => void,
): void {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  callback();
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

export function TresoOrgChart({
  company,
  selectedAssociateId,
  onCompanyClick,
  onAssociateClick,
  onSubsidiaryClick,
}: TresoOrgChartProps) {
  const layout = computeTresoOrgchartLayout(company, selectedAssociateId);
  const companyKindLabel = getTresoOrgchartCompanyKindLabel(company);
  const minDisplayWidth = layout.svgWidth <= 180 ? 240 : 380;
  const displayedSvgWidth = Math.max(layout.svgWidth, minDisplayWidth);

  const runNodeAction = (node: TresoOrgNode) => {
    if (node.kind === 'company') {
      onCompanyClick();
      return;
    }
    if (node.kind === 'associate') {
      onAssociateClick(node.id);
      return;
    }
    onSubsidiaryClick(node.id);
  };

  return (
    <div className="ts-org-chart" aria-label="Schéma société">
      <svg
        className="ts-org-chart__svg"
        style={{ width: `${displayedSvgWidth}px` }}
        role="img"
        aria-label="Schéma des détentions société"
        viewBox={`0 0 ${layout.svgWidth} ${layout.svgHeight}`}
      >
        <g className="ts-org-links" aria-hidden="true">
          {layout.edges.map(edge => (
            <line
              key={edge.id}
              className="ts-org-link"
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
            />
          ))}
          {layout.labels.map(label => (
            <g key={label.id} className="ts-org-link-label">
              <rect x={label.x - 23} y={label.y - 11} width="46" height="22" rx="6" />
              <text x={label.x} y={label.y + 4} textAnchor="middle">{label.text}</text>
            </g>
          ))}
        </g>

        {layout.nodes.map(node => {
          const ariaLabel = getTresoOrgchartNodeLabel(node);
          const title = node.kind === 'company' ? companyKindLabel : node.label;
          const subtitle = node.kind === 'company' ? node.label : node.meta;
          const metaParts = node.kind === 'company' && node.meta ? node.meta.split(' · ') : [];
          return (
            <g
              key={node.id}
              role="button"
              tabIndex={0}
              aria-label={ariaLabel}
              className={`ts-org-svg-node ts-org-svg-node--${node.kind}${node.active ? ' is-active' : ''}`}
              transform={`translate(${node.x} ${node.y})`}
              onClick={() => runNodeAction(node)}
              onKeyDown={event => handleKeyboardActivation(event, () => runNodeAction(node))}
            >
              <rect
                className="ts-org-svg-node__box"
                width={TRESO_ORG_NODE_WIDTH}
                height={TRESO_ORG_NODE_HEIGHT}
                rx="8"
              />
              <text className="ts-org-svg-node__label" x={TRESO_ORG_NODE_WIDTH / 2} y="19" textAnchor="middle">
                {truncate(title, 23)}
              </text>
              {subtitle ? (
                <text className="ts-org-svg-node__meta" x={TRESO_ORG_NODE_WIDTH / 2} y="33" textAnchor="middle">
                  {truncate(subtitle, 24)}
                </text>
              ) : null}
              {metaParts.length > 0 ? (
                <text className="ts-org-svg-node__code" x={TRESO_ORG_NODE_WIDTH / 2} y="41" textAnchor="middle">
                  <tspan>{truncate(metaParts[0], 8)}</tspan>
                  {metaParts[1] ? <tspan>{` · ${truncate(metaParts[1], 8)}`}</tspan> : null}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
