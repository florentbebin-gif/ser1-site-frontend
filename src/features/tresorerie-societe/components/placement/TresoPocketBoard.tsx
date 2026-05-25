import type {
  AllocationPocketHorizon,
  AllocationPocketInput,
} from '../../../../engine/tresorerie/types';
import { SimActionButton } from '@/components/ui/sim';
import { getAllocationHorizonLabel } from '../../utils/tresorerieSocieteModel';
import { getAllocationPocketLabel } from '../../utils/tresorerieV2Migration';
import { fmtEuroInput, fmtRateInput } from '../../utils/tresorerieFormatters';

interface PocketColumn {
  value: AllocationPocketHorizon;
  label: string;
  pockets: AllocationPocketInput[];
}

interface Props {
  bankAmount: number;
  pocketCount: number;
  treasuryInitial: number;
  pocketsByHorizon: PocketColumn[];
  onAddPocket: (horizon: AllocationPocketHorizon) => void;
  onEditPocket: (pocketId: string) => void;
}

function getPocketInitialAmount(treasuryInitial: number, pocket: AllocationPocketInput): number {
  return (Math.max(0, treasuryInitial) * Math.max(0, pocket.initialAllocationPct)) / 100;
}

export function TresoPocketBoard({
  bankAmount,
  pocketCount,
  treasuryInitial,
  pocketsByHorizon,
  onAddPocket,
  onEditPocket,
}: Props) {
  return (
    <div className="ts-pocket-board" aria-label="Allocation par horizon">
      <section
        className="ts-pocket-column ts-pocket-column--bank"
        role="group"
        aria-labelledby="ts-pocket-column-bank"
      >
        <header className="ts-pocket-column__header">
          <h3 id="ts-pocket-column-bank">Compte bancaire</h3>
          <span>0 %</span>
        </header>
        <div className="ts-bank-pocket">
          <strong>{fmtEuroInput(bankAmount)} €</strong>
          <small>Non rémunéré · sorties courantes</small>
          {pocketCount === 0 ? (
            <span>Trésorerie conservée sur compte bancaire, sans rendement</span>
          ) : null}
        </div>
      </section>

      {pocketsByHorizon.map((column) => (
        <section
          key={column.value}
          className="ts-pocket-column"
          role="group"
          aria-labelledby={`ts-pocket-column-${column.value}`}
        >
          <header className="ts-pocket-column__header">
            <h3 id={`ts-pocket-column-${column.value}`}>{column.label}</h3>
            <span>
              {column.pockets.length} poche{column.pockets.length > 1 ? 's' : ''}
            </span>
          </header>
          {column.pockets.length > 0 ? (
            <div className="ts-pocket-column__items">
              {column.pockets.map((pocket) => (
                <button
                  key={pocket.id}
                  type="button"
                  className="ts-pocket-column__item"
                  onClick={() => onEditPocket(pocket.id)}
                  aria-label={`Paramétrer ${getAllocationPocketLabel(pocket)}`}
                >
                  <span className="ts-pocket-column__item-head">
                    <strong>{getAllocationPocketLabel(pocket)}</strong>
                    <em>{fmtRateInput(pocket.annualReturnRate)} %</em>
                  </span>
                  <small>
                    {fmtEuroInput(getPocketInitialAmount(treasuryInitial, pocket))} € estimés
                  </small>
                  <span>
                    {pocket.durationYears} ans · {getAllocationHorizonLabel(pocket.horizon)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <SimActionButton
              variant="add"
              mode="text"
              label={`Ajouter une poche ${column.label.toLowerCase()}`}
              className="ts-pocket-column__empty"
              onClick={() => onAddPocket(column.value)}
            />
          )}
        </section>
      ))}
    </div>
  );
}
