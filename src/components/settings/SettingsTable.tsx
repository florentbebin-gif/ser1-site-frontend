import React from 'react';
import { numberOrEmpty } from '../../utils/settingsHelpers';

type CellValue = string | number | null;

interface SettingsTableRow {
  _key?: React.Key;
  [key: string]: unknown;
}

interface SettingsTableColumn {
  key: string;
  header: string;
  type?: React.HTMLInputTypeAttribute | 'display';
  step?: string;
  className?: string;
  render?: (value: unknown, row: SettingsTableRow, index: number) => React.ReactNode;
}

interface SettingsTableProps {
  columns: SettingsTableColumn[];
  rows: SettingsTableRow[];
  onCellChange: (rowIndex: number, key: string, value: CellValue) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export default function SettingsTable({
  columns,
  rows,
  onCellChange,
  disabled = false,
  style,
}: SettingsTableProps): React.ReactElement {
  return (
    <table className="settings-table" style={style}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} className={col.className}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIdx) => (
          <tr key={row._key ?? rowIdx}>
            {columns.map((col) => {
              const value = row[col.key];

              if (col.render) {
                return (
                  <td key={col.key} className={col.className}>
                    {col.render(value, row, rowIdx)}
                  </td>
                );
              }

              if (col.type === 'display') {
                return (
                  <td key={col.key} className={col.className} style={{ textAlign: 'left' }}>
                    {value as React.ReactNode}
                  </td>
                );
              }

              const inputValue =
                col.type === 'text'
                  ? String(value ?? '')
                  : numberOrEmpty(typeof value === 'number' ? value : value == null ? null : Number(value));

              return (
                <td key={col.key} className={col.className}>
                  <input
                    type={col.type || 'number'}
                    step={col.step}
                    value={inputValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const raw = e.target.value;
                      const parsed: CellValue =
                        raw === ''
                          ? null
                          : col.type === 'text'
                            ? raw
                            : Number(raw);
                      onCellChange(rowIdx, col.key, parsed);
                    }}
                    disabled={disabled}
                  />
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
