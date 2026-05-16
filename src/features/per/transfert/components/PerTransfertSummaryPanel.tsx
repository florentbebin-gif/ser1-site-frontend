import type { PerTransfertResult } from '@/engine/per';
import { PerTransfertCapitalRenteDonut } from './PerTransfertCapitalRenteDonut';

interface PerTransfertSummaryPanelProps {
  result: PerTransfertResult;
  capitalShareRatePercent: number;
  canExport: boolean;
  exportLoading: boolean;
  onExport?: () => void;
}

const euroFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

function euro(value: number): string {
  return euroFormatter.format(Math.round(Number.isFinite(value) ? value : 0));
}

function KpiRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="per-transfert-summary-panel__kpi">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function PerTransfertSummaryPanel({
  result,
  capitalShareRatePercent,
  canExport,
  exportLoading,
  onExport,
}: PerTransfertSummaryPanelProps) {
  return (
    <aside className="premium-card per-transfert-summary-panel sim-summary-card">
      <header className="per-transfert-summary-panel__header">
        <div>
          <h3>Synthèse du transfert</h3>
          <p>Conserver ou transférer, avec sortie capital/rente.</p>
        </div>
        <span>{result.compartment}</span>
      </header>

      <PerTransfertCapitalRenteDonut
        capitalShareRate={capitalShareRatePercent / 100}
        capitalNet={euro(result.capitalExit.unique.netIRPS)}
        rentNet={euro(result.newPerFiscal.netAnnualRent)}
      />

      <section className="per-transfert-summary-panel__hero" aria-label="Comparaison rente nette mensuelle">
        <span>Rente nette mensuelle</span>
        <div className="per-transfert-summary-panel__hero-compare">
          <div>
            <small>Conserver</small>
            <strong>{euro(result.keepScenario.currentRent.netMonthly)}</strong>
          </div>
          <div aria-hidden="true" className="per-transfert-summary-panel__hero-arrow">→</div>
          <div className="is-recommendation">
            <small>Transférer</small>
            <strong>{euro(result.newPerRent.monthlyRent)}</strong>
          </div>
        </div>
      </section>

      <dl className="per-transfert-summary-panel__kpis">
        <KpiRow label="Capital net transféré" value={euro(result.capitalAfterTransfer)} />
        <KpiRow label="Capital à la retraite" value={euro(result.capitalAtLiquidation)} />
        <KpiRow label="Capital unique net" value={result.capitalExit.unique.available ? euro(result.capitalExit.unique.netIRPS) : 'Non disponible'} />
        <KpiRow label={`Fractionnement ${result.capitalExit.shortHorizon.horizonAge} ans`} value={euro(result.capitalExit.shortHorizon.cumulativeNetWithdrawals)} />
        <KpiRow label={`Fractionnement ${result.capitalExit.longHorizon.horizonAge} ans`} value={euro(result.capitalExit.longHorizon.cumulativeNetWithdrawals)} />
      </dl>

      <button
        type="button"
        className="per-transfert-summary-panel__export"
        disabled={!canExport || exportLoading}
        onClick={onExport}
      >
        {exportLoading ? 'Génération...' : "Éditer l'étude"}
      </button>

      {result.warnings.length > 0 ? (
        <ul className="per-transfert-summary-panel__warnings">
          {result.warnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      ) : null}
    </aside>
  );
}
