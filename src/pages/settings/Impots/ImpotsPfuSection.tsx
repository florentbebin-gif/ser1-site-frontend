import React from 'react';
import SettingsYearColumn from '@/components/settings/SettingsYearColumn';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';

interface IncomeTaxLabels {
  currentYearLabel?: string;
  previousYearLabel?: string;
}

interface PfuPeriodSettings {
  rateIR: number | null;
}

interface PfuSettings {
  current: PfuPeriodSettings;
  previous: PfuPeriodSettings;
}

interface PatrimonyPeriodSettings {
  generalRate: number | null;
}

interface PatrimonySettings {
  current: PatrimonyPeriodSettings;
  previous: PatrimonyPeriodSettings;
}

interface ImpotsPfuSectionProps {
  pfu: PfuSettings;
  incomeTax: IncomeTaxLabels;
  patrimony: PatrimonySettings;
  updateField: (path: string[], value: string | number | null) => void;
  isAdmin: boolean;
  openSection: string | null;
  setOpenSection: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function ImpotsPfuSection({
  pfu,
  incomeTax,
  patrimony,
  updateField,
  isAdmin,
  openSection,
  setOpenSection,
}: ImpotsPfuSectionProps): React.ReactElement {
  const isOpen = openSection === 'pfu';

  const currentPs = Number(patrimony.current.generalRate) || 0;
  const previousPs = Number(patrimony.previous.generalRate) || 0;
  const currentTotal = (Number(pfu.current.rateIR) || 0) + currentPs;
  const previousTotal = (Number(pfu.previous.rateIR) || 0) + previousPs;

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
          PFU
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
          <p style={{ fontSize: 13, color: 'var(--color-c9)' }}>
            La part prélèvements sociaux du PFU est calculée automatiquement depuis
            /settings/prelevements. Seule la part IR reste éditable ici.
          </p>

          <div className="tax-two-cols">
            <SettingsYearColumn yearLabel={incomeTax.currentYearLabel || 'Année N'}>
              <SettingsFieldRow
                label="Part impôt sur le revenu"
                path={['pfu', 'current', 'rateIR']}
                value={pfu.current.rateIR}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Prélèvements sociaux calculés"
                path={['pfu', 'current', 'rateSocial']}
                value={currentPs}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled
              />
              <SettingsFieldRow
                label="Taux global PFU calculé"
                path={['pfu', 'current', 'rateTotal']}
                value={currentTotal}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled
              />
            </SettingsYearColumn>

            <SettingsYearColumn
              yearLabel={incomeTax.previousYearLabel || 'Année N-1'}
              isRight
            >
              <SettingsFieldRow
                label="Part impôt sur le revenu"
                path={['pfu', 'previous', 'rateIR']}
                value={pfu.previous.rateIR}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Prélèvements sociaux calculés"
                path={['pfu', 'previous', 'rateSocial']}
                value={previousPs}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled
              />
              <SettingsFieldRow
                label="Taux global PFU calculé"
                path={['pfu', 'previous', 'rateTotal']}
                value={previousTotal}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled
              />
            </SettingsYearColumn>
          </div>
        </div>
      )}
    </div>
  );
}
