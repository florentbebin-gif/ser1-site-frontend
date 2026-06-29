import type { ReactElement } from 'react';

import { IconChevronDown, IconInfo } from '@/icons/ui';

import { formatEuro } from './auditCockpitShared';
import { AUDIT_IR_HYPOTHESES, type AuditIrResult } from './auditIrAdapter';

interface DetailRow {
  label: string;
  value: string;
  strong?: boolean;
}

export function FiscaliteDetail({
  result,
  open,
  onToggle,
}: {
  result: AuditIrResult;
  open: boolean;
  onToggle: () => void;
}): ReactElement {
  const rows = buildDetailRows(result);

  return (
    <section className="audit-fiscal-detail" aria-label="Détail du calcul fiscal">
      <button
        type="button"
        className="audit-fiscal-detail__toggle"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="audit-fiscal-detail-panel"
      >
        <span>
          {open
            ? 'Masquer le détail du calcul'
            : 'Détail du calcul — barème, décote et contributions'}
        </span>
        <IconChevronDown data-open={open ? 'true' : undefined} />
      </button>

      {open ? (
        <div id="audit-fiscal-detail-panel" className="audit-fiscal-detail__panel">
          <dl className="audit-fiscal-detail__table">
            {rows.map((row) => (
              <div
                key={row.label}
                className="audit-fiscal-detail__row"
                data-strong={row.strong ? 'true' : undefined}
              >
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>

          <div className="audit-fiscal-detail__hypotheses">
            <p className="audit-fiscal-detail__hypotheses-title">
              <IconInfo />
              Hypothèses et limites
            </p>
            <ul>
              {AUDIT_IR_HYPOTHESES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function buildDetailRows(result: AuditIrResult): DetailRow[] {
  const rows: DetailRow[] = [
    { label: 'Base imposable du foyer', value: formatEuro(result.taxableIncome) },
    { label: 'Impôt avant quotient familial', value: formatEuro(result.irBeforeQfBase) },
    { label: 'Avantage du quotient familial', value: `− ${formatEuro(result.qfAdvantage)}` },
    { label: 'Impôt après quotient familial', value: formatEuro(result.irAfterQf) },
  ];

  if (result.domAbatementAmount > 0) {
    rows.push({ label: 'Abattement DOM', value: `− ${formatEuro(result.domAbatementAmount)}` });
  }

  rows.push(
    { label: 'Réductions et crédits d’impôt', value: `− ${formatEuro(result.creditsTotal)}` },
    { label: 'Décote', value: `− ${formatEuro(result.decote)}` },
    { label: 'Impôt sur le revenu net', value: formatEuro(result.irNet), strong: true },
    { label: 'PFU sur capitaux mobiliers', value: formatEuro(result.pfuIr) },
    { label: 'Prélèvements sociaux', value: formatEuro(result.psTotal) },
    { label: 'CEHR', value: formatEuro(result.cehr) },
    { label: 'CDHR', value: formatEuro(result.cdhr) },
    { label: 'Imposition totale estimée', value: formatEuro(result.totalTax), strong: true },
  );

  return rows;
}
