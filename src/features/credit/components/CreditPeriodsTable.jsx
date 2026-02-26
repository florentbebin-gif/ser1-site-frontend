/**
 * CreditPeriodsTable.jsx - Tableau répartition par période (prêts multiples)
 * 
 * Affiché uniquement si pret2 ou pret3 existent.
 * Montre la répartition des mensualités par période de changement.
 */

import React from 'react';
import { euro0 } from '../utils/creditFormatters.js';
import './CreditV2.css';

export function CreditPeriodsTable({
  synthesePeriodes,
  hasPret3,
}) {
  if (!synthesePeriodes || synthesePeriodes.length === 0) return null;

  return (
    <div className="cv2-periods" data-testid="credit-periods">
      <h3 className="cv2-periods__title">Répartition par période</h3>
      <div className="cv2-periods__scroll">
        <table className="cv2-table">
          <thead>
            <tr>
              <th className="cv2-table__th">Période</th>
              <th className="cv2-table__th cv2-table__th--right">Prêt 1</th>
              <th className="cv2-table__th cv2-table__th--right">Prêt 2</th>
              {hasPret3 && <th className="cv2-table__th cv2-table__th--right">Prêt 3</th>}
            </tr>
          </thead>
          <tbody>
            {synthesePeriodes.map((ln, i) => (
              <tr key={i} className="cv2-table__row">
                <td className="cv2-table__td">{ln.from}</td>
                <td className="cv2-table__td cv2-table__td--right">
                  {ln.p1 > 0 ? euro0(ln.p1) : '—'}
                </td>
                <td className="cv2-table__td cv2-table__td--right">
                  {ln.p2 > 0 ? euro0(ln.p2) : '—'}
                </td>
                {hasPret3 && (
                  <td className="cv2-table__td cv2-table__td--right">
                    {ln.p3 > 0 ? euro0(ln.p3) : '—'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
