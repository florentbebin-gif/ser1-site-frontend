/**
 * CreditHeader.jsx - Header premium du simulateur de crédit
 *
 * Affiche le titre, sous-titre, chip mode et bouton Export.
 * Le toggle Mensuel/Annuel est positionné dans la ligne de contrôles (Credit.jsx).
 *
 * Polish: border-bottom C6, chip mode sans icône, style expert identique au standard.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ExportMenu } from '../../../components/ExportMenu';
import './CreditV2.css';

export function CreditHeader({
  exportOptions,
  exportLoading,
  isExpert = true,
}) {
  return (
    <div className="premium-header cv2-header--credit" data-testid="credit-header">
      <div>
        <h1 className="premium-title" data-testid="credit-title">
          Simulateur de crédit
        </h1>
        <p className="premium-subtitle">
          Simulez les mensualités et le coût global du financement.
        </p>
        {/* Chip mode : discret, lien vers Home pour changer le mode */}
        <Link
          to="/"
          className="cv2-mode-chip"
          data-testid="credit-mode-chip"
          title="Changer le mode depuis la page d'accueil"
        >
          {isExpert ? 'Mode expert' : 'Mode simplifié'}
        </Link>
      </div>
      <div className="sim-header__actions" data-testid="credit-actions">
        <ExportMenu
          options={exportOptions}
          loading={exportLoading}
        />
      </div>
    </div>
  );
}
