/**
 * TresoPlacementSection.tsx — Matrice d’allocation de la trésorerie société.
 */

import { SimFieldShell } from '../../../components/ui/sim/SimFieldShell';
import { SimSelect } from '../../../components/ui/sim/SimSelect';
import type { AllocationPocketInput, TresoInputsV2 } from '../../../engine/tresorerie/types';
import { getAllocationPocketLabel } from '../utils/tresorerieV2Migration';

interface Props {
  inputs: TresoInputsV2;
  onChange: (nextInputs: TresoInputsV2) => void;
}

const KIND_OPTIONS = [
  { value: 'distribution', label: 'Distribution' },
  { value: 'capitalisation', label: 'Capitalisation' },
];

const DESTINATION_OPTIONS = [
  { value: 'treasury', label: 'Trésorerie' },
  { value: 'matrix', label: 'Matrice' },
  { value: 'same_pocket', label: 'Même poche' },
];

function fmt(n: number): string {
  return Math.round(n || 0).toLocaleString('fr-FR');
}

function parseEuro(v: string): number {
  const clean = v.replace(/\s/g, '').replace(/\D/g, '');
  return clean === '' ? 0 : Math.min(Number(clean), 999_999_999);
}

function parseNumber(v: string): number {
  const clean = v.replace(/\D/g, '');
  return clean === '' ? 0 : Number(clean);
}

function parsePct(v: string): number {
  const clean = v.replace(',', '.').replace(/[^\d.]/g, '');
  if (clean === '') return 0;
  return Math.min(Number(clean), 100);
}

function fmtRate(rate: number): string {
  return ((rate || 0) * 100).toFixed(2).replace('.', ',');
}

function parseRate(v: string): number {
  return parsePct(v) / 100;
}

function buildDefaultPocket(index: number): AllocationPocketInput {
  return {
    id: `poche-${index + 1}`,
    kind: index === 0 ? 'distribution' : 'capitalisation',
    durationYears: index === 0 ? 5 : 8,
    annualReturnRate: index === 0 ? 0.05 : 0.04,
    enjoymentDelayMonths: 0,
    initialAllocationPct: index === 0 ? 100 : 0,
    annualAllocationPct: index === 0 ? 100 : 0,
    repeatAtTerm: false,
    termDestination: 'treasury',
  };
}

export function TresoPlacementSection({ inputs, onChange }: Props) {
  const v2 = inputs;

  const matrix = v2.allocationMatrix;
  const pockets = matrix.pockets.slice(0, 5);

  const patchV2 = (nextV2: TresoInputsV2) => {
    onChange(nextV2);
  };

  const patchMatrix = (patch: Partial<TresoInputsV2['allocationMatrix']>) => {
    patchV2({ ...v2, allocationMatrix: { ...matrix, ...patch } });
  };

  const updatePocket = (id: string, patch: Partial<AllocationPocketInput>) => {
    patchMatrix({
      pockets: pockets.map(pocket => {
        if (pocket.id !== id) return pocket;
        const nextPocket = { ...pocket, ...patch };
        return {
          ...nextPocket,
          termDestination: nextPocket.repeatAtTerm ? 'same_pocket' : nextPocket.termDestination,
        };
      }),
    });
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

      <div className="ts-fields">
        <SimFieldShell label="Seuil de trésorerie conservée" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmt(matrix.sweepThreshold)}
            onChange={event => patchMatrix({ sweepThreshold: parseEuro(event.target.value) })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>
      </div>

      <div className="ts-matrix-flow" aria-label="Évolution de la matrice d’allocation">
        {pockets.map(pocket => (
          <div key={pocket.id} className="ts-matrix-flow__item">
            <span>{getAllocationPocketLabel(pocket)}</span>
            <i style={{ width: `${Math.max(4, pocket.annualAllocationPct)}%` }} />
          </div>
        ))}
      </div>

      <div className="ts-matrix-pockets">
        {pockets.map((pocket, index) => (
          <div key={pocket.id} className="ts-matrix-pocket">
            <div className="ts-matrix-pocket__header">
              <strong>{getAllocationPocketLabel(pocket)}</strong>
              <span>{pocket.annualAllocationPct}% du balayage annuel</span>
            </div>

            <div className="ts-modal-grid">
              <SimFieldShell label="Libellé" className="ts-field" rowClassName="ts-field__row">
                <input
                  type="text"
                  className="sim-field__control ts-input-left"
                  value={pocket.label ?? ''}
                  placeholder={getAllocationPocketLabel(pocket)}
                  onChange={event => updatePocket(pocket.id, { label: event.target.value })}
                />
              </SimFieldShell>

              <SimFieldShell label="Type" className="ts-field" rowClassName="ts-field__row">
                <SimSelect
                  value={pocket.kind}
                  onChange={value => updatePocket(pocket.id, {
                    kind: value as AllocationPocketInput['kind'],
                  })}
                  options={KIND_OPTIONS}
                  ariaLabel={`Type de poche ${index + 1}`}
                />
              </SimFieldShell>

              <SimFieldShell label="Durée" className="ts-field" rowClassName="ts-field__row">
                <input
                  type="text"
                  inputMode="numeric"
                  className="sim-field__control"
                  value={pocket.durationYears || ''}
                  onChange={event => updatePocket(pocket.id, {
                    durationYears: parseNumber(event.target.value),
                  })}
                />
                <span className="sim-field__unit ts-unit">ans</span>
              </SimFieldShell>

              <SimFieldShell label="Rendement annuel" className="ts-field" rowClassName="ts-field__row">
                <input
                  type="text"
                  inputMode="decimal"
                  className="sim-field__control"
                  value={fmtRate(pocket.annualReturnRate)}
                  onChange={event => updatePocket(pocket.id, {
                    annualReturnRate: parseRate(event.target.value),
                  })}
                />
                <span className="sim-field__unit ts-unit">%</span>
              </SimFieldShell>

              <SimFieldShell label="Délai de jouissance" className="ts-field" rowClassName="ts-field__row">
                <input
                  type="text"
                  inputMode="numeric"
                  className="sim-field__control"
                  value={pocket.enjoymentDelayMonths || ''}
                  onChange={event => updatePocket(pocket.id, {
                    enjoymentDelayMonths: parseNumber(event.target.value),
                  })}
                />
                <span className="sim-field__unit ts-unit">mois</span>
              </SimFieldShell>

              <SimFieldShell label="Allocation initiale" className="ts-field" rowClassName="ts-field__row">
                <input
                  type="text"
                  inputMode="decimal"
                  className="sim-field__control"
                  value={String(pocket.initialAllocationPct)}
                  onChange={event => updatePocket(pocket.id, {
                    initialAllocationPct: parsePct(event.target.value),
                  })}
                />
                <span className="sim-field__unit ts-unit">%</span>
              </SimFieldShell>

              <SimFieldShell label="Allocation annuelle" className="ts-field" rowClassName="ts-field__row">
                <input
                  type="text"
                  inputMode="decimal"
                  className="sim-field__control"
                  value={String(pocket.annualAllocationPct)}
                  onChange={event => updatePocket(pocket.id, {
                    annualAllocationPct: parsePct(event.target.value),
                  })}
                />
                <span className="sim-field__unit ts-unit">%</span>
              </SimFieldShell>

              <label className="ts-toggle-label ts-modal-toggle">
                <input
                  type="checkbox"
                  checked={pocket.repeatAtTerm}
                  onChange={event => updatePocket(pocket.id, {
                    repeatAtTerm: event.target.checked,
                  })}
                />
                Répéter au terme
              </label>

              {!pocket.repeatAtTerm && (
                <SimFieldShell label="Destination au terme" className="ts-field" rowClassName="ts-field__row">
                  <SimSelect
                    value={pocket.termDestination}
                    onChange={value => updatePocket(pocket.id, {
                      termDestination: value as AllocationPocketInput['termDestination'],
                    })}
                    options={DESTINATION_OPTIONS}
                    ariaLabel={`Destination au terme ${index + 1}`}
                  />
                </SimFieldShell>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="ts-matrix-actions">
        <button
          type="button"
          className="ts-text-btn"
          disabled={pockets.length >= 5}
          onClick={() => patchMatrix({ pockets: [...pockets, buildDefaultPocket(pockets.length)] })}
        >
          Ajouter une poche
        </button>
        <span className={totalInitialPct <= 100 ? '' : 'is-warning'}>
          Total initial : {totalInitialPct} %
        </span>
        <span className={totalAnnualPct <= 100 ? '' : 'is-warning'}>
          Total annuel : {totalAnnualPct} %
        </span>
      </div>
    </div>
  );
}
