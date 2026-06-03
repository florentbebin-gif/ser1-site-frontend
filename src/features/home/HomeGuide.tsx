import React, { useMemo, useState } from 'react';

import type { SimulatorSpace, SimulatorTab } from '@/domain/simulators/types';
import { IconChevronDown } from '@/icons/ui';

import {
  buildHomeGuideState,
  type HomeGuideCard,
  type HomeGuideFamily,
  type HomeGuideMode,
  type HomeGuideSpace,
  type HomeGuideTab,
} from './homeGuideModel';
import { HomeSimulatorPanel } from './HomeSimulatorPanel';
import { ICONS_BY_SPACE, getSimulatorIcon } from './simulatorIcons';
import './HomeGuide.css';

interface HomeGuideProps {
  mode: HomeGuideMode;
}

export function HomeGuide({ mode }: HomeGuideProps): React.ReactElement {
  const guide = useMemo(() => buildHomeGuideState(mode), [mode]);
  const isExpert = mode === 'expert';
  const [activeSpace, setActiveSpace] = useState<SimulatorSpace | null>(null);
  const [selectedCard, setSelectedCard] = useState<HomeGuideCard | null>(null);
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
            isExpert={isExpert}
            isOpen={activeSpace === space.id}
            activeTab={activeTabs[space.id]}
            onToggle={() => setActiveSpace(activeSpace === space.id ? null : space.id)}
            onTabChange={(tab) => openSpace(space.id, tab)}
            onSelectCard={setSelectedCard}
          />
        ))}
      </div>

      <HomeSimulatorPanel card={selectedCard} onClose={() => setSelectedCard(null)} />
    </section>
  );
}

function HomeGuideSpaceCard({
  space,
  isExpert,
  isOpen,
  activeTab,
  onToggle,
  onTabChange,
  onSelectCard,
}: {
  space: HomeGuideSpace;
  isExpert: boolean;
  isOpen: boolean;
  activeTab: SimulatorTab;
  onToggle: () => void;
  onTabChange: (_tab: SimulatorTab) => void;
  onSelectCard: (_card: HomeGuideCard) => void;
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
          <span className="home-guide-space__accroche">{space.accroche}</span>
        </span>
        <IconChevronDown className="home-guide-space__chevron" />
      </button>

      {isOpen && (
        <div className="home-guide-space__body">
          <HomeGuideTabs tabs={space.tabs} activeTab={activeTab} onChange={onTabChange} />
          <HomeGuideTabPanel
            tab={space.tabs.find((tab) => tab.id === activeTab) ?? space.tabs[0]}
            isExpert={isExpert}
            onSelectCard={onSelectCard}
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

function HomeGuideTabPanel({
  tab,
  isExpert,
  onSelectCard,
}: {
  tab: HomeGuideTab | undefined;
  isExpert: boolean;
  onSelectCard: (_card: HomeGuideCard) => void;
}): React.ReactElement {
  if (!tab || !tab.hasCards) {
    return (
      <div className="home-guide-empty" data-testid="home-guide-empty">
        Aucun simulateur disponible dans cet onglet.
      </div>
    );
  }

  // Onglet « Piloter » : familles repliables. Comprendre / Protéger : grille plate
  // (les familles ne portent pas d'entête, conforme aux visuels cibles).
  if (tab.id === 'piloter') {
    return (
      <div className="home-guide-families" data-testid="home-guide-cards">
        {tab.families.map((family) => (
          <HomeGuideFamilyAccordion
            key={family.name}
            family={family}
            isExpert={isExpert}
            onSelectCard={onSelectCard}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="home-guide-grid" data-testid="home-guide-cards">
      {tab.families.flatMap((family) =>
        family.cards.map((card) => (
          <HomeGuideSimulatorCard
            key={card.definition.id}
            card={card}
            isExpert={isExpert}
            onSelect={onSelectCard}
          />
        )),
      )}
    </div>
  );
}

function HomeGuideFamilyAccordion({
  family,
  isExpert,
  onSelectCard,
}: {
  family: HomeGuideFamily;
  isExpert: boolean;
  onSelectCard: (_card: HomeGuideCard) => void;
}): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section
      className={['home-guide-family', isOpen ? 'home-guide-family--open' : '']
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        className="home-guide-family__head"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="home-guide-family__name">{family.name}</span>
        <IconChevronDown className="home-guide-family__chevron" />
      </button>
      {isOpen && (
        <div className="home-guide-grid">
          {family.cards.map((card) => (
            <HomeGuideSimulatorCard
              key={card.definition.id}
              card={card}
              isExpert={isExpert}
              onSelect={onSelectCard}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function HomeGuideSimulatorCard({
  card,
  isExpert,
  onSelect,
}: {
  card: HomeGuideCard;
  isExpert: boolean;
  onSelect: (_card: HomeGuideCard) => void;
}): React.ReactElement {
  const Icon = getSimulatorIcon(card.definition.id);

  return (
    <button
      type="button"
      className="home-guide-card"
      data-testid={`home-simulator-card-${card.definition.id}`}
      onClick={() => onSelect(card)}
    >
      <span className="home-guide-card__icon" aria-hidden="true">
        <Icon className="home-guide-icon" />
      </span>
      <span className="home-guide-card__copy">
        <span className="home-guide-card__title">{card.definition.shortLabel}</span>
        {isExpert && <span className="home-guide-card__meta">{card.statusLabel}</span>}
      </span>
    </button>
  );
}
