import React from 'react';
import SettingsTable from '@/components/settings/SettingsTable';

export default function ImpotsAbattementDomSection({
  incomeTax,
  updateField,
  isAdmin,
  openSection,
  setOpenSection,
}) {
  const domZones = [
    { _key: 'gmr', zone: 'Guadeloupe / Martinique / Réunion', zoneKey: 'gmr' },
    { _key: 'guyane', zone: 'Guyane / Mayotte', zoneKey: 'guyane' },
  ];
  
  const domCols = [
    { key: 'zone', header: 'Zone', type: 'display' },
    { key: 'ratePercent', header: 'Taux %', className: 'taux-col' },
    { key: 'cap', header: 'Plafond €' },
  ];

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        id="impots-header-dom"
        aria-expanded={openSection === 'dom'}
        aria-controls="impots-panel-dom"
        onClick={() => setOpenSection(openSection === 'dom' ? null : 'dom')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Abattement DOM sur l’IR (barème)
        </span>
        <span className="fisc-acc-chevron">
          {openSection === 'dom' ? '▾' : '▸'}
        </span>
      </button>

      {openSection === 'dom' && (
        <div
          className="fisc-acc-body"
          id="impots-panel-dom"
          role="region"
          aria-labelledby="impots-header-dom"
        >
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 8 }}>
            Appliqué sur l’impôt issu du barème <strong>après plafonnement du quotient familial</strong> et
            <strong> avant</strong> décote + réductions/crédits.
          </p>

          <div className="income-tax-columns">
            {['current', 'previous'].map((period) => (
              <div className="income-tax-col" key={period}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>
                  {period === 'current'
                    ? (incomeTax.currentYearLabel || 'Année N')
                    : (incomeTax.previousYearLabel || 'Année N-1')}
                </div>
                <SettingsTable
                  columns={domCols}
                  rows={domZones.map((z) => ({
                    _key: z._key,
                    zone: z.zone,
                    ratePercent: incomeTax?.domAbatement?.[period]?.[z.zoneKey]?.ratePercent,
                    cap: incomeTax?.domAbatement?.[period]?.[z.zoneKey]?.cap,
                  }))}
                  onCellChange={(idx, key, value) =>
                    updateField(
                      ['incomeTax', 'domAbatement', period, domZones[idx].zoneKey, key],
                      value === null ? '' : value
                    )
                  }
                  disabled={!isAdmin}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
