import { ExportMenu } from '@/components/ExportMenu';
import type { PlacementStep } from '../utils/normalizers';

interface PlacementToolbarProps {
  exportLoading: boolean;
  onExportExcel: () => void | Promise<void>;
  canExportExcel: boolean;
  step: PlacementStep;
  onStepChange: (_step: PlacementStep) => void;
  isExpert: boolean;
  onToggleMode: () => void;
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

export function PlacementToolbar({
  exportLoading,
  onExportExcel,
  canExportExcel,
  step,
  onStepChange,
  isExpert,
  onToggleMode,
}: PlacementToolbarProps) {
  return (
    <>
      <div className="premium-header pl-header">
        <h1 className="premium-title">Comparer deux placements</h1>

        <div className="pl-header__subtitle-row">
          <p className="premium-subtitle">Épargne → Liquidation → Transmission</p>

          <div className="pl-header__actions pl-header-actions">
            <button
              type="button"
              className="chip premium-btn pl-mode-btn"
              onClick={onToggleMode}
              data-testid="placement-mode-btn"
            >
              {isExpert ? 'Mode expert' : 'Mode simplifié'}
            </button>

            <ExportMenu
              options={[
                { label: 'Excel', onClick: onExportExcel, disabled: !canExportExcel },
                { label: 'PowerPoint', onClick: () => {}, disabled: true, tooltip: 'bientôt' },
              ]}
              loading={exportLoading}
            />
          </div>
        </div>
      </div>

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
    </>
  );
}
