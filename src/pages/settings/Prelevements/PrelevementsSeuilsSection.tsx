import React from 'react';
import SeuilsYearPeriod from './SeuilsYearPeriod';

interface LabelsProps {
  currentYearLabel: string;
  previousYearLabel: string;
}

interface ThresholdValues {
  [key: string]: number | null | undefined;
}

interface RetirementThresholds {
  current: Record<string, ThresholdValues | undefined>;
  previous: Record<string, ThresholdValues | undefined>;
}

interface PrelevementsSeuilsSectionProps {
  labels: LabelsProps;
  retirementThresholds: RetirementThresholds;
  updateField: (path: string[], value: number | null) => void;
  isAdmin: boolean;
  openSection: string | null;
  setOpenSection: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function PrelevementsSeuilsSection({
  labels,
  retirementThresholds,
  updateField,
  isAdmin,
  openSection,
  setOpenSection,
}: PrelevementsSeuilsSectionProps): React.ReactElement {
  const isOpen = openSection === 'seuils';

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        id="prelev-header-seuils"
        aria-expanded={isOpen}
        aria-controls="prelev-panel-seuils"
        onClick={() => setOpenSection(isOpen ? null : 'seuils')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Seuils de revenus pour la CSG, la CRDS et la CASA (RFR)
        </span>
        <span className="fisc-acc-chevron">
          {isOpen ? 'v' : '>'}
        </span>
      </button>

      {isOpen && (
        <div
          className="fisc-acc-body"
          id="prelev-panel-seuils"
          role="region"
          aria-labelledby="prelev-header-seuils"
        >
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 12 }}>
            Seuils de revenu fiscal de référence (RFR) utilisés pour déterminer
            l'exonération ou l'assujettissement aux taux réduit, médian
            ou normal de CSG sur les pensions de retraite. Ces seuils s'appliquent
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
