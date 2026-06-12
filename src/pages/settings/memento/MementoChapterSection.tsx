import {
  Suspense,
  lazy,
  useEffect,
  useId,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import { SettingsIcon } from '@/components/settings/SettingsTitleWithIcon';
import type {
  MementoChapter,
  MementoChapterEditorial,
  MementoEntry,
  SimulatorCoverageEntry,
} from '@/domain/settings-memento';

import MementoEntryRow from './MementoEntryRow';
import MementoEditorialRow from './MementoEditorialRow';
import type { MementoSettingsSection } from './mementoSettingsSections';

const ComptablesSocietesSettingsPanel = lazy(
  () => import('../ComptablesSocietes/ComptablesSocietesSettingsPanel'),
);
const BaseContratSettingsPanel = lazy(() => import('../BaseContrat/BaseContratSettingsPanel'));
const DmtgSuccessionSettingsPanel = lazy(
  () => import('../DmtgSuccession/DmtgSuccessionSettingsPanel'),
);
const ImpotsSettingsPanel = lazy(() => import('../Impots/ImpotsSettingsPanel'));
const PrelevementsSettingsPanel = lazy(() => import('../Prelevements/PrelevementsSettingsPanel'));
const PrevoyanceRegimesSettingsPanel = lazy(
  () => import('../PrevoyanceRegimes/PrevoyanceRegimesSettingsPanel'),
);
const LazyMementoCoveragePanel = lazy(() => import('./MementoCoveragePanel'));

type MementoSubSectionId = 'lecture' | 'parametres' | 'couverture';

interface MementoChapterSectionProps {
  chapter: MementoChapter;
  entries: readonly MementoEntry[];
  coverage: readonly SimulatorCoverageEntry[];
  settingsSections: readonly MementoSettingsSection[];
  editorial: MementoChapterEditorial | null;
  isOpen: boolean;
  onToggle: () => void;
}

interface MementoSubAccordionProps {
  id: MementoSubSectionId;
  title: string;
  summary: string;
  count: number;
  openSubSection: MementoSubSectionId | null;
  setOpenSubSection: (nextSection: MementoSubSectionId | null) => void;
  children: ReactNode;
}

const SETTINGS_SOURCE_LABELS = {
  tax_settings: 'Tax settings',
  ps_settings: 'Paramètres sociaux',
  fiscality_settings: 'Fiscalité structurée',
  pass_history: 'Historique PASS',
  base_contrat_catalog: 'Catalogue contrats',
  base_contrat_overrides: 'Overrides contrats',
  prevoyance_regime_settings: 'Régimes prévoyance',
  prevoyance_maintien_employeur_settings: 'Maintien employeur',
} as const satisfies Record<MementoSettingsSection['readSources'][number], string>;

function ChapterIcon(): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <SettingsIcon name="layers" />
    </svg>
  );
}

function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count > 1 ? plural : singular}`;
}

function SettingsSourceRow({ section }: { section: MementoSettingsSection }): ReactElement {
  return (
    <article className="settings-memento-row settings-memento-row--settings-source">
      <div className="settings-memento-row__main">
        <div className="settings-memento-row__heading">
          <h4 className="settings-memento-row__title">{section.label}</h4>
          <span className="settings-memento-source-chip">{section.targetSectionKey}</span>
        </div>
        <p className="settings-memento-row__description">
          Les calculateurs continuent de lire ces paramètres depuis leurs sources centralisées.
        </p>
        <div className="settings-memento-row__facts" aria-label="Sources settings">
          {section.readSources.map((source) => (
            <span key={`read-${source}`}>Lecture : {SETTINGS_SOURCE_LABELS[source]}</span>
          ))}
          {section.writeSources.map((source) => (
            <span key={`write-${source}`}>Écriture : {SETTINGS_SOURCE_LABELS[source]}</span>
          ))}
        </div>
      </div>

      <div className="settings-memento-row__owner">
        <span className="settings-memento-owner-placeholder">{section.targetPagePath}</span>
      </div>
    </article>
  );
}

function SettingsSectionContent({
  chapter,
  section,
}: {
  chapter: MementoChapter;
  section: MementoSettingsSection;
}): ReactElement {
  if (section.id === 'impots' && chapter.id === 'fiscalite-foyer') {
    return (
      <div className="settings-memento-settings-editor">
        <SettingsSourceRow section={section} />
        <Suspense fallback={<p className="settings-memento-empty">Chargement des paramètres...</p>}>
          <ImpotsSettingsPanel />
        </Suspense>
      </div>
    );
  }

  if (section.id === 'comptables-societes' && chapter.id === 'societe') {
    return (
      <div className="settings-memento-settings-editor">
        <SettingsSourceRow section={section} />
        <Suspense fallback={<p className="settings-memento-empty">Chargement des paramètres...</p>}>
          <ComptablesSocietesSettingsPanel />
        </Suspense>
      </div>
    );
  }

  if (section.id === 'prelevements' && chapter.id === 'retraite') {
    return (
      <div className="settings-memento-settings-editor">
        <SettingsSourceRow section={section} />
        <Suspense fallback={<p className="settings-memento-empty">Chargement des paramètres...</p>}>
          <PrelevementsSettingsPanel />
        </Suspense>
      </div>
    );
  }

  if (section.id === 'dmtg-succession' && chapter.id === 'transmission') {
    return (
      <div className="settings-memento-settings-editor">
        <SettingsSourceRow section={section} />
        <Suspense fallback={<p className="settings-memento-empty">Chargement des paramètres...</p>}>
          <DmtgSuccessionSettingsPanel />
        </Suspense>
      </div>
    );
  }

  if (section.id === 'base-contrat' && chapter.id === 'placements') {
    return (
      <div className="settings-memento-settings-editor">
        <SettingsSourceRow section={section} />
        <Suspense fallback={<p className="settings-memento-empty">Chargement des paramètres...</p>}>
          <BaseContratSettingsPanel />
        </Suspense>
      </div>
    );
  }

  if (section.id === 'prevoyance-regimes' && chapter.id === 'prevoyance') {
    return (
      <div className="settings-memento-settings-editor">
        <SettingsSourceRow section={section} />
        <Suspense fallback={<p className="settings-memento-empty">Chargement des paramètres...</p>}>
          <PrevoyanceRegimesSettingsPanel />
        </Suspense>
      </div>
    );
  }

  return <SettingsSourceRow section={section} />;
}

function MementoSubAccordion({
  id,
  title,
  summary,
  count,
  openSubSection,
  setOpenSubSection,
  children,
}: MementoSubAccordionProps): ReactElement {
  const generatedId = useId();
  const isOpen = openSubSection === id;
  const buttonId = `${generatedId}-${id}-button`;
  const panelId = `${generatedId}-${id}-panel`;

  return (
    <div className="settings-memento-subsection">
      <button
        id={buttonId}
        type="button"
        className="settings-memento-subsection__header"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setOpenSubSection(isOpen ? null : id)}
      >
        <span className="settings-memento-subsection__title">{title}</span>
        <span className="settings-memento-subsection__summary">{summary}</span>
        <span className="settings-memento-subsection__count">{count}</span>
        <span className="settings-memento-chevron" aria-hidden="true">
          {isOpen ? '▾' : '▸'}
        </span>
      </button>

      {isOpen && (
        <div
          id={panelId}
          className="settings-memento-subsection__body"
          role="region"
          aria-labelledby={buttonId}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function MementoChapterSection({
  chapter,
  entries,
  coverage,
  settingsSections,
  editorial,
  isOpen,
  onToggle,
}: MementoChapterSectionProps): ReactElement {
  const generatedId = useId();
  const [openSubSection, setOpenSubSection] = useState<MementoSubSectionId | null>(null);
  const buttonId = `${generatedId}-chapter-button`;
  const panelId = `${generatedId}-chapter-panel`;

  useEffect(() => {
    if (!isOpen) setOpenSubSection(null);
  }, [isOpen]);

  return (
    <section className="settings-memento-chapter">
      <button
        id={buttonId}
        type="button"
        className="settings-memento-chapter__header"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="settings-action-icon settings-memento-chapter__icon">
          <ChapterIcon />
        </span>
        <span className="settings-memento-chapter__text">
          <span className="settings-memento-chapter__title">
            {chapter.label} ({entries.length})
          </span>
          <span className="settings-memento-chapter__description">{chapter.description}</span>
        </span>
        <span className="settings-memento-chapter__meta">
          <span>{formatCount(entries.length, 'entrée', 'entrées')}</span>
          <span>{formatCount(settingsSections.length, 'source', 'sources')}</span>
          <span>{formatCount(coverage.length, 'contrôle', 'contrôles')}</span>
        </span>
        <span className="settings-memento-chevron" aria-hidden="true">
          {isOpen ? '▾' : '▸'}
        </span>
      </button>

      {isOpen && (
        <div
          id={panelId}
          className="settings-memento-chapter__panel"
          role="region"
          aria-labelledby={buttonId}
        >
          <MementoSubAccordion
            id="lecture"
            title="Lecture métier"
            summary="Synthèse courte, statut et rattachement utile au CGP."
            count={entries.length + (editorial ? 1 : 0)}
            openSubSection={openSubSection}
            setOpenSubSection={setOpenSubSection}
          >
            {entries.length > 0 || editorial ? (
              <div className="settings-memento-section__rows">
                {editorial ? <MementoEditorialRow editorial={editorial} /> : null}
                {entries.map((entry) => (
                  <MementoEntryRow key={entry.key} entry={entry} />
                ))}
              </div>
            ) : (
              <p className="settings-memento-empty">Aucune entrée métier filtrée.</p>
            )}
          </MementoSubAccordion>

          <MementoSubAccordion
            id="parametres"
            title="Paramètres calculateurs"
            summary="Sources qui restent consommées par les simulateurs."
            count={settingsSections.length}
            openSubSection={openSubSection}
            setOpenSubSection={setOpenSubSection}
          >
            {settingsSections.length > 0 ? (
              <div className="settings-memento-section__rows">
                {settingsSections.map((section) => (
                  <SettingsSectionContent key={section.id} chapter={chapter} section={section} />
                ))}
              </div>
            ) : (
              <p className="settings-memento-empty">Aucun paramètre settings rattaché.</p>
            )}
          </MementoSubAccordion>

          <MementoSubAccordion
            id="couverture"
            title="Couverture simulateurs"
            summary="Contrôle technique affiché uniquement à la demande."
            count={coverage.length}
            openSubSection={openSubSection}
            setOpenSubSection={setOpenSubSection}
          >
            {coverage.length > 0 ? (
              <Suspense
                fallback={<p className="settings-memento-empty">Chargement de la couverture...</p>}
              >
                <LazyMementoCoveragePanel coverage={coverage} />
              </Suspense>
            ) : (
              <p className="settings-memento-empty">Aucun contrôle de couverture filtré.</p>
            )}
          </MementoSubAccordion>
        </div>
      )}
    </section>
  );
}
