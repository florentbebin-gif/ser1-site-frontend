import { lazy, useState, type ReactElement } from 'react';

import CalculatorSettingsCard from './CalculatorSettingsCard';
import {
  getMementoSettingsSection,
  MEMENTO_SETTINGS_SECTIONS,
  type MementoSettingsSectionId,
} from './mementoSettingsSections';

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

const PANEL_BY_SECTION = {
  impots: ImpotsSettingsPanel,
  'comptables-societes': ComptablesSocietesSettingsPanel,
  prelevements: PrelevementsSettingsPanel,
  'dmtg-succession': DmtgSuccessionSettingsPanel,
  'base-contrat': BaseContratSettingsPanel,
  'prevoyance-regimes': PrevoyanceRegimesSettingsPanel,
} as const;

const CALCULATOR_SECTION_IDS = MEMENTO_SETTINGS_SECTIONS.map((section) => section.id);

export default function MementoCalculatorSettingsView(): ReactElement {
  const [openSectionId, setOpenSectionId] = useState<MementoSettingsSectionId | null>(null);

  return (
    <div className="settings-memento-view settings-memento-calculators">
      <div className="settings-memento-calculator-grid">
        {CALCULATOR_SECTION_IDS.map((sectionId) => {
          const section = getMementoSettingsSection(sectionId);
          const Panel = PANEL_BY_SECTION[sectionId];

          return (
            <CalculatorSettingsCard
              key={section.id}
              section={section}
              Panel={Panel}
              isOpen={openSectionId === section.id}
              onToggle={() =>
                setOpenSectionId((current) => (current === section.id ? null : section.id))
              }
            />
          );
        })}
      </div>
    </div>
  );
}
