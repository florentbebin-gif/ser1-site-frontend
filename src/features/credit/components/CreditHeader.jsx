/**
 * CreditHeader.jsx - Header premium du simulateur de crédit
 *
 * Affiche le titre, sous-titre et bouton Export.
 * Le chip de mode est affiché sous la bordure du header dans Credit.jsx.
 */

import React from 'react';
import { ExportMenu } from '../../../components/ExportMenu';
import './CreditV2.css';

export function CreditHeader({
  exportOptions,
  exportLoading,
  isExpert,
  onToggleMode,
}) {
  return (
    <div className="premium-header cv2-header--credit" data-testid="credit-header">
      <h1 className="premium-title" data-testid="credit-title">
        Simulateur de crédit
      </h1>
      <div className="cv2-header__subtitle-row">
        <p className="premium-subtitle">
          Simulez les mensualités et le coût global du financement.
        </p>
        <div className="sim-header__actions" data-testid="credit-actions">
          <button
            className="chip premium-btn cv2-mode-btn"
            data-testid="credit-mode-chip"
            onClick={onToggleMode}
            title={isExpert ? 'Passer en mode simplifié' : 'Passer en mode expert'}
          >
            {isExpert ? 'Mode expert' : 'Mode simplifié'}
          </button>
          <ExportMenu
            options={exportOptions}
            loading={exportLoading}
          />
        </div>
      </div>
    </div>
  );
}
