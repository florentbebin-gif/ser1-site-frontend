import React from 'react';
import { LegalRefInlineList } from '@/components/legal/LegalRefLink';
import SettingsTitleWithIcon from '@/components/settings/SettingsTitleWithIcon';
import SettingsYearColumn from '@/components/settings/SettingsYearColumn';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';
import { INCOME_TAX_CEHR_BLOCK_REF_IDS } from '@/domain/settings-references/uiReferenceGroups';
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
        className="fisc-acc-header fisc-acc-header--with-icon"
        id="impots-header-cehr"
        aria-expanded={isOpen}
        aria-controls="impots-panel-cehr"
        onClick={() => setOpenSection(isOpen ? null : 'cehr')}
      >
        <SettingsTitleWithIcon
          icon="trending-up"
          className="settings-premium-title settings-premium-title--flush"
        >
          CEHR / CDHR
        </SettingsTitleWithIcon>
        <span className="fisc-acc-chevron">{isOpen ? 'v' : '>'}</span>
      </button>

      {isOpen && (
        <div
          className="fisc-acc-body"
          id="impots-panel-cehr"
          role="region"
          aria-labelledby="impots-header-cehr"
        >
          <p className="fisc-intro">
            Contribution exceptionnelle sur les hauts revenus (CEHR) et contribution différentielle
            (CDHR).
            <LegalRefInlineList ids={INCOME_TAX_CEHR_BLOCK_REF_IDS} />
          </p>

          <div className="tax-two-cols">
            {periods.map((period) => {
              const yearLabel =
                period === 'current'
                  ? incomeTax.currentYearLabel || 'Année N'
                  : incomeTax.previousYearLabel || 'Année N-1';
              const cehrData = cehr[period];
              const cdhrData = cdhr[period];

              return (
                <SettingsYearColumn
                  key={period}
                  yearLabel={yearLabel}
                  isRight={period === 'previous'}
                >
                  <div className="income-tax-block income-tax-block--mb12">
                    <div className="income-tax-block-title">CEHR – personne seule</div>
                    <div className="income-tax-block-body">
                      {cehrData.single.map((row, idx) => (
                        <SettingsFieldRow
                          key={`cehr-single-${period}-${idx}`}
                          label={`De ${numberOrEmpty(row.from)} EUR à ${
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
                    </div>
                  </div>

                  <div className="income-tax-block income-tax-block--mb12">
                    <div className="income-tax-block-title">CEHR – couple</div>
                    <div className="income-tax-block-body">
                      {cehrData.couple.map((row, idx) => (
                        <SettingsFieldRow
                          key={`cehr-couple-${period}-${idx}`}
                          label={`De ${numberOrEmpty(row.from)} EUR à ${
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
                    </div>
                  </div>

                  <div className="income-tax-block">
                    <div className="income-tax-block-title">CDHR (taux minimal)</div>
                    <div className="income-tax-block-body">
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
                        label="Seuil RFR – personne seule"
                        path={['cdhr', period, 'thresholdSingle']}
                        value={cdhrData.thresholdSingle}
                        onChange={updateField}
                        unit="EUR"
                        disabled={!isAdmin}
                      />
                      <SettingsFieldRow
                        label="Seuil RFR – couple"
                        path={['cdhr', period, 'thresholdCouple']}
                        value={cdhrData.thresholdCouple}
                        onChange={updateField}
                        unit="EUR"
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>
                </SettingsYearColumn>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
