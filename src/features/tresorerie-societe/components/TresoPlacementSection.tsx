/**
 * TresoPlacementSection.tsx — Matrice d’allocation de la trésorerie société.
 */

import { useState } from 'react';
import { SimFieldShell } from '../../../components/ui/sim/SimFieldShell';
import type {
  AllocationPocketHorizon,
  AllocationPocketInput,
  TresoInputsV4,
} from '../../../engine/tresorerie/types';
import {
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
  fmtRateInput,
  parseEuroInput,
} from '../utils/tresorerieFormatters';

interface Props {
  inputs: TresoInputsV4;
  onChange: (nextInputs: TresoInputsV4) => void;
}

export function TresoPlacementSection({ inputs, onChange }: Props) {
  const [editingPocketId, setEditingPocketId] = useState<string | null>(null);
  const v2 = inputs;

  const matrix = v2.allocationMatrix;
  const pockets = normalizeAllocationPockets(matrix.pockets);
  const workingCapitalRequirement = v2.company.incomeStatement?.workingCapitalRequirement ?? 0;
  const minimumBankBalance = matrix.minimumBankBalance ?? matrix.sweepThreshold;
  const editingPocketIndex = pockets.findIndex(pocket => pocket.id === editingPocketId);
  const editingPocket = editingPocketIndex >= 0 ? pockets[editingPocketIndex] : null;
  const pocketsByHorizon = ALLOCATION_HORIZON_OPTIONS.map(option => ({
    ...option,
    pockets: pockets.filter(pocket => (pocket.horizon ?? 'moyen_terme') === option.value),
  }));

  const patchV2 = (nextV2: TresoInputsV4) => {
    onChange(nextV2);
  };

  const patchMatrix = (patch: Partial<TresoInputsV4['allocationMatrix']>) => {
    patchV2({ ...v2, allocationMatrix: { ...matrix, ...patch } });
  };

  const updatePocket = (id: string, patch: Partial<AllocationPocketInput>) => {
    patchMatrix({
      pockets: matrix.pockets.map(pocket => {
        if (pocket.id !== id) return pocket;
        return { ...pocket, ...patch, termDestination: 'treasury' };
      }),
    });
  };

  const addPocket = (horizon?: AllocationPocketHorizon) => {
    if (matrix.pockets.length >= 5) return;
    const nextPocket = buildDefaultPocket(matrix.pockets, horizon);
    const nextPockets = [...matrix.pockets, nextPocket];
    patchMatrix({ pockets: nextPockets, mode: nextPockets.length > 1 ? 'strategy' : 'single' });
    setEditingPocketId(nextPocket.id);
  };

  const deletePocket = (id: string) => {
    const nextPockets = matrix.pockets.filter(pocket => pocket.id !== id);
    patchMatrix({ pockets: nextPockets, mode: nextPockets.length > 1 ? 'strategy' : 'single' });
    setEditingPocketId(null);
  };

  const totalInitialPct = pockets.reduce((sum, pocket) => sum + pocket.initialAllocationPct, 0);
  const totalAnnualPct = pockets.reduce((sum, pocket) => sum + pocket.annualAllocationPct, 0);
  const initialInvestedAmount =
    v2.company.treasuryInitial * Math.min(Math.max(totalInitialPct, 0), 100) / 100;
  const bankAmount = Math.max(0, v2.company.treasuryInitial - initialInvestedAmount);
  const protectedCash = minimumBankBalance + workingCapitalRequirement;
  const availableCash = Math.max(0, bankAmount - protectedCash);

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
          <p className="ts-section__subtitle">Compte bancaire pivot et placements par horizon</p>
        </div>
      </div>
      <div className="ts-section__divider" />

      <div className="ts-placement-summary" aria-label="Répartition de trésorerie">
        <span>Trésorerie initiale : {fmtEuroInput(v2.company.treasuryInitial)} €</span>
        <span>Investi : {fmtEuroInput(initialInvestedAmount)} €</span>
        <span>Compte bancaire : {fmtEuroInput(bankAmount)} €</span>
        <span>Solde minimum banque + BFR : {fmtEuroInput(protectedCash)} €</span>
        <span>Disponible : {fmtEuroInput(availableCash)} €</span>
      </div>

      <div className="ts-fields">
        <SimFieldShell label="Solde minimum à conserver sur le compte bancaire" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmtEuroInput(minimumBankBalance)}
            onChange={event => {
              const value = parseEuroInput(event.target.value);
              patchMatrix({ minimumBankBalance: value, sweepThreshold: value });
            }}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>
      </div>
      <p className="ts-note--info">
        Le balayage place uniquement la trésorerie au-dessus du solde minimum bancaire et du BFR.
      </p>

      <div className="ts-section__note">Poches par horizon</div>
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
            {pockets.length === 0 ? (
              <span>Trésorerie conservée sur compte bancaire, sans rendement</span>
            ) : null}
          </div>
        </section>

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
                      <span className="ts-pocket-column__item-head">
                        <strong>{getAllocationPocketLabel(pocket)}</strong>
                        <em>{fmtRateInput(pocket.annualReturnRate)} %</em>
                      </span>
                      <small>{getAllocationHorizonLabel(pocket.horizon)}</small>
                      <span>
                        Initial {pocket.initialAllocationPct} % · Annuel {pocket.annualAllocationPct} %
                      </span>
                      <i style={{ width: `${Math.max(4, pocket.annualAllocationPct)}%` }} />
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  className="ts-pocket-column__empty"
                  onClick={() => addPocket(column.value)}
                >
                  + Ajouter une poche {column.label.toLowerCase()}
                </button>
              )}
            </section>
        ))}
      </div>

      <div className="ts-matrix-actions">
        {pockets.length > 0 && (
          <button
            type="button"
            className="ts-text-btn"
            disabled={matrix.pockets.length >= 5}
            title={matrix.pockets.length >= 5 ? 'Maximum 5 poches' : undefined}
            onClick={() => addPocket()}
          >
            Ajouter une poche
          </button>
        )}
        <span className={totalInitialPct <= 100 ? '' : 'is-warning'}>
          Répartition de l’allocation initiale : {totalInitialPct} %
        </span>
        <span className={totalAnnualPct <= 100 ? '' : 'is-warning'}>
          Répartition du balayage annuel : {totalAnnualPct} %
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
