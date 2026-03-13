import { ExportMenu } from '@/components/ExportMenu';
import type { PlacementStep } from '../utils/normalizers';

interface PlacementToolbarProps {
  exportLoading: boolean;
  onExportExcel: () => void | Promise<void>;
  canExportExcel: boolean;
  step: PlacementStep;
  onStepChange: (_step: PlacementStep) => void;
}

const PLACEMENT_PHASES: Array<Exclude<PlacementStep, 'synthese'>> = [
  'epargne',
  'liquidation',
  'transmission',
];

export function PlacementToolbar({
  exportLoading,
  onExportExcel,
  canExportExcel,
  step,
  onStepChange,
}: PlacementToolbarProps) {
  return (
    <>
      <div className="pl-ir-header pl-header premium-header">
        <div className="pl-header-main">
          <div className="pl-ir-title premium-title">Comparer deux placements</div>
          <div className="pl-subtitle premium-subtitle">Épargne → Liquidation → Transmission</div>
        </div>

        <div className="pl-header-actions">
          <ExportMenu
            options={[
              { label: 'Excel', onClick: onExportExcel, disabled: !canExportExcel },
              { label: 'PowerPoint', onClick: () => {}, disabled: true, tooltip: 'bientôt' },
            ]}
            loading={exportLoading}
          />
        </div>
      </div>

      <div className="pl-phase-nav">
        {PLACEMENT_PHASES.map((phase) => (
          <button
            key={phase}
            type="button"
            className={`pl-phase-tab ${step === phase ? 'is-active' : ''}`}
            onClick={() => onStepChange(phase)}
          >
            {phase === 'epargne' && "Phase d'épargne"}
            {phase === 'liquidation' && 'Phase de liquidation'}
            {phase === 'transmission' && 'Phase de transmission'}
          </button>
        ))}
      </div>
    </>
  );
}

