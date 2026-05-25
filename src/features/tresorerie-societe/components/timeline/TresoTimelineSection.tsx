import { useEffect, useMemo, useState } from 'react';
import { IconArrowLeftRight, IconSettings } from '@/icons/ui';
import type {
  AssociateInputV6,
  AssociateRevenuePhaseInputV6,
  CompanyInputV6,
  TresoInputsV6,
} from '@/engine/tresorerie/types';
import { SimAmountInputNumeric } from '@/components/ui/sim';
import { buildNextPhase, sortPhases } from '../../utils/revenuePhases';
import { TresoRevenuePhaseModal } from './TresoRevenuePhaseModal';
import { TresoTimelineEmptyState } from './TresoTimelineEmptyState';
import { TresoTimelinePhaseList } from './TresoTimelinePhaseList';
import { TresoTimelineTrack } from './TresoTimelineTrack';
import { TresoTimelineYearScrubber } from './TresoTimelineYearScrubber';
import { computeTimelineRange } from './timelineLayout';
import { getTresoReadiness } from '../../utils/tresorerieReadiness';
import { normalizeProjectionHorizonYears } from '../../utils/projectionHorizon';

interface TresoTimelineSectionProps {
  inputs: TresoInputsV6;
  onChange: (nextInputs: TresoInputsV6) => void;
  onOpenAssociateModal?: (associateId: string) => void;
}

export function TresoTimelineSection({
  inputs,
  onChange,
  onOpenAssociateModal,
}: TresoTimelineSectionProps) {
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [horizonYears, setHorizonYears] = useState(() =>
    normalizeProjectionHorizonYears(inputs.company.projectionHorizonYears),
  );
  const readiness = getTresoReadiness(inputs);
  const selectedAssociate = readiness.selectedAssociate as AssociateInputV6 | undefined;
  const projectionStartYear =
    inputs.company.projectionStartYear ??
    selectedAssociate?.profile?.projectionStartYear ??
    new Date().getFullYear();
  const phases = selectedAssociate ? sortPhases(selectedAssociate.revenuePhases) : [];
  const layout = useMemo(
    () =>
      selectedAssociate
        ? computeTimelineRange(inputs.company, selectedAssociate, horizonYears)
        : null,
    [horizonYears, inputs.company, selectedAssociate],
  );
  const editingPhase = editingPhaseId
    ? (phases.find((phase) => phase.id === editingPhaseId) ?? null)
    : null;
  const selectedAssociateCcaCurrentBalance = selectedAssociate?.cca?.currentBalance ?? 0;

  useEffect(() => {
    setHorizonYears(normalizeProjectionHorizonYears(inputs.company.projectionHorizonYears));
  }, [inputs.company.projectionHorizonYears]);

  const patchCompany = (patch: Partial<CompanyInputV6>) => {
    onChange({ ...inputs, company: { ...inputs.company, ...patch } });
  };

  const patchProjectionHorizonYears = (value: number) => {
    const horizon = normalizeProjectionHorizonYears(value);
    setHorizonYears(horizon);
    patchCompany({ projectionHorizonYears: horizon });
  };

  const patchProjectionStartYear = (year: number) => {
    const safeYear = year || projectionStartYear;
    onChange({
      ...inputs,
      company: {
        ...inputs.company,
        projectionStartYear: safeYear,
        associates: inputs.company.associates.map((associate) => ({
          ...associate,
          profile: associate.profile
            ? { ...associate.profile, projectionStartYear: safeYear }
            : associate.profile,
        })),
      },
    });
  };

  const patchSelectedAssociate = (patch: Partial<AssociateInputV6>) => {
    if (!selectedAssociate) return;
    patchCompany({
      associates: inputs.company.associates.map((associate) =>
        associate.id === selectedAssociate.id ? { ...associate, ...patch } : associate,
      ),
    });
  };

  const setPhases = (nextPhases: AssociateRevenuePhaseInputV6[]) => {
    patchSelectedAssociate({ revenuePhases: sortPhases(nextPhases) });
  };

  const addRevenuePhase = () => {
    const nextPhase = buildNextPhase(
      phases,
      projectionStartYear,
      () => `phase-${Date.now()}-${phases.length + 1}`,
    ) as AssociateRevenuePhaseInputV6;
    setPhases(sortPhases([...phases, nextPhase]));
    setEditingPhaseId(nextPhase.id);
  };

  const saveRevenuePhase = (phase: AssociateRevenuePhaseInputV6) => {
    setPhases(sortPhases(phases.map((item) => (item.id === phase.id ? phase : item))));
    setEditingPhaseId(null);
  };

  const deleteRevenuePhase = () => {
    if (!editingPhase) return;
    if (phases.length <= 1) return;
    setPhases(sortPhases(phases.filter((phase) => phase.id !== editingPhase.id)));
    setEditingPhaseId(null);
  };

  return (
    <section
      className="premium-card ts-section ts-timeline-section"
      aria-labelledby="ts-timeline-title"
    >
      <div className="ts-section__header">
        <span className="sim-card__icon">
          <IconArrowLeftRight />
        </span>
        <div>
          <h2 className="ts-section__title" id="ts-timeline-title">
            Parcours de revenus de l’associé
          </h2>
          <p className="ts-section__subtitle">
            Phases de rémunération, objectifs nets et priorité CCA de l’associé sélectionné
          </p>
        </div>
        {selectedAssociate ? (
          <button
            type="button"
            className="ts-icon-btn ts-section__header-action"
            aria-label="Paramétrer l’associé"
            onClick={() => onOpenAssociateModal?.(selectedAssociate.id)}
          >
            <IconSettings />
          </button>
        ) : null}
      </div>
      <div className="ts-section__divider" />

      {!selectedAssociate ? (
        <TresoTimelineEmptyState />
      ) : selectedAssociate.kind === 'pm' ? (
        <div className="ts-timeline-empty">
          <strong>Associé personne morale</strong>
          <p>Une personne morale ne porte pas de parcours de revenu personnel.</p>
        </div>
      ) : !readiness.personalTimelineReady ? (
        <TresoTimelineEmptyState />
      ) : layout ? (
        <div className="ts-timeline-content">
          <div className="ts-timeline-settings-grid">
            <TresoTimelineYearScrubber
              projectionStartYear={projectionStartYear}
              selectedAssociateAge={selectedAssociate.profile?.currentAge}
              onChange={patchProjectionStartYear}
            />

            <div className="ts-timeline-horizon-row">
              <SimAmountInputNumeric
                label="Horizon de projection"
                value={horizonYears}
                min={5}
                max={60}
                unit="ans"
                fieldClassName="ts-field"
                rowClassName="ts-field__row"
                unitClassName="ts-unit"
                onChange={(value) => patchProjectionHorizonYears(Math.round(value))}
              />
            </div>
          </div>

          <TresoTimelineTrack layout={layout} onEditPhase={setEditingPhaseId} />

          <div className="ts-timeline-actions">
            <button type="button" className="ts-text-btn" onClick={addRevenuePhase}>
              Ajouter un palier
            </button>
          </div>

          <TresoTimelinePhaseList phases={phases} onEditPhase={setEditingPhaseId} />
        </div>
      ) : null}

      {editingPhase && layout ? (
        <TresoRevenuePhaseModal
          phase={editingPhase}
          phases={phases}
          subsidiaries={inputs.company.subsidiaries}
          horizonYear={layout.endYear}
          ccaCurrentBalance={selectedAssociateCcaCurrentBalance}
          onSave={saveRevenuePhase}
          onDelete={deleteRevenuePhase}
          onClose={() => setEditingPhaseId(null)}
        />
      ) : null}
    </section>
  );
}
