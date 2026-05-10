import type { AssociateRevenuePhaseInput } from '@/engine/tresorerie/types';
import {
  computeComplement,
  computeNetRevenue,
  getPhaseEndYear,
  sortPhases,
} from '../../utils/revenuePhases';
import { getRevenuePhaseSourceLabel } from '../../utils/revenuePhaseLabels';

interface TresoTimelinePhaseListProps {
  phases: AssociateRevenuePhaseInput[];
  horizonYear: number;
  onEditPhase: (phaseId: string) => void;
}

function fmtEuro(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR')} €`;
}

export function TresoTimelinePhaseList({
  phases,
  horizonYear,
  onEditPhase,
}: TresoTimelinePhaseListProps) {
  const sorted = sortPhases(phases);

  return (
    <div className="ts-timeline-list" aria-label="Liste des paliers de revenus">
      {sorted.map(phase => {
        const label = phase.label?.trim() || getRevenuePhaseSourceLabel(phase.source);
        const endYear = getPhaseEndYear(phase, sorted, horizonYear);
        return (
          <button
            key={phase.id}
            type="button"
            className="ts-timeline-list__item"
            onClick={() => onEditPhase(phase.id)}
            aria-label={`Modifier ${label}`}
          >
            <span>
              <strong>{label}</strong>
              <small>{phase.startYear} - {endYear} · {getRevenuePhaseSourceLabel(phase.source)}</small>
            </span>
            <span>
              <strong>{fmtEuro(phase.annualNetIncomeNeed)}</strong>
              <small>complément {fmtEuro(computeComplement(phase))} · net {fmtEuro(computeNetRevenue(phase))}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}
