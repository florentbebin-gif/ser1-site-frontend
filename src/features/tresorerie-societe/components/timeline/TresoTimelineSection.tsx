import { useMemo, useState } from 'react';
import type {
  AssociateInputV5,
  AssociateRevenuePhaseInput,
  CompanyInputV5,
  TresoInputsV5,
} from '@/engine/tresorerie/types';
import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import {
  addPhase,
  buildNextPhase,
  removePhase,
  sortPhases,
  updatePhase,
} from '../../utils/revenuePhases';
import { TresoRevenuePhaseModal } from './TresoRevenuePhaseModal';
import { TresoTimelineEmptyState } from './TresoTimelineEmptyState';
import { TresoTimelinePhaseList } from './TresoTimelinePhaseList';
import { TresoTimelineTrack } from './TresoTimelineTrack';
import { TresoTimelineYearScrubber } from './TresoTimelineYearScrubber';
import { computeTimelineRange } from './timelineLayout';

interface TresoTimelineSectionProps {
  inputs: TresoInputsV5;
  onChange: (nextInputs: TresoInputsV5) => void;
}

function getSelectedAssociate(inputs: TresoInputsV5): AssociateInputV5 | undefined {
  const selectedId = inputs.selectedAssociateId || inputs.foyer.selectedAssociateId;
  return inputs.company.associates.find(associate => associate.id === selectedId)
    ?? inputs.company.associates[0];
}

function isTimelineReady(company: CompanyInputV5, associate: AssociateInputV5 | undefined): boolean {
  return Boolean(
    company.label?.trim()
      && company.legalForm
      && company.projectionStartYear
      && associate?.kind === 'pp'
      && (associate.profile?.currentAge ?? 0) > 0,
  );
}

export function TresoTimelineSection({ inputs, onChange }: TresoTimelineSectionProps) {
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [horizonYears, setHorizonYears] = useState(15);
  const selectedAssociate = getSelectedAssociate(inputs);
  const projectionStartYear =
    inputs.company.projectionStartYear ??
    selectedAssociate?.profile?.projectionStartYear ??
    new Date().getFullYear();
  const phases = selectedAssociate ? sortPhases(selectedAssociate.revenuePhases) : [];
  const layout = useMemo(
    () => selectedAssociate
      ? computeTimelineRange(inputs.company, selectedAssociate, horizonYears)
      : null,
    [horizonYears, inputs.company, selectedAssociate],
  );
  const editingPhase = editingPhaseId
    ? phases.find(phase => phase.id === editingPhaseId) ?? null
    : null;

  const patchCompany = (patch: Partial<CompanyInputV5>) => {
    onChange({ ...inputs, company: { ...inputs.company, ...patch } });
  };

  const patchProjectionStartYear = (year: number) => {
    const safeYear = year || projectionStartYear;
    onChange({
      ...inputs,
      company: {
        ...inputs.company,
        projectionStartYear: safeYear,
        associates: inputs.company.associates.map(associate => ({
          ...associate,
          profile: associate.profile
            ? { ...associate.profile, projectionStartYear: safeYear }
            : associate.profile,
        })),
      },
    });
  };

  const patchSelectedAssociate = (patch: Partial<AssociateInputV5>) => {
    if (!selectedAssociate) return;
    patchCompany({
      associates: inputs.company.associates.map(associate =>
        associate.id === selectedAssociate.id ? { ...associate, ...patch } : associate,
      ),
    });
  };

  const setPhases = (nextPhases: AssociateRevenuePhaseInput[]) => {
    patchSelectedAssociate({ revenuePhases: sortPhases(nextPhases) });
  };

  const addRevenuePhase = () => {
    const nextPhase = buildNextPhase(phases, projectionStartYear, () => `phase-${Date.now()}-${phases.length + 1}`);
    setPhases(addPhase(phases, nextPhase));
    setEditingPhaseId(nextPhase.id);
  };

  const saveRevenuePhase = (phase: AssociateRevenuePhaseInput) => {
    setPhases(updatePhase(phases, phase.id, phase));
    setEditingPhaseId(null);
  };

  const deleteRevenuePhase = () => {
    if (!editingPhase) return;
    setPhases(removePhase(phases, editingPhase.id));
    setEditingPhaseId(null);
  };

  return (
    <section className="premium-card ts-section ts-timeline-section" aria-labelledby="ts-timeline-title">
      <div className="ts-section__header">
        <span className="sim-card__icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <polyline points="8 8 3 12 8 16" />
            <polyline points="16 8 21 12 16 16" />
          </svg>
        </span>
        <div>
          <h2 className="ts-section__title" id="ts-timeline-title">
            Parcours de revenus de l’associé
          </h2>
          <p className="ts-section__subtitle">
            Phases de rémunération, besoins nets et priorité CCA de l’associé sélectionné
          </p>
        </div>
      </div>
      <div className="ts-section__divider" />

      {!selectedAssociate ? (
        <TresoTimelineEmptyState />
      ) : selectedAssociate.kind === 'pm' ? (
        <div className="ts-timeline-empty">
          <strong>Associé personne morale</strong>
          <p>Une personne morale ne porte pas de parcours de revenu personnel.</p>
        </div>
      ) : !isTimelineReady(inputs.company, selectedAssociate) ? (
        <TresoTimelineEmptyState />
      ) : layout ? (
        <div className="ts-timeline-content">
          <TresoTimelineYearScrubber
            projectionStartYear={projectionStartYear}
            selectedAssociateAge={selectedAssociate.profile?.currentAge}
            onChange={patchProjectionStartYear}
          />

          <div className="ts-timeline-horizon-row">
            <SimFieldShell
              label="Horizon de projection"
              className="ts-field"
              rowClassName="ts-field__row"
              controlId="ts-horizon-years"
            >
              <input
                id="ts-horizon-years"
                type="number"
                min={5}
                max={40}
                step={1}
                value={horizonYears}
                className="sim-field__control"
                onChange={event => {
                  const value = Number(event.target.value);
                  if (value >= 5 && value <= 40) setHorizonYears(value);
                }}
              />
              <span className="sim-field__unit ts-unit">ans</span>
            </SimFieldShell>
          </div>

          <TresoTimelineTrack layout={layout} onEditPhase={setEditingPhaseId} />

          <div className="ts-timeline-actions">
            <button type="button" className="ts-secondary-btn" onClick={addRevenuePhase}>
              Ajouter un palier
            </button>
          </div>

          <TresoTimelinePhaseList
            phases={phases}
            horizonYear={layout.endYear}
            onEditPhase={setEditingPhaseId}
          />
        </div>
      ) : null}

      {editingPhase && layout ? (
        <TresoRevenuePhaseModal
          phase={editingPhase}
          phases={phases}
          subsidiaries={inputs.company.subsidiaries}
          horizonYear={layout.endYear}
          onSave={saveRevenuePhase}
          onDelete={deleteRevenuePhase}
          onClose={() => setEditingPhaseId(null)}
        />
      ) : null}
    </section>
  );
}
