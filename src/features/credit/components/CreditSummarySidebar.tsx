import { IconLayers } from '@/icons/ui';
import { SimMetric } from '@/components/ui/sim';
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
          isExpert && calc.hasPretsAdditionnels ? `Synthèse du prêt ${activeTab + 1}` : undefined
        }
        lissageCoutDelta={isExpert && activeTab === 0 ? lissageCoutDelta : 0}
      />

      {calc.hasPretsAdditionnels && (
        <div className="cv-total-mensu sim-summary-card sim-summary-card--secondary">
          <div className="cv-summary__header sim-card__header sim-card__header--bleed">
            <div className="cv-summary__title-row sim-card__title-row">
              <div className="sim-card__icon sim-card__icon--sm">
                <IconLayers />
              </div>
              <div className="cv-summary__title">Synthèse des prêts</div>
            </div>
          </div>
          <div className="cv-loan-card__divider cv-loan-card__divider--tight sim-divider sim-divider--soft" />

          <div className="cv-summary__kpi-zone">
            <div>
              <SimMetric
                variant="hero"
                label={isAnnual ? 'Annuité totale hors ass.' : 'Mensualité totale hors ass.'}
                value={euro0(calc.synthese.mensualiteTotaleM1 * (isAnnual ? 12 : 1))}
              />
              {isExpert && calc.synthese.primeAssMensuelle > 0 && (
                <div className="cv-summary__kpi-assurance">
                  + {euro0(calc.synthese.primeAssMensuelle * (isAnnual ? 12 : 1))}{' '}
                  {isAnnual ? '/an' : '/mois'} ass.
                </div>
              )}
            </div>
            <SummaryDonut
              capital={calc.synthese.capitalEmprunte}
              interets={calc.synthese.totalInterets}
            />
          </div>

          <div className="cv-summary__divider sim-divider sim-divider--solid" />
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
