import { useId, useState, type ReactElement, type ReactNode } from 'react';

interface MementoAdminSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function MementoAdminSection({
  title,
  subtitle,
  children,
}: MementoAdminSectionProps): ReactElement {
  const generatedId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const buttonId = `${generatedId}-admin-section-button`;
  const panelId = `${generatedId}-admin-section-panel`;

  return (
    <section className={`settings-memento-admin-section${isOpen ? ' is-open' : ''}`}>
      <button
        id={buttonId}
        type="button"
        className="settings-memento-admin-section__header"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="settings-memento-admin-section__text">
          <span className="settings-memento-admin-section__title">{title}</span>
          {subtitle ? (
            <span className="settings-memento-admin-section__subtitle">{subtitle}</span>
          ) : null}
        </span>
        <span className="settings-memento-chevron" aria-hidden="true">
          {isOpen ? '▾' : '▸'}
        </span>
      </button>

      {isOpen ? (
        <div
          id={panelId}
          className="settings-memento-admin-section__body"
          role="region"
          aria-labelledby={buttonId}
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}
