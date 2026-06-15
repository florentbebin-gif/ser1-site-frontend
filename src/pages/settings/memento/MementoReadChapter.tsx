import { Fragment, Suspense, useId, type ReactElement } from 'react';

import type { MementoDisplayChapter } from './mementoDisplayPlan';
import MementoReadableEntry from './MementoReadableEntry';
import { readChapterWrappersForChapter, readEntrySectionsForKey } from './mementoEntrySections';

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
  const ChapterWrappers = readChapterWrappersForChapter(chapter.chapter.id);
  const chapterBody = <MementoReadChapterBody chapter={chapter} showStatus={showStatus} />;

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
          <MementoChapterWrappers wrappers={ChapterWrappers}>{chapterBody}</MementoChapterWrappers>
        </div>
      )}
    </section>
  );
}

function MementoChapterWrappers({
  wrappers,
  children,
}: {
  wrappers: ReturnType<typeof readChapterWrappersForChapter>;
  children: ReactElement;
}): ReactElement {
  return wrappers.reduceRight<ReactElement>(
    (content, ChapterWrapper) => (
      <Suspense fallback={<p className="settings-memento-empty">Chargement...</p>}>
        <ChapterWrapper>{content}</ChapterWrapper>
      </Suspense>
    ),
    children,
  );
}

interface MementoReadChapterBodyProps {
  chapter: MementoDisplayChapter;
  showStatus: boolean;
}

function MementoReadChapterBody({
  chapter,
  showStatus,
}: MementoReadChapterBodyProps): ReactElement {
  return (
    <>
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
        {chapter.entries.map((entry) => {
          const entrySections = readEntrySectionsForKey(entry.key);

          return (
            <Fragment key={entry.key}>
              <MementoReadableEntry kind="entry" entry={entry} showStatus={showStatus} />
              {entrySections.map((EntrySection, index) => (
                <Suspense
                  key={`${entry.key}-${index}`}
                  fallback={<p className="settings-memento-empty">Chargement...</p>}
                >
                  <EntrySection entryKey={entry.key} />
                </Suspense>
              ))}
            </Fragment>
          );
        })}
      </div>
    </>
  );
}
