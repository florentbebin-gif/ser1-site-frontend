import React from 'react';
import SettingsTable from '@/components/settings/SettingsTable';

export default function PrelevementsRetraitesSection({
  labels,
  retirement,
  updateRetirementBracket,
  isAdmin,
  openSection,
  setOpenSection,
}) {
  const retCols = [
    { key: 'label', header: 'Tranche', type: 'display' },
    { key: 'rfrMin1Part', header: 'RFR min (1 part)' },
    { key: 'rfrMax1Part', header: 'RFR max (1 part)' },
    { key: 'csgRate', header: 'CSG\u00a0%', step: '0.1' },
    { key: 'crdsRate', header: 'CRDS\u00a0%', step: '0.1' },
    { key: 'casaRate', header: 'CASA\u00a0%', step: '0.1' },
    { key: 'maladieRate', header: 'Maladie\u00a0%', step: '0.1' },
    { key: 'totalRate', header: 'Total\u00a0%', step: '0.1' },
    { key: 'csgDeductibleRate', header: 'CSG déd.\u00a0%', step: '0.1' },
  ];

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        id="prelev-header-retraites"
        aria-expanded={openSection === 'retraites'}
        aria-controls="prelev-panel-retraites"
        onClick={() => setOpenSection(openSection === 'retraites' ? null : 'retraites')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Prélèvements sociaux — pensions de retraite
        </span>
        <span className="fisc-acc-chevron">
          {openSection === 'retraites' ? '▾' : '▸'}
        </span>
      </button>

      {openSection === 'retraites' && (
        <div
          className="fisc-acc-body"
          id="prelev-panel-retraites"
          role="region"
          aria-labelledby="prelev-header-retraites"
        >
          <p style={{ fontSize: 13, color: 'var(--color-c9)' }}>
            Barème des prélèvements sociaux sur les pensions de retraite
            (RFR pour 1 part). Les montants sont ajustés en fonction des
            parts, mais on stocke ici la base &quot;1 part&quot;.
          </p>

          <div>
            {[
              { yearKey: 'current', label: labels.currentYearLabel, prefix: 'retCur' },
              { yearKey: 'previous', label: labels.previousYearLabel, prefix: 'retPrev' },
            ].map(({ yearKey, label, prefix }, i) => (
              <div key={yearKey} style={i > 0 ? { marginTop: 24 } : undefined}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
                <SettingsTable
                  columns={retCols}
                  rows={retirement[yearKey].brackets.map((b, idx) => ({ ...b, _key: `${prefix}_${idx}` }))}
                  onCellChange={(idx, key, value) =>
                    updateRetirementBracket(yearKey, idx, key, value)
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
