import { euro0 } from '../utils/creditFormatters';
import { CreditSummaryCard, SummaryDonut } from './CreditSummaryCard';
import type { CreditCalcResult, CreditSynthesis } from '../types';

interface CreditSummarySidebarProps {
  activeSynthese: CreditSynthesis;
  isAnnual: boolean;
  isExpert: boolean;
  activeTab: number;
  lisserPret1: boolean;
  lissageCoutDelta: number;
  calc: CreditCalcResult;
}

export function CreditSummarySidebar({
  activeSynthese,
  isAnnual,
  isExpert,
  activeTab,
  lisserPret1,
  lissageCoutDelta,
  calc,
}: CreditSummarySidebarProps) {
  return (
    <>
      <CreditSummaryCard
        synthese={activeSynthese}
        isAnnual={isAnnual}
        lisserPret1={lisserPret1}
        isExpert={isExpert}
        loanLabel={
          isExpert && calc.hasPretsAdditionnels
            ? `Synthèse du prêt ${activeTab + 1}`
            : undefined
        }
        lissageCoutDelta={isExpert && activeTab === 0 ? lissageCoutDelta : 0}
      />

      {calc.hasPretsAdditionnels && (
        <div className="cv-total-mensu sim-summary-card sim-summary-card--secondary">
          <div className="cv-summary__title-row">
            <div className="sim-card__icon sim-card__icon--sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div className="cv-summary__title">Synthèse des prêts</div>
          </div>
          <div className="cv-loan-card__divider cv-loan-card__divider--tight sim-divider sim-divider--tight" />

          <div className="cv-summary__kpi-zone">
            <div>
              <div className="cv-summary__kpi-label-small">
                {isAnnual ? 'Annuité totale hors ass.' : 'Mensualité totale hors ass.'}
              </div>
              <div className="cv-total-mensu__value">
                {euro0(calc.synthese.mensualiteTotaleM1 * (isAnnual ? 12 : 1))}
              </div>
              {isExpert && calc.synthese.primeAssMensuelle > 0 && (
                <div className="cv-summary__kpi-assurance">
                  + {euro0(calc.synthese.primeAssMensuelle * (isAnnual ? 12 : 1))} {isAnnual ? '/an' : '/mois'} ass.
                </div>
              )}
            </div>
            <SummaryDonut
              capital={calc.synthese.capitalEmprunte}
              interets={calc.synthese.totalInterets}
              capitalColor="var(--color-c5)"
            />
          </div>

          <div className="cv-summary__divider sim-divider sim-divider--tight" />
          <div className="cv-summary__row cv-summary__row--total">
            <span className="cv-summary__row-label">Coût total des crédits</span>
            <span className="cv-summary__row-value cv-summary__row-value--highlight">
              {euro0(calc.synthese.coutTotalCredit)}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
