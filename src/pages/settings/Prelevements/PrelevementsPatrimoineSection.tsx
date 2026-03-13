import React from 'react';
import SettingsYearColumn from '@/components/settings/SettingsYearColumn';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';

interface LabelsProps {
  currentYearLabel: string;
  previousYearLabel: string;
}

interface PatrimonyYearSettings {
  totalRate: number | null;
  csgDeductibleRate: number | null;
}

interface PatrimonySettings {
  current: PatrimonyYearSettings;
  previous: PatrimonyYearSettings;
}

interface PrelevementsPatrimoineSectionProps {
  labels: LabelsProps;
  patrimony: PatrimonySettings;
  updateField: (path: string[], value: string | number | null) => void;
  isAdmin: boolean;
  openSection: string | null;
  setOpenSection: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function PrelevementsPatrimoineSection({
  labels,
  patrimony,
  updateField,
  isAdmin,
  openSection,
  setOpenSection,
}: PrelevementsPatrimoineSectionProps): React.ReactElement {
  const isOpen = openSection === 'patrimoine';

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        id="prelev-header-patrimoine"
        aria-expanded={isOpen}
        aria-controls="prelev-panel-patrimoine"
        onClick={() => setOpenSection(isOpen ? null : 'patrimoine')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Prelevements sociaux - patrimoine et capital
        </span>
        <span className="fisc-acc-chevron">
          {isOpen ? 'v' : '>'}
        </span>
      </button>

      {isOpen && (
        <div
          className="fisc-acc-body"
          id="prelev-panel-patrimoine"
          role="region"
          aria-labelledby="prelev-header-patrimoine"
        >
          <p style={{ fontSize: 13, color: 'var(--color-c9)' }}>
            Taux globaux applicables aux revenus du patrimoine et de
            placement (interets, dividendes, etc.).
          </p>

          <div className="tax-two-cols">
            <SettingsYearColumn yearLabel={labels.currentYearLabel}>
              <SettingsFieldRow
                label="Taux global des prelevements sociaux"
                path={['patrimony', 'current', 'totalRate']}
                value={patrimony.current.totalRate}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="CSG deductible (au bareme)"
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
                label="Taux global des prelevements sociaux"
                path={['patrimony', 'previous', 'totalRate']}
                value={patrimony.previous.totalRate}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="CSG deductible (au bareme)"
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
