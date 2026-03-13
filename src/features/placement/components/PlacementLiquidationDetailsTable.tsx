import type { LiquidationRow, SimulateCompleteResult } from '@/engine/placement/types';
import { euro } from '../utils/formatters';
import type { PlacementTableProduct } from '../utils/tableHelpers';
import { CollapsibleTable } from './tables';
import { buildColumns, getRelevantColumns } from '../utils/tableHelpers';

type PlacementLiquidationDetailRow = LiquidationRow & {
  capital?: number | null;
  capitalDecesTheorique?: number | null;
  cumulRevenusNetsPercus?: number | null;
};

type PlacementLiquidationProduct = Omit<SimulateCompleteResult, 'liquidation'> & {
  liquidation: Omit<SimulateCompleteResult['liquidation'], 'rows'> & {
    rows: PlacementLiquidationDetailRow[];
  };
};

interface PlacementLiquidationDetailsTableProps {
  product: PlacementLiquidationProduct;
  showAllColumns: boolean;
  showCapitalDecesColumn: boolean;
}

export function PlacementLiquidationDetailsTable({
  product,
  showAllColumns,
  showCapitalDecesColumn,
}: PlacementLiquidationDetailsTableProps) {
  const detailRows = product.liquidation.rows.filter((row) => row.age <= product.liquidation.ageAuDeces);

  return (
    <CollapsibleTable
      title={`Détail ${product.envelopeLabel}`}
      rows={detailRows}
      columns={getRelevantColumns(detailRows, buildColumns(product as PlacementTableProduct), showAllColumns)}
      renderRow={(row: PlacementLiquidationDetailRow, index) => (
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

