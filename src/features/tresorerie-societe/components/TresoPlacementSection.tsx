/**
 * TresoPlacementSection.tsx — Matrice d’allocation de la trésorerie société.
 */

import { useState } from 'react';
import { SimFieldShell } from '../../../components/ui/sim/SimFieldShell';
import type {
  AllocationPocketHorizon,
  AllocationPocketInput,
  TresoInputsV5,
  TresoProjectionRow,
} from '../../../engine/tresorerie/types';
import {
  normalizeAllocationPockets,
} from '../../../engine/tresorerie/allocationPockets';
import { TresoPocketModal } from './TresoPocketModal';
import { ALLOCATION_HORIZON_OPTIONS } from '../utils/tresorerieSocieteOptions';
import {
  buildDefaultPocket,
} from '../utils/tresorerieSocieteModel';
import {
  fmtEuroInput,
  parseEuroInput,
} from '../utils/tresorerieFormatters';
import {
  buildTreasuryStackSegments,
  TresoPlacementOverview,
} from './placement/TresoPlacementOverview';
import { TresoPocketBoard } from './placement/TresoPocketBoard';

interface Props {
  inputs: TresoInputsV5;
  projectionRows?: TresoProjectionRow[];
  onChange: (nextInputs: TresoInputsV5) => void;
}

export function TresoPlacementSection({ inputs, projectionRows = [], onChange }: Props) {
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

  const patchV2 = (nextV2: TresoInputsV5) => {
    onChange(nextV2);
  };

  const patchMatrix = (patch: Partial<TresoInputsV5['allocationMatrix']>) => {
    patchV2({ ...v2, allocationMatrix: { ...matrix, ...patch } });
  };

  const updatePocket = (id: string, patch: Partial<AllocationPocketInput>) => {
    patchMatrix({
      pockets: matrix.pockets.map(pocket => {
        if (pocket.id !== id) return pocket;
        return { ...pocket, ...patch };
      }),
    });
  };

  const addPocket = (horizon?: AllocationPocketHorizon) => {
    if (matrix.pockets.length >= 5) return;
    const nextPocket = buildDefaultPocket(matrix.pockets, horizon);
    const nextPockets = [...matrix.pockets, nextPocket];
    patchMatrix({ pockets: nextPockets });
    setEditingPocketId(nextPocket.id);
  };

  const deletePocket = (id: string) => {
    const nextPockets = matrix.pockets.filter(pocket => pocket.id !== id);
    patchMatrix({ pockets: nextPockets });
    setEditingPocketId(null);
  };

  const totalInitialPct = pockets.reduce((sum, pocket) => sum + pocket.initialAllocationPct, 0);
  const totalAnnualPct = pockets.reduce((sum, pocket) => sum + pocket.annualAllocationPct, 0);
  const initialInvestedAmount =
    v2.company.treasuryInitial * Math.min(Math.max(totalInitialPct, 0), 100) / 100;
  const bankAmount = Math.max(0, v2.company.treasuryInitial - initialInvestedAmount);
  const protectedCash = minimumBankBalance + workingCapitalRequirement;
  const availableCash = Math.max(0, bankAmount - protectedCash);
  const treasuryStackSegments = buildTreasuryStackSegments(
    v2.company.treasuryInitial,
    pockets,
    totalInitialPct,
    protectedCash,
  );
  const firstBankWarning = projectionRows.find(row => row.alerteTresorerieBancaireInsuffisante);
  const firstBankWarningYear = firstBankWarning
    ? (v2.company.projectionStartYear ?? new Date().getFullYear()) + firstBankWarning.year - 1
    : null;

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

      <TresoPlacementOverview
        treasuryInitial={v2.company.treasuryInitial}
        protectedCash={protectedCash}
        availableCash={availableCash}
        segments={treasuryStackSegments}
        onEditPocket={setEditingPocketId}
      />

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
      {firstBankWarning ? (
        <p className="ts-warning" role="alert">
          Compte bancaire insuffisant en {firstBankWarningYear} :
          déficit de {fmtEuroInput(firstBankWarning.deficitTresorerieBancaire ?? 0)} € face au solde minimum + BFR.
        </p>
      ) : null}

      <div className="ts-section__note">Poches par horizon</div>
      <TresoPocketBoard
        bankAmount={bankAmount}
        pocketCount={pockets.length}
        treasuryInitial={v2.company.treasuryInitial}
        pocketsByHorizon={pocketsByHorizon}
        onAddPocket={addPocket}
        onEditPocket={setEditingPocketId}
      />

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
