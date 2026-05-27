/**
 * TresoPlacementSection.tsx — Matrice d’allocation de la trésorerie société.
 */

import { useState } from 'react';
import { SimActionButton } from '@/components/ui/sim';
import { IconBarChart } from '@/icons/ui';
import type {
  AllocationPocketHorizon,
  AllocationPocketInput,
  TresoInputsV6,
  TresoProjectionRow,
} from '@/engine/tresorerie/types';
import { normalizeAllocationPockets } from '@/engine/tresorerie/allocationPockets';
import { TresoPocketModal } from './TresoPocketModal';
import { ALLOCATION_HORIZON_OPTIONS } from '../utils/tresorerieSocieteOptions';
import { buildDefaultPocket } from '../utils/tresorerieSocieteModel';
import { fmtEuroInput } from '../utils/tresorerieFormatters';
import {
  buildTreasuryStackSegments,
  TresoPlacementOverview,
} from './placement/TresoPlacementOverview';
import { TresoPocketBoard } from './placement/TresoPocketBoard';

interface Props {
  inputs: TresoInputsV6;
  projectionRows?: TresoProjectionRow[];
  onChange: (nextInputs: TresoInputsV6) => void;
}

export function TresoPlacementSection({ inputs, projectionRows = [], onChange }: Props) {
  const [editingPocketId, setEditingPocketId] = useState<string | null>(null);
  const v2 = inputs;

  const matrix = v2.allocationMatrix;
  const pockets = normalizeAllocationPockets(matrix.pockets);
  const workingCapitalRequirement = v2.company.incomeStatement?.workingCapitalRequirement ?? 0;
  const minimumBankBalance = matrix.minimumBankBalance ?? matrix.sweepThreshold;
  const editingPocketIndex = pockets.findIndex((pocket) => pocket.id === editingPocketId);
  const editingPocket = editingPocketIndex >= 0 ? pockets[editingPocketIndex] : null;
  const pocketsByHorizon = ALLOCATION_HORIZON_OPTIONS.map((option) => ({
    ...option,
    pockets: pockets.filter((pocket) => (pocket.horizon ?? 'moyen_terme') === option.value),
  }));

  const patchV2 = (nextV2: TresoInputsV6) => {
    onChange(nextV2);
  };

  const patchMatrix = (patch: Partial<TresoInputsV6['allocationMatrix']>) => {
    patchV2({ ...v2, allocationMatrix: { ...matrix, ...patch } });
  };

  const updatePocket = (id: string, patch: Partial<AllocationPocketInput>) => {
    patchMatrix({
      pockets: matrix.pockets.map((pocket) => {
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
    const nextPockets = matrix.pockets.filter((pocket) => pocket.id !== id);
    patchMatrix({ pockets: nextPockets });
    setEditingPocketId(null);
  };

  const totalInitialPct = pockets.reduce((sum, pocket) => sum + pocket.initialAllocationPct, 0);
  const totalAnnualPct = pockets.reduce((sum, pocket) => sum + pocket.annualAllocationPct, 0);
  const protectedCash = minimumBankBalance + workingCapitalRequirement;
  const initialAllocationBase = Math.max(0, v2.company.treasuryInitial - protectedCash);
  const initialInvestedAmount =
    (initialAllocationBase * Math.min(Math.max(totalInitialPct, 0), 100)) / 100;
  const bankAmount = Math.max(0, v2.company.treasuryInitial - initialInvestedAmount);
  const availableCash = Math.max(0, bankAmount - protectedCash);
  const treasuryStackSegments = buildTreasuryStackSegments(
    v2.company.treasuryInitial,
    initialAllocationBase,
    pockets,
    totalInitialPct,
    protectedCash,
  );
  const firstBankWarning = projectionRows.find((row) => row.alerteTresorerieBancaireInsuffisante);
  const firstBankWarningYear = firstBankWarning
    ? (v2.company.projectionStartYear ?? new Date().getFullYear()) + firstBankWarning.year - 1
    : null;

  return (
    <div className="premium-card premium-card--guide sim-card--guide ts-section">
      <div className="ts-section__header sim-card__header sim-card__header--bleed">
        <span className="sim-card__icon">
          <IconBarChart />
        </span>
        <div className="ts-section__header-text">
          <h2 className="ts-section__title sim-card__title">Allocation trésorerie société</h2>
          <p className="ts-section__subtitle sim-card__subtitle">
            Compte bancaire pivot et placements par horizon
          </p>
        </div>
      </div>
      <div className="ts-section__divider sim-divider" />

      <TresoPlacementOverview
        treasuryInitial={v2.company.treasuryInitial}
        protectedCash={protectedCash}
        availableCash={availableCash}
        minimumBankBalance={minimumBankBalance}
        workingCapitalRequirement={workingCapitalRequirement}
        segments={treasuryStackSegments}
        onEditPocket={setEditingPocketId}
        onMinimumBankBalanceChange={(value) =>
          patchMatrix({ minimumBankBalance: value, sweepThreshold: value })
        }
      />

      {firstBankWarning ? (
        <p className="ts-warning" role="alert">
          Compte bancaire insuffisant en {firstBankWarningYear} : déficit de{' '}
          {fmtEuroInput(firstBankWarning.deficitTresorerieBancaire ?? 0)} € face au solde minimum +
          BFR.
        </p>
      ) : null}

      <div className="ts-section__note">Poches par horizon</div>
      <TresoPocketBoard
        bankAmount={bankAmount}
        pocketCount={pockets.length}
        treasuryInitial={initialAllocationBase}
        pocketsByHorizon={pocketsByHorizon}
        onAddPocket={addPocket}
        onEditPocket={setEditingPocketId}
      />

      <div className="ts-matrix-actions">
        {pockets.length > 0 && (
          <SimActionButton
            variant="add"
            mode="text"
            label="Ajouter une poche"
            disabled={matrix.pockets.length >= 5}
            title={matrix.pockets.length >= 5 ? 'Maximum 5 poches' : undefined}
            onClick={() => addPocket()}
          />
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
          initialAllocationBase={initialAllocationBase}
          remainingInitialPct={Math.max(
            0,
            100 - (totalInitialPct - editingPocket.initialAllocationPct),
          )}
          remainingAnnualPct={Math.max(
            0,
            100 - (totalAnnualPct - editingPocket.annualAllocationPct),
          )}
          onChange={(patch) => updatePocket(editingPocket.id, patch)}
          onDelete={() => deletePocket(editingPocket.id)}
          onClose={() => setEditingPocketId(null)}
        />
      ) : null}
    </div>
  );
}
