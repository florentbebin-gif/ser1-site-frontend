/**
 * SettingsYearColumn.jsx
 *
 * Composant pour une colonne "année" (N ou N-1) dans les pages Settings.
 * Affiche le label de l'année en header, puis les children (FieldRows).
 *
 * Phase 2 — factorisation UI des pages Settings.
 */

import React from 'react';

/**
 * @param {Object} props
 * @param {string} props.yearLabel - Label affiché (ex: "2025 (RFR 2023 & Avis IR 2024)")
 * @param {React.ReactNode} props.children - Les SettingsFieldRow de cette colonne
 * @param {boolean} [props.isRight=false] - Si true, ajoute la classe tax-two-cols-right
 */
export default function SettingsYearColumn({ yearLabel, children, isRight = false }) {
  return (
    <div className={isRight ? 'tax-two-cols-right' : ''}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {yearLabel}
      </div>
      {children}
    </div>
  );
}
