import { Suspense, lazy, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';

import {
  buildMementoDisplayPlan,
  groupMementoLexiconTerms,
  type MementoDisplayChapter,
  type MementoDisplayPart,
  type MementoPartId,
} from './mementoDisplayPlan';
import {
  buildMementoChapterSearchText,
  buildMementoEntrySearchText,
  buildMementoLexiconSearchText,
  buildMementoReferenceValueSearchText,
  normalizeMementoSearch,
  textMatches,
} from './mementoSearch';
import MementoReadableEntry, {
  MementoEntrySources,
  MementoLexiconSources,
} from './MementoReadableEntry';
import MementoReadChapter from './MementoReadChapter';
import MementoReadTabs from './MementoReadTabs';
import { scrollAccordionHeaderIntoView } from './useAccordionScroll';
import { CATALOG } from '@/domain/base-contrat/catalog';
import type { MementoLexiconTerm } from '@/domain/settings-memento/lexicon';
import {
  DEFAULT_MEMENTO_REFERENCE_VALUES,
  type MementoReferenceValueDomain,
} from '@/domain/settings-memento/referenceValues';
import type { MementoEntry } from '@/domain/settings-memento/types';

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

interface FilteredMementoPart {
  part: MementoDisplayPart;
  index: number;
  isShown: boolean;
  entries: readonly MementoEntry[];
  chapters: readonly MementoDisplayChapter[];
  lexiconTerms: readonly MementoLexiconTerm[];
}

function filterMementoPart(
  part: MementoDisplayPart,
  index: number,
  normalizedQuery: string,
  extraMatch: boolean,
): FilteredMementoPart {
  // Un match sur le titre/description de la partie révèle l'intégralité de son contenu.
  if (textMatches(`${part.definition.title} ${part.definition.description}`, normalizedQuery)) {
    return {
      part,
      index,
      isShown: true,
      entries: part.entries,
      chapters: part.chapters,
      lexiconTerms: part.lexiconTerms,
    };
  }

  const entries = part.entries.filter((entry) =>
    textMatches(buildMementoEntrySearchText(entry), normalizedQuery),
  );

  const chapters = part.chapters
    .map((chapter) => {
      const chapterMatch = textMatches(
        buildMementoChapterSearchText(chapter.chapter),
        normalizedQuery,
      );
      const chapterEntries = chapterMatch
        ? chapter.entries
        : chapter.entries.filter((entry) =>
            textMatches(buildMementoEntrySearchText(entry), normalizedQuery),
          );
      return {
        chapter: { ...chapter, entries: chapterEntries },
        keep: chapterMatch || chapterEntries.length > 0,
      };
    })
    .filter((candidate) => candidate.keep)
    .map((candidate) => candidate.chapter);

  const lexiconTerms = part.lexiconTerms.filter((term) =>
    textMatches(buildMementoLexiconSearchText(term), normalizedQuery),
  );

  // `extraMatch` couvre le catalogue contrats (partie produits) et les tables de valeurs de
  // référence (démembrement, international, social) que le filtre parent ne parcourt pas sinon.
  const isShown =
    extraMatch || entries.length > 0 || chapters.length > 0 || lexiconTerms.length > 0;

  return { part, index, isShown, entries, chapters, lexiconTerms };
}

interface MementoReadViewProps {
  showStatus: boolean;
  isAdmin: boolean;
  searchQuery?: string;
}

export default function MementoReadView({
  showStatus,
  isAdmin,
  searchQuery = '',
}: MementoReadViewProps): ReactElement {
  const displayPlan = useMemo(
    () => buildMementoDisplayPlan({ includeImmature: isAdmin }),
    [isAdmin],
  );
  const [openPartId, setOpenPartId] = useState<MementoPartId | null>(null);
  const [openChapterKey, setOpenChapterKey] = useState<string | null>(null);
  const partHeaderRefs = useRef(new Map<MementoPartId, HTMLButtonElement | null>());
  const lastOpenedPartId = useRef<MementoPartId | null>(null);

  const normalizedQuery = normalizeMementoSearch(searchQuery);
  const hasSearch = normalizedQuery.length > 0;

  // Repositionne l'en-tête de la partie qu'on vient d'ouvrir (hors recherche, où tout est déplié
  // d'un coup), en gardant le focus sur le bouton.
  useEffect(() => {
    if (!hasSearch && openPartId && openPartId !== lastOpenedPartId.current) {
      scrollAccordionHeaderIntoView(partHeaderRefs.current.get(openPartId) ?? null);
    }
    lastOpenedPartId.current = openPartId;
  }, [hasSearch, openPartId]);

  // Domaines de valeurs de référence (démembrement, international, social, chiffres clés) dont au
  // moins une ligne correspond à la recherche — indexés sur les valeurs par défaut (libellés stables).
  const matchedValueDomains = useMemo(() => {
    const set = new Set<MementoReferenceValueDomain>();
    if (!hasSearch) return set;
    for (const value of DEFAULT_MEMENTO_REFERENCE_VALUES) {
      if (textMatches(buildMementoReferenceValueSearchText(value), normalizedQuery)) {
        set.add(value.domain);
      }
    }
    return set;
  }, [hasSearch, normalizedQuery]);

  const catalogueMatches = useMemo(() => {
    if (!hasSearch) return false;
    if (matchedValueDomains.has('chiffres-cles')) return true;
    return CATALOG.some((product) =>
      textMatches(`${product.label} ${product.grandeFamille}`, normalizedQuery),
    );
  }, [hasSearch, matchedValueDomains, normalizedQuery]);

  const visibleParts = useMemo<FilteredMementoPart[]>(() => {
    if (!hasSearch) {
      return displayPlan.map((part, index) => ({
        part,
        index,
        isShown: true,
        entries: part.entries,
        chapters: part.chapters,
        lexiconTerms: part.lexiconTerms,
      }));
    }

    return displayPlan
      .map((part, index) => {
        const valueDomain = VALUE_TABLE_BY_PART[part.definition.id]?.domain;
        const extraMatch =
          part.definition.id === 'chiffres-cles'
            ? catalogueMatches
            : valueDomain !== undefined && matchedValueDomains.has(valueDomain);
        return filterMementoPart(part, index, normalizedQuery, extraMatch);
      })
      .filter((item) => item.isShown);
  }, [catalogueMatches, displayPlan, hasSearch, matchedValueDomains, normalizedQuery]);

  return (
    <div className="settings-memento-view settings-memento-read-view">
      <div className="settings-memento-parts" aria-label="Sommaire du mémento">
        {hasSearch && visibleParts.length === 0 ? (
          <p className="settings-memento-empty">Aucun résultat pour « {searchQuery.trim()} ».</p>
        ) : null}
        {visibleParts.map(({ part, index, entries, chapters, lexiconTerms }) => {
          const isOpen = hasSearch || openPartId === part.definition.id;
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
                ref={(el) => {
                  partHeaderRefs.current.set(part.definition.id, el);
                }}
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
                  {valueTable || showBaseContrat || entries.length + lexiconTerms.length > 0 ? (
                    <MementoReadTabs
                      ariaLabel={`Sections de ${part.definition.title}`}
                      panels={[
                        {
                          id: 'lire',
                          label: 'Lire',
                          content:
                            entries.length + lexiconTerms.length > 0 ? (
                              <section className="settings-memento-read-zone settings-memento-read-zone--lecture">
                                <div className="settings-memento-read-zone__header">
                                  <h5>Lire</h5>
                                </div>
                                <div className="settings-memento-read-zone__body">
                                  {entries.length > 0 ? (
                                    <div className="settings-memento-readable-list">
                                      {entries.map((entry) => (
                                        <MementoReadableEntry
                                          key={entry.key}
                                          kind="entry"
                                          entry={entry}
                                          showReferences={false}
                                        />
                                      ))}
                                    </div>
                                  ) : null}

                                  {lexiconTerms.length > 0 ? (
                                    <div
                                      className="settings-memento-lexicon"
                                      aria-label="Définitions du lexique"
                                    >
                                      {groupMementoLexiconTerms(lexiconTerms).map((group) => (
                                        <section
                                          key={group.id}
                                          className="settings-memento-lexicon-group"
                                        >
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
                                                showReferences={false}
                                              />
                                            ))}
                                          </div>
                                        </section>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              </section>
                            ) : (
                              <section className="settings-memento-read-zone settings-memento-read-zone--lecture">
                                <div className="settings-memento-read-zone__header">
                                  <h5>Lire</h5>
                                </div>
                                <p className="settings-memento-empty">
                                  Aucun contenu de lecture direct à ce niveau.
                                </p>
                              </section>
                            ),
                        },
                        {
                          id: 'parametres',
                          label: 'Paramètres de référence',
                          content:
                            valueTable || showBaseContrat ? (
                              <section className="settings-memento-read-zone settings-memento-read-zone--parameters">
                                <div className="settings-memento-read-zone__header">
                                  <h5>Paramètres de référence</h5>
                                </div>
                                <div className="settings-memento-read-zone__body">
                                  {valueTable ? (
                                    <Suspense
                                      fallback={
                                        <p className="settings-memento-empty">
                                          Chargement des valeurs...
                                        </p>
                                      }
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
                                      <BaseContratSettingsPanel searchQuery={searchQuery} />
                                    </Suspense>
                                  ) : null}
                                </div>
                              </section>
                            ) : (
                              <section className="settings-memento-read-zone settings-memento-read-zone--parameters">
                                <div className="settings-memento-read-zone__header">
                                  <h5>Paramètres de référence</h5>
                                </div>
                                <p className="settings-memento-empty">
                                  Aucun paramètre de référence rattaché.
                                </p>
                              </section>
                            ),
                        },
                        {
                          id: 'sources',
                          label: 'Sources & couverture',
                          content:
                            entries.length + lexiconTerms.length > 0 ? (
                              <section className="settings-memento-read-zone settings-memento-read-zone--sources">
                                <div className="settings-memento-read-zone__header">
                                  <h5>Sources & couverture</h5>
                                </div>
                                <div className="settings-memento-read-zone__body settings-memento-source-list">
                                  {entries.map((entry) => (
                                    <MementoEntrySources
                                      key={entry.key}
                                      entry={entry}
                                      showStatus={showStatus}
                                    />
                                  ))}
                                  {groupMementoLexiconTerms(lexiconTerms).map((group) => (
                                    <section
                                      key={group.id}
                                      className="settings-memento-source-group"
                                    >
                                      <h5>{group.title}</h5>
                                      {group.terms.map((term) => (
                                        <MementoLexiconSources
                                          key={term.key}
                                          term={term}
                                          showStatus={showStatus}
                                        />
                                      ))}
                                    </section>
                                  ))}
                                </div>
                              </section>
                            ) : (
                              <section className="settings-memento-read-zone settings-memento-read-zone--sources">
                                <div className="settings-memento-read-zone__header">
                                  <h5>Sources & couverture</h5>
                                </div>
                                <p className="settings-memento-empty">
                                  Aucune source dédiée à ce niveau.
                                </p>
                              </section>
                            ),
                        },
                      ]}
                    />
                  ) : null}

                  {chapters.length > 0 ? (
                    <div className="settings-memento-read-chapters">
                      {chapters.map((chapter) => {
                        const chapterKey = `${part.definition.id}-${chapter.chapter.id}`;

                        return (
                          <MementoReadChapter
                            key={chapterKey}
                            chapter={chapter}
                            isOpen={hasSearch || openChapterKey === chapterKey}
                            showStatus={showStatus}
                            scrollOnOpen={!hasSearch}
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
