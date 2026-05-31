import { useEffect, useMemo, useState } from 'react';
import { SimModalShell } from '@/components/ui/sim/SimModalShell';
import type { AssociateRevenuePhaseInputV6, SubsidiaryInput } from '@/engine/tresorerie/types';
import { computeNetRevenue, sortPhases } from '../../utils/revenuePhases';
import { TresoTimelineMiniPreview } from './TresoTimelineMiniPreview';
import {
  findOverlappingPaliers,
  fmtEuro,
  isSubPhaseActive,
  SUB_PHASE_NAV,
  type SubPhaseKey,
} from './revenuePhaseModalUtils';
import { TresoCcaRepaymentPanel } from './TresoCcaRepaymentPanel';
import {
  TresoRevenuePhaseCcaContributionPanel,
  TresoRevenuePhaseDistributionPanel,
  TresoRevenuePhasePeriodPanel,
  TresoRevenuePhaseRemunerationPanel,
} from './TresoRevenuePhaseSubPanels';

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

function normalizePhaseForSave(phase: AssociateRevenuePhaseInputV6): AssociateRevenuePhaseInputV6 {
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
    () => phases.map((item) => (item.id === draft.id ? draft : item)),
    [draft, phases],
  );
  const sortedPhases = sortPhases(phasesWithDraft);
  const nextPhase = sortedPhases.find((item) => item.startYear > draft.startYear);
  const periodError =
    draft.endYear < draft.startYear
      ? 'L’année de fin doit être supérieure ou égale à l’année de début.'
      : undefined;
  const periodWarning =
    nextPhase && draft.endYear >= nextPhase.startYear
      ? `Le palier suivant commence en ${nextPhase.startYear}. Vérifiez le chevauchement volontaire.`
      : undefined;
  const overlapMessages = findOverlappingPaliers(draft, phases);
  const simultaneousCcaWarning =
    draft.ccaContribution.enabled && draft.ccaRepayment.enabled
      ? 'Constitution et remboursement CCA sont actifs sur le même palier : vérifiez le sens économique de ces flux croisés.'
      : undefined;
  const netRevenue = computeNetRevenue(draft);
  const activeCount = SUB_PHASE_NAV.filter((item) => isSubPhaseActive(draft, item.key)).length;
  const subsidiaryOptions = useMemo(
    () => subsidiaries.map((subsidiary) => ({ value: subsidiary.id, label: subsidiary.label })),
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
    setDraft((current) => ({ ...current, ...patch }));
  };

  const patchRemuneration = (patch: Partial<AssociateRevenuePhaseInputV6['remuneration']>) => {
    setDraft((current) => ({ ...current, remuneration: { ...current.remuneration, ...patch } }));
  };

  const patchDistribution = (patch: Partial<AssociateRevenuePhaseInputV6['distribution']>) => {
    setDraft((current) => ({ ...current, distribution: { ...current.distribution, ...patch } }));
  };

  const patchCcaContribution = (
    patch: Partial<AssociateRevenuePhaseInputV6['ccaContribution']>,
  ) => {
    setDraft((current) => ({
      ...current,
      ccaContribution: { ...current.ccaContribution, ...patch },
    }));
  };

  const patchCcaRepayment = (patch: Partial<AssociateRevenuePhaseInputV6['ccaRepayment']>) => {
    setDraft((current) => ({ ...current, ccaRepayment: { ...current.ccaRepayment, ...patch } }));
  };

  const toggleSubPhase = (key: SubPhaseKey, enabled: boolean) => {
    if (key === 'remuneration') {
      patchRemuneration(
        enabled
          ? {
              enabled: true,
              source: draft.remuneration.source === 'none' ? 'holding' : draft.remuneration.source,
            }
          : {
              enabled: false,
              source: 'none',
              subsidiaryId: undefined,
              loadedAnnualCost: 0,
              socialChargeRate: 0,
            },
      );
      return;
    }
    if (key === 'distribution') {
      patchDistribution({
        enabled,
        dividendsStrategy:
          enabled && draft.distribution.dividendsStrategy === 'aucun'
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
      strategy:
        enabled && draft.ccaRepayment.strategy === 'aucun'
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
      footer={
        <div className="ts-phase-modal__footer-inner" data-testid="ts-phase-modal-footer">
          <button
            type="button"
            className="sim-modal-btn sim-modal-btn--ghost"
            onClick={onDelete}
            disabled={phases.length <= 1}
          >
            Supprimer ce palier
          </button>
          <div className="ts-phase-modal__footer-actions">
            <button type="button" className="sim-modal-btn sim-modal-btn--ghost" onClick={onClose}>
              Annuler
            </button>
            <button
              type="button"
              className="sim-modal-btn sim-modal-btn--primary"
              onClick={() => onSave(normalizePhaseForSave(draft))}
              disabled={!canSave}
            >
              Valider
            </button>
          </div>
        </div>
      }
    >
      {periodError ? (
        <p className="ts-warning" role="alert">
          {periodError}
        </p>
      ) : null}
      {overlapMessages.map((message) => (
        <p key={message} className="ts-warning" role="alert">
          {message}
        </p>
      ))}
      {periodWarning ? <p className="ts-note--info">{periodWarning}</p> : null}
      {simultaneousCcaWarning ? <p className="ts-note--info">{simultaneousCcaWarning}</p> : null}

      <div className="ts-pocket-modal-summary">
        <span>Net annuel estimé avant IR {fmtEuro(netRevenue)}</span>
        <span>
          {activeCount} sous-phase{activeCount > 1 ? 's' : ''} active{activeCount > 1 ? 's' : ''}
        </span>
      </div>

      <TresoTimelineMiniPreview
        phase={draft}
        phases={phasesWithDraft}
        subsidiaries={subsidiaries}
        horizonYear={horizonYear}
      />

      <div className="ts-phase-modal-layout">
        <nav className="ts-phase-modal-nav" aria-label="Sous-phases du palier">
          {SUB_PHASE_NAV.map((item) => (
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
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => toggleSubPhase(item.key, event.target.checked)}
              />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="ts-phase-modal-panel">
          <TresoRevenuePhasePeriodPanel draft={draft} onPatch={patchDraft} />

          {activeSubPhase === 'remuneration' ? (
            <TresoRevenuePhaseRemunerationPanel
              draft={draft}
              netRevenue={netRevenue}
              subsidiaryOptions={subsidiaryOptions}
              remunerationSourceOptions={remunerationSourceOptions}
              onPatch={patchRemuneration}
            />
          ) : null}

          {activeSubPhase === 'distribution' ? (
            <TresoRevenuePhaseDistributionPanel draft={draft} onPatch={patchDistribution} />
          ) : null}

          {activeSubPhase === 'ccaContribution' ? (
            <TresoRevenuePhaseCcaContributionPanel draft={draft} onPatch={patchCcaContribution} />
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
