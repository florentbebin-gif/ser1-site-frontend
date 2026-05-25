import { IconArrowLeftRight, IconSliders } from '@/icons/ui';
import { CreditLoanForm } from './CreditLoanForm';
import { Toggle } from './CreditInputs';
import type { CreditCalcResult, CreditLoan, CreditRawLoanValues, CreditState } from '../types';

interface ActiveLoanEntry {
  data: CreditLoan | null;
  raw?: CreditRawLoanValues;
  set: (_patch: Partial<CreditLoan>) => void;
}

interface CreditLoanInputPanelProps {
  activeTab: number;
  activeLoan: ActiveLoanEntry;
  state: CreditState;
  isExpert: boolean;
  calc: CreditCalcResult;
  setGlobal: (_patch: Partial<CreditState>) => void;
  formatTauxRaw: (_value: number | null | undefined) => string;
}

export function CreditLoanInputPanel({
  activeTab,
  activeLoan,
  state,
  isExpert,
  calc,
  setGlobal,
  formatTauxRaw,
}: CreditLoanInputPanelProps) {
  return (
    <>
      <div className="premium-card premium-card--guide sim-card--guide">
        <div className="cv-loan-card">
          <header className="cv-loan-card__header sim-card__header sim-card__header--bleed">
            <h2 className="cv-loan-card__title sim-card__title sim-card__title-row">
              <span className="sim-card__icon sim-card__icon--lg">
                <IconSliders className="cv-loan-card__icon" />
              </span>
              Paramètres du prêt
            </h2>
            <p className="cv-loan-card__subtitle sim-card__subtitle">
              Renseignez les données du financement pour estimer mensualités et coût global.
            </p>
          </header>
          <div className="cv-loan-card__divider sim-divider" />
          <div className="cv-loan-card__body">
            <CreditLoanForm
              pretNum={activeTab}
              pretData={activeLoan.data}
              rawValues={activeLoan.raw}
              globalStartYM={state.startYM}
              globalAssurMode={state.assurMode}
              globalCreditType={state.creditType}
              onPatch={activeLoan.set}
              formatTauxRaw={formatTauxRaw}
              isExpert={isExpert}
            />
          </div>
        </div>
      </div>

      {calc.hasPretsAdditionnels && (
        <div className="premium-card premium-card--guide sim-card--guide cv-lissage-card">
          <header className="cv-lissage-card__header sim-card__header sim-card__header--bleed">
            <h2 className="cv-lissage-title sim-card__title sim-card__title-row">
              <span className="sim-card__icon sim-card__icon--lg">
                <IconArrowLeftRight className="cv-loan-card__icon" />
              </span>
              Options de lissage
            </h2>
            <p className="cv-lissage-subtitle sim-card__subtitle">
              Pilotez le lissage du prêt principal quand plusieurs financements coexistent.
            </p>
          </header>
          <div className="cv-loan-card__divider cv-loan-card__divider--tight sim-divider sim-divider--tight" />
          <div className="cv-lissage">
            <Toggle
              checked={state.lisserPret1}
              onChange={(value) => setGlobal({ lisserPret1: value })}
              label="Lisser le prêt 1"
              disabled={calc.pret1IsInfine}
            />
            {state.lisserPret1 && (
              <div className="cv-lissage__pills">
                <button
                  className={`cv-lissage__pill ${state.lissageMode === 'mensu' ? 'is-active' : ''}`}
                  onClick={() => setGlobal({ lissageMode: 'mensu' })}
                >
                  Mensualité constante
                </button>
                <button
                  className={`cv-lissage__pill ${state.lissageMode === 'duree' ? 'is-active' : ''}`}
                  onClick={() => setGlobal({ lissageMode: 'duree' })}
                >
                  Durée constante
                </button>
              </div>
            )}
          </div>
          {calc.pret1IsInfine && (
            <p className="cv-lissage__hint">
              Le lissage est indisponible pour un prêt 1 en In fine.
            </p>
          )}
          {state.lisserPret1 && calc.autresIsInfine.some(Boolean) && (
            <p className="cv-lissage__hint">
              Un prêt in fine comporte une échéance finale de capital : elle n&apos;est pas lissable
              et reste visible dans l&apos;échéancier.
            </p>
          )}
        </div>
      )}
    </>
  );
}
