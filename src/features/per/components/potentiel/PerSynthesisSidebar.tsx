import React from 'react';
import type { PerPotentielResult } from '../../../../engine/per';
import { PerAmountInput } from './PerAmountInput';

const fmtCurrency = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

const fmtPercent = (value: number): string =>
  `${(value <= 1 ? value * 100 : value).toFixed(1)} %`;

interface PerSynthesisSidebarProps {
  result: PerPotentielResult;
  modeVersement: boolean;
  versementEnvisage: number;
  onSetVersement: (_value: number) => void;
}

export function PerSynthesisSidebar({
  result,
  modeVersement,
  versementEnvisage,
  onSetVersement,
}: PerSynthesisSidebarProps): React.ReactElement {
  const totalDispo = result.deductionFlow163Q.declarant1.disponibleRestant
    + (result.deductionFlow163Q.declarant2?.disponibleRestant ?? 0);
  const totalPlafond = result.deductionFlow163Q.declarant1.plafondDisponible
    + (result.deductionFlow163Q.declarant2?.plafondDisponible ?? 0);
  const used = totalPlafond - totalDispo;
  const donutTotal = used + totalDispo;
  const donutR = 27;
  const donutCirc = 2 * Math.PI * donutR;
  const dispoLen = donutTotal > 0 ? (totalDispo / donutTotal) * donutCirc : 0;
  const usedLen = donutCirc - dispoLen;

  return (
    <>
      <div className="premium-card per-potentiel-context-card sim-summary-card">
        <div className="sim-card__title-row">
          <div className="sim-card__icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
          </div>
          <h3 className="sim-card__title">
            {modeVersement ? 'Potentiel déductible' : 'Plafond restant'}
          </h3>
        </div>
        <div className="sim-divider" />
        <div className="per-sidebar-hero">
          <div className="per-sidebar-hero__left">
            <div className="per-sidebar-hero__label">Disponible total</div>
            <div className="per-sidebar-hero__value">{fmtCurrency(totalDispo)}</div>
          </div>
          <svg width="68" height="68" viewBox="0 0 68 68" aria-hidden="true">
            <circle cx={34} cy={34} r={donutR} fill="none" stroke="var(--color-c8)" strokeWidth="9" />
            {donutTotal > 0 && (
              <>
                <circle cx={34} cy={34} r={donutR} fill="none" stroke="var(--color-c5)" strokeWidth="9" strokeDasharray={`${dispoLen} ${donutCirc}`} strokeDashoffset="0" strokeLinecap="butt" />
                <circle cx={34} cy={34} r={donutR} fill="none" stroke="var(--color-c6)" strokeWidth="9" strokeDasharray={`${usedLen} ${donutCirc}`} strokeDashoffset={`${-dispoLen}`} strokeLinecap="butt" />
              </>
            )}
          </svg>
        </div>
        <div className="sim-divider sim-divider--tight" />
        <div className="per-potentiel-mini-kpis">
          <div className="per-potentiel-mini-kpi">
            <span className="per-potentiel-mini-kpi-label">TMI</span>
            <strong className="per-potentiel-mini-kpi-value">{fmtPercent(result.situationFiscale.tmi)}</strong>
          </div>
          <div className="per-potentiel-mini-kpi">
            <span className="per-potentiel-mini-kpi-label">IR estimé</span>
            <strong className="per-potentiel-mini-kpi-value">{fmtCurrency(result.situationFiscale.irEstime)}</strong>
          </div>
          <div className="per-potentiel-mini-kpi">
            <span className="per-potentiel-mini-kpi-label">Marge TMI</span>
            <strong className="per-potentiel-mini-kpi-value">{fmtCurrency(result.situationFiscale.montantDansLaTMI)}</strong>
          </div>
          <div className="per-potentiel-mini-kpi">
            <span className="per-potentiel-mini-kpi-label">CEHR</span>
            <strong className="per-potentiel-mini-kpi-value">{fmtCurrency(result.situationFiscale.cehr)}</strong>
          </div>
        </div>
      </div>

      {modeVersement && (
        <div className="premium-card per-potentiel-context-card sim-summary-card sim-summary-card--secondary">
          <div className="sim-card__title-row">
            <div className="sim-card__icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <h3 className="sim-card__title">Simulation versement</h3>
          </div>
          <div className="sim-divider sim-divider--tight" />
          <div className="per-sidebar-simulation">
            <PerAmountInput
              value={versementEnvisage}
              onChange={onSetVersement}
              label="Versement envisagé"
            />
            {result.simulation ? (
              <div className="per-potentiel-mini-kpis">
                <div className="per-potentiel-mini-kpi">
                  <span className="per-potentiel-mini-kpi-label">Économie IR</span>
                  <strong className="per-potentiel-mini-kpi-value">{fmtCurrency(result.simulation.economieIRAnnuelle)}</strong>
                </div>
                <div className="per-potentiel-mini-kpi">
                  <span className="per-potentiel-mini-kpi-label">Coût net</span>
                  <strong className="per-potentiel-mini-kpi-value">{fmtCurrency(result.simulation.coutNetApresFiscalite)}</strong>
                </div>
              </div>
            ) : (
              <p className="per-sidebar-simulation__hint">Saisissez un versement pour voir l&apos;économie d&apos;impôt.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
