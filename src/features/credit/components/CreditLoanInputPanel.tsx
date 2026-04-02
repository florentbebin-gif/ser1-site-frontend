import { CreditLoanForm } from './CreditLoanForm';
import { Toggle } from './CreditInputs';
import type {
  CreditCalcResult,
  CreditLoan,
  CreditRawLoanValues,
  CreditState,
} from '../types';

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
    <div>
      <div className="premium-card premium-card--guide sim-card--guide">
        <div className="cv2-loan-card">
          <header className="cv2-loan-card__header sim-card__header sim-card__header--bleed">
            <h2 className="cv2-loan-card__title sim-card__title sim-card__title-row">
              <span className="cv2-loan-card__icon-wrapper sim-card__icon">
                <svg
                  className="cv2-loan-card__icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                  <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
                  <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
                  <circle cx="9" cy="18" r="2" fill="currentColor" stroke="none" />
                </svg>
              </span>
              Paramètres du prêt
            </h2>
            <p className="cv2-loan-card__subtitle sim-card__subtitle">
              Renseignez les données du financement pour estimer mensualités et coût global.
            </p>
          </header>
          <div className="cv2-loan-card__divider sim-divider" />
          <div className="cv2-loan-card__body">
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
        <div className="premium-card cv2-lissage-card">
          <div className="sim-section-title cv2-lissage-title">Options de lissage</div>
          <div className="cv2-loan-card__divider cv2-loan-card__divider--tight sim-divider sim-divider--tight" />
          <div className="cv2-lissage">
            <Toggle
              checked={state.lisserPret1}
              onChange={(value) => setGlobal({ lisserPret1: value })}
              label="Lisser le prêt 1"
              disabled={calc.pret1IsInfine}
            />
            {state.lisserPret1 && (
              <div className="cv2-lissage__pills">
                <button
                  className={`cv2-lissage__pill ${state.lissageMode === 'mensu' ? 'is-active' : ''}`}
                  onClick={() => setGlobal({ lissageMode: 'mensu' })}
                >
                  Mensualité constante
                </button>
                <button
                  className={`cv2-lissage__pill ${state.lissageMode === 'duree' ? 'is-active' : ''}`}
                  onClick={() => setGlobal({ lissageMode: 'duree' })}
                >
                  Durée constante
                </button>
              </div>
            )}
          </div>
          {calc.pret1IsInfine && (
            <p className="cv2-lissage__hint">
              Le lissage est indisponible pour un prêt 1 en In fine.
            </p>
          )}
          {state.lisserPret1 && calc.autresIsInfine.some(Boolean) && (
            <p className="cv2-lissage__hint">
              Un prêt in fine comporte une échéance finale de capital : elle n&apos;est pas lissable et reste visible dans l&apos;échéancier.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
