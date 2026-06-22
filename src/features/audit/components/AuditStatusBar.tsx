import type { ReactElement } from 'react';

import type { AuditStatusBarViewModel } from '../auditLandingViewModel';

interface AuditStatusBarProps {
  statusBar: AuditStatusBarViewModel;
}

export function AuditStatusBar({ statusBar }: AuditStatusBarProps): ReactElement {
  return (
    <section className="audit-status-bar sim-band" aria-label="État du dossier">
      <ul className="audit-status-bar__items">
        {statusBar.items.map((item) => (
          <li key={item.id} className="audit-status-bar__item sim-kpi-line" data-tone={item.tone}>
            <span className="audit-status-bar__label">{item.label}</span>
            <strong className="audit-status-bar__value">{item.value}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
