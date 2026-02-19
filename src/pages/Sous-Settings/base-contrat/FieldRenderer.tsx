/**
 * FieldRenderer — rendu d'un champ FieldDef dans un bloc de phase.
 * Extrait de BaseContrat.tsx (refactor godfile — PR feat/base-contrat-ux-nav).
 */

import React from 'react';
import type { FieldDef } from '@/types/baseContratSettings';

function chipStyle(bg: string, fg: string): React.CSSProperties {
  return { fontSize: 11, padding: '2px 8px', borderRadius: 4, background: bg, color: fg, fontWeight: 600, lineHeight: '18px' };
}

const CALC_BADGE = 'Calc.';
const REF_TOOLTIP = 'Valeur issue des paramètres Impôts / Prélèvements sociaux';

export function FieldRenderer({
  fieldKey,
  def,
  disabled,
  onChange,
}: {
  fieldKey: string;
  def: FieldDef;
  disabled: boolean;
  onChange: (_key: string, _value: unknown) => void;
}) {
  const isRef = def.type === 'ref';
  const label = fieldKey;

  if (def.type === 'boolean') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <input
          type="checkbox"
          checked={!!def.value}
          disabled={disabled || isRef}
          onChange={(e) => onChange(fieldKey, e.target.checked)}
        />
        <span style={{ fontSize: 13, color: 'var(--color-c10)' }}>{label}</span>
        {def.calc && <span style={chipStyle('var(--color-c3)', '#FFFFFF')}>{CALC_BADGE}</span>}
        {isRef && <span title={REF_TOOLTIP} style={{ fontSize: 11, color: 'var(--color-c9)', fontStyle: 'italic', cursor: 'help' }}>↗ ref</span>}
      </div>
    );
  }

  if (def.type === 'enum' && def.options) {
    return (
      <div style={{ marginBottom: 6 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--color-c9)', marginBottom: 2 }}>
          {label} {def.calc && <span style={chipStyle('var(--color-c3)', '#FFFFFF')}>{CALC_BADGE}</span>}
        </label>
        <select
          value={String(def.value ?? '')}
          disabled={disabled}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          style={{ fontSize: 13, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--color-c8)', backgroundColor: '#FFFFFF' }}
        >
          {def.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  if (def.type === 'brackets' && Array.isArray(def.value)) {
    return (
      <div style={{ marginBottom: 6 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--color-c9)', marginBottom: 4 }}>
          {label} {def.calc && <span style={chipStyle('var(--color-c3)', '#FFFFFF')}>{CALC_BADGE}</span>}
        </label>
        <table style={{ fontSize: 12, borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid var(--color-c8)' }}>Jusqu&apos;à</th>
              <th style={{ textAlign: 'right', padding: '4px 8px', borderBottom: '1px solid var(--color-c8)' }}>Taux %</th>
            </tr>
          </thead>
          <tbody>
            {(def.value as Array<{ upTo: number | null; ratePercent: number }>).map((row, i) => (
              <tr key={i}>
                <td style={{ padding: '4px 8px', borderBottom: '1px solid var(--color-c8)' }}>
                  {row.upTo === null ? '∞' : row.upTo.toLocaleString('fr-FR')}
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid var(--color-c8)' }}>
                  <input
                    type="number"
                    value={row.ratePercent}
                    disabled={disabled}
                    step="0.01"
                    onChange={(e) => {
                      const updated = [...(def.value as Array<{ upTo: number | null; ratePercent: number }>)];
                      updated[i] = { ...updated[i], ratePercent: Number(e.target.value) };
                      onChange(fieldKey, updated);
                    }}
                    style={{ width: 70, textAlign: 'right', fontSize: 12, padding: '4px 6px', borderRadius: 4, border: '1px solid var(--color-c8)', backgroundColor: '#FFFFFF' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Default: number / string / ref
  const displayValue = isRef ? String(def.value ?? '') : (def.value ?? '');
  return (
    <div style={{ marginBottom: 6 }}>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--color-c9)', marginBottom: 2 }}>
        {label}
        {def.unit && <span style={{ marginLeft: 4, fontSize: 11 }}>({def.unit})</span>}
        {def.calc && <span style={{ ...chipStyle('var(--color-c3)', '#FFFFFF'), marginLeft: 4 }}>{CALC_BADGE}</span>}
        {isRef && <span title={REF_TOOLTIP} style={{ marginLeft: 4, fontSize: 11, color: 'var(--color-c9)', fontStyle: 'italic', cursor: 'help' }}>↗ ref</span>}
      </label>
      <input
        type={def.type === 'number' ? 'number' : 'text'}
        value={String(displayValue)}
        disabled={disabled || isRef}
        step={def.type === 'number' ? '0.01' : undefined}
        onChange={(e) => onChange(fieldKey, def.type === 'number' ? Number(e.target.value) : e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', fontSize: 13, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--color-c8)', backgroundColor: isRef ? 'var(--color-c8)' : '#FFFFFF', fontStyle: isRef ? 'italic' : 'normal' }}
      />
    </div>
  );
}
