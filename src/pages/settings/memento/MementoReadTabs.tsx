import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

export interface MementoReadTabPanel {
  id: string;
  label: string;
  content: ReactNode;
}

interface MementoReadTabsProps {
  ariaLabel: string;
  panels: readonly MementoReadTabPanel[];
}

export default function MementoReadTabs({ ariaLabel, panels }: MementoReadTabsProps): ReactElement {
  const generatedId = useId();
  const [activePanelId, setActivePanelId] = useState(panels[0]?.id ?? '');
  const tabRefs = useRef(new Map<string, HTMLButtonElement | null>());

  useEffect(() => {
    if (!panels.some((panel) => panel.id === activePanelId)) {
      setActivePanelId(panels[0]?.id ?? '');
    }
  }, [activePanelId, panels]);

  const focusPanel = (panelId: string): void => {
    window.requestAnimationFrame(() => tabRefs.current.get(panelId)?.focus());
  };

  const activatePanel = (panelId: string, shouldFocus = false): void => {
    setActivePanelId(panelId);
    if (shouldFocus) focusPanel(panelId);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    const lastIndex = panels.length - 1;
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') {
      nextIndex = index === lastIndex ? 0 : index + 1;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = index === 0 ? lastIndex : index - 1;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = lastIndex;
    }

    if (nextIndex === null) return;
    const nextPanel = panels[nextIndex];
    if (!nextPanel) return;
    event.preventDefault();
    activatePanel(nextPanel.id, true);
  };

  return (
    <div className="settings-memento-tabs">
      <div className="settings-memento-tabs__tablist" role="tablist" aria-label={ariaLabel}>
        {panels.map((panel, index) => {
          const tabId = `${generatedId}-${panel.id}-tab`;
          const panelId = `${generatedId}-${panel.id}-panel`;
          const isActive = panel.id === activePanelId;

          return (
            <button
              key={panel.id}
              id={tabId}
              ref={(element) => {
                tabRefs.current.set(panel.id, element);
              }}
              type="button"
              className="settings-memento-tabs__tab"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => activatePanel(panel.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {panel.label}
            </button>
          );
        })}
      </div>

      <div className="settings-memento-tabs__panels">
        {panels.map((panel) => {
          const tabId = `${generatedId}-${panel.id}-tab`;
          const panelId = `${generatedId}-${panel.id}-panel`;

          return (
            <section
              key={panel.id}
              id={panelId}
              className="settings-memento-tabs__panel"
              role="tabpanel"
              aria-labelledby={tabId}
              hidden={panel.id !== activePanelId}
              tabIndex={0}
            >
              {panel.content}
            </section>
          );
        })}
      </div>
    </div>
  );
}
