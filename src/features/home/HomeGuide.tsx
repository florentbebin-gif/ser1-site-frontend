import React, { useMemo, useState } from 'react';
import { Link } from 'react-router';

import type { SimulatorSpace, SimulatorTab } from '@/domain/simulators/types';
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
  IconHome,
  IconLayers,
  IconNetwork,
  IconPieChart,
  IconShield,
  IconTable,
  IconTransfer,
  IconUsers,
} from '@/icons/ui';

import {
  buildHomeGuideState,
  type HomeGuideCard,
  type HomeGuideMode,
  type HomeGuideSpace,
  type HomeGuideTab,
} from './homeGuideModel';
import './HomeGuide.css';

interface HomeGuideProps {
  mode: HomeGuideMode;
}

type IconComponent = (_props: { className?: string }) => React.ReactElement;

const ICONS_BY_SPACE: Record<SimulatorSpace, IconComponent> = {
  foyer: IconHome,
  societe: IconBuilding,
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
  const [activeSpace, setActiveSpace] = useState<SimulatorSpace | null>(null);
  const [activeTabs, setActiveTabs] = useState<Record<SimulatorSpace, SimulatorTab>>({
    foyer: 'comprendre',
    societe: 'comprendre',
  });

  const openSpace = (space: SimulatorSpace, tab?: SimulatorTab): void => {
    setActiveSpace(space);
    if (tab) {
      setActiveTabs((current) => ({ ...current, [space]: tab }));
    }
  };

  return (
    <section className="home-guide" data-testid="home-guide">
      <header className="home-guide__head">
        <p className="home-guide__eyebrow">SIMULATEURS</p>
        <p className="home-guide__subtitle" data-testid="home-guide-subtitle">
          Sélectionnez votre objectif, SER1 vous guide pas à pas.
        </p>
      </header>

      <div className="home-guide__spaces" data-testid="home-guide-spaces">
        {guide.spaces.map((space) => (
          <HomeGuideSpaceCard
            key={space.id}
            space={space}
            isOpen={activeSpace === space.id}
            activeTab={activeTabs[space.id]}
            onToggle={() => setActiveSpace(activeSpace === space.id ? null : space.id)}
            onQuickAction={(tab) => openSpace(space.id, tab)}
            onTabChange={(tab) => openSpace(space.id, tab)}
          />
        ))}
      </div>
    </section>
  );
}

function HomeGuideSpaceCard({
  space,
  isOpen,
  activeTab,
  onToggle,
  onQuickAction,
  onTabChange,
}: {
  space: HomeGuideSpace;
  isOpen: boolean;
  activeTab: SimulatorTab;
  onToggle: () => void;
  onQuickAction: (_tab: SimulatorTab) => void;
  onTabChange: (_tab: SimulatorTab) => void;
}): React.ReactElement {
  const Icon = ICONS_BY_SPACE[space.id];

  return (
    <section
      className={['home-guide-space', isOpen ? 'home-guide-space--open' : '']
        .filter(Boolean)
        .join(' ')}
      data-open={isOpen ? 'true' : 'false'}
      data-testid={`home-space-${space.id}`}
    >
      <button
        type="button"
        className="home-guide-space__button"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span className="home-guide-space__icon" aria-hidden="true">
          <Icon className="home-guide-icon" />
        </span>
        <span className="home-guide-space__copy">
          <span className="home-guide-space__name">{space.label}</span>
          <span className="home-guide-space__description">{space.description}</span>
        </span>
        <IconChevronDown className="home-guide-space__chevron" />
      </button>

      <div className="home-guide-space__quick" aria-label={`Objectifs ${space.label}`}>
        {space.quickActions.map((quick) => (
          <button
            key={quick.tab}
            type="button"
            className="home-guide-quick"
            onClick={() => onQuickAction(quick.tab)}
          >
            {quick.label}
          </button>
        ))}
      </div>

      {isOpen && (
        <div className="home-guide-space__body">
          <HomeGuideTabs tabs={space.tabs} activeTab={activeTab} onChange={onTabChange} />
          <HomeGuideTabPanel
            tab={space.tabs.find((tab) => tab.id === activeTab) ?? space.tabs[0]}
          />
        </div>
      )}
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

function HomeGuideTabPanel({ tab }: { tab: HomeGuideTab | undefined }): React.ReactElement {
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
              <HomeGuideSimulatorCard key={card.definition.id} card={card} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function HomeGuideSimulatorCard({ card }: { card: HomeGuideCard }): React.ReactElement {
  const Icon = ICONS_BY_SIMULATOR_ID[card.definition.id] ?? IconTable;
  const content = (
    <>
      <span className="home-guide-card__icon" aria-hidden="true">
        <Icon className="home-guide-icon" />
      </span>
      <span className="home-guide-card__copy">
        <span className="home-guide-card__title">{card.definition.shortLabel}</span>
        <span className="home-guide-card__meta">{card.statusLabel}</span>
      </span>
      <IconChevronRight className="home-guide-card__chevron" />
    </>
  );

  if (card.route) {
    return (
      <Link
        to={card.route.path}
        className="home-guide-card"
        data-testid={`home-simulator-card-${card.definition.id}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="home-guide-card home-guide-card--muted"
      disabled
      data-testid={`home-simulator-card-${card.definition.id}`}
    >
      {content}
    </button>
  );
}
