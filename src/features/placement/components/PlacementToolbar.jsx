import React from 'react';
import { ExportMenu } from '@/components/ExportMenu';

export function PlacementToolbar({
  exportLoading,
  onExportExcel,
  canExportExcel,
  step,
  onStepChange,
}) {
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
        {['epargne', 'liquidation', 'transmission'].map((phase) => (
          <button
            key={phase}
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
