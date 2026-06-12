import { useMemo, useState, type ReactElement } from 'react';

import {
  buildMementoDisplayPlan,
  type MementoDisplayPart,
  type MementoPartId,
} from './mementoDisplayPlan';
import MementoReadableEntry from './MementoReadableEntry';
import MementoReadChapter from './MementoReadChapter';

function hasReadableContent(part: MementoDisplayPart): boolean {
  return part.chapters.length + part.entries.length + part.lexiconTerms.length > 0;
}

export default function MementoReadView(): ReactElement {
  const displayPlan = useMemo(() => buildMementoDisplayPlan(), []);
  const [openPartId, setOpenPartId] = useState<MementoPartId | null>(null);
  const [openChapterKey, setOpenChapterKey] = useState<string | null>(null);

  return (
    <div className="settings-memento-view settings-memento-read-view">
      <section className="settings-premium-card settings-memento-read-intro">
        <div className="settings-action-text">
          <h3 className="settings-premium-title">Lire le mémento</h3>
          <p className="settings-premium-subtitle">
            Sommaire patrimonial structuré pour préparer un conseil, sans exposer les contrôles
            techniques de couverture.
          </p>
        </div>
      </section>

      <div className="settings-memento-parts" aria-label="Sommaire du mémento">
        {displayPlan.map((part, index) => {
          const isOpen = openPartId === part.definition.id;
          const hasContent = hasReadableContent(part);
          const buttonId = `settings-memento-part-${part.definition.id}-button`;
          const panelId = `settings-memento-part-${part.definition.id}-panel`;

          return (
            <section
              key={part.definition.id}
              className={`settings-memento-part${isOpen ? ' is-open' : ''}${
                hasContent ? '' : ' is-empty'
              }`}
            >
              <button
                id={buttonId}
                type="button"
                className="settings-memento-part__header"
                aria-expanded={hasContent ? isOpen : undefined}
                aria-controls={hasContent ? panelId : undefined}
                disabled={!hasContent}
                onClick={() => {
                  if (!hasContent) return;
                  setOpenPartId((current) =>
                    current === part.definition.id ? null : part.definition.id,
                  );
                  setOpenChapterKey(null);
                }}
              >
                <span className="settings-memento-part__index">{index + 1}</span>
                <span className="settings-memento-part__text">
                  <span className="settings-memento-part__title">{part.definition.title}</span>
                  <span className="settings-memento-part__description">
                    {part.definition.description}
                  </span>
                </span>
                {!hasContent ? (
                  <span className="settings-memento-part__state">Enrichissement progressif</span>
                ) : (
                  <span className="settings-memento-chevron" aria-hidden="true">
                    {isOpen ? '▾' : '▸'}
                  </span>
                )}
              </button>

              {isOpen && hasContent ? (
                <div
                  id={panelId}
                  className="settings-memento-part__body"
                  role="region"
                  aria-labelledby={buttonId}
                >
                  {part.entries.length > 0 ? (
                    <div className="settings-memento-readable-list">
                      {part.entries.map((entry) => (
                        <MementoReadableEntry key={entry.key} kind="entry" entry={entry} />
                      ))}
                    </div>
                  ) : null}

                  {part.lexiconTerms.length > 0 ? (
                    <div className="settings-memento-readable-list">
                      {part.lexiconTerms.map((term) => (
                        <MementoReadableEntry key={term.key} kind="lexicon" term={term} />
                      ))}
                    </div>
                  ) : null}

                  {part.chapters.length > 0 ? (
                    <div className="settings-memento-read-chapters">
                      {part.chapters.map((chapter) => {
                        const chapterKey = `${part.definition.id}-${chapter.chapter.id}`;

                        return (
                          <MementoReadChapter
                            key={chapterKey}
                            chapter={chapter}
                            isOpen={openChapterKey === chapterKey}
                            onToggle={() =>
                              setOpenChapterKey((current) =>
                                current === chapterKey ? null : chapterKey,
                              )
                            }
                          />
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
