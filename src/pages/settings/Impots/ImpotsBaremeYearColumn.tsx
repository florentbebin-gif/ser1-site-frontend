import type { ChangeEvent, ReactElement } from 'react';
import SettingsTable from '@/components/settings/SettingsTable';
import { numberOrEmpty } from '@/components/settings/settingsHelpers';

export type ScaleFieldKey = 'from' | 'to' | 'rate';
export type IncomeScaleKey = 'scaleCurrent' | 'scalePrevious';
export type YearLabelKey = 'currentYearLabel' | 'previousYearLabel';
export type PeriodKey = 'current' | 'previous';
export type RetireesKey = 'retireesCurrent' | 'retireesPrevious';

export interface ScaleRow {
  from: number | null;
  to: number | null;
  rate: number | null;
  deduction?: number | null;
  [key: string]: number | null | undefined;
}

interface QuotientFamilySettings {
  plafondPartSup: number | null;
  'plafondParentIsol\u00e9DeuxPremi\u00e8resParts': number | null;
}

interface DecoteSettings {
  triggerSingle: number | null;
  triggerCouple: number | null;
  amountSingle: number | null;
  amountCouple: number | null;
  ratePercent: number | null;
}

interface AbatSettings {
  plafond: number | null;
  plancher: number | null;
}

export interface IncomeTaxSettings {
  currentYearLabel?: string;
  previousYearLabel?: string;
  scaleCurrent: ScaleRow[];
  scalePrevious: ScaleRow[];
  quotientFamily: {
    current: QuotientFamilySettings;
    previous: QuotientFamilySettings;
  };
  decote: {
    current: DecoteSettings;
    previous: DecoteSettings;
  };
  abat10: {
    current: AbatSettings;
    previous: AbatSettings;
    retireesCurrent: AbatSettings;
    retireesPrevious: AbatSettings;
  };
}

interface UpdateField {
  (path: string[], value: string | number | null): void;
}

interface UpdateIncomeScale {
  (
    which: IncomeScaleKey,
    index: number,
    key: ScaleFieldKey,
    value: string | number | null,
  ): void;
}

interface BaremeNumberFieldProps {
  label: string;
  value: number | null;
  path: string[];
  updateField: UpdateField;
  disabled: boolean;
  unit?: string;
  step?: string;
}

interface ImpotsBaremeYearColumnProps {
  yearLabel: string | undefined;
  yearLabelKey: YearLabelKey;
  scaleKey: IncomeScaleKey;
  periodKey: PeriodKey;
  retireesKey: RetireesKey;
  placeholder: string;
  incomeTax: IncomeTaxSettings;
  updateField: UpdateField;
  updateIncomeScale: UpdateIncomeScale;
  isAdmin: boolean;
  className?: string;
}

const parentIsoleKey = 'plafondParentIsol\u00e9DeuxPremi\u00e8resParts' as const;

const incomeScaleColumns = [
  { key: 'from', header: 'De' },
  { key: 'to', header: '\u00c0' },
  { key: 'rate', header: 'Taux\u00a0%', step: '0.01', className: 'taux-col' },
];

const quotientFields: Array<{
  key: keyof QuotientFamilySettings;
  label: string;
}> = [
  { key: 'plafondPartSup', label: 'Par 1/2 part suppl\u00e9mentaire' },
  { key: parentIsoleKey, label: 'Parent isol\u00e9 (2 premi\u00e8res parts)' },
];

const decoteFields: Array<{
  key: keyof DecoteSettings;
  label: string;
  unit?: string;
  step?: string;
}> = [
  { key: 'triggerSingle', label: 'D\u00e9clenchement c\u00e9libataire' },
  { key: 'triggerCouple', label: 'D\u00e9clenchement couple' },
  { key: 'amountSingle', label: 'Montant c\u00e9libataire' },
  { key: 'amountCouple', label: 'Montant couple' },
  { key: 'ratePercent', label: 'Taux de la d\u00e9cote', unit: '%', step: '0.01' },
];

const abatFields: Array<{
  key: keyof AbatSettings;
  label: string;
}> = [
  { key: 'plafond', label: 'Plafond' },
  { key: 'plancher', label: 'Plancher' },
];

function parseNullableNumber(event: ChangeEvent<HTMLInputElement>): number | null {
  return event.target.value === '' ? null : Number(event.target.value);
}

function BaremeNumberField({
  label,
  value,
  path,
  updateField,
  disabled,
  unit = '\u20ac',
  step,
}: BaremeNumberFieldProps): ReactElement {
  return (
    <div className="settings-field-row">
      <label>{label}</label>
      <input
        type="number"
        step={step}
        value={numberOrEmpty(value)}
        onChange={(event) => updateField(path, parseNullableNumber(event))}
        disabled={disabled}
      />
      <span>{unit}</span>
    </div>
  );
}

export function ImpotsBaremeYearColumn({
  yearLabel,
  yearLabelKey,
  scaleKey,
  periodKey,
  retireesKey,
  placeholder,
  incomeTax,
  updateField,
  updateIncomeScale,
  isAdmin,
  className,
}: ImpotsBaremeYearColumnProps): ReactElement {
  const quotientFamily = incomeTax.quotientFamily[periodKey];
  const decote = incomeTax.decote[periodKey];
  const abat10 = incomeTax.abat10[periodKey];
  const retirees = incomeTax.abat10[retireesKey];
  const columnClassName = ['income-tax-col', className].filter(Boolean).join(' ');

  return (
    <div className={columnClassName}>
      <div className="settings-field-row" style={{ marginBottom: 10 }}>
        <label style={{ fontWeight: 600 }}>{'Bar\u00e8me'}</label>
        <input
          type="text"
          value={yearLabel ?? ''}
          onChange={(event) =>
            updateField(['incomeTax', yearLabelKey], event.target.value)
          }
          disabled={!isAdmin}
          style={{ width: 220, textAlign: 'left' }}
          placeholder={placeholder}
        />
      </div>

      <SettingsTable
        columns={incomeScaleColumns}
        rows={incomeTax[scaleKey]}
        onCellChange={(index, key, value) =>
          updateIncomeScale(scaleKey, index, key as ScaleFieldKey, value)
        }
        disabled={!isAdmin}
      />

      <div className="income-tax-extra">
        <div className="income-tax-block">
          <div className="income-tax-block-title">
            {'Plafond du quotient familial'}
          </div>
          {quotientFields.map(({ key, label }) => (
            <BaremeNumberField
              key={key}
              label={label}
              value={quotientFamily[key]}
              path={['incomeTax', 'quotientFamily', periodKey, key]}
              updateField={updateField}
              disabled={!isAdmin}
            />
          ))}
        </div>

        <div className="income-tax-block">
          <div className="income-tax-block-title">{'D\u00e9cote'}</div>
          {decoteFields.map(({ key, label, unit, step }) => (
            <BaremeNumberField
              key={key}
              label={label}
              value={decote[key]}
              path={['incomeTax', 'decote', periodKey, key]}
              updateField={updateField}
              disabled={!isAdmin}
              unit={unit}
              step={step}
            />
          ))}
        </div>

        <div className="income-tax-block">
          <div className="income-tax-block-title">{'Abattement 10\u00a0%'}</div>
          {abatFields.map(({ key, label }) => (
            <BaremeNumberField
              key={key}
              label={label}
              value={abat10[key]}
              path={['incomeTax', 'abat10', periodKey, key]}
              updateField={updateField}
              disabled={!isAdmin}
            />
          ))}
        </div>

        <div className="income-tax-block">
          <div className="income-tax-block-title">
            {'Abattement 10\u00a0% pensions retraite'}
          </div>
          {abatFields.map(({ key, label }) => (
            <BaremeNumberField
              key={key}
              label={label}
              value={retirees[key]}
              path={['incomeTax', 'abat10', retireesKey, key]}
              updateField={updateField}
              disabled={!isAdmin}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
