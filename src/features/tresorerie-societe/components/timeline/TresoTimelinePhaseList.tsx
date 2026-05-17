import type { AssociateRevenuePhaseInputV6 } from '@/engine/tresorerie/types';
import { getPhaseAmountLines, getPhaseTitle, sortPhases } from '../../utils/revenuePhases';

interface TresoTimelinePhaseListProps {
  phases: AssociateRevenuePhaseInputV6[];
  onEditPhase: (phaseId: string) => void;
}

export function TresoTimelinePhaseList({ phases, onEditPhase }: TresoTimelinePhaseListProps) {
  const sorted = sortPhases(phases);

  return (
    <div className="ts-timeline-list" aria-label="Liste des paliers de revenus">
      {sorted.map((phase) => {
        const palierLabel = `Palier ${phase.startYear}-${phase.endYear}`;
        const title = getPhaseTitle(phase);
        const amountLines = getPhaseAmountLines(phase);
        const duration = Math.max(1, phase.endYear - phase.startYear + 1);
        return (
          <button
            key={phase.id}
            type="button"
            className="ts-timeline-list__item ts-timeline-list__item--enriched"
            onClick={() => onEditPhase(phase.id)}
            aria-label={`Modifier ${palierLabel} - ${title}`}
          >
            <span className="ts-timeline-list__title">
              <strong>{palierLabel}</strong>
              <em> - {title}</em>
            </span>
            <span className="ts-timeline-list__duration">
              {duration} {duration > 1 ? 'ans' : 'an'}
            </span>
            <span className="ts-timeline-list__amounts">
              {amountLines.length > 0 ? (
                amountLines.map((line) => <span key={line}>{line}</span>)
              ) : (
                <span className="ts-timeline-list__amounts--empty">Aucun flux paramétré</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
