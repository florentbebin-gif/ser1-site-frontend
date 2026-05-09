/**
 * TresoPlacementSection.tsx — Matrice d’allocation de la trésorerie société.
 */

import { useState } from 'react';
import { SimFieldShell } from '../../../components/ui/sim/SimFieldShell';
import type {
  AllocationPocketInput,
  TresoInputsV3,
} from '../../../engine/tresorerie/types';
import {
  getEffectiveAllocationMode,
  normalizeAllocationPockets,
} from '../../../engine/tresorerie/allocationPockets';
import { TresoPocketModal } from './TresoPocketModal';
import {
  ALLOCATION_HORIZON_OPTIONS,
  buildDefaultPocket,
  getAllocationHorizonLabel,
} from '../utils/tresorerieSocieteModel';
import { getAllocationPocketLabel } from '../utils/tresorerieV2Migration';
import {
  fmtEuroInput,
  parseEuroInput,
} from '../utils/tresorerieFormatters';

interface Props {
  inputs: TresoInputsV3;
  onChange: (nextInputs: TresoInputsV3) => void;
}

export function TresoPlacementSection({ inputs, onChange }: Props) {
  const [editingPocketId, setEditingPocketId] = useState<string | null>(null);
  const v2 = inputs;

  const matrix = v2.allocationMatrix;
  const pockets = normalizeAllocationPockets(matrix.pockets);
  const mode = getEffectiveAllocationMode(pockets);
  const modeLabel = mode === 'single' ? 'placement unique' : 'stratégie multi-poches';
  const workingCapitalRequirement = v2.company.incomeStatement?.workingCapitalRequirement ?? 0;
  const editingPocketIndex = pockets.findIndex(pocket => pocket.id === editingPocketId);
  const editingPocket = editingPocketIndex >= 0 ? pockets[editingPocketIndex] : null;
  const pocketsByHorizon = ALLOCATION_HORIZON_OPTIONS.map(option => ({
    ...option,
    pockets: pockets.filter(pocket => (pocket.horizon ?? 'moyen_terme') === option.value),
  }));

  const patchV2 = (nextV2: TresoInputsV3) => {
    onChange(nextV2);
  };

  const patchMatrix = (patch: Partial<TresoInputsV3['allocationMatrix']>) => {
    patchV2({ ...v2, allocationMatrix: { ...matrix, ...patch } });
  };

  const updatePocket = (id: string, patch: Partial<AllocationPocketInput>) => {
    patchMatrix({
      pockets: matrix.pockets.map(pocket => {
        if (pocket.id !== id) return pocket;
        const nextPocket = { ...pocket, ...patch };
        return {
          ...nextPocket,
          termDestination: nextPocket.repeatAtTerm ? 'same_pocket' : nextPocket.termDestination,
        };
      }),
    });
  };

  const addPocket = () => {
    if (matrix.pockets.length >= 5) return;
    const nextPocket = buildDefaultPocket(matrix.pockets);
    const nextPockets = [...matrix.pockets, nextPocket];
    patchMatrix({ pockets: nextPockets, mode: getEffectiveAllocationMode(nextPockets) });
    setEditingPocketId(nextPocket.id);
  };

  const deletePocket = (id: string) => {
    const nextPockets = matrix.pockets.filter(pocket => pocket.id !== id);
    patchMatrix({ pockets: nextPockets, mode: getEffectiveAllocationMode(nextPockets) });
    setEditingPocketId(null);
  };

  const totalInitialPct = pockets.reduce((sum, pocket) => sum + pocket.initialAllocationPct, 0);
  const totalAnnualPct = pockets.reduce((sum, pocket) => sum + pocket.annualAllocationPct, 0);

  return (
    <div className="premium-card ts-section">
      <div className="ts-section__header">
        <span className="sim-card__icon">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 12L6 8l3 3 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <h2 className="ts-section__title">Allocation trésorerie société</h2>
          <p className="ts-section__subtitle">Matrice initiale et balayage annuel au-dessus du seuil</p>
        </div>
      </div>
      <div className="ts-section__divider" />

      <div className="ts-placement-summary" aria-label="Mode de placement déduit">
        <span>Mode déduit : {modeLabel}</span>
        <span>BFR inclus dans le seuil de sécurité : {fmtEuroInput(workingCapitalRequirement)} €</span>
      </div>

      <div className="ts-fields">
        <SimFieldShell label="Seuil de trésorerie conservée" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmtEuroInput(matrix.sweepThreshold)}
            onChange={event => patchMatrix({ sweepThreshold: parseEuroInput(event.target.value) })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>
      </div>

      <div className="ts-section__note">Poches par horizon</div>
      {pockets.length > 0 ? (
        <div className="ts-pocket-board" aria-label="Allocation par horizon">
          {pocketsByHorizon.map(column => (
            <section
              key={column.value}
              className="ts-pocket-column"
              role="group"
              aria-labelledby={`ts-pocket-column-${column.value}`}
            >
              <header className="ts-pocket-column__header">
                <h3 id={`ts-pocket-column-${column.value}`}>{column.label}</h3>
                <span>{column.pockets.length} poche{column.pockets.length > 1 ? 's' : ''}</span>
              </header>
              {column.pockets.length > 0 ? (
                <div className="ts-pocket-column__items">
                  {column.pockets.map(pocket => (
                    <button
                      key={pocket.id}
                      type="button"
                      className="ts-pocket-column__item"
                      onClick={() => setEditingPocketId(pocket.id)}
                      aria-label={`Paramétrer ${getAllocationPocketLabel(pocket)}`}
                    >
                      <strong>{getAllocationPocketLabel(pocket)}</strong>
                      <small>
                        Ordre {pocket.withdrawalPriority ?? '-'} · {getAllocationHorizonLabel(pocket.horizon)}
                      </small>
                      <span>
                        Initial {pocket.initialAllocationPct} % · Annuel {pocket.annualAllocationPct} %
                      </span>
                      <i style={{ width: `${Math.max(4, pocket.annualAllocationPct)}%` }} />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="ts-pocket-column__empty">Aucune poche</p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="ts-matrix-empty">
          <strong>Trésorerie conservée sur compte bancaire, sans rendement</strong>
          <button type="button" className="ts-text-btn" onClick={addPocket}>
            Ajouter une poche
          </button>
        </div>
      )}

      <div className="ts-matrix-actions">
        {pockets.length > 0 && (
          <button
            type="button"
            className="ts-text-btn"
            disabled={matrix.pockets.length >= 5}
            title={matrix.pockets.length >= 5 ? 'Maximum 5 poches' : undefined}
            onClick={addPocket}
          >
            Ajouter une poche
          </button>
        )}
        <span className={totalInitialPct <= 100 ? '' : 'is-warning'}>
          Total initial : {totalInitialPct} %
        </span>
        <span className={totalAnnualPct <= 100 ? '' : 'is-warning'}>
          Total annuel : {totalAnnualPct} %
        </span>
      </div>

      {editingPocket ? (
        <TresoPocketModal
          pocket={editingPocket}
          index={editingPocketIndex}
          onChange={patch => updatePocket(editingPocket.id, patch)}
          onDelete={() => deletePocket(editingPocket.id)}
          onClose={() => setEditingPocketId(null)}
        />
      ) : null}
    </div>
  );
}
