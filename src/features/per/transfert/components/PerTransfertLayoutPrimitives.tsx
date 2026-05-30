import { useId } from 'react';
import type { ReactNode } from 'react';
import { SimFieldShell } from '@/components/ui/sim';

const formatPercent = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function percent(value: number): string {
  return formatPercent.format(Number.isFinite(value) ? value : 0);
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="per-transfert-field-grid">{children}</div>;
}

export function FieldLabel({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <span className="per-transfert-field-label">
      <span>{text}</span>
      {children}
    </span>
  );
}

export function ConversionRateBadge({ value }: { value: number }) {
  return (
    <span className="per-transfert-taux-inline">
      <span>Taux conversion</span>
      <strong>{percent(value)}</strong>
    </span>
  );
}

export function Panel({
  title,
  subtitle,
  headerActions,
  className,
  contentClassName,
  contentId,
  collapsible = false,
  expanded = true,
  onToggleExpand,
  children,
}: {
  title: string;
  subtitle: string;
  headerActions?: ReactNode;
  className?: string;
  contentClassName?: string;
  contentId?: string;
  collapsible?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  children: ReactNode;
}) {
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const regionId = contentId ?? `${generatedId}-content`;
  const isContentHidden = collapsible && !expanded;

  return (
    <section
      className={`premium-card premium-card--guide sim-card--guide per-transfert-panel${className ? ` ${className}` : ''}`}
    >
      <div className="sim-card__header--bleed per-transfert-panel__header">
        <div className="per-transfert-panel__header-row">
          <div>
            <h2 id={titleId}>{title}</h2>
            <p>{subtitle}</p>
          </div>
          {headerActions || collapsible ? (
            <div className="per-transfert-panel__actions">
              {headerActions}
              {collapsible ? (
                <button
                  type="button"
                  className="per-transfert-panel__toggle"
                  onClick={onToggleExpand}
                  aria-expanded={expanded}
                  aria-controls={regionId}
                  aria-label={expanded ? `Replier ${title}` : `Déplier ${title}`}
                >
                  {expanded ? '−' : '+'}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <div
        id={regionId}
        className={`per-transfert-panel__content${contentClassName ? ` ${contentClassName}` : ''}`}
        role={collapsible ? 'region' : undefined}
        aria-labelledby={collapsible ? titleId : undefined}
        hidden={isContentHidden}
      >
        <div className="sim-divider" aria-hidden="true" />
        {children}
      </div>
    </section>
  );
}

export function DateField({
  label,
  value,
  onChange,
  hint,
}: {
  label: ReactNode;
  value: string;
  onChange: (_value: string) => void;
  hint?: string;
}) {
  return (
    <SimFieldShell label={label} hint={hint}>
      <input
        className="sim-field__control"
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </SimFieldShell>
  );
}
