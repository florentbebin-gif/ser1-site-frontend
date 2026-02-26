import React from 'react';
import SettingsYearColumn from '@/components/settings/SettingsYearColumn';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';
import { numberOrEmpty } from '@/utils/settingsHelpers.js';

export default function ImpotsCehrSection({
  cehr,
  cdhr,
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
        id="impots-header-cehr"
        aria-expanded={openSection === 'cehr'}
        aria-controls="impots-panel-cehr"
        onClick={() => setOpenSection(openSection === 'cehr' ? null : 'cehr')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          CEHR / CDHR
        </span>
        <span className="fisc-acc-chevron">
          {openSection === 'cehr' ? '▾' : '▸'}
        </span>
      </button>

      {openSection === 'cehr' && (
        <div
          className="fisc-acc-body"
          id="impots-panel-cehr"
          role="region"
          aria-labelledby="impots-header-cehr"
        >
          <p style={{ fontSize: 13, color: 'var(--color-c9)' }}>
            Contribution exceptionnelle sur les hauts revenus (CEHR) et
            contribution différentielle (CDHR).
          </p>

          <div className="tax-two-cols">
            {['current', 'previous'].map((period) => {
              const yearLabel =
                period === 'current'
                  ? incomeTax.currentYearLabel
                  : incomeTax.previousYearLabel;
              const cehrData = cehr[period];
              const cdhrData = cdhr[period];
              const suffix = period === 'current' ? '2025' : '2024';
              return (
                <SettingsYearColumn
                  key={period}
                  yearLabel={yearLabel}
                  isRight={period === 'previous'}
                >
                  <strong>CEHR – personne seule</strong>
                  {cehrData.single.map((row, idx) => (
                    <SettingsFieldRow
                      key={`cehrS_${suffix}_${idx}`}
                      label={`De ${numberOrEmpty(row.from)} € à ${
                        row.to ? `${row.to} €` : 'plus'
                      }`}
                      path={['cehr', period, 'single', idx, 'rate']}
                      value={row.rate}
                      onChange={updateField}
                      step="0.1"
                      unit="%"
                      disabled={!isAdmin}
                    />
                  ))}

                  <strong>CEHR – couple</strong>
                  {cehrData.couple.map((row, idx) => (
                    <SettingsFieldRow
                      key={`cehrC_${suffix}_${idx}`}
                      label={`De ${numberOrEmpty(row.from)} € à ${
                        row.to ? `${row.to} €` : 'plus'
                      }`}
                      path={['cehr', period, 'couple', idx, 'rate']}
                      value={row.rate}
                      onChange={updateField}
                      step="0.1"
                      unit="%"
                      disabled={!isAdmin}
                    />
                  ))}

                  <strong>CDHR (taux minimal)</strong>
                  <SettingsFieldRow
                    label="Taux effectif minimal"
                    path={['cdhr', period, 'minEffectiveRate']}
                    value={cdhrData.minEffectiveRate}
                    onChange={updateField}
                    step="0.1"
                    unit="%"
                    disabled={!isAdmin}
                  />
                  <SettingsFieldRow
                    label="Seuil RFR personne seule"
                    path={['cdhr', period, 'thresholdSingle']}
                    value={cdhrData.thresholdSingle}
                    onChange={updateField}
                    unit="€"
                    disabled={!isAdmin}
                  />
                  <SettingsFieldRow
                    label="Seuil RFR couple"
                    path={['cdhr', period, 'thresholdCouple']}
                    value={cdhrData.thresholdCouple}
                    onChange={updateField}
                    unit="€"
                    disabled={!isAdmin}
                  />
                </SettingsYearColumn>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
