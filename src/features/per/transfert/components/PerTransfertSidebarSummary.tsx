import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  SimInfoButton,
  SimKpiReference,
  SimMetric,
  SimSparkline,
  SimStatusBadge,
  SimTooltip,
} from '@/components/ui/sim';
import { CGP_GLOSSARY } from '@/constants/cgpGlossary';
import {
  TYPE_LABELS,
  type BaseCgRetraiteContract,
  type BaseCgRetraiteContractType,
} from '@/data/base-cg-retraite';
import type {
  PerTransfertCapitalFiscalResult,
  PerTransfertCapitalHorizon,
  PerTransfertFiscalResult,
  PerTransfertPrefonStrategyResult,
  PerTransfertResult,
} from '@/engine/per';

type PrefonStrategy = 'all_rente' | 'max_capital';

interface PerTransfertSidebarSummaryProps {
  result: PerTransfertResult;
  selectedContract: BaseCgRetraiteContract | null;
  typeContrat: BaseCgRetraiteContractType;
  step2Done: boolean;
  horizonAgeShort: number;
  horizonAgeLong: number;
  onOpenQuotientInfo: () => void;
  onOpenFractionalInfo: () => void;
}

const euroFormat = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const euro = (value: number) => euroFormat.format(Math.round(Number.isFinite(value) ? value : 0));

export function PerTransfertSidebarSummary({
  result,
  selectedContract,
  typeContrat,
  step2Done,
  horizonAgeShort,
  horizonAgeLong,
  onOpenQuotientInfo,
  onOpenFractionalInfo,
}: PerTransfertSidebarSummaryProps) {
  const [prefonStrategy, setPrefonStrategy] = useState<PrefonStrategy>('all_rente');
  const activePrefonStrategy =
    prefonStrategy === 'max_capital' ? result.prefon?.maxCapital : result.prefon?.allRente;
  const isPrefon = typeContrat === 'PER_POINTS';

  return (
    <aside className="premium-card per-transfert-summary-panel sim-summary-card">
      <div className="per-transfert-summary-panel__header">
        <div>
          <h3>Synthèse</h3>
          <p>Lecture CGP des sorties possibles, fiscalité incluse.</p>
        </div>
      </div>

      {isPrefon ? (
        <div className="per-transfert-prefon-strategy" aria-label="Stratégie Préfon">
          <button
            type="button"
            className={prefonStrategy === 'all_rente' ? 'is-active' : ''}
            onClick={() => setPrefonStrategy('all_rente')}
          >
            Tout rente
          </button>
          <button
            type="button"
            className={prefonStrategy === 'max_capital' ? 'is-active' : ''}
            onClick={() => setPrefonStrategy('max_capital')}
          >
            Max capital
          </button>
        </div>
      ) : null}

      <div className="per-transfert-oppositions">
        <OppositionSection
          title="Rente"
          currentTitle={selectedContract?.nomContrat ?? 'Contrat actuel'}
          currentSubtitle={
            selectedContract ? TYPE_LABELS[selectedContract.typeContrat] : 'Hypothèses du relevé'
          }
          newPerVisible={step2Done}
          current={
            <RentMetrics
              fiscal={activePrefonStrategy?.fiscal ?? result.keepScenario.currentRent.fiscal}
            />
          }
          transfer={<RentMetrics fiscal={result.newPerFiscal} />}
        />

        <OppositionSection
          title="Capital unique"
          currentTitle={selectedContract?.nomContrat ?? 'Contrat actuel'}
          currentSubtitle="Choix à 100 % si autorisé"
          newPerVisible={step2Done}
          current={
            <CapitalMetrics
              fiscal={currentCapitalUnique(result, activePrefonStrategy, isPrefon)}
              onOpenQuotientInfo={onOpenQuotientInfo}
            />
          }
          transfer={
            <CapitalMetrics
              fiscal={result.capitalExit.unique}
              onOpenQuotientInfo={onOpenQuotientInfo}
            />
          }
        />

        <OppositionSection
          title="Capital fractionné court"
          currentTitle={selectedContract?.nomContrat ?? 'Contrat actuel'}
          currentSubtitle={`Horizon ${isPrefon ? '10 versements' : `${horizonAgeShort} ans`}`}
          newPerVisible={step2Done}
          current={
            <HorizonMetrics
              horizon={currentShortHorizon(result, activePrefonStrategy, isPrefon)}
              onOpenFractionalInfo={onOpenFractionalInfo}
            />
          }
          transfer={
            <HorizonMetrics
              horizon={result.capitalExit.shortHorizon}
              onOpenFractionalInfo={onOpenFractionalInfo}
            />
          }
        />

        <OppositionSection
          title="Capital fractionné long"
          currentTitle={selectedContract?.nomContrat ?? 'Contrat actuel'}
          currentSubtitle={`Horizon ${horizonAgeLong} ans`}
          newPerVisible={step2Done}
          current={
            <HorizonMetrics
              horizon={isPrefon ? null : (result.keepScenario.capitalExit?.longHorizon ?? null)}
              onOpenFractionalInfo={onOpenFractionalInfo}
            />
          }
          transfer={
            <HorizonMetrics
              horizon={result.capitalExit.longHorizon}
              onOpenFractionalInfo={onOpenFractionalInfo}
            />
          }
        />
      </div>
    </aside>
  );
}

function currentCapitalUnique(
  result: PerTransfertResult,
  prefonStrategy: PerTransfertPrefonStrategyResult | undefined,
  isPrefon: boolean,
): PerTransfertCapitalFiscalResult | null {
  if (isPrefon) return prefonStrategy?.capitalUnique ?? null;
  return result.keepScenario.capitalExit?.unique ?? null;
}

function currentShortHorizon(
  result: PerTransfertResult,
  prefonStrategy: PerTransfertPrefonStrategyResult | undefined,
  isPrefon: boolean,
): PerTransfertCapitalHorizon | null {
  if (isPrefon) return prefonStrategy?.shortHorizon ?? null;
  return result.keepScenario.capitalExit?.shortHorizon ?? null;
}

function OppositionSection({
  title,
  currentTitle,
  currentSubtitle,
  newPerVisible,
  current,
  transfer,
}: {
  title: string;
  currentTitle: string;
  currentSubtitle: string;
  newPerVisible: boolean;
  current: ReactNode;
  transfer: ReactNode;
}) {
  return (
    <section className="per-transfert-opposition">
      <h4>{title}</h4>
      <div className="per-transfert-compare2">
        <ScenarioCard title={currentTitle} subtitle={currentSubtitle}>
          {current}
        </ScenarioCard>
        {newPerVisible ? (
          <ScenarioCard title="Nouveau PER" subtitle="Choix à 100 %" highlighted>
            {transfer}
          </ScenarioCard>
        ) : (
          <div className="per-transfert-compare2__placeholder">
            Sélectionnez un nouveau PER pour afficher le scénario de transfert.
          </div>
        )}
      </div>
    </section>
  );
}

function ScenarioCard({
  title,
  subtitle,
  highlighted = false,
  children,
}: {
  title: string;
  subtitle: string;
  highlighted?: boolean;
  children: ReactNode;
}) {
  return (
    <article className={`per-transfert-compare2__card${highlighted ? ' is-highlighted' : ''}`}>
      <header>
        <h5>{title}</h5>
        <p>{subtitle}</p>
        {highlighted ? <SimStatusBadge variant="optimal">Scénario cible</SimStatusBadge> : null}
      </header>
      {children}
    </article>
  );
}

function RentMetrics({ fiscal }: { fiscal: PerTransfertFiscalResult }) {
  return (
    <div className="per-transfert-compare2__kpis">
      <KpiRow label={`Brut (${fiscal.family})`} value={euro(fiscal.grossAnnualRent)} />
      <KpiRow label="Net de PS" value={euro(fiscal.netOfSocialContributions)} muted />
      <KpiRow label="Net de PS + IR" value={euro(fiscal.netOfAllTaxes)} highlighted />
    </div>
  );
}

function CapitalMetrics({
  fiscal,
  onOpenQuotientInfo,
}: {
  fiscal: PerTransfertCapitalFiscalResult | null;
  onOpenQuotientInfo: () => void;
}) {
  if (!fiscal?.available)
    return <Unavailable label="Capital unique non disponible pour ce dispositif." />;
  return (
    <div className="per-transfert-compare2__kpis">
      <KpiRow label="Brut" value={euro(fiscal.capital)} />
      <KpiRow label="Net de PS" value={euro(fiscal.netOfSocialContributions)} muted />
      <KpiRow
        label={
          <span className="sim-tooltip-inline">
            Net de PS + IR/
            <SimTooltip label={CGP_GLOSSARY.pfu.label} description={CGP_GLOSSARY.pfu.description} />
          </span>
        }
        value={euro(fiscal.netOfAllTaxes)}
        highlighted
      />
      <KpiRow
        label={
          <span className="per-transfert-compare2__info-label">
            Quotient
            <SimInfoButton
              ariaLabel="Informations sur le système du quotient"
              onClick={onOpenQuotientInfo}
            />
          </span>
        }
        value={euro(fiscal.netOfAllTaxesWithQuotient)}
      />
    </div>
  );
}

function HorizonMetrics({
  horizon,
  onOpenFractionalInfo,
}: {
  horizon: PerTransfertCapitalHorizon | null;
  onOpenFractionalInfo: () => void;
}) {
  if (!horizon || horizon.annualWithdrawal <= 0)
    return <Unavailable label="Capital fractionné non disponible pour ce dispositif." />;
  return (
    <div className="per-transfert-compare2__kpis">
      <KpiRow
        label={
          <span className="per-transfert-compare2__info-label">
            Brut annuel
            <SimInfoButton
              ariaLabel="Informations sur le capital fractionné"
              onClick={onOpenFractionalInfo}
            />
          </span>
        }
        value={euro(horizon.annualWithdrawal)}
      />
      <KpiRow label="Net PS + IR annuel" value={euro(horizon.annualNetWithdrawal)} muted />
      <KpiRow
        label={`Cumul net ${horizon.horizonAge} ans`}
        value={euro(horizon.cumulativeNetWithdrawals)}
        highlighted
      />
    </div>
  );
}

function Unavailable({ label }: { label: string }) {
  return <p className="per-transfert-compare2__not-available">{label}</p>;
}

function KpiRow({
  label,
  value,
  muted = false,
  highlighted = false,
}: {
  label: ReactNode;
  value: string;
  muted?: boolean;
  highlighted?: boolean;
}) {
  return (
    <SimMetric
      variant="inline"
      label={label}
      value={value}
      className={`per-transfert-compare2__metric${muted ? ' is-muted' : ''}${highlighted ? ' is-highlighted' : ''}`}
      note={highlighted ? <PerKpiReference /> : undefined}
    />
  );
}

function PerKpiReference() {
  return (
    <span className="sim-kpi-note">
      <SimSparkline />
      <SimKpiReference kind="per" />
    </span>
  );
}
