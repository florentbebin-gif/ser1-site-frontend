/**
 * CreditHeader.jsx - Header premium du simulateur de crédit
 *
 * Affiche le titre, sous-titre, switch Mensuel/Annuel (pill) et bouton Export.
 * Inspiré du pattern premium-header (Home.jsx / simulateur Placement).
 *
 * PR2: Prop isExpert → chip mode discret affiché dans le header.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ExportMenu } from '../../../components/ExportMenu';
import './CreditV2.css';

export function CreditHeader({
  viewMode,
  onViewModeChange,
  exportOptions,
  exportLoading,
  isExpert = true,
}) {
  return (
    <div className="cv2-header" data-testid="credit-header">
      <div className="cv2-header__left">
        <h1 className="cv2-header__title" data-testid="credit-title">
          Simulateur de crédit
        </h1>
        <p className="cv2-header__subtitle">
          Simulez les mensualités et le coût global du financement.
        </p>
        {/* Chip mode : discret, lien vers Home pour changer le mode */}
        <Link
          to="/"
          className={`cv2-mode-chip${isExpert ? ' cv2-mode-chip--expert' : ''}`}
          data-testid="credit-mode-chip"
          title="Changer le mode depuis la page d'accueil"
        >
          {isExpert ? '⚡ Mode expert' : 'Mode simplifié'}
        </Link>
      </div>
      <div className="cv2-header__actions" data-testid="credit-actions">
        <div className="cv2-pill-toggle" data-testid="credit-view-toggle">
          <button
            className={`cv2-pill-toggle__btn ${viewMode === 'mensuel' ? 'is-active' : ''}`}
            onClick={() => onViewModeChange('mensuel')}
            data-testid="credit-view-mensuel"
          >
            Mensuel
          </button>
          <button
            className={`cv2-pill-toggle__btn ${viewMode === 'annuel' ? 'is-active' : ''}`}
            onClick={() => onViewModeChange('annuel')}
            data-testid="credit-view-annuel"
          >
            Annuel
          </button>
        </div>
        <ExportMenu
          options={exportOptions}
          loading={exportLoading}
        />
      </div>
    </div>
  );
}
