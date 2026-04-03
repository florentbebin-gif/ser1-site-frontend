/**
 * CreditScheduleTable.tsx - Tableau échéancier (mensuel ou annuel)
 */

import { useMemo, useState } from 'react';
import { euro0, addMonths, labelMonthFR } from '../utils/creditFormatters';
import type {
  CreditScheduleRow,
  CreditScheduleTableProps,
} from '../types';

interface AnnualScheduleRow {
  year: string;
  interet: number;
  assurance: number;
  amort: number;
  mensu: number;
  mensuTotal: number;
  crd: number;
  assuranceDeces: number;
}

interface MonthlyScheduleRow extends CreditScheduleRow {
  period: string;
}

function aggregateAnnual(
  monthlyRows: Array<CreditScheduleRow | null>,
  startYM: string,
): AnnualScheduleRow[] {
  if (!monthlyRows || monthlyRows.length === 0) return [];

  const buckets = new Map<string, AnnualScheduleRow>();

  monthlyRows.forEach((row, index) => {
    if (!row) return;
    const ym = addMonths(startYM, index);
    const year = ym.split('-')[0];

    if (!buckets.has(year)) {
      buckets.set(year, {
        year,
        interet: 0,
        assurance: 0,
        amort: 0,
        mensu: 0,
        mensuTotal: 0,
        crd: 0,
        assuranceDeces: 0,
      });
    }
    const bucket = buckets.get(year)!;
    bucket.interet += row.interet ?? 0;
    bucket.assurance += row.assurance ?? 0;
    bucket.amort += row.amort ?? 0;
    bucket.mensu += row.mensu ?? 0;
    bucket.mensuTotal += row.mensuTotal ?? 0;
    bucket.crd = row.crd ?? 0;
    bucket.assuranceDeces = Math.max(bucket.assuranceDeces, row.assuranceDeces ?? 0);
  });

  return Array.from(buckets.values());
}

function isMonthlyScheduleRow(row: AnnualScheduleRow | MonthlyScheduleRow): row is MonthlyScheduleRow {
  return 'period' in row;
}

export function CreditScheduleTable({
  rows,
  startYM,
  isAnnual,
  title,
  defaultCollapsed = false,
  hideInsurance = false,
}: CreditScheduleTableProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const displayRows = useMemo<Array<AnnualScheduleRow | MonthlyScheduleRow>>(() => {
    if (!rows || rows.length === 0) return [];
    if (isAnnual) return aggregateAnnual(rows, startYM);
    return rows
      .map((row, index) => (row ? { ...row, period: labelMonthFR(addMonths(startYM, index)) } : null))
      .filter((row): row is MonthlyScheduleRow => row !== null);
  }, [rows, startYM, isAnnual]);

  if (displayRows.length === 0) return null;

  return (
    <div className="cv2-schedule" data-testid="credit-schedule">
      <div className="cv2-schedule__header">
        <h3 className="cv2-schedule__title">
          {title || `Échéancier ${isAnnual ? 'annuel' : 'mensuel'}`}
        </h3>
        <button
          type="button"
          className="cv2-schedule__toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
        >
          {collapsed ? 'Afficher' : 'Masquer'}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`cv2-schedule__chevron ${collapsed ? '' : 'is-open'}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {!collapsed && (
        <div className="cv2-schedule__scroll">
          <table className="cv2-table">
            <thead>
              <tr>
                <th className="cv2-table__th">Période</th>
                <th className="cv2-table__th cv2-table__th--right">Intérêts</th>
                {!hideInsurance && (
                  <th className="cv2-table__th cv2-table__th--right">Assurance</th>
                )}
                <th className="cv2-table__th cv2-table__th--right">Amort.</th>
                <th className="cv2-table__th cv2-table__th--right">
                  {isAnnual ? 'Annuité' : 'Mensualité'}
                </th>
                <th className="cv2-table__th cv2-table__th--right">CRD</th>
                {!hideInsurance && (
                  <th className="cv2-table__th cv2-table__th--right">Capital décès</th>
                )}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, index) => (
                <tr key={index} className="cv2-table__row">
                  <td className="cv2-table__td">{isMonthlyScheduleRow(row) ? row.period : row.year}</td>
                  <td className="cv2-table__td cv2-table__td--right">{euro0(row.interet ?? 0)}</td>
                  {!hideInsurance && (
                    <td className="cv2-table__td cv2-table__td--right">{euro0(row.assurance ?? 0)}</td>
                  )}
                  <td className="cv2-table__td cv2-table__td--right">{euro0(row.amort ?? 0)}</td>
                  <td className="cv2-table__td cv2-table__td--right cv2-table__td--bold">
                    {euro0(row.mensuTotal ?? 0)}
                  </td>
                  <td className="cv2-table__td cv2-table__td--right">{euro0(row.crd ?? 0)}</td>
                  {!hideInsurance && (
                    <td className="cv2-table__td cv2-table__td--right">
                      {row.assuranceDeces ? euro0(row.assuranceDeces) : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
