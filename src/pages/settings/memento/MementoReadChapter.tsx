import { Suspense, useId, type ReactElement } from 'react';

import type { MementoDisplayChapter } from './mementoDisplayPlan';
import MementoReadableEntry, { MementoEntrySources } from './MementoReadableEntry';
import { readChapterWrappersForChapter, readEntrySectionsForKey } from './mementoEntrySections';
import { useAccordionScroll } from './useAccordionScroll';

interface MementoReadChapterProps {
  chapter: MementoDisplayChapter;
  isOpen: boolean;
  showStatus: boolean;
  /** Désactivé en mode recherche (tout est déplié d'un coup) pour éviter le scroll en cascade. */
  scrollOnOpen?: boolean;
  onToggle: () => void;
}

export default function MementoReadChapter({
  chapter,
  isOpen,
  showStatus,
  scrollOnOpen = true,
  onToggle,
}: MementoReadChapterProps): ReactElement {
  const generatedId = useId();
  const buttonId = `${generatedId}-read-chapter-button`;
  const panelId = `${generatedId}-read-chapter-panel`;
  const headerRef = useAccordionScroll(isOpen, scrollOnOpen);
  const ChapterWrappers = readChapterWrappersForChapter(chapter.chapter.id);
  const chapterBody = <MementoReadChapterBody chapter={chapter} showStatus={showStatus} />;

  return (
    <section className="settings-memento-read-chapter">
      <button
        id={buttonId}
        ref={headerRef}
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
  const entriesWithSections = chapter.entries
    .map((entry) => ({ entry, entrySections: readEntrySectionsForKey(entry.key) }))
    .filter(({ entrySections }) => entrySections.length > 0);

  return (
    <>
      <section className="settings-memento-read-zone settings-memento-read-zone--lecture">
        <div className="settings-memento-read-zone__header">
          <h5>Lire</h5>
        </div>
        <div className="settings-memento-read-zone__body">
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
                showStatus={false}
                showReferences={false}
              />
            ))}
          </div>
        </div>
      </section>

      {entriesWithSections.length > 0 ? (
        <section className="settings-memento-read-zone settings-memento-read-zone--parameters">
          <div className="settings-memento-read-zone__header">
            <h5>Paramètres des calculateurs</h5>
          </div>
          <div className="settings-memento-read-zone__body settings-memento-parameter-list">
            {entriesWithSections.map(({ entry, entrySections }) => (
              <section key={entry.key} className="settings-memento-parameter-group">
                <h5>{entry.label}</h5>
                {entrySections.map((EntrySection, index) => (
                  <Suspense
                    key={`${entry.key}-${index}`}
                    fallback={<p className="settings-memento-empty">Chargement...</p>}
                  >
                    <EntrySection entryKey={entry.key} />
                  </Suspense>
                ))}
              </section>
            ))}
          </div>
        </section>
      ) : null}

      <section className="settings-memento-read-zone settings-memento-read-zone--sources">
        <div className="settings-memento-read-zone__header">
          <h5>Sources & couverture</h5>
        </div>
        <div className="settings-memento-read-zone__body settings-memento-source-list">
          {chapter.entries.map((entry) => (
            <MementoEntrySources key={entry.key} entry={entry} showStatus={showStatus} />
          ))}
        </div>
      </section>
    </>
  );
}
