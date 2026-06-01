import { useEffect, type ReactElement } from 'react';
import { Link } from 'react-router';

import { getOptionalSimulatorDefinition } from '@/domain/simulators/registry';
import { IconArrowRight, IconClose } from '@/icons/ui';

import type { HomeGuideCard } from './homeGuideModel';
import { getSimulatorIcon } from './simulatorIcons';
import './HomeSimulatorPanel.css';

interface HomeSimulatorPanelProps {
  card: HomeGuideCard | null;
  onClose: () => void;
}

interface ChainStep {
  id: string;
  label: string;
}

function resolveSteps(ids: readonly string[]): ChainStep[] {
  return ids.map((id) => ({
    id,
    label: getOptionalSimulatorDefinition(id)?.shortLabel ?? id,
  }));
}

export function HomeSimulatorPanel({
  card,
  onClose,
}: HomeSimulatorPanelProps): ReactElement | null {
  useEffect(() => {
    if (!card) return undefined;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [card, onClose]);

  if (!card) return null;

  const { definition, route } = card;
  const Icon = getSimulatorIcon(definition.id);
  const upstream = resolveSteps(definition.upstream);
  const next = resolveSteps(definition.next);

  return (
    <div className="home-panel-overlay" data-testid="home-detail-panel">
      <button
        type="button"
        className="home-panel-backdrop"
        aria-label="Fermer le détail"
        onClick={onClose}
      />
      <aside
        className="home-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Détail ${definition.shortLabel}`}
      >
        <header className="home-panel__header">
          <span className="home-panel__icon" aria-hidden="true">
            <Icon className="home-panel__icon-svg" />
          </span>
          <h2 className="home-panel__title">{definition.shortLabel}</h2>
          <button type="button" className="home-panel__close" aria-label="Fermer" onClick={onClose}>
            <IconClose className="home-panel__close-svg" />
          </button>
        </header>

        <div className="home-panel__body">
          <section className="home-panel__section">
            <h3 className="home-panel__eyebrow">Objectif</h3>
            <p className="home-panel__text">{definition.objective}</p>
          </section>

          {definition.calculates.length > 0 && (
            <section className="home-panel__section">
              <h3 className="home-panel__eyebrow">Ce que ce simulateur calcule</h3>
              <ul className="home-panel__list">
                {definition.calculates.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {upstream.length > 0 && (
            <section className="home-panel__section">
              <h3 className="home-panel__eyebrow">Données en amont</h3>
              <div className="home-panel__chips">
                {upstream.map((step) => (
                  <ChainChip key={step.id} step={step} />
                ))}
              </div>
            </section>
          )}

          {next.length > 0 && (
            <section className="home-panel__section">
              <h3 className="home-panel__eyebrow">Étapes suivantes</h3>
              <div className="home-panel__chips">
                {next.map((step) => (
                  <ChainChip key={step.id} step={step} />
                ))}
              </div>
            </section>
          )}
        </div>

        <footer className="home-panel__footer">
          {route ? (
            <Link to={route.path} className="home-panel__cta" data-testid="home-panel-launch">
              Lancer le simulateur
              <IconArrowRight className="home-panel__cta-icon" />
            </Link>
          ) : (
            <span className="home-panel__cta home-panel__cta--disabled" aria-disabled="true">
              Bientôt disponible
            </span>
          )}
        </footer>
      </aside>
    </div>
  );
}

function ChainChip({ step }: { step: ChainStep }): ReactElement {
  const Icon = getSimulatorIcon(step.id);
  return (
    <span className="home-panel-chip">
      <Icon className="home-panel-chip__icon" />
      {step.label}
    </span>
  );
}

export default HomeSimulatorPanel;
