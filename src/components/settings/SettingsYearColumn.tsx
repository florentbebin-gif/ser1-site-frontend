/**
 * SettingsYearColumn.jsx
 *
 * Composant pour une colonne "annee" (N ou N-1) dans les pages Settings.
 * Affiche le label de l'annee en header, puis les children (FieldRows).
 *
 * Phase 2 - factorisation UI des pages Settings.
 */

import React from 'react';

interface SettingsYearColumnProps {
  yearLabel: string;
  children: React.ReactNode;
  isRight?: boolean;
}

export default function SettingsYearColumn({
  yearLabel,
  children,
  isRight = false,
}: SettingsYearColumnProps): React.ReactElement {
  return (
    <div className={isRight ? 'tax-two-cols-right' : ''}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {yearLabel}
      </div>
      {children}
    </div>
  );
}
