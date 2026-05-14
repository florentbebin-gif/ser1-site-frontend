import type { KeyboardEvent } from 'react';
import type { TimelineSubPhaseLayout, TresoTimelineLayout } from './timelineLayout';

interface TresoTimelineTrackProps {
  layout: TresoTimelineLayout;
  onEditPhase: (phaseId: string) => void;
  compact?: boolean;
}

const BAND_Y = [44, 60, 76, 92] as const;
const BAND_HEIGHT = 14;
const PALIER_Y = 28;
const PALIER_HEIGHT = 82;

const LEGEND_ITEMS: Array<{ kind: TimelineSubPhaseLayout['kind']; label: string }> = [
  { kind: 'remuneration', label: 'Rémunération' },
  { kind: 'distribution', label: 'Distribution' },
  { kind: 'cca_contribution', label: 'Constitution CCA' },
  { kind: 'cca_repayment', label: 'Remboursement CCA' },
];

function onSegmentKeyDown(
  event: KeyboardEvent<SVGGElement>,
  phaseId: string,
  onEditPhase: (phaseId: string) => void,
) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onEditPhase(phaseId);
}

function getModeText(mode: TimelineSubPhaseLayout['modeIcon']): string {
  if (mode === 'target') return 'cible';
  if (mode === 'max') return 'max';
  if (mode === 'none') return 'aucun';
  return '';
}

function getPalierTitle(item: TresoTimelineLayout['paliers'][number]): string {
  const details = item.subPhases
    .filter(subPhase => subPhase.enabled)
    .map(subPhase => subPhase.detail)
    .join(' · ');
  return `Palier ${item.startYear}-${item.endYear}${details ? ` - ${details}` : ''}`;
}

export function TresoTimelineTrack({ layout, onEditPhase, compact = false }: TresoTimelineTrackProps) {
  const tickModulo = layout.ticks.length > 10 ? 2 : 1;
  const svgHeight = compact ? 124 : layout.svgHeight;

  return (
    <div className={`ts-timeline-track-outer${compact ? ' ts-timeline-track-outer--compact' : ''} ts-scroll-x`}>
      <div className={`ts-timeline-track${compact ? ' ts-timeline-track--compact' : ''}`} aria-label="Timeline des revenus">
        <svg
          width={layout.svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${layout.svgWidth} ${svgHeight}`}
          role="img"
          aria-label="Parcours de revenus"
        >
          <defs>
            <pattern id="ts-subphase-disabled" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" className="ts-timeline-track__pattern-line" />
            </pattern>
          </defs>

          {layout.ticks.map((tick, index) => (
            <g key={tick.year}>
              <line x1={tick.x} y1="24" x2={tick.x} y2="110" className="ts-timeline-track__tick" />
              {index % tickModulo === 0 ? (
                <>
                  <text x={tick.x} y="18" textAnchor="middle" className="ts-timeline-track__year">
                    {tick.year}
                  </text>
                  {!compact && tick.age != null ? (
                    <text x={tick.x} y="128" textAnchor="middle" className="ts-timeline-track__age">
                      {tick.age} ans
                    </text>
                  ) : null}
                </>
              ) : null}
            </g>
          ))}

          {!compact ? (
            <line
              x1={layout.trackLeft}
              y1="112"
              x2={layout.trackRight}
              y2="112"
              className="ts-timeline-track__age-axis"
            />
          ) : null}

          {layout.paliers.map(item => {
            const title = getPalierTitle(item);
            const showPalierLabel = item.width >= 130 && item.phase.label?.trim();
            const textWidth = Math.max(0, item.width - 18);
            return (
              <g
                key={item.phase.id}
                role="button"
                tabIndex={0}
                aria-label={`Modifier ${title}`}
                className="ts-timeline-track__palier"
                onClick={() => onEditPhase(item.phase.id)}
                onKeyDown={event => onSegmentKeyDown(event, item.phase.id, onEditPhase)}
              >
                <title>{title}</title>
                <rect
                  x={item.x}
                  y={PALIER_Y}
                  width={item.width}
                  height={PALIER_HEIGHT}
                  rx="6"
                  className="ts-timeline-track__palier-bg"
                />
                {showPalierLabel ? (
                  <text x={item.x + 8} y="39" className="ts-timeline-track__palier-label">
                    {item.phase.label}
                  </text>
                ) : null}
                {item.subPhases.map(subPhase => {
                  const y = BAND_Y[subPhase.bandIndex];
                  const modeText = getModeText(subPhase.modeIcon);
                  const showText = subPhase.enabled && item.width >= 80;
                  const showMode = subPhase.enabled && modeText && item.width >= 118;
                  const bandClass = [
                    'ts-timeline-track__subphase',
                    `ts-timeline-track__subphase--${subPhase.kind}`,
                    subPhase.enabled ? 'is-enabled' : 'is-disabled',
                    subPhase.modeIcon === 'none' ? 'has-none-mode' : '',
                    subPhase.kind === 'remuneration' && item.phase.remuneration.source === 'subsidiary'
                      ? 'is-subsidiary-source'
                      : '',
                  ].filter(Boolean).join(' ');
                  return (
                    <g key={subPhase.kind}>
                      <rect
                        x={item.x + 6}
                        y={y}
                        width={Math.max(0, item.width - 12)}
                        height={BAND_HEIGHT}
                        rx="4"
                        className={bandClass}
                      />
                      {!subPhase.enabled ? (
                        <rect
                          x={item.x + 6}
                          y={y}
                          width={Math.max(0, item.width - 12)}
                          height={BAND_HEIGHT}
                          rx="4"
                          fill="url(#ts-subphase-disabled)"
                          className="ts-timeline-track__subphase-hatch"
                        />
                      ) : null}
                      {showText ? (
                        <text
                          x={item.x + item.width / 2}
                          y={y + 10}
                          textAnchor="middle"
                          className="ts-timeline-track__subphase-label"
                          textLength={textWidth > 28 ? undefined : textWidth}
                          lengthAdjust="spacingAndGlyphs"
                        >
                          {subPhase.shortLabel}
                        </text>
                      ) : null}
                      {showMode ? (
                        <text
                          x={item.x + item.width - 12}
                          y={y + 10}
                          textAnchor="end"
                          className="ts-timeline-track__subphase-mode"
                        >
                          {modeText}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {!compact ? (
            <g className="ts-timeline-track__legend">
              {LEGEND_ITEMS.map((item, index) => {
                const x = layout.trackLeft + index * 150;
                return (
                  <g key={item.kind} transform={`translate(${x} 146)`}>
                    <rect
                      x="0"
                      y="-9"
                      width="18"
                      height="8"
                      rx="3"
                      className={`ts-timeline-track__subphase ts-timeline-track__subphase--${item.kind} is-enabled`}
                    />
                    <text x="24" y="-2" className="ts-timeline-track__legend-label">
                      {item.label}
                    </text>
                  </g>
                );
              })}
            </g>
          ) : null}
        </svg>
      </div>
    </div>
  );
}
