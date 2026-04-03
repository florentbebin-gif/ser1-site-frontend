import React from 'react';
import SettingsYearColumn from '@/components/settings/SettingsYearColumn';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';

interface IncomeTaxLabels {
  currentYearLabel?: string;
  previousYearLabel?: string;
}

interface CorporateTaxPeriodSettings {
  normalRate: number | null;
  reducedRate: number | null;
  reducedThreshold: number | null;
}

interface CorporateTaxSettings {
  current: CorporateTaxPeriodSettings;
  previous: CorporateTaxPeriodSettings;
}

interface ImpotsISSectionProps {
  corporateTax: CorporateTaxSettings;
  incomeTax: IncomeTaxLabels;
  updateField: (path: string[], value: string | number | null) => void;
  isAdmin: boolean;
  openSection: string | null;
  setOpenSection: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function ImpotsISSection({
  corporateTax,
  incomeTax,
  updateField,
  isAdmin,
  openSection,
  setOpenSection,
}: ImpotsISSectionProps): React.ReactElement {
  const isOpen = openSection === 'is';

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        id="impots-header-is"
        aria-expanded={isOpen}
        aria-controls="impots-panel-is"
        onClick={() => setOpenSection(isOpen ? null : 'is')}
      >
        <span className="settings-premium-title settings-premium-title--flush">
          Impot sur les societes
        </span>
        <span className="fisc-acc-chevron">
          {isOpen ? 'v' : '>'}
        </span>
      </button>

      {isOpen && (
        <div
          className="fisc-acc-body"
          id="impots-panel-is"
          role="region"
          aria-labelledby="impots-header-is"
        >
          <div className="tax-two-cols">
            <SettingsYearColumn yearLabel={incomeTax.currentYearLabel || 'Annee N'}>
              <SettingsFieldRow
                label="Taux normal IS"
                path={['corporateTax', 'current', 'normalRate']}
                value={corporateTax.current.normalRate}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Taux reduit IS"
                path={['corporateTax', 'current', 'reducedRate']}
                value={corporateTax.current.reducedRate}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Seuil de benefice au taux reduit"
                path={['corporateTax', 'current', 'reducedThreshold']}
                value={corporateTax.current.reducedThreshold}
                onChange={updateField}
                unit="EUR"
                disabled={!isAdmin}
              />
            </SettingsYearColumn>

            <SettingsYearColumn
              yearLabel={incomeTax.previousYearLabel || 'Annee N-1'}
              isRight
            >
              <SettingsFieldRow
                label="Taux normal IS"
                path={['corporateTax', 'previous', 'normalRate']}
                value={corporateTax.previous.normalRate}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Taux reduit IS"
                path={['corporateTax', 'previous', 'reducedRate']}
                value={corporateTax.previous.reducedRate}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Seuil de benefice au taux reduit"
                path={['corporateTax', 'previous', 'reducedThreshold']}
                value={corporateTax.previous.reducedThreshold}
                onChange={updateField}
                unit="EUR"
                disabled={!isAdmin}
              />
            </SettingsYearColumn>
          </div>
        </div>
      )}
    </div>
  );
}
