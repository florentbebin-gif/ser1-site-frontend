import { Suspense, type ComponentType, type LazyExoticComponent, type ReactElement } from 'react';

import {
  MEMENTO_SETTINGS_SOURCE_LABELS,
  type MementoSettingsSection,
} from './mementoSettingsSections';

interface CalculatorSettingsCardProps {
  section: MementoSettingsSection;
  Panel: LazyExoticComponent<ComponentType>;
  isOpen: boolean;
  showTechnicalSources?: boolean;
  onToggle: () => void;
}

export default function CalculatorSettingsCard({
  section,
  Panel,
  isOpen,
  showTechnicalSources = false,
  onToggle,
}: CalculatorSettingsCardProps): ReactElement {
  const buttonId = `settings-memento-calculator-${section.id}-button`;
  const panelId = `settings-memento-calculator-${section.id}-panel`;

  return (
    <section className={`settings-memento-calculator-card${isOpen ? ' is-open' : ''}`}>
      <button
        id={buttonId}
        type="button"
        className="settings-memento-calculator-card__header"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="settings-memento-calculator-card__text">
          <strong>{section.label}</strong>
          <small>{section.shortDescription}</small>
        </span>
        <span className="settings-memento-chevron" aria-hidden="true">
          {isOpen ? '▾' : '▸'}
        </span>
      </button>

      {showTechnicalSources ? (
        <div className="settings-memento-calculator-card__sources" aria-label="Sources settings">
          {section.readSources.map((source) => (
            <span key={`read-${source}`}>Lecture : {MEMENTO_SETTINGS_SOURCE_LABELS[source]}</span>
          ))}
          {section.writeSources.map((source) => (
            <span key={`write-${source}`}>Écriture : {MEMENTO_SETTINGS_SOURCE_LABELS[source]}</span>
          ))}
        </div>
      ) : null}

      {isOpen ? (
        <div
          id={panelId}
          className="settings-memento-calculator-card__body"
          role="region"
          aria-labelledby={buttonId}
        >
          <Suspense fallback={<p className="settings-memento-empty">Chargement du panneau...</p>}>
            <Panel />
          </Suspense>
        </div>
      ) : null}
    </section>
  );
}
