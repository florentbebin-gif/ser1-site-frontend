import type { ReactElement, ReactNode } from 'react';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';
import type { ImpotsIncomeScaleKey, ImpotsIncomeTaxSettings } from '../../Impots/impotsSaveAdapter';

export type PeriodKey = 'current' | 'previous';
export type RetireesKey = 'retireesCurrent' | 'retireesPrevious';
export type YearLabelKey = 'currentYearLabel' | 'previousYearLabel';
export type CellValue = string | number | null;

interface ReadonlyColumn {
  key: string;
  header: string;
  className?: string;
  format?: (value: unknown) => ReactNode;
}

interface ReadonlyTableProps {
  columns: ReadonlyColumn[];
  rows: Array<Record<string, unknown>>;
}

export const incomeScaleColumns = [
  { key: 'from', header: 'De' },
  { key: 'to', header: 'À' },
  { key: 'rate', header: 'Taux %', step: '0.01', className: 'taux-col' },
];

export const readonlyIncomeScaleColumns: ReadonlyColumn[] = [
  { key: 'from', header: 'De', format: formatAmount },
  { key: 'to', header: 'À', format: formatUpperAmount },
  { key: 'rate', header: 'Taux', className: 'taux-col', format: formatPercent },
];

export const quotientFields = [
  { key: 'plafondPartSup', label: 'Par 1/2 part supplémentaire' },
  {
    key: 'plafondParentIsoléDeuxPremièresParts',
    label: 'Parent isolé (2 premières parts)',
  },
] as const;

export const decoteFields = [
  { key: 'triggerSingle', label: 'Déclenchement célibataire', unit: 'EUR', step: undefined },
  { key: 'triggerCouple', label: 'Déclenchement couple', unit: 'EUR', step: undefined },
  { key: 'amountSingle', label: 'Montant célibataire', unit: 'EUR', step: undefined },
  { key: 'amountCouple', label: 'Montant couple', unit: 'EUR', step: undefined },
  { key: 'ratePercent', label: 'Taux de la décote', unit: '%', step: '0.01' },
] as const;

export const abatFields = [
  { key: 'plafond', label: 'Plafond' },
  { key: 'plancher', label: 'Plancher' },
] as const;

export const domZones = [
  { _key: 'gmr', zone: 'Guadeloupe / Martinique / Réunion', zoneKey: 'gmr' },
  { _key: 'guyane', zone: 'Guyane / Mayotte', zoneKey: 'guyane' },
] as const;

export const domCols = [
  { key: 'zone', header: 'Zone', type: 'display' as const },
  { key: 'ratePercent', header: 'Taux %', className: 'taux-col' },
  { key: 'cap', header: 'Plafond EUR' },
];

export const readonlyDomCols: ReadonlyColumn[] = [
  { key: 'zone', header: 'Zone' },
  { key: 'ratePercent', header: 'Taux', className: 'taux-col', format: formatPercent },
  { key: 'cap', header: 'Plafond', format: formatAmount },
];

export const ifiScaleColumns = [
  { key: 'from', header: 'De' },
  { key: 'to', header: 'À' },
  { key: 'rate', header: 'Taux %', step: '0.01', className: 'taux-col' },
];

export function formatAmount(value: unknown): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Non renseigné';
  return `${value.toLocaleString('fr-FR')} €`;
}

export function formatUpperAmount(value: unknown): string {
  if (value == null) return 'Plus';
  return formatAmount(value);
}

export function formatPercent(value: unknown): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Non renseigné';
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`;
}

function formatText(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') return 'Non renseigné';
  return value;
}

export function ReadonlyTable({ columns, rows }: ReadonlyTableProps): ReactElement {
  return (
    <table className="settings-table settings-memento-readonly-table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key} className={column.className}>
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={String(row._key ?? rowIndex)}>
            {columns.map((column) => (
              <td key={column.key} className={column.className}>
                {column.format ? column.format(row[column.key]) : String(row[column.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ReadonlyFieldRow({
  label,
  value,
  unit,
}: {
  label: string;
  value: unknown;
  unit?: string;
}): ReactElement {
  const formatted =
    unit === '%'
      ? formatPercent(value)
      : unit === 'EUR' || unit === '€'
        ? formatAmount(value)
        : formatText(value);

  return (
    <div className="settings-impots-readonly-row">
      <span>{label}</span>
      <strong>{formatted}</strong>
    </div>
  );
}

export function EditableOrReadonlyField({
  isAdmin,
  label,
  path,
  value,
  onChange,
  unit,
  step,
  type,
}: {
  isAdmin: boolean;
  label: string;
  path: string[];
  value: string | number | null | undefined;
  onChange: (path: string[], value: string | number | null) => void;
  unit?: string;
  step?: string;
  type?: 'number' | 'text';
}): ReactElement {
  if (!isAdmin) {
    return <ReadonlyFieldRow label={label} value={value} unit={unit} />;
  }

  return (
    <SettingsFieldRow
      label={label}
      path={path}
      value={value}
      onChange={onChange}
      unit={unit}
      step={step}
      type={type}
    />
  );
}

export function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): ReactElement {
  return (
    <div className="income-tax-block">
      <div className="income-tax-block-title">{title}</div>
      <div className="income-tax-block-body">{children}</div>
    </div>
  );
}

export function periodLabel(incomeTax: ImpotsIncomeTaxSettings, period: PeriodKey): string {
  if (period === 'current') return incomeTax.currentYearLabel || 'Année N';
  return incomeTax.previousYearLabel || 'Année N-1';
}

export function yearLabelKey(period: PeriodKey): YearLabelKey {
  return period === 'current' ? 'currentYearLabel' : 'previousYearLabel';
}

export function scaleKey(period: PeriodKey): ImpotsIncomeScaleKey {
  return period === 'current' ? 'scaleCurrent' : 'scalePrevious';
}

export function retireesKey(period: PeriodKey): RetireesKey {
  return period === 'current' ? 'retireesCurrent' : 'retireesPrevious';
}

export function pfuTotal(rateIR: number | null, psRate: number | null): number {
  return Math.round(((Number(rateIR) || 0) + (Number(psRate) || 0)) * 10) / 10;
}
