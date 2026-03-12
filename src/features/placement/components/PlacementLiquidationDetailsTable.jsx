import React from 'react';
import { euro } from '../utils/formatters';
import { CollapsibleTable } from './tables.jsx';
import { buildColumns, getRelevantColumns } from '../utils/tableHelpers';

export function PlacementLiquidationDetailsTable({
  product,
  showAllColumns,
  showCapitalDecesColumn,
}) {
  return (
    <CollapsibleTable
      title={`Détail ${product.envelopeLabel}`}
      rows={product.liquidation.rows.filter((row) => row.age <= product.liquidation.ageAuDeces)}
      columns={getRelevantColumns(product.liquidation.rows, buildColumns(product), showAllColumns)}
      renderRow={(row, index) => (
        <tr key={index} className={row.isAgeAuDeces ? 'pl-row-deces' : ''}>
          <td>{row.age} ans {row.isAgeAuDeces && '†'}</td>
          {product.envelope === 'SCPI' ? (
            <>
              <td>{euro(row.capitalDebut)}</td>
              <td>{euro(row.retraitBrut)}</td>
              <td>{euro(row.fiscaliteTotal)}</td>
              <td>{euro(row.retraitNet)}</td>
              <td>{euro(row.capitalFin)}</td>
            </>
          ) : ['CTO', 'PEA'].includes(product.envelope) ? (
            <>
              <td>{euro(row.capitalDebut)}</td>
              <td>{euro(row.retraitBrut)}</td>
              <td>{euro(row.pvLatenteDebut ?? 0)}</td>
              <td>{euro(row.fiscaliteTotal)}</td>
              <td>{euro(row.retraitNet)}</td>
              <td>{euro(row.pvLatenteFin ?? row.totalInteretsRestants ?? 0)}</td>
              <td>{euro(row.capitalFin)}</td>
            </>
          ) : (
            <>
              <td>
                {euro(row.capitalDebut)}
                <div className="pl-detail-cumul">+{euro(row.gainsAnnee)} intérêts</div>
                <div className="pl-detail-cumul">Cumul : {euro(row.cumulRevenusNetsPercus || 0)}</div>
              </td>
              <td>{euro(row.retraitBrut)}</td>
              <td>
                {euro(row.partGains)}
                <div className="pl-detail-cumul">Reste : {euro(row.totalInteretsRestants)}</div>
              </td>
              <td>
                {euro(row.partCapital)}
                <div className="pl-detail-cumul">Reste : {euro(row.totalCapitalRestant)}</div>
              </td>
              <td>{euro(row.fiscaliteTotal)}</td>
              <td>{euro(row.retraitNet)}</td>
              {showCapitalDecesColumn && (
                <td>{euro(row.capitalDecesTheorique || 0)}</td>
              )}
              <td>{euro(row.capitalFin)}</td>
            </>
          )}
        </tr>
      )}
    />
  );
}
