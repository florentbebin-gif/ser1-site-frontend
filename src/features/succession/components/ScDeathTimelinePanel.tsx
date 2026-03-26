import type { SuccessionChainOrder } from '../successionChainage';
import {
  getSuccessionInterMassClaimKindLabel,
  getSuccessionPocketLabel,
} from '../successionInterMassClaims';
import { DECES_DANS_X_ANS_OPTIONS } from '../successionSimulator.constants';
import { fmt } from '../successionSimulator.helpers';
import { ScSelect } from './ScSelect';

interface ScDeathTimelinePanelProps {
  chainOrder: SuccessionChainOrder;
  onToggleOrder: () => void;
  showOrderToggle: boolean;
  displayUsesChainage: boolean;
  derivedMasseTransmise: number;
  derivedTotalDroits: number;
  isPacsed: boolean;
  showDeathHorizonControl: boolean;
  decesDansXAns: 0 | 5 | 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50;
  onChangeDecesDansXAns: (_value: 0 | 5 | 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50) => void;
  chainageAnalysis: {
    order: 'epoux1' | 'epoux2';
    firstDecedeLabel: string;
    secondDecedeLabel: string;
    societeAcquets: {
      totalValue: number;
      firstEstateContribution: number;
      survivorShare: number;
      preciputAmount: number;
      survivorAttributionAmount: number;
      liquidationMode: 'quotes' | 'attribution_survivant';
      deceasedQuotePct: number;
      survivorQuotePct: number;
      attributionIntegrale: boolean;
    } | null;
    participationAcquets: {
      active: boolean;
      creditor: 'epoux1' | 'epoux2' | null;
      debtor: 'epoux1' | 'epoux2' | null;
      quoteAppliedPct: number;
      creanceAmount: number;
      firstEstateAdjustment: number;
    } | null;
    interMassClaims: {
      totalAppliedAmount: number;
      claims: Array<{
        id: string;
        kind: 'recompense' | 'creance';
        label?: string;
        fromPocket: 'epoux1' | 'epoux2' | 'communaute' | 'societe_acquets' | 'indivision_pacse' | 'indivision_concubinage';
        toPocket: 'epoux1' | 'epoux2' | 'communaute' | 'societe_acquets' | 'indivision_pacse' | 'indivision_concubinage';
        appliedAmount: number;
      }>;
    } | null;
    affectedLiabilities: {
      totalAmount: number;
      byPocket: Array<{
        pocket: 'epoux1' | 'epoux2' | 'communaute' | 'societe_acquets' | 'indivision_pacse' | 'indivision_concubinage';
        amount: number;
      }>;
    } | null;
    preciput: {
      mode: 'global' | 'cible' | 'none';
      appliedAmount: number;
      usesGlobalFallback: boolean;
      selections: Array<{
        id: string;
        label: string;
        appliedAmount: number;
      }>;
    } | null;
    step1: { actifTransmis: number; droitsEnfants: number } | null;
    step2: { actifTransmis: number; droitsEnfants: number } | null;
  };
  assuranceVieByAssure: Record<'epoux1' | 'epoux2', number>;
  avFiscalByAssure: Record<'epoux1' | 'epoux2', { totalDroits: number }>;
  perByAssure: Record<'epoux1' | 'epoux2', number>;
  perFiscalByAssure: Record<'epoux1' | 'epoux2', { totalDroits: number }>;
  prevoyanceByAssure: Record<'epoux1' | 'epoux2', number>;
  prevoyanceFiscalByAssure: Record<'epoux1' | 'epoux2', { totalDroits: number }>;
  directDisplay: {
    simulatedDeceased: 'epoux1' | 'epoux2';
    result: { totalDroits: number } | null;
  };
}

export default function ScDeathTimelinePanel({
  chainOrder,
  onToggleOrder,
  showOrderToggle,
  displayUsesChainage,
  derivedMasseTransmise,
  derivedTotalDroits,
  isPacsed,
  showDeathHorizonControl,
  decesDansXAns,
  onChangeDecesDansXAns,
  chainageAnalysis,
  assuranceVieByAssure,
  avFiscalByAssure,
  perByAssure,
  perFiscalByAssure,
  prevoyanceByAssure,
  prevoyanceFiscalByAssure,
  directDisplay,
}: ScDeathTimelinePanelProps) {
  const secondAssure = chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1';
  const societeAcquets = chainageAnalysis.societeAcquets;
  const participationAcquets = chainageAnalysis.participationAcquets;
  const interMassClaims = chainageAnalysis.interMassClaims;
  const affectedLiabilities = chainageAnalysis.affectedLiabilities;
  const preciput = chainageAnalysis.preciput;

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
          <h2 className="sc-summary-title">Chronologie des deces</h2>
        </div>
        {showOrderToggle && (
          <div className="sc-pill-toggle">
            <button
              type="button"
              className={`sc-pill-toggle__btn${chainOrder === 'epoux2' ? ' is-active' : ''}`}
              onClick={onToggleOrder}
            >
              Ordre inverse
            </button>
          </div>
        )}
      </div>
      {showDeathHorizonControl && (
        <>
          <div className="sc-card__divider sc-card__divider--tight" />
          <div className="sc-field sc-field--timeline-select">
            <label>Horizon du deces simule</label>
            <ScSelect
              value={String(decesDansXAns)}
              onChange={(value) => onChangeDecesDansXAns(Number(value) as ScDeathTimelinePanelProps['decesDansXAns'])}
              options={DECES_DANS_X_ANS_OPTIONS.map((option) => ({
                value: String(option.value),
                label: option.label,
              }))}
            />
          </div>
        </>
      )}
      <div className="sc-card__divider sc-card__divider--tight" />
      {displayUsesChainage && chainageAnalysis.step1 && chainageAnalysis.step2 ? (
        <div className="sc-chrono-list">
          <div className="sc-chrono-item">
            <div className="sc-chrono-item__header">
              <strong className="sc-chrono-item__title">Etape 1</strong>
              <span className="sc-chrono-item__meta">Deces {chainageAnalysis.firstDecedeLabel}</span>
            </div>
            <div className="sc-summary-row">
              <span>Masse transmise</span>
              <strong>{fmt(
                chainageAnalysis.step1.actifTransmis
                + assuranceVieByAssure[chainageAnalysis.order]
                + perByAssure[chainageAnalysis.order]
                + prevoyanceByAssure[chainageAnalysis.order],
              )}</strong>
            </div>
            {societeAcquets && societeAcquets.totalValue > 0 && (
              <>
                <div className="sc-summary-row">
                  <span>Societe d'acquets - part 1er deces</span>
                  <strong>{fmt(societeAcquets.firstEstateContribution)}</strong>
                </div>
                {societeAcquets.preciputAmount > 0 && (
                  <div className="sc-summary-row">
                    <span>Preciput sur societe d'acquets</span>
                    <strong>{fmt(societeAcquets.preciputAmount)}</strong>
                  </div>
                )}
                {societeAcquets.survivorAttributionAmount > 0 && (
                  <div className="sc-summary-row">
                    <span>Attribution prealable au survivant</span>
                    <strong>{fmt(societeAcquets.survivorAttributionAmount)}</strong>
                  </div>
                )}
              </>
            )}
            {preciput && preciput.appliedAmount > 0 && (
              <>
                <div className="sc-summary-row">
                  <span>Preciput applique</span>
                  <strong>{fmt(preciput.appliedAmount)}</strong>
                </div>
                {preciput.selections.map((selection) => (
                  <div key={selection.id} className="sc-summary-row">
                    <span>{selection.label}</span>
                    <strong>{fmt(selection.appliedAmount)}</strong>
                  </div>
                ))}
              </>
            )}
            {participationAcquets?.active && participationAcquets.creanceAmount > 0 && (
              <div className="sc-summary-row">
                <span>Creance de participation</span>
                <strong>{fmt(participationAcquets.creanceAmount)}</strong>
              </div>
            )}
            {interMassClaims && interMassClaims.totalAppliedAmount > 0 && (
              <>
                <div className="sc-summary-row">
                  <span>Creances entre masses appliquees</span>
                  <strong>{fmt(interMassClaims.totalAppliedAmount)}</strong>
                </div>
                {interMassClaims.claims
                  .filter((claim) => claim.appliedAmount > 0)
                  .map((claim) => (
                    <div key={claim.id} className="sc-summary-row">
                      <span>
                        {claim.label ?? getSuccessionInterMassClaimKindLabel(claim.kind)}
                        {' - '}
                        {getSuccessionPocketLabel(claim.fromPocket)}
                        {' vers '}
                        {getSuccessionPocketLabel(claim.toPocket)}
                      </span>
                      <strong>{fmt(claim.appliedAmount)}</strong>
                    </div>
                  ))}
              </>
            )}
            {affectedLiabilities && affectedLiabilities.totalAmount > 0 && (
              <div className="sc-summary-row">
                <span>Passif affecte rattache</span>
                <strong>{fmt(affectedLiabilities.totalAmount)}</strong>
              </div>
            )}
            {prevoyanceByAssure[chainageAnalysis.order] > 0 && (
              <div className="sc-summary-row">
                <span>Dont prévoyance décès</span>
                <strong>{fmt(prevoyanceByAssure[chainageAnalysis.order])}</strong>
              </div>
            )}
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
            {perFiscalByAssure[chainageAnalysis.order].totalDroits > 0 && (
              <div className="sc-summary-row">
                <span>Droits PER</span>
                <strong>{fmt(perFiscalByAssure[chainageAnalysis.order].totalDroits)}</strong>
              </div>
            )}
            {prevoyanceFiscalByAssure[chainageAnalysis.order].totalDroits > 0 && (
              <div className="sc-summary-row">
                <span>Droits prévoyance</span>
                <strong>{fmt(prevoyanceFiscalByAssure[chainageAnalysis.order].totalDroits)}</strong>
              </div>
            )}
          </div>

          <div className="sc-chrono-item">
            <div className="sc-chrono-item__header">
              <strong className="sc-chrono-item__title">Etape 2</strong>
              <span className="sc-chrono-item__meta">Deces {chainageAnalysis.secondDecedeLabel}</span>
            </div>
            <div className="sc-summary-row">
              <span>Masse transmise</span>
              <strong>{fmt(
                chainageAnalysis.step2.actifTransmis
                + assuranceVieByAssure[secondAssure]
                + perByAssure[secondAssure]
                + prevoyanceByAssure[secondAssure],
              )}</strong>
            </div>
            {societeAcquets && societeAcquets.totalValue > 0 && (
              <div className="sc-summary-row">
                <span>Societe d'acquets - part survivant</span>
                <strong>{fmt(societeAcquets.survivorShare)}</strong>
              </div>
            )}
            {prevoyanceByAssure[secondAssure] > 0 && (
              <div className="sc-summary-row">
                <span>Dont prévoyance décès</span>
                <strong>{fmt(prevoyanceByAssure[secondAssure])}</strong>
              </div>
            )}
            <div className="sc-summary-row">
              <span>Droits succession</span>
              <strong>{fmt(chainageAnalysis.step2.droitsEnfants)}</strong>
            </div>
            {avFiscalByAssure[secondAssure].totalDroits > 0 && (
              <div className="sc-summary-row">
                <span>Droits assurance-vie</span>
                <strong>{fmt(avFiscalByAssure[secondAssure].totalDroits)}</strong>
              </div>
            )}
            {perFiscalByAssure[secondAssure].totalDroits > 0 && (
              <div className="sc-summary-row">
                <span>Droits PER</span>
                <strong>{fmt(perFiscalByAssure[secondAssure].totalDroits)}</strong>
              </div>
            )}
            {prevoyanceFiscalByAssure[secondAssure].totalDroits > 0 && (
              <div className="sc-summary-row">
                <span>Droits prévoyance</span>
                <strong>{fmt(prevoyanceFiscalByAssure[secondAssure].totalDroits)}</strong>
              </div>
            )}
          </div>

          <div className="sc-chrono-total">
            <span>Total cumule des droits</span>
            <strong>{fmt(derivedTotalDroits)}</strong>
          </div>
          {societeAcquets && societeAcquets.totalValue > 0 && (
            <div className="sc-chrono-total">
              <span>
                Societe d'acquets
                {' '}
                {societeAcquets.liquidationMode === 'attribution_survivant' ? '(attribution)' : '(quotes)'}
              </span>
              <strong>{`${Math.round(societeAcquets.deceasedQuotePct)}% / ${Math.round(societeAcquets.survivorQuotePct)}%`}</strong>
            </div>
          )}
          {participationAcquets && (
            <div className="sc-chrono-total">
              <span>Participation aux acquets</span>
              <strong>
                {participationAcquets.active
                  ? fmt(participationAcquets.creanceAmount)
                  : 'Inactive'}
              </strong>
            </div>
          )}
          {interMassClaims && interMassClaims.totalAppliedAmount > 0 && (
            <div className="sc-chrono-total">
              <span>Creances entre masses</span>
              <strong>{fmt(interMassClaims.totalAppliedAmount)}</strong>
            </div>
          )}
          {affectedLiabilities && affectedLiabilities.totalAmount > 0 && (
            <div className="sc-chrono-total">
              <span>Passif affecte</span>
              <strong>{fmt(affectedLiabilities.totalAmount)}</strong>
            </div>
          )}
        </div>
      ) : (
        <div className="sc-chrono-list">
          <div className="sc-chrono-item">
            <div className="sc-chrono-item__header">
              <strong className="sc-chrono-item__title">Succession directe</strong>
              <span className="sc-chrono-item__meta">
                {isPacsed ? 'Deces du partenaire simule' : 'Deces du/de la defunt(e) simule(e)'}
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
            {perFiscalByAssure[directDisplay.simulatedDeceased].totalDroits > 0 && (
              <div className="sc-summary-row">
                <span>Droits PER</span>
                <strong>{fmt(perFiscalByAssure[directDisplay.simulatedDeceased].totalDroits)}</strong>
              </div>
            )}
            {prevoyanceByAssure[directDisplay.simulatedDeceased] > 0 && (
              <div className="sc-summary-row">
                <span>Dont prévoyance décès</span>
                <strong>{fmt(prevoyanceByAssure[directDisplay.simulatedDeceased])}</strong>
              </div>
            )}
            {prevoyanceFiscalByAssure[directDisplay.simulatedDeceased].totalDroits > 0 && (
              <div className="sc-summary-row">
                <span>Droits prévoyance</span>
                <strong>{fmt(prevoyanceFiscalByAssure[directDisplay.simulatedDeceased].totalDroits)}</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
