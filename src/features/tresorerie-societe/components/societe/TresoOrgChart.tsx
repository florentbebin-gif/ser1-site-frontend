import type { KeyboardEvent } from 'react';
import type { CompanyInput } from '@/engine/tresorerie/types';
import {
  getTresoOrgchartCompanyKindLabel,
  getTresoOrgchartNodeLabel,
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
        style={{ width: `${layout.svgWidth}px` }}
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
              <rect x={label.x - 18} y={label.y - 8} width="36" height="16" rx="5" />
              <text x={label.x} y={label.y + 3} textAnchor="middle">{label.text}</text>
            </g>
          ))}
        </g>

        {layout.nodes.map(node => {
          const baseAriaLabel = node.kind === 'company'
            ? `Paramétrer ${companyKindLabel}`
            : getTresoOrgchartNodeLabel(node);
          const ariaLabel = node.active
            ? `${baseAriaLabel} - associé actif`
            : baseAriaLabel;
          const title = node.kind === 'company' ? companyKindLabel : node.label;
          const subtitle = node.kind === 'company' ? node.label : node.meta;
          const metaParts = node.kind === 'company' && node.meta ? node.meta.split(' · ') : [];
          const titleY = node.kind === 'company' ? 27 : 17;
          const subtitleY = node.kind === 'company' ? 46 : 30;
          const codeY = node.kind === 'company' ? 58 : 34;
          const maxTitleLength = node.kind === 'company' ? 30 : 18;
          const maxSubtitleLength = node.kind === 'company' ? 28 : 18;
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
                width={node.width}
                height={node.height}
                rx="8"
              />
              <text className="ts-org-svg-node__label" x={node.width / 2} y={titleY} textAnchor="middle">
                {truncate(title, maxTitleLength)}
              </text>
              {subtitle ? (
                <text className="ts-org-svg-node__meta" x={node.width / 2} y={subtitleY} textAnchor="middle">
                  {truncate(subtitle, maxSubtitleLength)}
                </text>
              ) : null}
              {metaParts.length > 0 ? (
                <text className="ts-org-svg-node__code" x={node.width / 2} y={codeY} textAnchor="middle">
                  <tspan>{truncate(metaParts[0], 8)}</tspan>
                  {metaParts[1] ? <tspan>{` · ${truncate(metaParts[1], 8)}`}</tspan> : null}
                </text>
              ) : null}
              {node.active ? (
                <g className="ts-org-svg-node__active-badge">
                  <rect x={node.width - 33} y="-7" width="29" height="12" rx="4" />
                  <text x={node.width - 18.5} y="2" textAnchor="middle">Actif</text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
