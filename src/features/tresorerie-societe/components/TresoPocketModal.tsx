import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import { SimModalShell } from '@/components/ui/sim/SimModalShell';
import { SimSelect } from '@/components/ui/sim/SimSelect';
import type { AllocationPocketHorizon, AllocationPocketInput } from '@/engine/tresorerie/types';
import {
  ALLOCATION_HORIZON_OPTIONS,
  ALLOCATION_KIND_OPTIONS,
} from '../utils/tresorerieSocieteOptions';
import { getAllocationPocketLabel } from '@/engine/tresorerie/allocationLabels';
import {
  fmtEuroInput,
  fmtRateInput,
  parseNumberInput,
  parsePctInput,
  parseRateInput,
} from '../utils/tresorerieFormatters';

interface TresoPocketModalProps {
  pocket: AllocationPocketInput;
  index: number;
  initialAllocationBase: number;
  remainingInitialPct: number;
  remainingAnnualPct: number;
  onChange: (patch: Partial<AllocationPocketInput>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function TresoPocketModal({
  pocket,
  index,
  initialAllocationBase,
  remainingInitialPct,
  remainingAnnualPct,
  onChange,
  onDelete,
  onClose,
}: TresoPocketModalProps) {
  const patchPocket = (patch: Partial<AllocationPocketInput>) => {
    onChange(patch);
  };

  // Cap des allocations : la poche ne peut pas dépasser sa propre part + le reste libre.
  const maxInitialPct = Math.max(
    0,
    Math.min(100, remainingInitialPct + pocket.initialAllocationPct),
  );
  const maxAnnualPct = Math.max(0, Math.min(100, remainingAnnualPct + pocket.annualAllocationPct));
  const initialAmount =
    (Math.max(0, initialAllocationBase) * Math.max(0, pocket.initialAllocationPct)) / 100;

  return (
    <SimModalShell
      title="Paramétrer la poche"
      subtitle={getAllocationPocketLabel(pocket)}
      onClose={onClose}
      modalClassName="ts-company-modal sim-modal--xl"
      bodyClassName="ts-company-modal__body"
      footer={
        <>
          <button type="button" className="sim-modal-btn sim-modal-btn--ghost" onClick={onDelete}>
            Supprimer la poche
          </button>
          <button type="button" className="sim-modal-btn sim-modal-btn--ghost" onClick={onClose}>
            Fermer
          </button>
        </>
      }
    >
      <div className="ts-pocket-modal-summary">
        <span>Initial {pocket.initialAllocationPct} %</span>
        <span>Balayage annuel {pocket.annualAllocationPct} %</span>
        <span>Rendement {fmtRateInput(pocket.annualReturnRate)} %</span>
        <span>Durée {pocket.durationYears || 0} ans</span>
      </div>

      <div className="ts-modal-stack">
        <section className="ts-associate-card">
          <div className="ts-associate-card__header">
            <strong>Identité</strong>
            <span>Nom et famille de placement</span>
          </div>
          <div className="ts-modal-grid ts-modal-grid--three">
            <SimFieldShell label="Libellé" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                className="sim-field__control ts-input-left"
                value={pocket.label ?? ''}
                placeholder={getAllocationPocketLabel(pocket)}
                onChange={(event) => patchPocket({ label: event.target.value })}
              />
            </SimFieldShell>

            <SimFieldShell label="Type" className="ts-field" rowClassName="ts-field__row">
              <SimSelect
                value={pocket.kind}
                onChange={(value) =>
                  patchPocket({
                    kind: value as AllocationPocketInput['kind'],
                  })
                }
                options={ALLOCATION_KIND_OPTIONS}
                ariaLabel={`Type de poche ${index + 1}`}
              />
            </SimFieldShell>
          </div>
        </section>

        <section className="ts-associate-card">
          <div className="ts-associate-card__header">
            <strong>Allocation</strong>
            <span>Part de trésorerie à placer</span>
          </div>
          <div className="ts-modal-grid ts-modal-grid--three">
            <SimFieldShell label="Horizon" className="ts-field" rowClassName="ts-field__row">
              <SimSelect
                value={pocket.horizon ?? 'moyen_terme'}
                onChange={(value) =>
                  patchPocket({
                    horizon: value as AllocationPocketHorizon,
                  })
                }
                options={ALLOCATION_HORIZON_OPTIONS}
                ariaLabel={`Horizon poche ${index + 1}`}
              />
            </SimFieldShell>

            <SimFieldShell
              label="Allocation initiale"
              className="ts-field"
              rowClassName="ts-field__row ts-field__row--note-below"
            >
              <input
                type="text"
                inputMode="decimal"
                className="sim-field__control"
                value={String(pocket.initialAllocationPct)}
                onChange={(event) =>
                  patchPocket({
                    initialAllocationPct: Math.min(
                      parsePctInput(event.target.value),
                      maxInitialPct,
                    ),
                  })
                }
              />
              <span className="sim-field__unit ts-unit">%</span>
              <small className="ts-field-note">
                {fmtEuroInput(initialAmount)} € · maximum disponible : {maxInitialPct} %
              </small>
            </SimFieldShell>

            <SimFieldShell
              label="Allocation annuelle"
              className="ts-field"
              rowClassName="ts-field__row ts-field__row--note-below"
            >
              <input
                type="text"
                inputMode="decimal"
                className="sim-field__control"
                value={String(pocket.annualAllocationPct)}
                onChange={(event) =>
                  patchPocket({
                    annualAllocationPct: Math.min(parsePctInput(event.target.value), maxAnnualPct),
                  })
                }
              />
              <span className="sim-field__unit ts-unit">%</span>
              <small className="ts-field-note">Maximum disponible : {maxAnnualPct} %</small>
            </SimFieldShell>
          </div>
        </section>

        <section className="ts-associate-card">
          <div className="ts-associate-card__header">
            <strong>Rendement & durée</strong>
            <span>Performance et indisponibilité</span>
          </div>
          <div className="ts-modal-grid ts-modal-grid--three">
            <SimFieldShell label="Durée" className="ts-field" rowClassName="ts-field__row">
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={pocket.durationYears || ''}
                onChange={(event) =>
                  patchPocket({
                    durationYears: parseNumberInput(event.target.value),
                  })
                }
              />
              <span className="sim-field__unit ts-unit">ans</span>
            </SimFieldShell>

            <SimFieldShell
              label="Rendement annuel"
              className="ts-field"
              rowClassName="ts-field__row"
            >
              <input
                type="text"
                inputMode="decimal"
                className="sim-field__control"
                value={fmtRateInput(pocket.annualReturnRate)}
                onChange={(event) =>
                  patchPocket({
                    annualReturnRate: parseRateInput(event.target.value),
                  })
                }
              />
              <span className="sim-field__unit ts-unit">%</span>
            </SimFieldShell>

            <SimFieldShell
              label="Délai de jouissance"
              className="ts-field"
              rowClassName="ts-field__row"
            >
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={pocket.enjoymentDelayMonths || ''}
                onChange={(event) =>
                  patchPocket({
                    enjoymentDelayMonths: parseNumberInput(event.target.value),
                  })
                }
              />
              <span className="sim-field__unit ts-unit">mois</span>
            </SimFieldShell>
          </div>
        </section>

        <section className="ts-associate-card">
          <div className="ts-associate-card__header">
            <strong>Fin du placement</strong>
            <span>Retour automatique sur compte bancaire</span>
          </div>
          <p className="ts-note--info">
            Au terme, le produit revient sur le compte bancaire. Si la répétition est activée, seul
            l’excédent au-dessus du solde minimum est réinvesti.
          </p>
          <label className="ts-toggle-label ts-modal-toggle">
            <input
              type="checkbox"
              checked={pocket.repeatAtTerm}
              onChange={(event) =>
                patchPocket({
                  repeatAtTerm: event.target.checked,
                })
              }
            />
            Réinvestir automatiquement si le solde minimum reste respecté
          </label>
        </section>
      </div>
    </SimModalShell>
  );
}
