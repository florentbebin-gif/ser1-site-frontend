import { Suspense, lazy, useMemo, useState, type ReactElement } from 'react';

import {
  buildMementoDisplayPlan,
  groupMementoLexiconTerms,
  type MementoDisplayPart,
  type MementoPartId,
} from './mementoDisplayPlan';
import MementoReadableEntry from './MementoReadableEntry';
import MementoReadChapter from './MementoReadChapter';
import type { MementoReferenceValueDomain } from '@/domain/settings-memento/referenceValues';

const MementoValueTable = lazy(() => import('./MementoValueTable'));
const BaseContratSettingsPanel = lazy(() => import('../BaseContrat/BaseContratSettingsPanel'));

const VALUE_TABLE_BY_PART: Partial<
  Record<
    MementoPartId,
    {
      domain: MementoReferenceValueDomain;
      title: string;
      description: string;
    }
  >
> = {
  demembrement: {
    domain: 'demembrement',
    title: 'Valeurs de démembrement',
    description: 'Repères de valorisation fiscale de l’usufruit et de la nue-propriété.',
  },
  'fiscalite-internationale': {
    domain: 'fiscalite-internationale',
    title: 'Valeurs internationales',
    description: 'Repères non-résidents à relire avec les conventions fiscales applicables.',
  },
  'social-protection': {
    domain: 'social-protection',
    title: 'Valeurs sociales de référence',
    description: 'Repères sociaux annuels utiles à la lecture retraite, prévoyance et dirigeant.',
  },
};

function hasReadableContent(part: MementoDisplayPart): boolean {
  return part.chapters.length + part.entries.length + part.lexiconTerms.length > 0;
}

interface MementoReadViewProps {
  showStatus: boolean;
  isAdmin: boolean;
}

export default function MementoReadView({
  showStatus,
  isAdmin,
}: MementoReadViewProps): ReactElement {
  const displayPlan = useMemo(() => buildMementoDisplayPlan(), []);
  const [openPartId, setOpenPartId] = useState<MementoPartId | null>(null);
  const [openChapterKey, setOpenChapterKey] = useState<string | null>(null);

  return (
    <div className="settings-memento-view settings-memento-read-view">
      <div className="settings-memento-parts" aria-label="Sommaire du mémento">
        {displayPlan.map((part, index) => {
          const isOpen = openPartId === part.definition.id;
          const hasContent = hasReadableContent(part);
          const buttonId = `settings-memento-part-${part.definition.id}-button`;
          const panelId = `settings-memento-part-${part.definition.id}-panel`;
          const valueTable = VALUE_TABLE_BY_PART[part.definition.id];
          const showBaseContrat = part.definition.id === 'chiffres-cles';

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
                  {valueTable ? (
                    <Suspense
                      fallback={<p className="settings-memento-empty">Chargement des valeurs...</p>}
                    >
                      <MementoValueTable isAdmin={isAdmin} {...valueTable} />
                    </Suspense>
                  ) : null}

                  {showBaseContrat ? (
                    <Suspense
                      fallback={
                        <p className="settings-memento-empty">
                          Chargement du référentiel contrats...
                        </p>
                      }
                    >
                      <BaseContratSettingsPanel />
                    </Suspense>
                  ) : null}

                  {part.entries.length > 0 ? (
                    <div className="settings-memento-readable-list">
                      {part.entries.map((entry) => (
                        <MementoReadableEntry
                          key={entry.key}
                          kind="entry"
                          entry={entry}
                          showStatus={showStatus}
                        />
                      ))}
                    </div>
                  ) : null}

                  {part.lexiconTerms.length > 0 ? (
                    <div className="settings-memento-lexicon" aria-label="Définitions du lexique">
                      {groupMementoLexiconTerms(part.lexiconTerms).map((group) => (
                        <section key={group.id} className="settings-memento-lexicon-group">
                          <div className="settings-memento-lexicon-group__header">
                            <h4>{group.title}</h4>
                            <p>{group.description}</p>
                          </div>
                          <div className="settings-memento-readable-list">
                            {group.terms.map((term) => (
                              <MementoReadableEntry
                                key={term.key}
                                kind="lexicon"
                                term={term}
                                showStatus={showStatus}
                              />
                            ))}
                          </div>
                        </section>
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
                            showStatus={showStatus}
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
