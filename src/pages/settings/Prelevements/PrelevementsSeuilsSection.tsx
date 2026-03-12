// @ts-nocheck
import React from 'react';
import SeuilsYearPeriod from './SeuilsYearPeriod';

export default function PrelevementsSeuilsSection({
  labels,
  retirementThresholds,
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
        id="prelev-header-seuils"
        aria-expanded={openSection === 'seuils'}
        aria-controls="prelev-panel-seuils"
        onClick={() => setOpenSection(openSection === 'seuils' ? null : 'seuils')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Seuils de revenus pour la CSG, la CRDS et la CASA (RFR)
        </span>
        <span className="fisc-acc-chevron">
          {openSection === 'seuils' ? '▾' : '▸'}
        </span>
      </button>

      {openSection === 'seuils' && (
        <div
          className="fisc-acc-body"
          id="prelev-panel-seuils"
          role="region"
          aria-labelledby="prelev-header-seuils"
        >
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 12 }}>
            Seuils de revenu fiscal de référence (RFR) utilisés pour déterminer
            l&apos;exonération ou l&apos;assujettissement aux taux réduit, médian
            ou normal de CSG sur les pensions de retraite. Ces seuils s&apos;appliquent
            aussi pour la CRDS et la CASA. Les montants sont indiqués pour{' '}
            <strong>1 part</strong>, avec une majoration par{' '}
            <strong>quart de part supplémentaire</strong>.
          </p>

          <div className="tax-two-cols">
            <div>
              <SeuilsYearPeriod
                yearKey="current"
                yearLabel={labels.currentYearLabel}
                thresholds={retirementThresholds.current}
                updateField={updateField}
                isAdmin={isAdmin}
              />
            </div>

            <div className="income-tax-col-right">
              <SeuilsYearPeriod
                yearKey="previous"
                yearLabel={labels.previousYearLabel}
                thresholds={retirementThresholds.previous}
                updateField={updateField}
                isAdmin={isAdmin}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

