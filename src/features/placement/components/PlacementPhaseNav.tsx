import type { PlacementStep } from '../utils/normalizers';

interface PlacementPhaseNavProps {
  step: PlacementStep;
  onStepChange: (_step: PlacementStep) => void;
}

const PLACEMENT_PHASES: Array<Exclude<PlacementStep, 'synthese'>> = [
  'epargne',
  'liquidation',
  'transmission',
];

const PLACEMENT_PHASE_LABELS: Record<Exclude<PlacementStep, 'synthese'>, string> = {
  epargne: 'Épargne',
  liquidation: 'Liquidation',
  transmission: 'Transmission',
};

export function PlacementPhaseNav({
  step,
  onStepChange,
}: PlacementPhaseNavProps) {
  return (
    <div className="pl-phase-nav" role="tablist" aria-label="Phases de la simulation placement">
      {PLACEMENT_PHASES.map((phase) => (
        <button
          key={phase}
          type="button"
          role="tab"
          aria-selected={step === phase}
          className={`pl-phase-tab ${step === phase ? 'is-active' : ''}`}
          onClick={() => onStepChange(phase)}
        >
          {PLACEMENT_PHASE_LABELS[phase]}
        </button>
      ))}
    </div>
  );
}
