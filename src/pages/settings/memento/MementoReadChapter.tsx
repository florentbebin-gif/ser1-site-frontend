import { useId, type ReactElement } from 'react';

import type { MementoDisplayChapter } from './mementoDisplayPlan';
import MementoReadableEntry from './MementoReadableEntry';

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
  const buttonId = `${generatedId}-read-chapter-button`;
  const panelId = `${generatedId}-read-chapter-panel`;

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
        </div>
      )}
    </section>
  );
}
