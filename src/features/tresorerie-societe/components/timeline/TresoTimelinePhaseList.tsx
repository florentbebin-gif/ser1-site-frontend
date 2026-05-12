import type { AssociateRevenuePhaseInputV6 } from '@/engine/tresorerie/types';
import {
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

function getDistributionSummary(phase: AssociateRevenuePhaseInputV6): string {
  if (!phase.distribution.enabled || phase.distribution.dividendsStrategy === 'aucun') {
    return 'Aucun dividende';
  }
  if (phase.distribution.dividendsStrategy === 'montant_cible') {
    return `Objectif ${fmtEuro(phase.distribution.dividendsTargetAmountNet ?? 0)} net`;
  }
  return 'Dividendes max';
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
              <strong>{getDistributionSummary(phase)}</strong>
              <small>net annuel estimé {fmtEuro(computeNetRevenue(phase))}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}
