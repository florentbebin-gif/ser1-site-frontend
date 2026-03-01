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
}) {
  return (
    <div className="premium-header cv2-header--credit" data-testid="credit-header">
      <div className="cv2-header__title-row">
        <h1 className="premium-title" data-testid="credit-title">
          Simulateur de crédit
        </h1>
        <div className="sim-header__actions" data-testid="credit-actions">
          <ExportMenu
            options={exportOptions}
            loading={exportLoading}
          />
        </div>
      </div>
      <p className="premium-subtitle">
        Simulez les mensualités et le coût global du financement.
      </p>
    </div>
  );
}
