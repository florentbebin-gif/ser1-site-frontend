import type { ReactElement, ReactNode } from 'react';

export interface ReadonlyColumn<T> {
  key: keyof T;
  header: string;
  className?: string;
  render?: (value: T[keyof T], row: T, index: number) => ReactNode;
}

const amountFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 2,
});

export function formatDmtgAmount(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${amountFormatter.format(value)} €`
    : 'Non renseigné';
}

export function formatDmtgPercent(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${percentFormatter.format(value)} %`
    : 'Non renseigné';
}

export function formatDmtgYears(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${amountFormatter.format(value)} ans`
    : 'Non renseigné';
}

export function ReadonlyDmtgTable<T extends { _key?: string | number }>({
  columns,
  rows,
}: {
  columns: ReadonlyColumn<T>[];
  rows: T[];
}): ReactElement {
  return (
    <table className="settings-table dmtg-table--mt8">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={String(column.key)} className={column.className}>
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={row._key ?? rowIndex}>
            {columns.map((column) => {
              const value = row[column.key];
              return (
                <td key={String(column.key)} className={column.className}>
                  {column.render ? column.render(value, row, rowIndex) : (value as ReactNode)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
