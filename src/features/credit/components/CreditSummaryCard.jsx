/**
 * CreditSummaryCard.jsx - Carte synthèse sticky (colonne droite)
 */

import React from 'react';
import { euro0 } from '../utils/creditFormatters.js';
import './CreditV2.css';

// ── Donut SVG (Capital vs Intérêts, sans valeurs) ──────────────────────────
const DONUT_R = 27;
const DONUT_CX = 34;
const DONUT_CY = 34;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_R; // ≈ 169.6

function SummaryDonut({ capital, interets }) {
  const total = capital + interets;

  if (total <= 0) {
    return (
      <svg
        width="68" height="68" viewBox="0 0 68 68"
        className="cv2-donut" aria-hidden="true"
      >
        <circle cx={DONUT_CX} cy={DONUT_CY} r={DONUT_R}
          fill="none" stroke="var(--color-c8)" strokeWidth="9" />
      </svg>
    );
  }

  const capitalLen = (capital / total) * DONUT_CIRCUMFERENCE;
  const interetsLen = DONUT_CIRCUMFERENCE - capitalLen;

  return (
    <svg
      width="68" height="68" viewBox="0 0 68 68"
      className="cv2-donut" aria-hidden="true"
      style={{ transform: 'rotate(-90deg)' }}
    >
      {/* Fond anneau */}
      <circle cx={DONUT_CX} cy={DONUT_CY} r={DONUT_R}
        fill="none" stroke="var(--color-c8)" strokeWidth="9" />
      {/* Segment Capital — C2 */}
      <circle cx={DONUT_CX} cy={DONUT_CY} r={DONUT_R}
        fill="none"
        stroke="var(--color-c2)"
        strokeWidth="9"
        strokeDasharray={`${capitalLen} ${DONUT_CIRCUMFERENCE}`}
        strokeDashoffset="0"
        strokeLinecap="butt"
      />
      {/* Segment Intérêts — C6 */}
      <circle cx={DONUT_CX} cy={DONUT_CY} r={DONUT_R}
        fill="none"
        stroke="var(--color-c6)"
        strokeWidth="9"
        strokeDasharray={`${interetsLen} ${DONUT_CIRCUMFERENCE}`}
        strokeDashoffset={`${-capitalLen}`}
        strokeLinecap="butt"
      />
    </svg>
  );
}

// ── Composant principal ────────────────────────────────────────────────────
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
    capitalEmprunte = 0,
  } = synthese;

  const factor = isAnnual ? 12 : 1;
  const kpiLabel = isAnnual ? 'Annuité hors ass.' : 'Mensualité hors ass.';
  const assLabel = isAnnual ? '/an' : '/mois';

  return (
    <aside className="cv2-summary" data-testid="credit-summary-card">

      {/* Header : titre à gauche, donut à droite */}
      <div className="cv2-summary__header-row">
        <div className="cv2-summary__title">{loanLabel || 'Synthèse du prêt'}</div>
        <SummaryDonut capital={capitalEmprunte} interets={totalInterets} />
      </div>

      {/* KPI principal — typographique, sans fond */}
      <div className="cv2-summary__kpi-zone">
        <div className="cv2-summary__kpi-label-small">{kpiLabel}</div>
        <div
          className="cv2-summary__kpi-main-value"
          data-testid="credit-mensu-totale-avec-ass"
        >
          {euro0(mensualiteTotaleM1 * factor)}
        </div>
        {isExpert && primeAssMensuelle > 0 && (
          <div className="cv2-summary__kpi-assurance">
            + {euro0(primeAssMensuelle * factor)} {assLabel} ass.
          </div>
        )}
        {!isExpert && (
          <div className="cv2-summary__badge">Hors assurance</div>
        )}
      </div>

      {/* Séparateur */}
      <div className="cv2-summary__divider" />

      {/* Lignes de coût */}
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
          <span
            className="cv2-summary__row-value cv2-summary__row-value--highlight"
            data-testid="credit-cout-total-value"
          >
            {euro0(coutTotalCredit)}
          </span>
        </div>
      </div>

      {/* Bloc lissage */}
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
