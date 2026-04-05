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
    <div className="cv-periods" data-testid="credit-periods">
      <h3 className="cv-periods__title">Répartition par période</h3>
      <div className="cv-periods__scroll">
        <table className="cv-table">
          <thead>
            <tr>
              <th className="cv-table__th">Période</th>
              <th className="cv-table__th cv-table__th--right">Prêt 1</th>
              <th className="cv-table__th cv-table__th--right">Prêt 2</th>
              {hasPret3 && <th className="cv-table__th cv-table__th--right">Prêt 3</th>}
            </tr>
          </thead>
          <tbody>
            {synthesePeriodes.map((line, index) => (
              <tr key={index} className="cv-table__row">
                <td className="cv-table__td">{line.from}</td>
                <td className="cv-table__td cv-table__td--right">
                  {line.p1 > 0 ? euro0(line.p1) : '—'}
                </td>
                <td className="cv-table__td cv-table__td--right">
                  {line.p2 > 0 ? euro0(line.p2) : '—'}
                </td>
                {hasPret3 && (
                  <td className="cv-table__td cv-table__td--right">
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
