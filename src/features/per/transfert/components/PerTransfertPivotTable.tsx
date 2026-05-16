import type { PerTransfertResult } from '@/engine/per';

const formatEuro = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

function euro(value: number): string {
  return formatEuro.format(Math.round(Number.isFinite(value) ? value : 0));
}

interface Props {
  result: PerTransfertResult;
  liquidationAge: number;
}

export function PerTransfertPivotTable({ result, liquidationAge }: Props) {
  const short = result.capitalExit.shortHorizon;
  const long = result.capitalExit.longHorizon;
  const keep = result.keepScenario.currentRent;
  const gain = result.newPerFiscal.netAnnualRent - keep.netAnnualRent;

  return (
    <table className="per-transfert-pivot-table">
      <thead>
        <tr>
          <th scope="col" />
          <th scope="col">Au départ retraite ({liquidationAge} ans)</th>
          <th scope="col">Cumul à {short.horizonAge} ans</th>
          <th scope="col">Cumul à {long.horizonAge} ans</th>
        </tr>
      </thead>
      <tbody>
        <tr className="per-transfert-pivot-table__section">
          <th scope="row" colSpan={4}>Conserver le contrat actuel</th>
        </tr>
        <tr>
          <th scope="row">Rente nette annuelle</th>
          <td>{euro(keep.netAnnualRent)}</td>
          <td>{euro(keep.cumulativeToShortHorizon)}</td>
          <td>{euro(keep.cumulativeToLongHorizon)}</td>
        </tr>

        <tr className="per-transfert-pivot-table__section">
          <th scope="row" colSpan={4}>Transférer vers le nouveau PER</th>
        </tr>
        <tr>
          <th scope="row">Rente nette annuelle</th>
          <td>{euro(result.newPerFiscal.netAnnualRent)}</td>
          <td>—</td>
          <td>—</td>
        </tr>
        <tr>
          <th scope="row">Capital unique net</th>
          <td>{result.capitalExit.unique.available ? euro(result.capitalExit.unique.netIRPS) : '—'}</td>
          <td>—</td>
          <td>—</td>
        </tr>
        <tr>
          <th scope="row">Capital fractionné</th>
          <td>—</td>
          <td>{euro(short.cumulativeNetWithdrawals)}</td>
          <td>{euro(long.cumulativeNetWithdrawals)}</td>
        </tr>
        <tr>
          <th scope="row">Sans retrait à {long.horizonAge} ans</th>
          <td>—</td>
          <td>—</td>
          <td>{euro(result.capitalExit.withoutWithdrawalToLongHorizon)}</td>
        </tr>

        <tr className="per-transfert-pivot-table__gain">
          <th scope="row">Gain PER vs contrat actuel (rente)</th>
          <td>{gain >= 0 ? `+${euro(gain)}` : euro(gain)}</td>
          <td>—</td>
          <td>—</td>
        </tr>
      </tbody>
    </table>
  );
}
