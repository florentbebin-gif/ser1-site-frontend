import { useMemo } from 'react';
import { buildCapitalSchedule } from '@/engine/per/transfert';
import type { PerTransfertCapitalScheduleRow } from '@/engine/per/transfert';
import type { PerTransfertInput, PerTransfertResult } from '@/engine/per';

const formatEuro = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

function euro(value: number): string {
  return formatEuro.format(Math.round(Number.isFinite(value) ? value : 0));
}

interface Props {
  input: PerTransfertInput;
  result: PerTransfertResult;
}

function ScheduleTable({ rows }: { rows: PerTransfertCapitalScheduleRow[] }) {
  if (rows.length === 0) {
    return <p className="per-transfert-schedule-empty">Aucune donnée disponible pour cet horizon.</p>;
  }
  return (
    <div className="per-transfert-schedule-scroll">
      <table className="per-transfert-schedule-table">
        <thead>
          <tr>
            <th scope="col">Âge</th>
            <th scope="col">Capital ouverture</th>
            <th scope="col">Intérêts</th>
            <th scope="col">Retrait brut</th>
            <th scope="col">IR</th>
            <th scope="col">PS</th>
            <th scope="col">Retrait net</th>
            <th scope="col">Capital clôture</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.age}>
              <td>{row.age}</td>
              <td>{euro(row.openingCapital)}</td>
              <td>{euro(row.interests)}</td>
              <td>{euro(row.withdrawal)}</td>
              <td>{euro(row.incomeTax)}</td>
              <td>{euro(row.socialContributions)}</td>
              <td>{euro(row.netWithdrawal)}</td>
              <td>{euro(row.closingCapital)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PerTransfertCapitalScheduleTable({ input, result }: Props) {
  const capital = result.capitalExit.capitalAvailableAtLiquidation;
  const gains = result.capitalExit.unique.available ? result.capitalExit.unique.gains : 0;

  const shortSchedule = useMemo(() => buildCapitalSchedule({
    capital,
    gains,
    annualRate: input.projection.capitalExitRevaluationRate,
    liquidationAge: input.insured.liquidationAge,
    horizonAge: result.capitalExit.shortHorizon.horizonAge,
    compartment: result.compartment,
    tmiRetraite: input.tmiRetraite,
    smallAnnuityEligible: result.smallAnnuityCapitalExitEligible,
    assumptions: input.fiscalAssumptions,
  }), [capital, gains, input, result]);

  const longSchedule = useMemo(() => buildCapitalSchedule({
    capital,
    gains,
    annualRate: input.projection.capitalExitRevaluationRate,
    liquidationAge: input.insured.liquidationAge,
    horizonAge: result.capitalExit.longHorizon.horizonAge,
    compartment: result.compartment,
    tmiRetraite: input.tmiRetraite,
    smallAnnuityEligible: result.smallAnnuityCapitalExitEligible,
    assumptions: input.fiscalAssumptions,
  }), [capital, gains, input, result]);

  if (capital === 0) {
    return <p className="per-transfert-schedule-empty">Aucune sortie capital disponible pour ce compartiment.</p>;
  }

  return (
    <div className="per-transfert-schedule-wrap">
      <h4>Horizon {result.capitalExit.shortHorizon.horizonAge} ans</h4>
      <ScheduleTable rows={shortSchedule} />
      <h4>Horizon {result.capitalExit.longHorizon.horizonAge} ans</h4>
      <ScheduleTable rows={longSchedule} />
    </div>
  );
}
