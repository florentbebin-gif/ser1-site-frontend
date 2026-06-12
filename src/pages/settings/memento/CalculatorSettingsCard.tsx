import { Suspense, type ComponentType, type LazyExoticComponent, type ReactElement } from 'react';

import type { MementoSettingsSection } from './mementoSettingsSections';

interface CalculatorSettingsCardProps {
  section: MementoSettingsSection;
  Panel: LazyExoticComponent<ComponentType>;
  isOpen: boolean;
  onToggle: () => void;
}

const SETTINGS_SOURCE_LABELS = {
  tax_settings: 'Tax settings',
  ps_settings: 'Paramètres sociaux',
  fiscality_settings: 'Fiscalité structurée',
  pass_history: 'Historique PASS',
  base_contrat_catalog: 'Catalogue contrats',
  base_contrat_overrides: 'Overrides contrats',
  prevoyance_regime_settings: 'Régimes prévoyance',
  prevoyance_maintien_employeur_settings: 'Maintien employeur',
} as const satisfies Record<MementoSettingsSection['readSources'][number], string>;

export default function CalculatorSettingsCard({
  section,
  Panel,
  isOpen,
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

      <div className="settings-memento-calculator-card__sources" aria-label="Sources settings">
        {section.readSources.map((source) => (
          <span key={`read-${source}`}>Lecture : {SETTINGS_SOURCE_LABELS[source]}</span>
        ))}
        {section.writeSources.map((source) => (
          <span key={`write-${source}`}>Écriture : {SETTINGS_SOURCE_LABELS[source]}</span>
        ))}
      </div>

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
