import React from 'react';
import SettingsYearColumn from '@/components/settings/SettingsYearColumn';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';

export default function ImpotsPfuSection({
  pfu,
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
        id="impots-header-pfu"
        aria-expanded={openSection === 'pfu'}
        aria-controls="impots-panel-pfu"
        onClick={() => setOpenSection(openSection === 'pfu' ? null : 'pfu')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          PFU (flat tax)
        </span>
        <span className="fisc-acc-chevron">
          {openSection === 'pfu' ? '▾' : '▸'}
        </span>
      </button>

      {openSection === 'pfu' && (
        <div
          className="fisc-acc-body"
          id="impots-panel-pfu"
          role="region"
          aria-labelledby="impots-header-pfu"
        >
          <div className="tax-two-cols">
            <SettingsYearColumn yearLabel={incomeTax.currentYearLabel}>
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
                label="Prélèvements sociaux"
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

            <SettingsYearColumn yearLabel={incomeTax.previousYearLabel} isRight>
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
                label="Prélèvements sociaux"
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
