import React from 'react';
import SettingsYearColumn from '@/components/settings/SettingsYearColumn';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';

interface LabelsProps {
  currentYearLabel: string;
  previousYearLabel: string;
}

interface PatrimonyYearSettings {
  generalRate: number | null;
  exceptionRate: number | null;
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
  const currentGeneralRateLabel =
    patrimony.current.generalRate != null ? ` (${String(patrimony.current.generalRate).replace('.', ',')} %)` : '';
  const currentExceptionRateLabel =
    patrimony.current.exceptionRate != null ? ` (${String(patrimony.current.exceptionRate).replace('.', ',')} %)` : '';

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
          Prélèvements sociaux - patrimoine et capital
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
            Cas général pour les revenus du capital au taux en vigueur ; taux d'exception pour les
            revenus fonciers, plus-values immobilières, assurance-vie, PEP et épargne logement selon les cas.
          </p>

          <div className="tax-two-cols">
            <SettingsYearColumn yearLabel={labels.currentYearLabel}>
              <SettingsFieldRow
                label={`Taux global des prélèvements sociaux - cas général${currentGeneralRateLabel}`}
                path={['patrimony', 'current', 'generalRate']}
                value={patrimony.current.generalRate}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label={`Taux global des prélèvements sociaux - régime d'exception${currentExceptionRateLabel}`}
                path={['patrimony', 'current', 'exceptionRate']}
                value={patrimony.current.exceptionRate}
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
                label="Taux global des prélèvements sociaux - cas général"
                path={['patrimony', 'previous', 'generalRate']}
                value={patrimony.previous.generalRate}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Taux global des prélèvements sociaux - régime d'exception"
                path={['patrimony', 'previous', 'exceptionRate']}
                value={patrimony.previous.exceptionRate}
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
