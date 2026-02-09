/**
 * CreditInputs.jsx - Composants de saisie réutilisables pour le simulateur de crédit
 * 
 * Inspiré de placement/components/inputs.jsx
 * Tous les inputs respectent la gouvernance UI :
 * - Fond BLANC (#FFFFFF) impératif
 * - Bordure C8, focus C2
 * - Typo héritée, 13px
 */

import React, { useState, useEffect } from 'react';
import { parseCapital, parseTaux, formatTauxInput } from '../utils/creditFormatters.js';

// ============================================================================
// STYLES COMMUNS (inline pour isolation)
// ============================================================================

const inputBaseStyle = {
  height: '32px',
  width: '100%',
  boxSizing: 'border-box',
  padding: '4px 8px',
  borderRadius: '6px',
  border: '1px solid var(--color-c8)',
  textAlign: 'right',
  backgroundColor: '#FFFFFF', // ✅ BLANC impératif per ui-governance.md
  fontFamily: 'inherit',
  fontSize: '13px',
  color: 'var(--color-c10)',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const inputFocusStyle = {
  outline: 'none',
  borderColor: 'var(--color-c2)',
  boxShadow: '0 0 0 2px var(--color-c4)',
};

const labelStyle = {
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--color-c9)',
  marginBottom: '4px',
  display: 'block',
};

const unitStyle = {
  fontSize: '13px',
  color: 'var(--color-c9)',
  minWidth: '24px',
  marginLeft: '6px',
};

const hintStyle = {
  fontSize: '11px',
  color: 'var(--color-c9)',
  marginTop: '2px',
  fontStyle: 'italic',
};

const fieldContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const inputWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
};

// ============================================================================
// INPUT EURO (Montant avec unité €)
// ============================================================================

export function InputEuro({ 
  label, 
  value, 
  onChange, 
  disabled = false, 
  hint,
  testId,
  dataTestId,
  onBlur,
}) {
  const fmt = (n) => (Math.round(Number(n) || 0)).toLocaleString('fr-FR');
  
  const handleChange = (e) => {
    const parsed = parseCapital(e.target.value);
    onChange(parsed);
  };

  return (
    <div style={fieldContainerStyle} data-testid={dataTestId || testId}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={inputWrapperStyle}>
        <input
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={fmt(value)}
          onChange={handleChange}
          style={{
            ...inputBaseStyle,
            ...(disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
          }}
          onFocus={(e) => {
            Object.assign(e.target.style, inputFocusStyle);
          }}
          onBlur={(e) => {
            Object.assign(e.target.style, inputBaseStyle);
            onBlur?.(e);
          }}
        />
        <span style={unitStyle}>€</span>
      </div>
      {hint && <span style={hintStyle}>{hint}</span>}
    </div>
  );
}

// ============================================================================
// INPUT POURCENTAGE (Taux avec unité %)
// ============================================================================

export function InputPct({ 
  label, 
  rawValue, 
  onBlur,
  disabled = false, 
  hint,
  testId,
  placeholder = "0,00",
}) {
  const [local, setLocal] = useState(rawValue || '');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setLocal(rawValue || '');
  }, [rawValue, focused]);

  const handleChange = (e) => {
    setLocal(formatTauxInput(e.target.value));
  };

  const handleBlur = (e) => {
    setFocused(false);
    const num = parseTaux(local);
    setLocal(num.toFixed(2).replace('.', ','));
    Object.assign(e.target.style, inputBaseStyle);
    onBlur?.(num);
  };

  return (
    <div style={fieldContainerStyle} data-testid={testId}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={inputWrapperStyle}>
        <input
          type="text"
          inputMode="decimal"
          disabled={disabled}
          value={local}
          placeholder={placeholder}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{
            ...inputBaseStyle,
            ...(disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
          }}
          onFocus={(e) => {
            setFocused(true);
            Object.assign(e.target.style, inputFocusStyle);
          }}
        />
        <span style={unitStyle}>%</span>
      </div>
      {hint && <span style={hintStyle}>{hint}</span>}
    </div>
  );
}

// ============================================================================
// INPUT NOMBRE (Durée, Quotité, etc.)
// ============================================================================

export function InputNumber({ 
  label, 
  value, 
  onChange, 
  unit,
  min = 0,
  max = 999,
  disabled = false, 
  hint,
  testId,
  onBlur,
}) {
  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 3);
    const num = Math.min(max, Math.max(min, parseInt(raw) || 0));
    onChange(num);
  };

  return (
    <div style={fieldContainerStyle} data-testid={testId}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={inputWrapperStyle}>
        <input
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={String(value || 0)}
          onChange={handleChange}
          style={{
            ...inputBaseStyle,
            ...(disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
          }}
          onFocus={(e) => {
            Object.assign(e.target.style, inputFocusStyle);
          }}
          onBlur={(e) => {
            Object.assign(e.target.style, inputBaseStyle);
            onBlur?.(e);
          }}
        />
        {unit && <span style={unitStyle}>{unit}</span>}
      </div>
      {hint && <span style={hintStyle}>{hint}</span>}
    </div>
  );
}

// ============================================================================
// INPUT MOIS (type="month" pour dates YYYY-MM)
// ============================================================================

export function InputMonth({ 
  label, 
  value, 
  onChange, 
  disabled = false, 
  hint,
  testId,
}) {
  return (
    <div style={fieldContainerStyle} data-testid={testId}>
      {label && <label style={labelStyle}>{label}</label>}
      <input
        type="month"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...inputBaseStyle,
          textAlign: 'left',
          ...(disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
        }}
        onFocus={(e) => {
          Object.assign(e.target.style, inputFocusStyle);
        }}
        onBlur={(e) => {
          Object.assign(e.target.style, inputBaseStyle);
        }}
      />
      {hint && <span style={hintStyle}>{hint}</span>}
    </div>
  );
}

// ============================================================================
// SELECT
// ============================================================================

const selectBaseStyle = {
  height: '32px',
  width: '100%',
  padding: '4px 8px',
  borderRadius: '6px',
  border: '1px solid var(--color-c8)',
  backgroundColor: '#FFFFFF', // ✅ BLANC impératif
  fontFamily: 'inherit',
  fontSize: '13px',
  color: 'var(--color-c10)',
  cursor: 'pointer',
  transition: 'border-color 0.2s',
};

export function Select({ 
  label, 
  value, 
  onChange, 
  options = [],
  disabled = false, 
  hint,
  testId,
}) {
  return (
    <div style={fieldContainerStyle} data-testid={testId}>
      {label && <label style={labelStyle}>{label}</label>}
      <select
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...selectBaseStyle,
          ...(disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--color-c2)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--color-c8)';
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && <span style={hintStyle}>{hint}</span>}
    </div>
  );
}

// ============================================================================
// TOGGLE (Switch binaire)
// ============================================================================

const toggleContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const toggleSwitchStyle = {
  position: 'relative',
  width: '44px',
  height: '24px',
  borderRadius: '12px',
  border: 'none',
  background: 'var(--color-c8)',
  cursor: 'pointer',
  transition: 'background 0.2s ease',
  padding: 0,
};

const toggleSwitchActiveStyle = {
  background: 'var(--color-c2)',
};

const toggleKnobStyle = {
  position: 'absolute',
  top: '3px',
  left: '3px',
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  background: '#FFFFFF',
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  transition: 'transform 0.2s ease',
};

const toggleKnobActiveStyle = {
  transform: 'translateX(20px)',
};

const toggleLabelStyle = {
  fontSize: '13px',
  color: 'var(--color-c10)',
};

export function Toggle({ 
  checked, 
  onChange, 
  label,
  disabled = false,
  testId,
}) {
  return (
    <div style={toggleContainerStyle} data-testid={testId}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        style={{
          ...toggleSwitchStyle,
          ...(checked ? toggleSwitchActiveStyle : {}),
          ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
        }}
        aria-checked={checked}
        role="switch"
      >
        <span 
          style={{
            ...toggleKnobStyle,
            ...(checked ? toggleKnobActiveStyle : {}),
          }} 
        />
      </button>
      {label && <span style={toggleLabelStyle}>{label}</span>}
    </div>
  );
}
