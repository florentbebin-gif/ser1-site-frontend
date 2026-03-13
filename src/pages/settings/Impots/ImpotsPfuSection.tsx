import React from 'react';
import SettingsYearColumn from '@/components/settings/SettingsYearColumn';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';

interface IncomeTaxLabels {
  currentYearLabel?: string;
  previousYearLabel?: string;
}

interface PfuPeriodSettings {
  rateIR: number | null;
  rateSocial: number | null;
  rateTotal: number | null;
}

interface PfuSettings {
  current: PfuPeriodSettings;
  previous: PfuPeriodSettings;
}

interface ImpotsPfuSectionProps {
  pfu: PfuSettings;
  incomeTax: IncomeTaxLabels;
  updateField: (path: string[], value: string | number | null) => void;
  isAdmin: boolean;
  openSection: string | null;
  setOpenSection: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function ImpotsPfuSection({
  pfu,
  incomeTax,
  updateField,
  isAdmin,
  openSection,
  setOpenSection,
}: ImpotsPfuSectionProps): React.ReactElement {
  const isOpen = openSection === 'pfu';

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        id="impots-header-pfu"
        aria-expanded={isOpen}
        aria-controls="impots-panel-pfu"
        onClick={() => setOpenSection(isOpen ? null : 'pfu')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          PFU (flat tax)
        </span>
        <span className="fisc-acc-chevron">
          {isOpen ? 'v' : '>'}
        </span>
      </button>

      {isOpen && (
        <div
          className="fisc-acc-body"
          id="impots-panel-pfu"
          role="region"
          aria-labelledby="impots-header-pfu"
        >
          <div className="tax-two-cols">
            <SettingsYearColumn yearLabel={incomeTax.currentYearLabel || 'Annee N'}>
              <SettingsFieldRow
                label="Part impot sur le revenu"
                path={['pfu', 'current', 'rateIR']}
                value={pfu.current.rateIR}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Prelevements sociaux"
                path={['pfu', 'current', 'rateSocial']}
                value={pfu.current.rateSocial}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Taux global PFU"
                path={['pfu', 'current', 'rateTotal']}
                value={pfu.current.rateTotal}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
            </SettingsYearColumn>

            <SettingsYearColumn
              yearLabel={incomeTax.previousYearLabel || 'Annee N-1'}
              isRight
            >
              <SettingsFieldRow
                label="Part impot sur le revenu"
                path={['pfu', 'previous', 'rateIR']}
                value={pfu.previous.rateIR}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Prelevements sociaux"
                path={['pfu', 'previous', 'rateSocial']}
                value={pfu.previous.rateSocial}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Taux global PFU"
                path={['pfu', 'previous', 'rateTotal']}
                value={pfu.previous.rateTotal}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
            </SettingsYearColumn>
          </div>
        </div>
      )}
    </div>
  );
}
