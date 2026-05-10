import { useEffect, useMemo, useState } from 'react';
import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import { SimModalShell } from '@/components/ui/sim/SimModalShell';
import { SimSelect } from '@/components/ui/sim/SimSelect';
import type {
  AssociateRevenuePhaseInput,
  AssociateRevenuePhaseSource,
  SubsidiaryInput,
} from '@/engine/tresorerie/types';
import {
  computeComplement,
  computeNetRevenue,
  getPhaseEndYear,
} from '../../utils/revenuePhases';
import {
  fmtEuroInput,
  fmtRateInput,
  parseEuroInput,
  parseNumberInput,
  parseRateInput,
} from '../../utils/tresorerieFormatters';

interface TresoRevenuePhaseModalProps {
  phase: AssociateRevenuePhaseInput;
  phases: AssociateRevenuePhaseInput[];
  subsidiaries: SubsidiaryInput[];
  horizonYear: number;
  onSave: (phase: AssociateRevenuePhaseInput) => void;
  onDelete: () => void;
  onClose: () => void;
}

function fmtEuro(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR')} €`;
}

function normalizeSourcePatch(source: AssociateRevenuePhaseSource): Partial<AssociateRevenuePhaseInput> {
  if (source === 'none') {
    return {
      source,
      subsidiaryId: undefined,
      loadedAnnualCost: 0,
      socialChargeRate: 0,
    };
  }
  return { source };
}

export function TresoRevenuePhaseModal({
  phase,
  phases,
  subsidiaries,
  horizonYear,
  onSave,
  onDelete,
  onClose,
}: TresoRevenuePhaseModalProps) {
  const [draft, setDraft] = useState<AssociateRevenuePhaseInput>(phase);

  useEffect(() => {
    setDraft(phase);
  }, [phase]);

  const derivedEndYear = getPhaseEndYear(draft, phases, horizonYear);
  const duplicateStartYear = phases.some(item =>
    item.id !== draft.id && item.startYear === draft.startYear,
  );
  const netRevenue = computeNetRevenue(draft);
  const complement = computeComplement(draft);
  const subsidiaryOptions = useMemo(
    () => subsidiaries.map(subsidiary => ({ value: subsidiary.id, label: subsidiary.label })),
    [subsidiaries],
  );

  const patchDraft = (patch: Partial<AssociateRevenuePhaseInput>) => {
    setDraft(current => ({ ...current, ...patch }));
  };

  return (
    <SimModalShell
      title="Paramétrer le palier"
      subtitle={draft.label?.trim() || 'Parcours de revenus'}
      onClose={onClose}
      modalClassName="ts-company-modal"
      bodyClassName="ts-company-modal__body"
      footerClassName="ts-phase-modal__footer"
      footer={(
        <div className="ts-phase-modal__footer-inner" data-testid="ts-phase-modal-footer">
          <button
            type="button"
            className="ts-danger-btn"
            onClick={onDelete}
            disabled={phases.length <= 1}
          >
            Supprimer ce palier
          </button>
          <div className="ts-phase-modal__footer-actions">
            <button type="button" className="ts-text-btn" onClick={onClose}>
              Fermer
            </button>
            <button
              type="button"
              className="ts-primary-btn"
              onClick={() => onSave(draft)}
              disabled={duplicateStartYear}
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}
    >
      {duplicateStartYear ? (
        <p className="ts-warning" role="alert">
          Un autre palier commence déjà en {draft.startYear}. Choisissez une année différente.
        </p>
      ) : null}

      <div className="ts-pocket-modal-summary">
        <span>Net annuel estimé {fmtEuro(netRevenue)}</span>
        <span>Besoin total {fmtEuro(draft.annualNetIncomeNeed)}</span>
        <span>Complément {fmtEuro(complement)}</span>
        <span>CCA {draft.useCcaForCompletion ? 'prioritaire' : 'désactivé'}</span>
      </div>

      <div className="ts-modal-stack">
        <section className="ts-associate-card">
          <div className="ts-associate-card__header">
            <strong>Période</strong>
            <span>La fin se déduit du palier suivant</span>
          </div>
          <div className="ts-modal-grid ts-modal-grid--three">
            <SimFieldShell
              label="Année de début"
              className="ts-field"
              rowClassName="ts-field__row"
              controlId="ts-phase-start-year"
            >
              <input
                id="ts-phase-start-year"
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={draft.startYear}
                onChange={event => patchDraft({ startYear: parseNumberInput(event.target.value) })}
              />
            </SimFieldShell>
            <p className="ts-field-note">
              Jusqu’à {derivedEndYear === horizonYear ? 'l’horizon de projection' : `l’année ${derivedEndYear}`}.
            </p>
          </div>
        </section>

        <section className="ts-associate-card">
          <div className="ts-associate-card__header">
            <strong>Revenu payé</strong>
            <span>Ce qui est perçu pendant ce palier</span>
          </div>
          <div className="ts-phase-source" role="radiogroup" aria-label="Source de rémunération">
            {([
              ['holding', 'Oui, depuis la holding'],
              ['subsidiary', 'Oui, depuis une filiale'],
              ['none', 'Aucune rémunération'],
            ] as const).map(([value, label]) => (
              <label key={value} className="ts-phase-source__choice">
                <input
                  type="radio"
                  name="ts-phase-source"
                  checked={draft.source === value}
                  onChange={() => patchDraft(normalizeSourcePatch(value))}
                />
                {label}
              </label>
            ))}
          </div>

          {draft.source === 'subsidiary' ? (
            <div className="ts-modal-grid ts-modal-grid--three">
              <SimFieldShell label="Filiale source" className="ts-field" rowClassName="ts-field__row">
                <SimSelect
                  value={draft.subsidiaryId ?? subsidiaryOptions[0]?.value ?? ''}
                  onChange={value => patchDraft({ subsidiaryId: value })}
                  options={subsidiaryOptions}
                  ariaLabel="Filiale source de rémunération"
                  disabled={subsidiaryOptions.length === 0}
                />
              </SimFieldShell>
            </div>
          ) : null}

          {draft.source !== 'none' ? (
            <div className="ts-modal-grid ts-modal-grid--three">
              <SimFieldShell label="Rémunération chargée annuelle" className="ts-field" rowClassName="ts-field__row">
                <input
                  type="text"
                  inputMode="numeric"
                  className="sim-field__control"
                  value={fmtEuroInput(draft.loadedAnnualCost)}
                  onChange={event => patchDraft({ loadedAnnualCost: parseEuroInput(event.target.value) })}
                />
                <span className="sim-field__unit ts-unit">€</span>
              </SimFieldShell>

              <SimFieldShell label="Taux de charges" className="ts-field" rowClassName="ts-field__row">
                <input
                  type="text"
                  inputMode="decimal"
                  className="sim-field__control"
                  value={fmtRateInput(draft.socialChargeRate)}
                  onChange={event => patchDraft({ socialChargeRate: parseRateInput(event.target.value) })}
                />
                <span className="sim-field__unit ts-unit">%</span>
              </SimFieldShell>

              <div className="ts-phase-net">
                <span>Net annuel estimé</span>
                <strong>{fmtEuro(netRevenue)}</strong>
              </div>
            </div>
          ) : null}
        </section>

        <section className="ts-associate-card">
          <div className="ts-associate-card__header">
            <strong>Besoin total annuel net</strong>
            <span>Le complément est calculé automatiquement</span>
          </div>
          <div className="ts-modal-grid ts-modal-grid--three">
            <SimFieldShell
              label="Besoin total net annuel pendant ce palier"
              className="ts-field"
              rowClassName="ts-field__row"
            >
              <input
                type="text"
                inputMode="numeric"
                className="sim-field__control"
                value={fmtEuroInput(draft.annualNetIncomeNeed)}
                onChange={event => patchDraft({ annualNetIncomeNeed: parseEuroInput(event.target.value) })}
              />
              <span className="sim-field__unit ts-unit">€</span>
            </SimFieldShell>
            <div className="ts-phase-net">
              <span>Complément à financer</span>
              <strong>{fmtEuro(complement)}</strong>
            </div>
          </div>
        </section>

        <section className="ts-associate-card">
          <div className="ts-associate-card__header">
            <strong>Priorité CCA</strong>
            <span>Arbitrage entre CCA et dividendes</span>
          </div>
          <label className="ts-toggle-label ts-modal-toggle">
            <input
              type="checkbox"
              checked={draft.useCcaForCompletion}
              onChange={event => patchDraft({ useCcaForCompletion: event.target.checked })}
            />
            Rembourser le CCA en priorité pour financer le complément
          </label>
          <p className="ts-note--info">
            Si décoché, le complément est financé directement par dividendes, sans retrait CCA.
          </p>
        </section>
      </div>
    </SimModalShell>
  );
}
