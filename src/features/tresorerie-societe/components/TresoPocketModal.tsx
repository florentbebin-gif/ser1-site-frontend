import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import { SimModalShell } from '@/components/ui/sim/SimModalShell';
import { SimSelect } from '@/components/ui/sim/SimSelect';
import type {
  AllocationPocketHorizon,
  AllocationPocketInput,
} from '@/engine/tresorerie/types';
import {
  ALLOCATION_DESTINATION_OPTIONS,
  ALLOCATION_HORIZON_OPTIONS,
  ALLOCATION_KIND_OPTIONS,
} from '../utils/tresorerieSocieteModel';
import { getAllocationPocketLabel } from '../utils/tresorerieV2Migration';
import {
  fmtRateInput,
  parseNumberInput,
  parsePctInput,
  parseRateInput,
} from '../utils/tresorerieFormatters';

interface TresoPocketModalProps {
  pocket: AllocationPocketInput;
  index: number;
  onChange: (patch: Partial<AllocationPocketInput>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function TresoPocketModal({
  pocket,
  index,
  onChange,
  onDelete,
  onClose,
}: TresoPocketModalProps) {
  const patchPocket = (patch: Partial<AllocationPocketInput>) => {
    const nextPocket = { ...pocket, ...patch };
    onChange({
      ...patch,
      termDestination: nextPocket.repeatAtTerm ? 'same_pocket' : nextPocket.termDestination,
    });
  };

  return (
    <SimModalShell
      title="Paramétrer la poche"
      subtitle={getAllocationPocketLabel(pocket)}
      onClose={onClose}
      modalClassName="ts-company-modal"
      bodyClassName="ts-company-modal__body"
      footer={(
        <>
          <button type="button" className="ts-danger-btn" onClick={onDelete}>
            Supprimer la poche
          </button>
          <button type="button" className="ts-text-btn" onClick={onClose}>
            Fermer
          </button>
        </>
      )}
    >
      <div className="ts-modal-grid ts-modal-grid--three">
        <SimFieldShell label="Libellé" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            className="sim-field__control ts-input-left"
            value={pocket.label ?? ''}
            placeholder={getAllocationPocketLabel(pocket)}
            onChange={event => patchPocket({ label: event.target.value })}
          />
        </SimFieldShell>

        <SimFieldShell label="Type" className="ts-field" rowClassName="ts-field__row">
          <SimSelect
            value={pocket.kind}
            onChange={value => patchPocket({
              kind: value as AllocationPocketInput['kind'],
            })}
            options={ALLOCATION_KIND_OPTIONS}
            ariaLabel={`Type de poche ${index + 1}`}
          />
        </SimFieldShell>

        <SimFieldShell label="Horizon" className="ts-field" rowClassName="ts-field__row">
          <SimSelect
            value={pocket.horizon ?? 'moyen_terme'}
            onChange={value => patchPocket({
              horizon: value as AllocationPocketHorizon,
            })}
            options={ALLOCATION_HORIZON_OPTIONS}
            ariaLabel={`Horizon poche ${index + 1}`}
          />
        </SimFieldShell>

        <SimFieldShell label="Ordre de consommation" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={pocket.withdrawalPriority ?? index + 1}
            onChange={event => patchPocket({
              withdrawalPriority: parseNumberInput(event.target.value),
            })}
          />
        </SimFieldShell>

        <SimFieldShell label="Durée" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={pocket.durationYears || ''}
            onChange={event => patchPocket({
              durationYears: parseNumberInput(event.target.value),
            })}
          />
          <span className="sim-field__unit ts-unit">ans</span>
        </SimFieldShell>

        <SimFieldShell label="Rendement annuel" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="decimal"
            className="sim-field__control"
            value={fmtRateInput(pocket.annualReturnRate)}
            onChange={event => patchPocket({
              annualReturnRate: parseRateInput(event.target.value),
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
            onChange={event => patchPocket({
              enjoymentDelayMonths: parseNumberInput(event.target.value),
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
            onChange={event => patchPocket({
              initialAllocationPct: parsePctInput(event.target.value),
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
            onChange={event => patchPocket({
              annualAllocationPct: parsePctInput(event.target.value),
            })}
          />
          <span className="sim-field__unit ts-unit">%</span>
        </SimFieldShell>

        <label className="ts-toggle-label ts-modal-toggle">
          <input
            type="checkbox"
            checked={pocket.repeatAtTerm}
            onChange={event => patchPocket({
              repeatAtTerm: event.target.checked,
            })}
          />
          Répéter au terme
        </label>

        {!pocket.repeatAtTerm && (
          <SimFieldShell label="Destination au terme" className="ts-field" rowClassName="ts-field__row">
            <SimSelect
              value={pocket.termDestination}
              onChange={value => patchPocket({
                termDestination: value as AllocationPocketInput['termDestination'],
              })}
              options={ALLOCATION_DESTINATION_OPTIONS}
              ariaLabel={`Destination au terme ${index + 1}`}
            />
          </SimFieldShell>
        )}
      </div>
    </SimModalShell>
  );
}
