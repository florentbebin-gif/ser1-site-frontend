/**
 * FieldRenderer — rendu d'un champ FieldDef dans un bloc de phase.
 * Extrait de BaseContrat.tsx (refactor godfile — PR feat/base-contrat-ux-nav).
 *
 * UX premium :
 *  - Labels métier FR (FIELD_LABELS_FR + humanizeFieldKey) — 0 camelCase visible
 *  - Références $ref → libellé lisible + source (formatRefLabel) — 0 $ref: visible
 *  - Badge "Utilisé par les simulateurs" (remplace "Calc.")
 *  - Mode Détails (showDetails=true) : affiche clé interne + $ref brut
 */

import React from 'react';
import type { FieldDef } from '@/types/baseContratSettings';
import { humanizeFieldKey, formatRefLabel } from '@/constants/base-contrat/fieldLabels.fr';

function chipStyle(bg: string, fg: string): React.CSSProperties {
  return { fontSize: 11, padding: '2px 8px', borderRadius: 4, background: bg, color: fg, fontWeight: 600, lineHeight: '18px' };
}

const CALC_TOOLTIP = 'Cette valeur est utilisée dans les calculs (IR, placements, prévoyance…)';
const CALC_LABEL = '★ Simulateurs';

/** Badge "Utilisé par les simulateurs" — remplace l'ancien badge "Calc." ambigu */
function CalcBadge() {
  return (
    <span
      title={CALC_TOOLTIP}
      style={{ ...chipStyle('var(--color-c3)', '#FFFFFF'), marginLeft: 4, cursor: 'help' }}
    >
      {CALC_LABEL}
    </span>
  );
}

/** Affiche la clé interne en mode Détails */
function InternalKeyHint({ fieldKey }: { fieldKey: string }) {
  return (
    <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--color-c9)', fontFamily: 'monospace', opacity: 0.7 }}>
      [{fieldKey}]
    </span>
  );
}

/** Rendu d'une valeur $ref en mode normal : libellé + source + lien optionnel */
function RefValueDisplay({ refStr, showDetails }: { refStr: string; showDetails: boolean }) {
  const meta = formatRefLabel(refStr);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: 'var(--color-c9)', fontStyle: 'italic' }}>
        Valeur automatique —{' '}
        <strong style={{ color: 'var(--color-c10)' }}>{meta.label}</strong>
      </span>
      <span style={{ fontSize: 11, color: 'var(--color-c9)' }}>({meta.source})</span>
      {meta.settingsRoute && (
        <a
          href={meta.settingsRoute}
          style={{ fontSize: 11, color: 'var(--color-c3)', textDecoration: 'underline' }}
          title={`Ouvrir ${meta.source}`}
        >
          ↗ Ouvrir
        </a>
      )}
      {showDetails && (
        <span style={{ fontSize: 10, color: 'var(--color-c9)', fontFamily: 'monospace', opacity: 0.7 }}>
          {refStr}
        </span>
      )}
    </div>
  );
}

export function FieldRenderer({
  fieldKey,
  def,
  disabled,
  showDetails = false,
  onChange,
}: {
  fieldKey: string;
  def: FieldDef;
  disabled: boolean;
  showDetails?: boolean;
  onChange: (_key: string, _value: unknown) => void;
}) {
  const isRef = def.type === 'ref';
  const label = humanizeFieldKey(fieldKey);

  if (def.type === 'boolean') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <input
          type="checkbox"
          checked={!!def.value}
          disabled={disabled}
          onChange={(e) => onChange(fieldKey, e.target.checked)}
        />
        <span style={{ fontSize: 13, color: 'var(--color-c10)' }}>{label}</span>
        {def.calc && <CalcBadge />}
        {showDetails && <InternalKeyHint fieldKey={fieldKey} />}
      </div>
    );
  }

  if (def.type === 'enum' && def.options) {
    return (
      <div style={{ marginBottom: 6 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--color-c9)', marginBottom: 2 }}>
          {label}
          {def.calc && <CalcBadge />}
          {showDetails && <InternalKeyHint fieldKey={fieldKey} />}
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
          {label}
          {def.calc && <CalcBadge />}
          {showDetails && <InternalKeyHint fieldKey={fieldKey} />}
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

  // Champ $ref : affichage lisible (jamais la chaîne brute en mode normal)
  if (isRef) {
    return (
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--color-c9)' }}>{label}</span>
          {def.unit && <span style={{ fontSize: 11, color: 'var(--color-c9)' }}>({def.unit})</span>}
          {def.calc && <CalcBadge />}
          {showDetails && <InternalKeyHint fieldKey={fieldKey} />}
        </div>
        <RefValueDisplay refStr={String(def.value ?? '')} showDetails={showDetails} />
      </div>
    );
  }

  // Default: number / string
  return (
    <div style={{ marginBottom: 6 }}>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--color-c9)', marginBottom: 2 }}>
        {label}
        {def.unit && <span style={{ marginLeft: 4, fontSize: 11 }}>({def.unit})</span>}
        {def.calc && <CalcBadge />}
        {showDetails && <InternalKeyHint fieldKey={fieldKey} />}
      </label>
      <input
        type={def.type === 'number' ? 'number' : 'text'}
        value={String(def.value ?? '')}
        disabled={disabled}
        step={def.type === 'number' ? '0.01' : undefined}
        onChange={(e) => onChange(fieldKey, def.type === 'number' ? Number(e.target.value) : e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', fontSize: 13, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--color-c8)', backgroundColor: '#FFFFFF' }}
      />
    </div>
  );
}
