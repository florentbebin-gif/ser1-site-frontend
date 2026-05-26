/**
 * CreditSummaryCard.tsx - Carte synthèse sticky (colonne droite)
 */

import { euro0 } from '../utils/creditFormatters';
import type { CreditSummaryCardProps, SummaryDonutProps } from '../types';
import { IconBarChart } from '@/icons/ui';
import {
  SimDelta,
  SimKpiReference,
  SimMetric,
  SimSparkline,
  SimStatusBadge,
} from '@/components/ui/sim';

const DONUT_R = 27;
const DONUT_CX = 34;
const DONUT_CY = 34;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_R;

export function SummaryDonut({ capital, interets }: SummaryDonutProps) {
  const total = capital + interets;

  if (total <= 0) {
    return (
      <svg width="68" height="68" viewBox="0 0 68 68" className="cv-donut" aria-hidden="true">
        <circle
          className="cv-donut__track"
          cx={DONUT_CX}
          cy={DONUT_CY}
          r={DONUT_R}
          fill="none"
          strokeWidth="9"
        />
      </svg>
    );
  }

  const capitalLen = (capital / total) * DONUT_CIRCUMFERENCE;
  const interetsLen = DONUT_CIRCUMFERENCE - capitalLen;

  return (
    <svg
      width="68"
      height="68"
      viewBox="0 0 68 68"
      className="cv-donut"
      aria-hidden="true"
      style={{ transform: 'rotate(-90deg)' }}
    >
      <circle
        className="cv-donut__track"
        cx={DONUT_CX}
        cy={DONUT_CY}
        r={DONUT_R}
        fill="none"
        strokeWidth="9"
      />
      <circle
        className="cv-donut__capital"
        cx={DONUT_CX}
        cy={DONUT_CY}
        r={DONUT_R}
        fill="none"
        strokeWidth="9"
        strokeDasharray={`${capitalLen} ${DONUT_CIRCUMFERENCE}`}
        strokeDashoffset="0"
        strokeLinecap="butt"
      />
      <circle
        className="cv-donut__interest"
        cx={DONUT_CX}
        cy={DONUT_CY}
        r={DONUT_R}
        fill="none"
        strokeWidth="9"
        strokeDasharray={`${interetsLen} ${DONUT_CIRCUMFERENCE}`}
        strokeDashoffset={`${-capitalLen}`}
        strokeLinecap="butt"
      />
    </svg>
  );
}

export function CreditSummaryCard({
  synthese,
  isAnnual,
  lisserPret1,
  isExpert = true,
  loanLabel,
  lissageCoutDelta = 0,
}: CreditSummaryCardProps) {
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
    <aside className="cv-summary sim-summary-card" data-testid="credit-summary-card">
      <div className="cv-summary__header sim-card__header sim-card__header--bleed">
        <div className="cv-summary__title-row sim-card__title-row">
          <div className="sim-card__icon sim-card__icon--sm">
            <IconBarChart />
          </div>
          <div className="cv-summary__title">{loanLabel || 'Synthèse du prêt'}</div>
        </div>
      </div>

      <div className="cv-loan-card__divider sim-divider" />

      <div className="cv-summary__kpi-zone">
        <div>
          <SimMetric
            variant="hero"
            label={kpiLabel}
            value={
              <span data-testid="credit-mensu-totale-avec-ass">
                {euro0(mensualiteTotaleM1 * factor)}
              </span>
            }
            note={
              <span className="sim-kpi-note">
                <SimSparkline />
                <SimKpiReference kind="ir" />
              </span>
            }
          />
          {isExpert && primeAssMensuelle > 0 && (
            <div className="cv-summary__kpi-assurance">
              + {euro0(primeAssMensuelle * factor)} {assLabel} ass.
            </div>
          )}
          {!isExpert && (
            <SimStatusBadge variant="info" className="cv-summary__status-badge">
              Hors assurance
            </SimStatusBadge>
          )}
        </div>
        <SummaryDonut capital={capitalEmprunte} interets={totalInterets} />
      </div>

      <div className="cv-summary__divider sim-divider sim-divider--solid" />

      <div className="cv-summary__rows">
        {isExpert && (
          <div className="cv-summary__row">
            <span className="cv-summary__row-label">Coût total des intérêts</span>
            <span className="cv-summary__row-value">{euro0(totalInterets)}</span>
          </div>
        )}
        {isExpert && (
          <div className="cv-summary__row">
            <span className="cv-summary__row-label">Coût total assurance</span>
            <span className="cv-summary__row-value">{euro0(totalAssurance)}</span>
          </div>
        )}
        <div className="cv-summary__row cv-summary__row--total">
          <span className="cv-summary__row-label">Coût total du crédit</span>
          <span
            className="cv-summary__row-value cv-summary__row-value--highlight"
            data-testid="credit-cout-total-value"
          >
            {euro0(coutTotalCredit)}
          </span>
        </div>
      </div>

      {lisserPret1 && (diffDureesMois !== 0 || lissageCoutDelta !== 0) && (
        <>
          <div className="cv-loan-card__divider cv-loan-card__divider--tight sim-divider sim-divider--soft" />
          <div className="cv-summary__lissage-info">
            {diffDureesMois !== 0 && (
              <div className="cv-summary__row">
                <span className="cv-summary__row-label">
                  {diffDureesMois > 0 ? 'Durée allongée' : 'Durée réduite'}
                </span>
                <span className="cv-summary__row-value">
                  <SimDelta value={diffDureesMois} unit="mois" precision={0} />
                </span>
              </div>
            )}
            {lissageCoutDelta !== 0 && (
              <div className="cv-summary__row">
                <span className="cv-summary__row-label">
                  {lissageCoutDelta > 0 ? 'Coût supplémentaire' : 'Économie du lissage'}
                </span>
                <span className="cv-summary__row-value">
                  <SimDelta value={lissageCoutDelta} formatValue={euro0} />
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
