import type { SuccessionChainOrder } from '../successionChainage';
import { fmt } from '../successionSimulator.helpers';

interface ScDeathTimelinePanelProps {
  chainOrder: SuccessionChainOrder;
  onToggleOrder: () => void;
  displayUsesChainage: boolean;
  derivedMasseTransmise: number;
  derivedTotalDroits: number;
  isPacsed: boolean;
  chainageAnalysis: {
    order: 'epoux1' | 'epoux2';
    firstDecedeLabel: string;
    secondDecedeLabel: string;
    step1: { actifTransmis: number; droitsEnfants: number } | null;
    step2: { actifTransmis: number; droitsEnfants: number } | null;
  };
  assuranceVieByAssure: Record<'epoux1' | 'epoux2', number>;
  avFiscalByAssure: Record<'epoux1' | 'epoux2', { totalDroits: number }>;
  directDisplay: {
    simulatedDeceased: 'epoux1' | 'epoux2';
    result: { totalDroits: number } | null;
  };
}

export default function ScDeathTimelinePanel({
  chainOrder,
  onToggleOrder,
  displayUsesChainage,
  derivedMasseTransmise,
  derivedTotalDroits,
  isPacsed,
  chainageAnalysis,
  assuranceVieByAssure,
  avFiscalByAssure,
  directDisplay,
}: ScDeathTimelinePanelProps) {
  return (
    <div className="premium-card sc-summary-card sc-hero-card">
      <div className="sc-hero-header">
        <div className="sc-summary-title-row">
          <div className="sc-section-icon-wrapper">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h2 className="sc-summary-title">Chronologie des décès</h2>
        </div>
        <div className="sc-pill-toggle">
          <button
            type="button"
            className={`sc-pill-toggle__btn${chainOrder === 'epoux2' ? ' is-active' : ''}`}
            onClick={onToggleOrder}
          >
            Ordre inversé
          </button>
        </div>
      </div>
      <div className="sc-card__divider sc-card__divider--tight" />
      {displayUsesChainage && chainageAnalysis.step1 && chainageAnalysis.step2 ? (
        <div className="sc-chrono-list">
          <div className="sc-chrono-item">
            <div className="sc-chrono-item__header">
              <strong className="sc-chrono-item__title">Étape 1</strong>
              <span className="sc-chrono-item__meta">Décès {chainageAnalysis.firstDecedeLabel}</span>
            </div>
            <div className="sc-summary-row">
              <span>Masse transmise</span>
              <strong>{fmt(chainageAnalysis.step1.actifTransmis + assuranceVieByAssure[chainageAnalysis.order])}</strong>
            </div>
            <div className="sc-summary-row">
              <span>Droits succession</span>
              <strong>{fmt(chainageAnalysis.step1.droitsEnfants)}</strong>
            </div>
            {avFiscalByAssure[chainageAnalysis.order].totalDroits > 0 && (
              <div className="sc-summary-row">
                <span>Droits assurance-vie</span>
                <strong>{fmt(avFiscalByAssure[chainageAnalysis.order].totalDroits)}</strong>
              </div>
            )}
          </div>

          <div className="sc-chrono-item">
            <div className="sc-chrono-item__header">
              <strong className="sc-chrono-item__title">Étape 2</strong>
              <span className="sc-chrono-item__meta">Décès {chainageAnalysis.secondDecedeLabel}</span>
            </div>
            <div className="sc-summary-row">
              <span>Masse transmise</span>
              <strong>{fmt(chainageAnalysis.step2.actifTransmis + assuranceVieByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'])}</strong>
            </div>
            <div className="sc-summary-row">
              <span>Droits succession</span>
              <strong>{fmt(chainageAnalysis.step2.droitsEnfants)}</strong>
            </div>
            {avFiscalByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'].totalDroits > 0 && (
              <div className="sc-summary-row">
                <span>Droits assurance-vie</span>
                <strong>{fmt(avFiscalByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'].totalDroits)}</strong>
              </div>
            )}
          </div>

          <div className="sc-chrono-total">
            <span>Total cumulé des droits</span>
            <strong>{fmt(derivedTotalDroits)}</strong>
          </div>
        </div>
      ) : (
        <div className="sc-chrono-list">
          <div className="sc-chrono-item">
            <div className="sc-chrono-item__header">
              <strong className="sc-chrono-item__title">Succession directe</strong>
              <span className="sc-chrono-item__meta">
                {isPacsed ? 'Décès du partenaire simulé' : 'Décès du/de la défunt(e) simulé(e)'}
              </span>
            </div>
            <div className="sc-summary-row">
              <span>Masse transmise</span>
              <strong>{fmt(derivedMasseTransmise)}</strong>
            </div>
            <div className="sc-summary-row">
              <span>Droits de succession</span>
              <strong>{fmt(directDisplay.result?.totalDroits ?? 0)}</strong>
            </div>
            {avFiscalByAssure[directDisplay.simulatedDeceased].totalDroits > 0 && (
              <div className="sc-summary-row">
                <span>Droits assurance-vie</span>
                <strong>{fmt(avFiscalByAssure[directDisplay.simulatedDeceased].totalDroits)}</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
