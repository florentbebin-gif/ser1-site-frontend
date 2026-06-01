import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import type { SimulatorDefinition, SimulatorSpace, SimulatorTab } from '@/domain/simulators/types';
import {
  IconActivity,
  IconArrowLeftRight,
  IconBarChart,
  IconBriefcase,
  IconBuilding,
  IconChevronDown,
  IconChevronRight,
  IconClock,
  IconFileText,
  IconGauge,
  IconGift,
  IconLayers,
  IconNetwork,
  IconPieChart,
  IconShield,
  IconTable,
  IconTransfer,
  IconUsers,
} from '@/icons/ui';

import {
  buildHomeGuidePanel,
  buildHomeGuideState,
  type HomeGuideCard,
  type HomeGuideMode,
  type HomeGuidePanelItem,
  type HomeGuideTab,
} from './homeGuideModel';
import './HomeGuide.css';

interface HomeGuideProps {
  mode: HomeGuideMode;
}

type IconComponent = (_props: { className?: string }) => React.ReactElement;

const SPACE_DESCRIPTIONS: Record<SimulatorSpace, string> = {
  foyer: 'Famille, fiscalité, placements, immobilier et transmission privée.',
  societe: 'Structure, rémunération, trésorerie, titres et transmission d’entreprise.',
};

const QUICK_TABS: Record<SimulatorSpace, { tab: SimulatorTab; label: string }[]> = {
  foyer: [
    { tab: 'comprendre', label: 'Comprendre ma situation' },
    { tab: 'piloter', label: 'Piloter mon patrimoine' },
    { tab: 'proteger', label: 'Protéger et transmettre' },
  ],
  societe: [
    { tab: 'comprendre', label: 'Analyser la société' },
    { tab: 'piloter', label: 'Piloter le dirigeant' },
    { tab: 'proteger', label: 'Transmettre l’entreprise' },
  ],
};

const ICONS_BY_SIMULATOR_ID: Partial<Record<string, IconComponent>> = {
  filiation: IconUsers,
  'regime-matrimonial': IconShield,
  'donations-anterieures': IconFileText,
  'actif-passif': IconTable,
  budget: IconActivity,
  ir: IconTable,
  ifi: IconBuilding,
  retraite: IconGauge,
  per: IconClock,
  'per-potentiel': IconClock,
  'per-transfert': IconArrowLeftRight,
  placement: IconPieChart,
  credit: IconBarChart,
  'investissement-locatif': IconBuilding,
  'revenus-fonciers': IconFileText,
  'lmnp-lmp': IconBuilding,
  scpi: IconLayers,
  sci: IconNetwork,
  'plus-values-immobilieres': IconArrowLeftRight,
  'arbitrage-reemploi': IconArrowLeftRight,
  prevoyance: IconShield,
  succession: IconTransfer,
  'donation-demembrement': IconGift,
  'organigramme-societe': IconNetwork,
  'valorisation-titres': IconBriefcase,
  'projection-comptable': IconBarChart,
  'tresorerie-societe': IconBuilding,
  remuneration: IconActivity,
  'epargne-salariale': IconBriefcase,
  'cession-titres': IconArrowLeftRight,
  'sortie-capitaux': IconArrowLeftRight,
  holding: IconLayers,
  'pacte-dutreil': IconShield,
};

export function HomeGuide({ mode }: HomeGuideProps): React.ReactElement {
  const guide = useMemo(() => buildHomeGuideState(mode), [mode]);
  const [activeSpace, setActiveSpace] = useState<SimulatorSpace>('foyer');
  const [activeTabs, setActiveTabs] = useState<Record<SimulatorSpace, SimulatorTab>>({
    foyer: 'comprendre',
    societe: 'comprendre',
  });
  const [selectedId, setSelectedId] = useState<string | null>(
    guide.allCards[0]?.definition.id ?? null,
  );

  useEffect(() => {
    const visibleIds = new Set(guide.allCards.map((card) => card.definition.id));
    if (!selectedId || !visibleIds.has(selectedId)) {
      setSelectedId(guide.allCards[0]?.definition.id ?? null);
    }
  }, [guide.allCards, selectedId]);

  const panel = useMemo(() => {
    if (!selectedId) return null;
    return buildHomeGuidePanel(selectedId);
  }, [selectedId]);

  return (
    <section className="home-guide" data-testid="home-guide">
      <header className="home-guide__head">
        <p className="home-guide__eyebrow">SIMULATEURS</p>
        <h2 className="home-guide__title" data-testid="home-guide-title">
          Sélectionnez votre objectif, SER1 vous guide pas à pas
        </h2>
      </header>

      <div className="home-guide__layout">
        <div className="home-guide__spaces" data-testid="home-guide-spaces">
          {guide.spaces.map((space) => (
            <section
              key={space.id}
              className={[
                'home-guide-space',
                activeSpace === space.id ? 'home-guide-space--open' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              data-testid={`home-space-${space.id}`}
            >
              <button
                type="button"
                className="home-guide-space__button"
                aria-expanded={activeSpace === space.id}
                onClick={() => setActiveSpace(space.id)}
              >
                <span className="home-guide-space__icon" aria-hidden="true">
                  {space.id === 'foyer' ? (
                    <IconUsers className="home-guide-icon" />
                  ) : (
                    <IconBuilding className="home-guide-icon" />
                  )}
                </span>
                <span className="home-guide-space__copy">
                  <span className="home-guide-space__name">{space.label}</span>
                  <span className="home-guide-space__description">
                    {SPACE_DESCRIPTIONS[space.id]}
                  </span>
                </span>
                <IconChevronDown className="home-guide-space__chevron" />
              </button>

              {activeSpace !== space.id && (
                <div className="home-guide-space__quick">
                  {QUICK_TABS[space.id].map((quick) => (
                    <button
                      key={quick.tab}
                      type="button"
                      className="home-guide-quick"
                      onClick={() => {
                        setActiveSpace(space.id);
                        setActiveTabs((current) => ({ ...current, [space.id]: quick.tab }));
                      }}
                    >
                      {quick.label}
                    </button>
                  ))}
                </div>
              )}

              {activeSpace === space.id && (
                <div className="home-guide-space__body">
                  <HomeGuideTabs
                    tabs={space.tabs}
                    activeTab={activeTabs[space.id]}
                    onChange={(tab) =>
                      setActiveTabs((current) => ({ ...current, [space.id]: tab }))
                    }
                  />
                  <HomeGuideTabPanel
                    tab={space.tabs.find((tab) => tab.id === activeTabs[space.id]) ?? space.tabs[0]}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
                </div>
              )}
            </section>
          ))}
        </div>

        {panel && <HomeGuideDetails panel={panel} onSelect={setSelectedId} />}
      </div>
    </section>
  );
}

function HomeGuideTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: HomeGuideTab[];
  activeTab: SimulatorTab;
  onChange: (_tab: SimulatorTab) => void;
}): React.ReactElement {
  return (
    <div className="home-guide-tabs" role="tablist" aria-label="Familles de simulateurs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={['home-guide-tab', activeTab === tab.id ? 'home-guide-tab--active' : '']
            .filter(Boolean)
            .join(' ')}
          disabled={!tab.hasCards}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function HomeGuideTabPanel({
  tab,
  selectedId,
  onSelect,
}: {
  tab: HomeGuideTab | undefined;
  selectedId: string | null;
  onSelect: (_id: string) => void;
}): React.ReactElement {
  if (!tab || !tab.hasCards) {
    return (
      <div className="home-guide-empty" data-testid="home-guide-empty">
        Aucun simulateur disponible dans cet onglet.
      </div>
    );
  }

  return (
    <div className="home-guide-families" data-testid="home-guide-cards">
      {tab.families.map((family) => (
        <section key={family.name} className="home-guide-family">
          <h3 className="home-guide-family__head">{family.name}</h3>
          <div className="home-guide-family__cards">
            {family.cards.map((card) => (
              <HomeGuideSimulatorCard
                key={card.definition.id}
                card={card}
                isSelected={selectedId === card.definition.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function HomeGuideSimulatorCard({
  card,
  isSelected,
  onSelect,
}: {
  card: HomeGuideCard;
  isSelected: boolean;
  onSelect: (_id: string) => void;
}): React.ReactElement {
  const Icon = ICONS_BY_SIMULATOR_ID[card.definition.id] ?? IconTable;

  return (
    <button
      type="button"
      className={[
        'home-guide-card',
        isSelected ? 'home-guide-card--selected' : '',
        card.route ? '' : 'home-guide-card--muted',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onSelect(card.definition.id)}
      data-testid={`home-simulator-card-${card.definition.id}`}
    >
      <span className="home-guide-card__icon" aria-hidden="true">
        <Icon className="home-guide-icon" />
      </span>
      <span className="home-guide-card__copy">
        <span className="home-guide-card__title">{card.definition.shortLabel}</span>
        <span className="home-guide-card__meta">{card.statusLabel}</span>
      </span>
      <IconChevronRight className="home-guide-card__chevron" />
    </button>
  );
}

function HomeGuideDetails({
  panel,
  onSelect,
}: {
  panel: ReturnType<typeof buildHomeGuidePanel>;
  onSelect: (_id: string) => void;
}): React.ReactElement {
  const simulator = panel.simulator.definition;
  const route = panel.simulator.route;

  return (
    <aside className="home-guide-detail" data-testid="home-detail-panel">
      <header className="home-guide-detail__head">
        <span className="home-guide-detail__icon" aria-hidden="true">
          <SimulatorIcon simulator={simulator} />
        </span>
        <div>
          <p className="home-guide-detail__status">{panel.simulator.statusLabel}</p>
          <h3 className="home-guide-detail__title" data-testid="home-detail-title">
            {simulator.fullLabel}
          </h3>
        </div>
      </header>

      <div className="home-guide-detail__body">
        <DetailSection title="Objectif">
          <p>{simulator.objective}</p>
        </DetailSection>

        <DetailList title="Inputs" items={simulator.inputs} />
        <DetailList title="Calculs" items={simulator.calculates} />
        <DetailList title="Outputs" items={simulator.outputs} />

        {simulator.subtypes && simulator.subtypes.length > 0 && (
          <DetailSection title="Sous-types">
            <div className="home-guide-chip-row">
              {simulator.subtypes.map((subtype) => (
                <span key={subtype} className="home-guide-chip">
                  {subtype}
                </span>
              ))}
            </div>
          </DetailSection>
        )}

        <RelationSection title="Amont" items={panel.upstream} onSelect={onSelect} />
        <RelationSection title="Aval" items={panel.next} onSelect={onSelect} />

        {panel.futureDependencies.length > 0 && (
          <RelationSection
            title="Étapes futures"
            items={panel.futureDependencies}
            onSelect={onSelect}
            forceStatic
          />
        )}

        <DetailSection title="Références">
          {simulator.legalRefsStatus === 'complete' ? (
            <ul className="home-guide-detail__list">
              {simulator.legalRefs.map((ref) => (
                <li key={ref}>{ref}</li>
              ))}
            </ul>
          ) : (
            <p>Références à renseigner avant codage.</p>
          )}
        </DetailSection>
      </div>

      <footer className="home-guide-detail__footer">
        {route ? (
          <Link to={route.path} className="home-guide-detail__cta" data-testid="home-detail-cta">
            {simulator.lifecycle === 'placeholder' ? 'Voir la fiche' : 'Ouvrir'}
            <IconChevronRight className="home-guide-detail__cta-icon" />
          </Link>
        ) : (
          <button type="button" className="home-guide-detail__cta" disabled>
            Non disponible
          </button>
        )}
      </footer>
    </aside>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="home-guide-detail__section">
      <h4>{title}</h4>
      {children}
    </section>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }): React.ReactElement {
  return (
    <DetailSection title={title}>
      <ul className="home-guide-detail__list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </DetailSection>
  );
}

function RelationSection({
  title,
  items,
  onSelect,
  forceStatic = false,
}: {
  title: string;
  items: HomeGuidePanelItem[];
  onSelect: (_id: string) => void;
  forceStatic?: boolean;
}): React.ReactElement | null {
  if (items.length === 0) return null;

  return (
    <DetailSection title={title}>
      <div className="home-guide-chip-row">
        {items.map((item) => {
          const isStatic =
            forceStatic ||
            !item.selectable ||
            item.definition.lifecycle === 'planned' ||
            item.definition.lifecycle === 'internalOnly';

          if (isStatic) {
            return (
              <span
                key={item.definition.id}
                className="home-guide-chip home-guide-chip--muted"
                data-testid={`home-panel-dependency-${item.definition.id}`}
              >
                {item.definition.shortLabel}
              </span>
            );
          }

          return (
            <button
              key={item.definition.id}
              type="button"
              className="home-guide-chip home-guide-chip--button"
              onClick={() => onSelect(item.definition.id)}
            >
              {item.definition.shortLabel}
            </button>
          );
        })}
      </div>
    </DetailSection>
  );
}

function SimulatorIcon({ simulator }: { simulator: SimulatorDefinition }): React.ReactElement {
  const Icon = ICONS_BY_SIMULATOR_ID[simulator.id] ?? IconTable;
  return <Icon className="home-guide-icon" />;
}
