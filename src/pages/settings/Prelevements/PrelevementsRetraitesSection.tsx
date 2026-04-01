import React from 'react';
import SettingsTable from '@/components/settings/SettingsTable';

type YearKey = 'current' | 'previous';
type CellValue = string | number | null;

interface LabelsProps {
  currentYearLabel: string;
  previousYearLabel: string;
}

interface RetirementBracket {
  label: string;
  rfrMin1Part: number | null;
  rfrMax1Part: number | null;
  csgRate: number | null;
  crdsRate: number | null;
  casaRate: number | null;
  maladieRate: number | null;
  totalRate: number | null;
  csgDeductibleRate: number | null;
}

interface RetirementYearSettings {
  brackets: RetirementBracket[];
}

interface RetirementSettings {
  current: RetirementYearSettings;
  previous: RetirementYearSettings;
}

interface PrelevementsRetraitesSectionProps {
  labels: LabelsProps;
  retirement: RetirementSettings;
  updateRetirementBracket: (yearKey: YearKey, index: number, key: string, value: CellValue) => void;
  isAdmin: boolean;
  openSection: string | null;
  setOpenSection: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function PrelevementsRetraitesSection({
  labels,
  retirement,
  updateRetirementBracket,
  isAdmin,
  openSection,
  setOpenSection,
}: PrelevementsRetraitesSectionProps): React.ReactElement {
  const isOpen = openSection === 'retraites';
  const retCols = [
    { key: 'label', header: 'Tranche', type: 'display' as const },
    { key: 'rfrMin1Part', header: 'RFR min (1 part)' },
    { key: 'rfrMax1Part', header: 'RFR max (1 part)' },
    { key: 'csgRate', header: 'CSG %', step: '0.1' },
    { key: 'crdsRate', header: 'CRDS %', step: '0.1' },
    { key: 'casaRate', header: 'CASA %', step: '0.1' },
    { key: 'maladieRate', header: 'Maladie %', step: '0.1' },
    { key: 'totalRate', header: 'Total %', step: '0.1' },
    { key: 'csgDeductibleRate', header: 'CSG ded. %', step: '0.1' },
  ];

  const yearPeriods: Array<{ yearKey: YearKey; label: string; prefix: string }> = [
    { yearKey: 'current', label: labels.currentYearLabel, prefix: 'retCur' },
    { yearKey: 'previous', label: labels.previousYearLabel, prefix: 'retPrev' },
  ];

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        id="prelev-header-retraites"
        aria-expanded={isOpen}
        aria-controls="prelev-panel-retraites"
        onClick={() => setOpenSection(isOpen ? null : 'retraites')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Prélèvements sociaux - pensions de retraite
        </span>
        <span className="fisc-acc-chevron">
          {isOpen ? 'v' : '>'}
        </span>
      </button>

      {isOpen && (
        <div
          className="fisc-acc-body"
          id="prelev-panel-retraites"
          role="region"
          aria-labelledby="prelev-header-retraites"
        >
          <p style={{ fontSize: 13, color: 'var(--color-c9)' }}>
            Barème des prélèvements sociaux sur les pensions de retraite
            (RFR pour 1 part). Les montants sont ajustés en fonction des
            parts, mais on stocke ici la base "1 part".
          </p>

          <div>
            {yearPeriods.map(({ yearKey, label, prefix }, index) => (
              <div key={yearKey} style={index > 0 ? { marginTop: 24 } : undefined}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
                <SettingsTable
                  columns={retCols}
                  rows={retirement[yearKey].brackets.map((bracket, bracketIndex) => ({
                    ...bracket,
                    _key: `${prefix}_${bracketIndex}`,
                  }))}
                  onCellChange={(bracketIndex, key, value) => {
                    updateRetirementBracket(yearKey, bracketIndex, key, value);
                  }}
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
