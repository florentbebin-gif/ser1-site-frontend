import type { AssociateRevenuePhaseInputV6 } from '@/engine/tresorerie/types';
import {
  computeComplement,
  computeNetRevenue,
  sortPhases,
} from '../../utils/revenuePhases';

interface TresoTimelinePhaseListProps {
  phases: AssociateRevenuePhaseInputV6[];
  onEditPhase: (phaseId: string) => void;
}

function fmtEuro(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR')} €`;
}

export function TresoTimelinePhaseList({
  phases,
  onEditPhase,
}: TresoTimelinePhaseListProps) {
  const sorted = sortPhases(phases);

  return (
    <div className="ts-timeline-list" aria-label="Liste des paliers de revenus">
      {sorted.map(phase => {
        const label = phase.label?.trim() || `Palier ${phase.startYear}-${phase.endYear}`;
        const activeSubPhaseCount = [
          phase.remuneration.enabled && phase.remuneration.source !== 'none',
          phase.distribution.enabled && phase.distribution.dividendsStrategy !== 'aucun',
          phase.ccaContribution.enabled,
          phase.ccaRepayment.enabled && phase.ccaRepayment.strategy !== 'aucun',
        ].filter(Boolean).length;
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
              <small>
                {phase.startYear} - {phase.endYear} · {activeSubPhaseCount} sous-phase{activeSubPhaseCount > 1 ? 's' : ''}
              </small>
            </span>
            <span>
              <strong>{fmtEuro(phase.distribution.annualNetIncomeNeed)}</strong>
              <small>complément {fmtEuro(computeComplement(phase))} · net {fmtEuro(computeNetRevenue(phase))}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}
