import { useId, useState, type ReactElement } from 'react';

import type { MementoDisplayChapter } from './mementoDisplayPlan';
import MementoReadableEntry from './MementoReadableEntry';
import CalculatorSettingsCard from './CalculatorSettingsCard';
import { readValueSectionsForChapter } from './mementoValueSections';

interface MementoReadChapterProps {
  chapter: MementoDisplayChapter;
  isOpen: boolean;
  showStatus: boolean;
  onToggle: () => void;
}

export default function MementoReadChapter({
  chapter,
  isOpen,
  showStatus,
  onToggle,
}: MementoReadChapterProps): ReactElement {
  const generatedId = useId();
  const [openValueSectionId, setOpenValueSectionId] = useState<string | null>(null);
  const buttonId = `${generatedId}-read-chapter-button`;
  const panelId = `${generatedId}-read-chapter-panel`;
  const valueSections = readValueSectionsForChapter(chapter.chapter.id);

  return (
    <section className="settings-memento-read-chapter">
      <button
        id={buttonId}
        type="button"
        className="settings-memento-read-chapter__header"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span>
          <strong>{chapter.chapter.label}</strong>
          <small>{chapter.chapter.description}</small>
        </span>
        <span className="settings-memento-chevron" aria-hidden="true">
          {isOpen ? '▾' : '▸'}
        </span>
      </button>

      {isOpen && (
        <div
          id={panelId}
          className="settings-memento-read-chapter__body"
          role="region"
          aria-labelledby={buttonId}
        >
          {chapter.editorial ? (
            <blockquote className="settings-memento-read-note" aria-label="À retenir">
              <h5>À retenir</h5>
              <p>{chapter.editorial.summary}</p>
              <ul>
                {chapter.editorial.keyPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </blockquote>
          ) : null}

          {chapter.editorial?.sections && chapter.editorial.sections.length > 0 ? (
            <div className="settings-memento-editorial-sections">
              {chapter.editorial.sections.map((section) => (
                <section key={section.title} className="settings-memento-editorial-section">
                  <h5>{section.title}</h5>
                  <p>{section.body}</p>
                </section>
              ))}
            </div>
          ) : null}

          <div className="settings-memento-readable-list">
            {chapter.entries.map((entry) => (
              <MementoReadableEntry
                key={entry.key}
                kind="entry"
                entry={entry}
                showStatus={showStatus}
              />
            ))}
          </div>

          {valueSections.length > 0 ? (
            <div
              className="settings-memento-value-sections"
              aria-label={`Valeurs de référence — ${chapter.chapter.label}`}
            >
              {valueSections.map(({ section, Panel }) => (
                <CalculatorSettingsCard
                  key={section.id}
                  section={section}
                  Panel={Panel}
                  isOpen={openValueSectionId === section.id}
                  onToggle={() =>
                    setOpenValueSectionId((current) => (current === section.id ? null : section.id))
                  }
                />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
