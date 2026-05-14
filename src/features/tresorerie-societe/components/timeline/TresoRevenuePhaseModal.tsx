import { useEffect, useMemo, useState } from 'react';
import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import { SimModalShell } from '@/components/ui/sim/SimModalShell';
import { SimSelect } from '@/components/ui/sim/SimSelect';
import type {
  AssociateRevenuePhaseInputV6,
  DividendsStrategy,
  SubsidiaryInput,
} from '@/engine/tresorerie/types';
import {
  computeNetRevenue,
  sortPhases,
} from '../../utils/revenuePhases';
import {
  fmtEuroInput,
  fmtRateInput,
  parseEuroInput,
  parseNumberInput,
  parseRateInput,
} from '../../utils/tresorerieFormatters';
import { TresoTimelineMiniPreview } from './TresoTimelineMiniPreview';
import {
  findOverlappingPaliers,
  fmtEuro,
  isSubPhaseActive,
  normalizeSourcePatch,
  SUB_PHASE_NAV,
  type SubPhaseKey,
} from './revenuePhaseModalUtils';
import { TresoCcaRepaymentPanel } from './TresoCcaRepaymentPanel';

interface TresoRevenuePhaseModalProps {
  phase: AssociateRevenuePhaseInputV6;
  phases: AssociateRevenuePhaseInputV6[];
  subsidiaries: SubsidiaryInput[];
  horizonYear: number;
  ccaCurrentBalance: number;
  onSave: (phase: AssociateRevenuePhaseInputV6) => void;
  onDelete: () => void;
  onClose: () => void;
}

function normalizePhaseForSave(
  phase: AssociateRevenuePhaseInputV6,
): AssociateRevenuePhaseInputV6 {
  return {
    ...phase,
    distribution: {
      ...phase.distribution,
      annualNetIncomeNeed: 0,
    },
    ccaContribution: {
      ...phase.ccaContribution,
      annual: phase.ccaContribution.annual
        ? {
            ...phase.ccaContribution.annual,
            startYear: phase.startYear,
            endYear: phase.endYear,
          }
        : undefined,
    },
  };
}

function coercePhaseForSubsidiaries(
  phase: AssociateRevenuePhaseInputV6,
  hasSubsidiaries: boolean,
): AssociateRevenuePhaseInputV6 {
  if (hasSubsidiaries || phase.remuneration.source !== 'subsidiary') return phase;
  return {
    ...phase,
    remuneration: {
      ...phase.remuneration,
      source: 'holding',
      subsidiaryId: undefined,
    },
  };
}

export function TresoRevenuePhaseModal({
  phase,
  phases,
  subsidiaries,
  horizonYear,
  ccaCurrentBalance,
  onSave,
  onDelete,
  onClose,
}: TresoRevenuePhaseModalProps) {
  const [draft, setDraft] = useState<AssociateRevenuePhaseInputV6>(phase);
  const [activeSubPhase, setActiveSubPhase] = useState<SubPhaseKey>('remuneration');

  useEffect(() => {
    setDraft(coercePhaseForSubsidiaries(phase, subsidiaries.length > 0));
    setActiveSubPhase('remuneration');
  }, [phase, subsidiaries.length]);

  const phasesWithDraft = useMemo(
    () => phases.map(item => (item.id === draft.id ? draft : item)),
    [draft, phases],
  );
  const sortedPhases = sortPhases(phasesWithDraft);
  const nextPhase = sortedPhases.find(item => item.startYear > draft.startYear);
  const periodError = draft.endYear < draft.startYear
    ? 'L’année de fin doit être supérieure ou égale à l’année de début.'
    : undefined;
  const periodWarning = nextPhase && draft.endYear >= nextPhase.startYear
    ? `Le palier suivant commence en ${nextPhase.startYear}. Vérifiez le chevauchement volontaire.`
    : undefined;
  const overlapMessages = findOverlappingPaliers(draft, phases);
  const simultaneousCcaWarning = draft.ccaContribution.enabled && draft.ccaRepayment.enabled
    ? 'Constitution et remboursement CCA sont actifs sur le même palier : vérifiez le sens économique de ces flux croisés.'
    : undefined;
  const netRevenue = computeNetRevenue(draft);
  const activeCount = SUB_PHASE_NAV.filter(item => isSubPhaseActive(draft, item.key)).length;
  const subsidiaryOptions = useMemo(
    () => subsidiaries.map(subsidiary => ({ value: subsidiary.id, label: subsidiary.label })),
    [subsidiaries],
  );
  const remunerationSourceOptions = useMemo(() => {
    const options: Array<[AssociateRevenuePhaseInputV6['remuneration']['source'], string]> = [
      ['holding', 'Oui, depuis la holding'],
    ];
    if (subsidiaryOptions.length > 0) {
      options.push(['subsidiary', 'Oui, depuis une filiale']);
    }
    return options;
  }, [subsidiaryOptions.length]);

  const patchDraft = (patch: Partial<AssociateRevenuePhaseInputV6>) => {
    setDraft(current => ({ ...current, ...patch }));
  };

  const patchRemuneration = (patch: Partial<AssociateRevenuePhaseInputV6['remuneration']>) => {
    setDraft(current => ({ ...current, remuneration: { ...current.remuneration, ...patch } }));
  };

  const patchDistribution = (patch: Partial<AssociateRevenuePhaseInputV6['distribution']>) => {
    setDraft(current => ({ ...current, distribution: { ...current.distribution, ...patch } }));
  };

  const patchCcaContribution = (patch: Partial<AssociateRevenuePhaseInputV6['ccaContribution']>) => {
    setDraft(current => ({ ...current, ccaContribution: { ...current.ccaContribution, ...patch } }));
  };

  const patchCcaRepayment = (patch: Partial<AssociateRevenuePhaseInputV6['ccaRepayment']>) => {
    setDraft(current => ({ ...current, ccaRepayment: { ...current.ccaRepayment, ...patch } }));
  };

  const toggleSubPhase = (key: SubPhaseKey, enabled: boolean) => {
    if (key === 'remuneration') {
      patchRemuneration(enabled
        ? { enabled: true, source: draft.remuneration.source === 'none' ? 'holding' : draft.remuneration.source }
        : { enabled: false, source: 'none', subsidiaryId: undefined, loadedAnnualCost: 0, socialChargeRate: 0 });
      return;
    }
    if (key === 'distribution') {
      patchDistribution({
        enabled,
        dividendsStrategy: enabled && draft.distribution.dividendsStrategy === 'aucun'
          ? 'max_treso'
          : draft.distribution.dividendsStrategy,
      });
      return;
    }
    if (key === 'ccaContribution') {
      patchCcaContribution({ enabled });
      return;
    }
    patchCcaRepayment({
      enabled,
      strategy: enabled && draft.ccaRepayment.strategy === 'aucun'
        ? 'max_treso'
        : draft.ccaRepayment.strategy,
    });
  };

  const canSave = !periodError && overlapMessages.length === 0;

  return (
    <SimModalShell
      title="Paramétrer le palier"
      subtitle={draft.label?.trim() || 'Parcours de revenus'}
      onClose={onClose}
      modalClassName="ts-company-modal ts-phase-modal"
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
              Annuler
            </button>
            <button
              type="button"
              className="ts-primary-btn"
              onClick={() => onSave(normalizePhaseForSave(draft))}
              disabled={!canSave}
            >
              Valider
            </button>
          </div>
        </div>
      )}
    >
      {periodError ? <p className="ts-warning" role="alert">{periodError}</p> : null}
      {overlapMessages.map(message => (
        <p key={message} className="ts-warning" role="alert">{message}</p>
      ))}
      {periodWarning ? <p className="ts-note--info">{periodWarning}</p> : null}
      {simultaneousCcaWarning ? <p className="ts-note--info">{simultaneousCcaWarning}</p> : null}

      <div className="ts-pocket-modal-summary">
        <span>Net annuel estimé {fmtEuro(netRevenue)}</span>
        <span>{activeCount} sous-phase{activeCount > 1 ? 's' : ''} active{activeCount > 1 ? 's' : ''}</span>
      </div>

      <TresoTimelineMiniPreview
        phase={draft}
        phases={phasesWithDraft}
        subsidiaries={subsidiaries}
        horizonYear={horizonYear}
      />

      <div className="ts-phase-modal-layout">
        <nav className="ts-phase-modal-nav" aria-label="Sous-phases du palier">
          {SUB_PHASE_NAV.map(item => (
            <button
              key={item.key}
              type="button"
              className={activeSubPhase === item.key ? 'is-active' : ''}
              onClick={() => setActiveSubPhase(item.key)}
            >
              <input
                type="checkbox"
                checked={isSubPhaseActive(draft, item.key)}
                aria-label={`Activer ${item.label}`}
                onClick={event => event.stopPropagation()}
                onChange={event => toggleSubPhase(item.key, event.target.checked)}
              />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="ts-phase-modal-panel">
          <section className="ts-associate-card">
            <div className="ts-associate-card__header">
              <strong>Période</strong>
              <span>Bornes inclusives</span>
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

              <SimFieldShell
                label="Année de fin"
                className="ts-field"
                rowClassName="ts-field__row"
                controlId="ts-phase-end-year"
              >
                <input
                  id="ts-phase-end-year"
                  type="text"
                  inputMode="numeric"
                  className="sim-field__control"
                  value={draft.endYear}
                  onChange={event => patchDraft({ endYear: parseNumberInput(event.target.value) })}
                />
              </SimFieldShell>
            </div>
          </section>

          {activeSubPhase === 'remuneration' ? (
            <section className="ts-associate-card">
              <div className="ts-associate-card__header">
                <strong>Phase rémunération</strong>
                <span>Revenu payé</span>
              </div>
              <div className="ts-phase-source" role="radiogroup" aria-label="Source de rémunération">
                {remunerationSourceOptions.map(([value, label]) => (
                  <label key={value} className="ts-phase-source__choice">
                    <input
                      type="radio"
                      name="ts-phase-source"
                      checked={draft.remuneration.source === value}
                      onChange={() => patchRemuneration(normalizeSourcePatch(value))}
                    />
                    {label}
                  </label>
                ))}
              </div>

              {draft.remuneration.source === 'subsidiary' ? (
                <div className="ts-modal-grid ts-modal-grid--three">
                  <SimFieldShell label="Filiale source" className="ts-field" rowClassName="ts-field__row">
                    <SimSelect
                      value={draft.remuneration.subsidiaryId ?? subsidiaryOptions[0]?.value ?? ''}
                      onChange={value => patchRemuneration({ subsidiaryId: value })}
                      options={subsidiaryOptions}
                      ariaLabel="Filiale source de rémunération"
                      disabled={subsidiaryOptions.length === 0}
                    />
                  </SimFieldShell>
                </div>
              ) : null}

              {draft.remuneration.source !== 'none' ? (
                <div className="ts-modal-grid ts-modal-grid--three">
                  <SimFieldShell label="Rémunération chargée annuelle" className="ts-field" rowClassName="ts-field__row">
                    <input
                      type="text"
                      inputMode="numeric"
                      className="sim-field__control"
                      value={fmtEuroInput(draft.remuneration.loadedAnnualCost)}
                      onChange={event => patchRemuneration({ loadedAnnualCost: parseEuroInput(event.target.value) })}
                    />
                    <span className="sim-field__unit ts-unit">€</span>
                  </SimFieldShell>

                  <SimFieldShell label="Taux de charges" className="ts-field" rowClassName="ts-field__row">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="sim-field__control"
                      value={fmtRateInput(draft.remuneration.socialChargeRate)}
                      onChange={event => patchRemuneration({ socialChargeRate: parseRateInput(event.target.value) })}
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
          ) : null}

          {activeSubPhase === 'distribution' ? (
            <section className="ts-associate-card">
              <div className="ts-associate-card__header">
                <strong>Phase distribution</strong>
                <span>Objectif ou trésorerie disponible</span>
              </div>
              <p className="ts-phase-source-title">Dividendes souhaités</p>
              <div className="ts-phase-source" role="radiogroup" aria-label="Dividendes souhaités">
                {([
                  ['max_treso', 'Maximum selon trésorerie'],
                  ['montant_cible', 'Montant net cible'],
                ] as Array<[DividendsStrategy, string]>).map(([value, label]) => (
                  <label key={value} className="ts-phase-source__choice">
                    <input
                      type="radio"
                      name="ts-dividends-strategy"
                      checked={draft.distribution.dividendsStrategy === value}
                      onChange={() => patchDistribution({
                        enabled: true,
                        dividendsStrategy: value,
                      })}
                    />
                    {label}
                  </label>
                ))}
              </div>
              {draft.distribution.dividendsStrategy === 'montant_cible' ? (
                <div className="ts-modal-grid ts-modal-grid--three">
                  <SimFieldShell label="Objectif net annuel de l’associé" className="ts-field" rowClassName="ts-field__row">
                    <input
                      type="text"
                      inputMode="numeric"
                      className="sim-field__control"
                      value={fmtEuroInput(draft.distribution.dividendsTargetAmountNet ?? 0)}
                      onChange={event => patchDistribution({
                        dividendsTargetAmountNet: parseEuroInput(event.target.value),
                      })}
                    />
                    <span className="sim-field__unit ts-unit">€</span>
                  </SimFieldShell>
                </div>
              ) : null}
              <p className="ts-note--info">
                En maximum selon trésorerie, le calculateur rembourse d’abord le CCA disponible puis distribue les dividendes possibles.
              </p>
            </section>
          ) : null}

          {activeSubPhase === 'ccaContribution' ? (
            <section className="ts-associate-card">
              <div className="ts-associate-card__header">
                <strong>Phase constitution de CCA</strong>
                <span>Apports ponctuels ou récurrents</span>
              </div>
              <div className="ts-modal-grid ts-modal-grid--three">
                <SimFieldShell label="Apport annuel" className="ts-field" rowClassName="ts-field__row">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="sim-field__control"
                    value={fmtEuroInput(draft.ccaContribution.annual?.amount ?? 0)}
                    onChange={event => patchCcaContribution({
                      enabled: true,
                      annual: {
                        amount: parseEuroInput(event.target.value),
                        startYear: draft.startYear,
                        endYear: draft.endYear,
                      },
                    })}
                  />
                  <span className="sim-field__unit ts-unit">€</span>
                </SimFieldShell>
              </div>
              <div className="ts-modal-grid ts-modal-grid--three">
                <SimFieldShell label="Apport exceptionnel" className="ts-field" rowClassName="ts-field__row">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="sim-field__control"
                    value={fmtEuroInput(draft.ccaContribution.exceptional?.amount ?? 0)}
                    onChange={event => patchCcaContribution({
                      enabled: true,
                      exceptional: {
                        year: draft.ccaContribution.exceptional?.year ?? draft.startYear,
                        amount: parseEuroInput(event.target.value),
                      },
                    })}
                  />
                  <span className="sim-field__unit ts-unit">€</span>
                </SimFieldShell>
                <SimFieldShell label="Année exceptionnelle" className="ts-field" rowClassName="ts-field__row">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="sim-field__control"
                    value={draft.ccaContribution.exceptional?.year ?? draft.startYear}
                    onChange={event => patchCcaContribution({
                      enabled: true,
                      exceptional: {
                        amount: draft.ccaContribution.exceptional?.amount ?? 0,
                        year: parseNumberInput(event.target.value),
                      },
                    })}
                  />
                </SimFieldShell>
              </div>
            </section>
          ) : null}

          {activeSubPhase === 'ccaRepayment' ? (
            <TresoCcaRepaymentPanel
              phase={draft}
              ccaCurrentBalance={ccaCurrentBalance}
              onChange={patchCcaRepayment}
            />
          ) : null}
        </div>
      </div>
    </SimModalShell>
  );
}
