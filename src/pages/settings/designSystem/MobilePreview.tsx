import { useState } from 'react';
import {
  SimAmountInputEuro,
  SimEmptyState,
  SimMobileStickyActions,
  SimSegmentedControl,
} from '@/components/ui/sim';
import { snippets } from '../designSystemCatalog';
import { SettingsDesignSystemCodeSnippet } from '../SettingsDesignSystemCodeSnippet';

export function DesignSystemMobilePreview() {
  const [value, setValue] = useState(18000);
  const [period, setPeriod] = useState<'annee' | 'mois'>('annee');

  return (
    <div className="settings-design-system__stack">
      <div className="settings-design-system__mobile-frame" aria-label="Mobile 390">
        <div className="settings-design-system__mobile-topbar">390 px</div>
        <div className="settings-design-system__mobile-body">
          <SimAmountInputEuro label="Versement mobile" value={value} onChange={setValue} min={0} />
          <SimSegmentedControl
            value={period}
            onChange={setPeriod}
            ariaLabel="Période mobile"
            options={[
              { value: 'annee', label: 'Année' },
              { value: 'mois', label: 'Mois' },
            ]}
          />
          <SimEmptyState
            illustration="table"
            title="Aucun scénario"
            description="Ajoutez une ligne pour lancer la comparaison."
          />
          <SimMobileStickyActions ariaLabel="Actions mobiles 390">
            <button type="button" className="sim-modal-btn sim-modal-btn--ghost">
              Annuler
            </button>
            <button type="button" className="sim-modal-btn sim-modal-btn--primary">
              Valider
            </button>
          </SimMobileStickyActions>
        </div>
      </div>
      <SettingsDesignSystemCodeSnippet label="Extrait mobile">
        {snippets.mobile}
      </SettingsDesignSystemCodeSnippet>
    </div>
  );
}
