import React from 'react';
import { LegalRefInlineList } from '@/components/legal/LegalRefLink';
import SettingsTitleWithIcon from '@/components/settings/SettingsTitleWithIcon';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';
import { PRELEVEMENTS_SOCIAL_DIRIGEANT_REF_IDS } from '@/domain/settings-references/uiReferenceGroups';

interface SocialDirigeantSettings {
  current: {
    remuneration: {
      tns: { status: string };
      assimileSalarie: { status: string };
    };
    dividends: {
      tnsSocialBasePct: number | null;
    };
    passTranches: {
      status: string;
    };
    madelin: {
      status: string;
    };
  };
}

interface PrelevementsSocialDirigeantSectionProps {
  socialDirigeant: SocialDirigeantSettings;
  updateField: (path: string[], value: string | number | null) => void;
  isAdmin: boolean;
  openSection: string | null;
  setOpenSection: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function PrelevementsSocialDirigeantSection({
  socialDirigeant,
  updateField,
  isAdmin,
  openSection,
  setOpenSection,
}: PrelevementsSocialDirigeantSectionProps): React.ReactElement {
  const isOpen = openSection === 'social-dirigeant';

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header fisc-acc-header--with-icon"
        id="prelev-header-social-dirigeant"
        aria-expanded={isOpen}
        aria-controls="prelev-panel-social-dirigeant"
        onClick={() => setOpenSection(isOpen ? null : 'social-dirigeant')}
      >
        <SettingsTitleWithIcon
          icon="briefcase"
          className="settings-premium-title settings-premium-title--flush"
        >
          Charges sociales dirigeant
        </SettingsTitleWithIcon>
        <span className="fisc-acc-chevron">{isOpen ? 'v' : '>'}</span>
      </button>

      {isOpen && (
        <div
          className="fisc-acc-body"
          id="prelev-panel-social-dirigeant"
          role="region"
          aria-labelledby="prelev-header-social-dirigeant"
        >
          <p className="fisc-intro">
            Paramètres sociaux centralisés pour les moteurs société et dirigeant. Le seuil
            dividendes TNS est consommable ; les autres périmètres restent à compléter avant moteur
            dédié.
            <LegalRefInlineList ids={PRELEVEMENTS_SOCIAL_DIRIGEANT_REF_IDS} />
          </p>

          <div className="income-tax-block income-tax-block--mb12">
            <div className="settings-registry-status-panel__counts">
              <span className="settings-registry-status-panel__count is-partial">Partiel</span>
            </div>
            <div className="income-tax-block-title">Dividendes TNS</div>
            <div className="income-tax-block-body">
              <SettingsFieldRow
                label="Seuil dividendes TNS soumis aux charges sociales"
                path={['socialDirigeant', 'current', 'dividends', 'tnsSocialBasePct']}
                value={socialDirigeant.current.dividends.tnsSocialBasePct}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
            </div>
          </div>

          <div className="income-tax-block">
            <div className="income-tax-block-title">Périmètres bloqués</div>
            <div className="income-tax-block-body">
              <ul className="settings-error-list">
                <li>Rémunération TNS - à compléter</li>
                <li>Rémunération assimilé salarié - à compléter</li>
                <li>Tranches TA/TB/TC - à compléter</li>
                <li>Madelin - bloqué consommateur</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
