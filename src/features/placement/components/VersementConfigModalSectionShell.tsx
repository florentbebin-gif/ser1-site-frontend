import type { JSX } from 'react';

interface VersementSectionShellProps {
  step: string;
  title: string;
  action?: JSX.Element | null;
  children: JSX.Element;
}

export const VersementSectionShell = ({
  step,
  title,
  action,
  children,
}: VersementSectionShellProps) => (
  <section className="vcm__section">
    <div className="vcm__section-header">
      <div className="vcm__section-icon">{step}</div>
      <h3 className="vcm__section-title">{title}</h3>
      {action || null}
    </div>
    {children}
  </section>
);
