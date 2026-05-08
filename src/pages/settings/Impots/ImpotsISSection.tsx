import React from 'react';
import SettingsYearColumn from '@/components/settings/SettingsYearColumn';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';
import { validateQpfcRate } from '../validators/isValidators';

interface IncomeTaxLabels {
  currentYearLabel?: string;
  previousYearLabel?: string;
}

interface MotherDaughterQpfc {
  standard: number | null;
  group: number | null;
}

interface CorporateTaxPeriodSettings {
  normalRate: number | null;
  reducedRate: number | null;
  reducedThreshold: number | null;
  maxDeductibleCcaInterestRate?: number | null;
  dividendsAbatementPct?: number | null;
  motherDaughterQpfc?: MotherDaughterQpfc;
}

interface CorporateTaxSettings {
  current: CorporateTaxPeriodSettings;
  previous: CorporateTaxPeriodSettings;
}

interface ImpotsISSectionProps {
  corporateTax: CorporateTaxSettings;
  incomeTax: IncomeTaxLabels;
  updateField: (path: string[], value: string | number | null) => void;
  isAdmin: boolean;
  openSection: string | null;
  setOpenSection: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function ImpotsISSection({
  corporateTax,
  incomeTax,
  updateField,
  isAdmin,
  openSection,
  setOpenSection,
}: ImpotsISSectionProps): React.ReactElement {
  const isOpen = openSection === 'is';

  const qpfcCurrentError = validateQpfcRate({
    standard: corporateTax.current.motherDaughterQpfc?.standard,
    group: corporateTax.current.motherDaughterQpfc?.group,
  });
  const qpfcPreviousError = validateQpfcRate({
    standard: corporateTax.previous.motherDaughterQpfc?.standard,
    group: corporateTax.previous.motherDaughterQpfc?.group,
  });

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        id="impots-header-is"
        aria-expanded={isOpen}
        aria-controls="impots-panel-is"
        onClick={() => setOpenSection(isOpen ? null : 'is')}
      >
        <span className="settings-premium-title settings-premium-title--flush">
          Impôt sur les sociétés
        </span>
        <span className="fisc-acc-chevron">
          {isOpen ? 'v' : '>'}
        </span>
      </button>

      {isOpen && (
        <div
          className="fisc-acc-body"
          id="impots-panel-is"
          role="region"
          aria-labelledby="impots-header-is"
        >
          <div className="tax-two-cols">
            <SettingsYearColumn yearLabel={incomeTax.currentYearLabel || 'Année N'}>
              <SettingsFieldRow
                label="Taux normal IS"
                path={['corporateTax', 'current', 'normalRate']}
                value={corporateTax.current.normalRate}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Taux réduit IS"
                path={['corporateTax', 'current', 'reducedRate']}
                value={corporateTax.current.reducedRate}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Seuil de bénéfice au taux réduit"
                path={['corporateTax', 'current', 'reducedThreshold']}
                value={corporateTax.current.reducedThreshold}
                onChange={updateField}
                unit="EUR"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Quote-part frais (régime standard)"
                path={['corporateTax', 'current', 'motherDaughterQpfc', 'standard']}
                value={corporateTax.current.motherDaughterQpfc?.standard ?? null}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Quote-part frais (groupe fiscal)"
                path={['corporateTax', 'current', 'motherDaughterQpfc', 'group']}
                value={corporateTax.current.motherDaughterQpfc?.group ?? null}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Taux maximum déductible des intérêts CCA"
                path={['corporateTax', 'current', 'maxDeductibleCcaInterestRate']}
                value={corporateTax.current.maxDeductibleCcaInterestRate ?? null}
                onChange={updateField}
                step="0.01"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Abattement dividendes au barème"
                path={['corporateTax', 'current', 'dividendsAbatementPct']}
                value={corporateTax.current.dividendsAbatementPct ?? null}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              {qpfcCurrentError && (
                <p style={{ color: 'var(--color-warning-text)', fontSize: 12, margin: '2px 0 4px' }}>
                  {qpfcCurrentError}
                </p>
              )}
            </SettingsYearColumn>

            <SettingsYearColumn
              yearLabel={incomeTax.previousYearLabel || 'Année N-1'}
              isRight
            >
              <SettingsFieldRow
                label="Taux normal IS"
                path={['corporateTax', 'previous', 'normalRate']}
                value={corporateTax.previous.normalRate}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Taux réduit IS"
                path={['corporateTax', 'previous', 'reducedRate']}
                value={corporateTax.previous.reducedRate}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Seuil de bénéfice au taux réduit"
                path={['corporateTax', 'previous', 'reducedThreshold']}
                value={corporateTax.previous.reducedThreshold}
                onChange={updateField}
                unit="EUR"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Quote-part frais (régime standard)"
                path={['corporateTax', 'previous', 'motherDaughterQpfc', 'standard']}
                value={corporateTax.previous.motherDaughterQpfc?.standard ?? null}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Quote-part frais (groupe fiscal)"
                path={['corporateTax', 'previous', 'motherDaughterQpfc', 'group']}
                value={corporateTax.previous.motherDaughterQpfc?.group ?? null}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Taux maximum déductible des intérêts CCA"
                path={['corporateTax', 'previous', 'maxDeductibleCcaInterestRate']}
                value={corporateTax.previous.maxDeductibleCcaInterestRate ?? null}
                onChange={updateField}
                step="0.01"
                unit="%"
                disabled={!isAdmin}
              />
              <SettingsFieldRow
                label="Abattement dividendes au barème"
                path={['corporateTax', 'previous', 'dividendsAbatementPct']}
                value={corporateTax.previous.dividendsAbatementPct ?? null}
                onChange={updateField}
                step="0.1"
                unit="%"
                disabled={!isAdmin}
              />
              {qpfcPreviousError && (
                <p style={{ color: 'var(--color-warning-text)', fontSize: 12, margin: '2px 0 4px' }}>
                  {qpfcPreviousError}
                </p>
              )}
            </SettingsYearColumn>
          </div>
        </div>
      )}
    </div>
  );
}
