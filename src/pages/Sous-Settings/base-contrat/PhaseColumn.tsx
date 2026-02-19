/**
 * PhaseColumn — colonne de phase (constitution / sortie / décès) dans la fiche produit.
 * Extrait de BaseContrat.tsx (refactor godfile — PR feat/base-contrat-ux-nav).
 */

import React from 'react';
import type { Phase, Block } from '@/types/baseContratSettings';
import { PHASE_LABELS, MISC_LABELS } from '@/constants/baseContratLabels';
import { FieldRenderer } from './FieldRenderer';

function chipStyle(bg: string, fg: string): React.CSSProperties {
  return { fontSize: 11, padding: '2px 8px', borderRadius: 4, background: bg, color: fg, fontWeight: 600, lineHeight: '18px' };
}

export function PhaseColumn({
  phaseKey,
  phase,
  disabled,
  showDetails = false,
  onFieldChange,
  onApplicableChange,
}: {
  phaseKey: string;
  phase: Phase;
  disabled: boolean;
  showDetails?: boolean;
  onFieldChange: (_blockId: string, _fieldKey: string, _value: unknown) => void;
  onApplicableChange?: (_applicable: boolean) => void;
}) {
  if (!phase.applicable) {
    return (
      <div style={{ flex: 1, minWidth: 240 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-c10)', marginBottom: 8 }}>{PHASE_LABELS[phaseKey]}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={chipStyle('var(--color-c8)', 'var(--color-c9)')}>{MISC_LABELS.phaseNotApplicable}</span>
          {!disabled && onApplicableChange && (
            <button
              type="button"
              onClick={() => onApplicableChange(true)}
              title={MISC_LABELS.phaseApplicableToggleHint}
              style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, border: '1px solid var(--color-c8)', background: 'none', color: 'var(--color-c9)', cursor: 'pointer' }}
            >
              {MISC_LABELS.phaseMarkApplicable}
            </button>
          )}
        </div>
        {!disabled && (
          <p style={{ fontSize: 11, color: 'var(--color-c9)', fontStyle: 'italic', marginTop: 6 }}>
            {MISC_LABELS.phaseNotApplicableHint}
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, minWidth: 240 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-c10)', margin: 0 }}>{PHASE_LABELS[phaseKey]}</h4>
        {!disabled && onApplicableChange && (
          <button
            type="button"
            onClick={() => onApplicableChange(false)}
            title={MISC_LABELS.phaseNotApplicableToggleHint}
            style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, border: '1px solid var(--color-c8)', background: 'none', color: 'var(--color-c9)', cursor: 'pointer' }}
          >
            {MISC_LABELS.phaseMarkNotApplicable}
          </button>
        )}
      </div>
      {phase.blocks.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--color-c9)', fontStyle: 'italic' }}>{MISC_LABELS.noBlocks}</p>
      ) : (
        phase.blocks.map((block: Block) => (
          <div
            key={block.blockId}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--color-c8)',
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-c10)', marginBottom: 6 }}>
              {block.uiTitle}
              {block.audience !== 'all' && (
                <span style={{ ...chipStyle('var(--color-c8)', 'var(--color-c9)'), marginLeft: 6 }}>{block.audience}</span>
              )}
            </div>
            {Object.entries(block.payload).map(([fKey, fDef]) => (
              <FieldRenderer
                key={fKey}
                fieldKey={fKey}
                def={fDef}
                disabled={disabled}
                showDetails={showDetails}
                onChange={(k, v) => onFieldChange(block.blockId, k, v)}
              />
            ))}
            {block.notes && (
              <p style={{ fontSize: 11, color: 'var(--color-c9)', fontStyle: 'italic', margin: '6px 0 0' }}>
                {block.notes}
              </p>
            )}
            {block.dependencies && block.dependencies.length > 0 && (
              <p style={{ fontSize: 11, color: 'var(--color-c9)', margin: '4px 0 0' }}>
                Conditions : {block.dependencies.join(' · ')}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
