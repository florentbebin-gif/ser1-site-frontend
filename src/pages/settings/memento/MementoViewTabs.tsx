import { type KeyboardEvent, type ReactElement } from 'react';

export type MementoViewId = 'lire' | 'parametres' | 'audit';

interface MementoViewTab {
  id: MementoViewId;
  label: string;
  description: string;
}

interface MementoViewTabsProps {
  activeView: MementoViewId;
  showAudit: boolean;
  onChange: (view: MementoViewId) => void;
}

const ALL_TABS = [
  {
    id: 'lire',
    label: 'Lire le mémento',
    description: 'Lecture patrimoniale',
  },
  {
    id: 'parametres',
    label: 'Paramètres calculateurs',
    description: 'Édition admin et expert',
  },
  {
    id: 'audit',
    label: 'Audit & sources',
    description: 'Contrôles techniques',
  },
] as const satisfies readonly MementoViewTab[];

function focusTabAt(buttons: HTMLElement[], index: number): void {
  const nextButton = buttons[index];
  nextButton?.focus();
  nextButton?.click();
}

export default function MementoViewTabs({
  activeView,
  showAudit,
  onChange,
}: MementoViewTabsProps): ReactElement {
  const tabs = showAudit ? ALL_TABS : ALL_TABS.filter((tab) => tab.id !== 'audit');

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    const buttons = Array.from(
      event.currentTarget
        .closest('[role="tablist"]')
        ?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [],
    );
    const currentIndex = buttons.indexOf(event.currentTarget);
    if (currentIndex === -1) return;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusTabAt(buttons, (currentIndex + 1) % buttons.length);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusTabAt(buttons, (currentIndex - 1 + buttons.length) % buttons.length);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      focusTabAt(buttons, 0);
    }
    if (event.key === 'End') {
      event.preventDefault();
      focusTabAt(buttons, buttons.length - 1);
    }
  }

  return (
    <div className="settings-memento-view-tabs" role="tablist" aria-label="Vues du mémento">
      {tabs.map((tab) => {
        const selected = activeView === tab.id;

        return (
          <button
            key={tab.id}
            id={`settings-memento-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`settings-memento-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            className={`settings-memento-view-tabs__tab${selected ? ' is-active' : ''}`}
            onClick={() => onChange(tab.id)}
            onKeyDown={handleKeyDown}
          >
            <span>{tab.label}</span>
            <small>{tab.description}</small>
          </button>
        );
      })}
    </div>
  );
}
