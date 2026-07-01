import type { ReactElement } from 'react';

import { IconPieChart } from '@/icons/ui';

import { AuditCardHead, AuditSurfaceCard, formatEuro, formatPercent } from './auditCockpitShared';
import type {
  AuditIfiIndicator,
  AuditIrEstimate,
  AuditIrResult,
  IfiStatus,
} from './auditIrAdapter';
import { AuditDonut, DonutLegend, type DonutSegment } from './auditFiscaliteViz';

const COMPOSITION_TOKENS = {
  ir: '--viz-1',
  ps: '--viz-2',
  pfu: '--viz-3',
  cehr: '--viz-4',
  cdhr: '--viz-5',
} as const;

export function FiscalitePressionCard({
  estimate,
  ifi,
}: {
  estimate: AuditIrEstimate;
  ifi: AuditIfiIndicator;
}): ReactElement {
  const { result } = estimate;

  return (
    <AuditSurfaceCard
      className="audit-fiscal-pression"
      ariaLabelledby="audit-fiscal-pression-title"
    >
      <AuditCardHead
        icon={<IconPieChart />}
        title="Pression fiscale"
        titleId="audit-fiscal-pression-title"
      />
      {result ? <PressionBody estimate={estimate} result={result} ifi={ifi} /> : <PressionEmpty />}
    </AuditSurfaceCard>
  );
}

function PressionEmpty(): ReactElement {
  return (
    <div className="audit-inventory-empty">
      <span className="audit-inventory-empty__icon" aria-hidden="true">
        <IconPieChart />
      </span>
      <b>Pression fiscale en attente</b>
      <p>Renseignez les revenus du foyer pour estimer l’impôt, la TMI et les contributions.</p>
    </div>
  );
}

function PressionBody({
  estimate,
  result,
  ifi,
}: {
  estimate: AuditIrEstimate;
  result: AuditIrResult;
  ifi: AuditIfiIndicator;
}): ReactElement {
  const segments: DonutSegment[] = [
    { label: 'Impôt sur le revenu', value: result.irNet, token: COMPOSITION_TOKENS.ir },
    { label: 'Prélèvements sociaux', value: result.psTotal, token: COMPOSITION_TOKENS.ps },
    { label: 'PFU capitaux', value: result.pfuIr, token: COMPOSITION_TOKENS.pfu },
    { label: 'CEHR', value: result.cehr, token: COMPOSITION_TOKENS.cehr },
    { label: 'CDHR', value: result.cdhr, token: COMPOSITION_TOKENS.cdhr },
  ];
  const legendItems = segments
    .filter((segment) => segment.value > 0)
    .map((segment) => ({
      label: segment.label,
      token: segment.token,
      value: formatEuro(segment.value),
    }));

  return (
    <>
      <div className="audit-fiscal-pression__chart">
        <AuditDonut
          segments={segments}
          centerValue={formatEuro(result.totalTax)}
          centerLabel="Imposition totale"
          ariaLabel={`Imposition totale estimée ${formatEuro(result.totalTax)}`}
        />
        {legendItems.length > 0 ? (
          <DonutLegend items={legendItems} />
        ) : (
          <p className="audit-fiscal-pression__none">Aucune imposition estimée sur ces revenus.</p>
        )}
      </div>

      <div className="audit-fiscal-tmi">
        <div className="audit-fiscal-tmi__head">
          <span className="audit-fiscal-tmi__label">Tranche marginale d’imposition</span>
          <strong className="audit-fiscal-tmi__value">{formatPercent(result.tmiRate)}</strong>
        </div>
        <div
          className="audit-tmi-ladder"
          role="img"
          aria-label={`Tranche marginale : ${result.tmiRate} %`}
        >
          {estimate.tmiScale.map((bracket) => (
            <span
              key={bracket.rate}
              className="audit-tmi-ladder__segment"
              data-active={bracket.rate === result.tmiRate ? 'true' : undefined}
            >
              {bracket.rate} %
            </span>
          ))}
        </div>
        <p className="audit-fiscal-tmi__margin">
          {result.tmiMarginGlobal != null && result.tmiMarginGlobal > 0
            ? `Il reste ${formatEuro(result.tmiMarginGlobal)} avant la tranche supérieure.`
            : 'Au plafond de la tranche actuelle.'}
        </p>
      </div>

      <div className="audit-fiscal-chips">
        <ContributionChip label="CEHR" amount={result.cehr} />
        <ContributionChip label="CDHR" amount={result.cdhr} />
        <IfiChip ifi={ifi} />
      </div>
    </>
  );
}

function ContributionChip({ label, amount }: { label: string; amount: number }): ReactElement {
  const due = amount > 0;
  return (
    <div className="audit-fiscal-chip" data-status={due ? 'due' : 'none'}>
      <span className="audit-fiscal-chip__label">{label}</span>
      <strong className="audit-fiscal-chip__value">
        {due ? formatEuro(amount) : 'Non assujetti'}
      </strong>
    </div>
  );
}

const IFI_LABELS: Record<IfiStatus, string> = {
  assujetti: 'Assujetti',
  proche: 'Proche du seuil',
  'non-assujetti': 'Non assujetti',
  'a-qualifier': 'À qualifier',
};

function IfiChip({ ifi }: { ifi: AuditIfiIndicator }): ReactElement {
  return (
    <div className="audit-fiscal-chip" data-status={ifiTone(ifi.status)}>
      <span className="audit-fiscal-chip__label">IFI</span>
      <strong className="audit-fiscal-chip__value">{IFI_LABELS[ifi.status]}</strong>
      <span className="audit-fiscal-chip__hint">
        {ifi.hasImmo
          ? `Patrimoine immo net ${formatEuro(ifi.assietteImmoNette)}`
          : 'Renseignez les actifs immobiliers'}
      </span>
    </div>
  );
}

function ifiTone(status: IfiStatus): 'due' | 'warn' | 'none' {
  if (status === 'assujetti') return 'due';
  if (status === 'proche' || status === 'a-qualifier') return 'warn';
  return 'none';
}
