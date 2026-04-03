/**
 * CreditPeriodsTable.tsx - Tableau répartition par période (prêts multiples)
 */

import { euro0 } from '../utils/creditFormatters';
import type { CreditPeriodsTableProps } from '../types';

export function CreditPeriodsTable({
  synthesePeriodes,
  hasPret3,
}: CreditPeriodsTableProps) {
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
            {synthesePeriodes.map((line, index) => (
              <tr key={index} className="cv2-table__row">
                <td className="cv2-table__td">{line.from}</td>
                <td className="cv2-table__td cv2-table__td--right">
                  {line.p1 > 0 ? euro0(line.p1) : '—'}
                </td>
                <td className="cv2-table__td cv2-table__td--right">
                  {line.p2 > 0 ? euro0(line.p2) : '—'}
                </td>
                {hasPret3 && (
                  <td className="cv2-table__td cv2-table__td--right">
                    {line.p3 > 0 ? euro0(line.p3) : '—'}
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
