import React from 'react';
import SettingsYearColumn from '@/components/settings/SettingsYearColumn';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';

export default function PrelevementsPatrimoineSection({
  labels,
  patrimony,
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
        id="prelev-header-patrimoine"
        aria-expanded={openSection === 'patrimoine'}
        aria-controls="prelev-panel-patrimoine"
        onClick={() => setOpenSection(openSection === 'patrimoine' ? null : 'patrimoine')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Prélèvements sociaux — patrimoine et capital
        </span>
        <span className="fisc-acc-chevron">
          {openSection === 'patrimoine' ? '▾' : '▸'}
        </span>
      </button>

      {openSection === 'patrimoine' && (
        <div
          className="fisc-acc-body"
          id="prelev-panel-patrimoine"
          role="region"
          aria-labelledby="prelev-header-patrimoine"
        >
          <p style={{ fontSize: 13, color: 'var(--color-c9)' }}>
            Taux globaux applicables aux revenus du patrimoine et de
            placement (intérêts, dividendes, etc.).
          </p>

          <div className="tax-two-cols">
            <SettingsYearColumn yearLabel={labels.currentYearLabel}>
              <SettingsFieldRow
                label="Taux global des prélèvements sociaux"
                path={['patrimony', 'current', 'totalRate']}
                value={patrimony.current.totalRate}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="CSG déductible (au barème)"
                path={['patrimony', 'current', 'csgDeductibleRate']}
                value={patrimony.current.csgDeductibleRate}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
            </SettingsYearColumn>

            <SettingsYearColumn yearLabel={labels.previousYearLabel} isRight>
              <SettingsFieldRow
                label="Taux global des prélèvements sociaux"
                path={['patrimony', 'previous', 'totalRate']}
                value={patrimony.previous.totalRate}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="CSG déductible (au barème)"
                path={['patrimony', 'previous', 'csgDeductibleRate']}
                value={patrimony.previous.csgDeductibleRate}
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
