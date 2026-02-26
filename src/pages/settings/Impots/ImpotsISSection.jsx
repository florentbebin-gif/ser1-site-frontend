import React from 'react';
import SettingsYearColumn from '@/components/settings/SettingsYearColumn';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';

export default function ImpotsISSection({
  corporateTax,
  incomeTax,
  updateField,
  isAdmin,
  openSection,
  setOpenSection,
}) {
  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        id="impots-header-is"
        aria-expanded={openSection === 'is'}
        aria-controls="impots-panel-is"
        onClick={() => setOpenSection(openSection === 'is' ? null : 'is')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Impôt sur les sociétés
        </span>
        <span className="fisc-acc-chevron">
          {openSection === 'is' ? '▾' : '▸'}
        </span>
      </button>

      {openSection === 'is' && (
        <div
          className="fisc-acc-body"
          id="impots-panel-is"
          role="region"
          aria-labelledby="impots-header-is"
        >
          <div className="tax-two-cols">
            <SettingsYearColumn yearLabel={incomeTax.currentYearLabel}>
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
                label="Taux réduit IS"
                path={['corporateTax', 'current', 'reducedRate']}
                value={corporateTax.current.reducedRate}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Seuil de bénéfice au taux réduit"
                path={['corporateTax', 'current', 'reducedThreshold']}
                value={corporateTax.current.reducedThreshold}
                onChange={updateField}
                unit="€"
                disabled={!isAdmin}
              />
            </SettingsYearColumn>

            <SettingsYearColumn yearLabel={incomeTax.previousYearLabel} isRight>
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
                label="Taux réduit IS"
                path={['corporateTax', 'previous', 'reducedRate']}
                value={corporateTax.previous.reducedRate}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Seuil de bénéfice au taux réduit"
                path={['corporateTax', 'previous', 'reducedThreshold']}
                value={corporateTax.previous.reducedThreshold}
                onChange={updateField}
                unit="€"
                disabled={!isAdmin}
              />
            </SettingsYearColumn>
          </div>
        </div>
      )}
    </div>
  );
}
