import React from 'react';
import SettingsYearColumn from '@/components/settings/SettingsYearColumn';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';
import { numberOrEmpty } from '@/components/settings/settingsHelpers';

type PeriodKey = 'current' | 'previous';

interface IncomeTaxLabels {
  currentYearLabel?: string;
  previousYearLabel?: string;
}

interface CehrBracket {
  from: number | null;
  to: number | null;
  rate: number | null;
}

interface CehrPeriodSettings {
  single: CehrBracket[];
  couple: CehrBracket[];
}

interface CehrSettings {
  current: CehrPeriodSettings;
  previous: CehrPeriodSettings;
}

interface CdhrPeriodSettings {
  minEffectiveRate: number | null;
  thresholdSingle: number | null;
  thresholdCouple: number | null;
}

interface CdhrSettings {
  current: CdhrPeriodSettings;
  previous: CdhrPeriodSettings;
}

interface ImpotsCehrSectionProps {
  cehr: CehrSettings;
  cdhr: CdhrSettings;
  incomeTax: IncomeTaxLabels;
  updateField: (path: string[], value: string | number | null) => void;
  isAdmin: boolean;
  openSection: string | null;
  setOpenSection: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function ImpotsCehrSection({
  cehr,
  cdhr,
  incomeTax,
  updateField,
  isAdmin,
  openSection,
  setOpenSection,
}: ImpotsCehrSectionProps): React.ReactElement {
  const isOpen = openSection === 'cehr';
  const periods: PeriodKey[] = ['current', 'previous'];

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        id="impots-header-cehr"
        aria-expanded={isOpen}
        aria-controls="impots-panel-cehr"
        onClick={() => setOpenSection(isOpen ? null : 'cehr')}
      >
        <span className="settings-premium-title settings-premium-title--flush">
          CEHR / CDHR
        </span>
        <span className="fisc-acc-chevron">
          {isOpen ? 'v' : '>'}
        </span>
      </button>

      {isOpen && (
        <div
          className="fisc-acc-body"
          id="impots-panel-cehr"
          role="region"
          aria-labelledby="impots-header-cehr"
        >
          <p style={{ fontSize: 13, color: 'var(--color-c9)' }}>
            Contribution exceptionnelle sur les hauts revenus (CEHR) et
            contribution differentielle (CDHR).
          </p>

          <div className="tax-two-cols">
            {periods.map((period) => {
              const yearLabel =
                period === 'current'
                  ? incomeTax.currentYearLabel || 'Annee N'
                  : incomeTax.previousYearLabel || 'Annee N-1';
              const cehrData = cehr[period];
              const cdhrData = cdhr[period];

              return (
                <SettingsYearColumn
                  key={period}
                  yearLabel={yearLabel}
                  isRight={period === 'previous'}
                >
                  <strong>CEHR - personne seule</strong>
                  {cehrData.single.map((row, idx) => (
                    <SettingsFieldRow
                      key={`cehr-single-${period}-${idx}`}
                      label={`De ${numberOrEmpty(row.from)} EUR a ${
                        row.to == null ? 'plus' : `${row.to} EUR`
                      }`}
                      path={['cehr', period, 'single', String(idx), 'rate']}
                      value={row.rate}
                      onChange={updateField}
                      step="0.1"
                      unit="%"
                      disabled={!isAdmin}
                    />
                  ))}

                  <strong>CEHR - couple</strong>
                  {cehrData.couple.map((row, idx) => (
                    <SettingsFieldRow
                      key={`cehr-couple-${period}-${idx}`}
                      label={`De ${numberOrEmpty(row.from)} EUR a ${
                        row.to == null ? 'plus' : `${row.to} EUR`
                      }`}
                      path={['cehr', period, 'couple', String(idx), 'rate']}
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
                    unit="EUR"
                    disabled={!isAdmin}
                  />
                  <SettingsFieldRow
                    label="Seuil RFR couple"
                    path={['cdhr', period, 'thresholdCouple']}
                    value={cdhrData.thresholdCouple}
                    onChange={updateField}
                    unit="EUR"
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
