import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import type {
  AssociateRevenuePhaseInputV6,
  CcaRepaymentStrategy,
} from '@/engine/tresorerie/types';
import {
  fmtEuroInput,
  parseEuroInput,
} from '../../utils/tresorerieFormatters';
import { fmtEuro } from './revenuePhaseModalUtils';

interface TresoCcaRepaymentPanelProps {
  phase: AssociateRevenuePhaseInputV6;
  ccaCurrentBalance: number;
  onChange: (patch: Partial<AssociateRevenuePhaseInputV6['ccaRepayment']>) => void;
}

function computeLinearCcaRepaymentAmount(
  ccaCurrentBalance: number,
  phase: AssociateRevenuePhaseInputV6,
): number {
  const phaseDurationYears = Math.max(1, phase.endYear - phase.startYear + 1);
  return Math.round(Math.max(0, ccaCurrentBalance) / phaseDurationYears);
}

export function TresoCcaRepaymentPanel({
  phase,
  ccaCurrentBalance,
  onChange,
}: TresoCcaRepaymentPanelProps) {
  const linearCcaRepaymentAmount = computeLinearCcaRepaymentAmount(ccaCurrentBalance, phase);

  return (
    <section className="ts-associate-card">
      <div className="ts-associate-card__header">
        <strong>Phase remboursement de CCA</strong>
        <span>Restitution du compte courant</span>
      </div>
      <p className="ts-phase-source-title">Remboursement annuel souhaité</p>
      <div className="ts-phase-source" role="radiogroup" aria-label="Remboursement annuel souhaité">
        {([
          ['max_treso', 'Maximum selon trésorerie'],
          ['montant_cible', 'Montant max/an'],
        ] as Array<[CcaRepaymentStrategy, string]>).map(([value, label]) => (
          <label key={value} className="ts-phase-source__choice">
            <input
              type="radio"
              name="ts-cca-repayment-strategy"
              checked={phase.ccaRepayment.strategy === value}
              onChange={() => onChange({
                enabled: true,
                strategy: value,
              })}
            />
            {label}
          </label>
        ))}
      </div>
      <button
        type="button"
        className="ts-phase-source__choice ts-phase-source__choice--button"
        onClick={() => onChange({
          enabled: true,
          strategy: 'montant_cible',
          targetAmount: linearCcaRepaymentAmount,
        })}
      >
        <span>Linéaire sur la phase</span>
        <small>{fmtEuro(linearCcaRepaymentAmount)}/an</small>
      </button>
      {phase.ccaRepayment.strategy === 'montant_cible' ? (
        <div className="ts-modal-grid ts-modal-grid--three">
          <SimFieldShell label="Montant max/an" className="ts-field" rowClassName="ts-field__row">
            <input
              type="text"
              inputMode="numeric"
              className="sim-field__control"
              value={fmtEuroInput(phase.ccaRepayment.targetAmount ?? 0)}
              onChange={event => onChange({ targetAmount: parseEuroInput(event.target.value) })}
            />
            <span className="sim-field__unit ts-unit">€</span>
          </SimFieldShell>
        </div>
      ) : null}
      <p className="ts-note--info">
        Les retraits sont limités au solde CCA et à la trésorerie disponible après IS, solde minimum bancaire et BFR conservés.
      </p>
    </section>
  );
}
