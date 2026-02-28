/**
 * CreditSummaryCard.jsx - Carte synthèse sticky (colonne droite)
 *
 * Affiche les KPIs principaux : mensualité, assurance, coûts totaux.
 * Style premium card avec position sticky.
 *
 * PR2: Ajout KPI "Mensualité totale avec assurance" (chiffre le plus attendu CGP)
 */

import React from 'react';
import { euro0 } from '../utils/creditFormatters.js';
import './CreditV2.css';

export function CreditSummaryCard({
  synthese,
  isAnnual,
  lisserPret1,
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
  const mensualiteTotaleAvecAss = (mensualiteTotaleM1 + primeAssMensuelle) * factor;

  return (
    <aside className="cv2-summary" data-testid="credit-summary-card">
      <div className="cv2-summary__title">Synthèse du prêt</div>

      {/* KPI PRINCIPAL : mensualité totale avec assurance */}
      <div className="cv2-summary__kpi-main" data-testid="credit-mensu-totale-avec-ass">
        <div className="cv2-summary__kpi-value cv2-summary__kpi-value--main">
          {euro0(mensualiteTotaleAvecAss)}
        </div>
        <div className="cv2-summary__kpi-label">
          {isAnnual ? 'Annuité totale' : 'Mensualité totale'} (avec ass.)
        </div>
      </div>

      {/* KPIs secondaires */}
      <div className="cv2-summary__kpi-grid">
        <div className="cv2-summary__kpi">
          <div className="cv2-summary__kpi-value cv2-summary__kpi-value--accent">
            {euro0(mensualiteTotaleM1 * factor)}
          </div>
          <div className="cv2-summary__kpi-label">
            {isAnnual ? 'Annuité' : 'Mensualité'} (hors ass.)
          </div>
        </div>
        <div className="cv2-summary__kpi">
          <div className="cv2-summary__kpi-value cv2-summary__kpi-value--accent">
            {euro0(primeAssMensuelle * factor)}
          </div>
          <div className="cv2-summary__kpi-label">
            Assurance / {isAnnual ? 'an' : 'mois'}
          </div>
        </div>
      </div>

      {/* Détail coûts */}
      <div className="cv2-summary__rows">
        <div className="cv2-summary__row">
          <span className="cv2-summary__row-label">Coût total des intérêts</span>
          <span className="cv2-summary__row-value">{euro0(totalInterets)}</span>
        </div>
        <div className="cv2-summary__row">
          <span className="cv2-summary__row-label">Coût total assurance</span>
          <span className="cv2-summary__row-value">{euro0(totalAssurance)}</span>
        </div>
        <div className="cv2-summary__row cv2-summary__row--total">
          <span className="cv2-summary__row-label">Coût total du crédit</span>
          <span className="cv2-summary__row-value cv2-summary__row-value--highlight" data-testid="credit-cout-total-value">
            {euro0(coutTotalCredit)}
          </span>
        </div>
      </div>

      {/* Info lissage */}
      {lisserPret1 && diffDureesMois !== 0 && (
        <div className="cv2-summary__lissage-info">
          <span className="cv2-summary__row-label">Différence de durée</span>
          <span className="cv2-summary__row-value">
            {diffDureesMois > 0 ? '+' : ''}{diffDureesMois} mois
          </span>
        </div>
      )}
    </aside>
  );
}
