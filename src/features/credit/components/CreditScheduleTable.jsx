/**
 * CreditScheduleTable.jsx - Tableau échéancier (mensuel ou annuel)
 * 
 * Affiche l'échéancier global avec colonnes premium :
 * - Sans bordures verticales
 * - Header C7, texte C9
 * - Zebra-striping subtil
 * - font-variant-numeric: tabular-nums pour alignement
 */

import React, { useState, useMemo } from 'react';
import { euro0 } from '../utils/creditFormatters.js';
import { addMonths, labelMonthFR } from '../utils/creditFormatters.js';
import './CreditV2.css';

/**
 * Agrège les lignes mensuelles en lignes annuelles.
 * Somme interet, assurance, amort, mensu, mensuTotal. CRD = dernière valeur de l'année.
 */
function aggregateAnnual(monthlyRows, startYM) {
  if (!monthlyRows || monthlyRows.length === 0) return [];

  const buckets = new Map();

  monthlyRows.forEach((row, i) => {
    if (!row) return;
    const ym = addMonths(startYM, i);
    const year = ym.split('-')[0];

    if (!buckets.has(year)) {
      buckets.set(year, { year, interet: 0, assurance: 0, amort: 0, mensu: 0, mensuTotal: 0, crd: 0, assuranceDeces: 0 });
    }
    const b = buckets.get(year);
    b.interet += row.interet ?? 0;
    b.assurance += row.assurance ?? 0;
    b.amort += row.amort ?? 0;
    b.mensu += row.mensu ?? 0;
    b.mensuTotal += row.mensuTotal ?? 0;
    b.crd = row.crd ?? 0; // last month CRD
    b.assuranceDeces = Math.max(b.assuranceDeces, row.assuranceDeces ?? 0);
  });

  return Array.from(buckets.values());
}

export function CreditScheduleTable({
  rows,
  startYM,
  isAnnual,
  title,
  defaultCollapsed = false,
  hideInsurance = false,
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const displayRows = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    if (isAnnual) return aggregateAnnual(rows, startYM);
    return rows.map((row, i) => row ? { ...row, period: labelMonthFR(addMonths(startYM, i)) } : null).filter(Boolean);
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
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
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
              {displayRows.map((row, i) => (
                <tr key={i} className="cv2-table__row">
                  <td className="cv2-table__td">{isAnnual ? row.year : row.period}</td>
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
