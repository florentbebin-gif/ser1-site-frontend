/**
 * CreditSummaryCard.jsx - Carte synthèse sticky (colonne droite)
 */

import React from 'react';
import { euro0 } from '../utils/creditFormatters.js';
import './CreditV2.css';

export function CreditSummaryCard({
  synthese,
  isAnnual,
  lisserPret1,
  isExpert = true,
  loanLabel,
  lissageCoutDelta = 0,
}) {
  const {
    mensualiteTotaleM1,
    primeAssMensuelle,
    totalInterets,
    totalAssurance,
    coutTotalCredit,
    diffDureesMois,
  } = synthese;

  const factor = isAnnual ? 12 : 1;

  return (
    <aside className="cv2-summary" data-testid="credit-summary-card">
      <div className="cv2-summary__title">{loanLabel || 'Synthèse du prêt'}</div>

      <div className={`cv2-summary__kpi-grid${!isExpert ? ' cv2-summary__kpi-grid--full' : ''}`}>
        <div className="cv2-summary__kpi cv2-summary__kpi--main">
          <div className="cv2-summary__kpi-value cv2-summary__kpi-value--main" data-testid="credit-mensu-totale-avec-ass">
            {euro0(mensualiteTotaleM1 * factor)}
          </div>
          <div className="cv2-summary__kpi-label">
            {isAnnual ? 'Annuité' : 'Mensualité'} (hors ass.)
          </div>
        </div>
        {isExpert && (
          <div className="cv2-summary__kpi">
            <div className="cv2-summary__kpi-value cv2-summary__kpi-value--accent">
              {euro0(primeAssMensuelle * factor)}
            </div>
            <div className="cv2-summary__kpi-label">
              Assurance / {isAnnual ? 'an' : 'mois'}
            </div>
          </div>
        )}
      </div>

      <div className="cv2-summary__rows">
        <div className="cv2-summary__row">
          <span className="cv2-summary__row-label">Coût total des intérêts</span>
          <span className="cv2-summary__row-value">{euro0(totalInterets)}</span>
        </div>
        {isExpert && (
          <div className="cv2-summary__row">
            <span className="cv2-summary__row-label">Coût total assurance</span>
            <span className="cv2-summary__row-value">{euro0(totalAssurance)}</span>
          </div>
        )}
        <div className="cv2-summary__row cv2-summary__row--total">
          <span className="cv2-summary__row-label">Coût total du crédit</span>
          <span className="cv2-summary__row-value cv2-summary__row-value--highlight" data-testid="credit-cout-total-value">
            {euro0(coutTotalCredit)}
          </span>
        </div>
      </div>

      {lisserPret1 && (diffDureesMois !== 0 || lissageCoutDelta !== 0) && (
        <div className="cv2-summary__lissage-info">
          {diffDureesMois !== 0 && (
            <div className="cv2-summary__row">
              <span className="cv2-summary__row-label">
                {diffDureesMois > 0 ? 'Durée allongée' : 'Durée réduite'}
              </span>
              <span className="cv2-summary__row-value">
                {diffDureesMois > 0 ? '+' : ''}{diffDureesMois} mois
              </span>
            </div>
          )}
          {lissageCoutDelta !== 0 && (
            <div className="cv2-summary__row">
              <span className="cv2-summary__row-label">
                {lissageCoutDelta > 0 ? 'Coût supplémentaire' : 'Économie du lissage'}
              </span>
              <span className="cv2-summary__row-value">
                {euro0(Math.abs(lissageCoutDelta))}
              </span>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
