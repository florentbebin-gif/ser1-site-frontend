import React from 'react';
import type { PerPotentielResult } from '../../../../engine/per';
import type { WizardStep } from '../../hooks/usePerPotentiel';

interface PerPotentielContextSidebarProps {
  step: WizardStep;
  isCouple: boolean;
  showRevenusPreview: boolean;
  parcoursPills: Array<{ label: string; on: boolean }>;
  totalAvisIrD1: number;
  totalAvisIrD2: number;
  result: PerPotentielResult | null;
}

const fmtCurrency = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

const fmtPercent = (value: number): string =>
  `${(value <= 1 ? value * 100 : value).toFixed(1)} %`;

function MiniKpi({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div className="per-potentiel-mini-kpi">
      <span className="per-potentiel-mini-kpi-label">{label}</span>
      <strong className="per-potentiel-mini-kpi-value">{value}</strong>
    </div>
  );
}

function PreviewColumn({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: string }>;
}): React.ReactElement {
  return (
    <div className="per-potentiel-preview-column">
      <div className="per-potentiel-preview-column__title">{title}</div>
      <div className="per-potentiel-mini-kpis">
        {items.map((item) => (
          <MiniKpi key={`${title}-${item.label}`} label={item.label} value={item.value} />
        ))}
      </div>
    </div>
  );
}

export function PerPotentielContextSidebar({
  step,
  isCouple,
  showRevenusPreview,
  parcoursPills,
  totalAvisIrD1,
  totalAvisIrD2,
  result,
}: PerPotentielContextSidebarProps): React.ReactElement {
  const showPotentielAvis = step <= 3;
  const showLivePreview = Boolean(result && step !== 5);
  const potentielD1 = showRevenusPreview && result
    ? result.deductionFlow163Q.declarant1.disponibleRestant
    : totalAvisIrD1;
  const potentielD2 = showRevenusPreview && result
    ? result.deductionFlow163Q.declarant2?.disponibleRestant ?? totalAvisIrD2
    : totalAvisIrD2;
  const potentielLabel = showRevenusPreview
    ? '163 quatervicies disponible après saisie'
    : "163 quatervicies issu de l'avis IR";

  const declarationD1 = result
    ? [
      { label: '6NS', value: fmtCurrency(result.declaration2042.case6NS) },
      { label: '6RS', value: fmtCurrency(result.declaration2042.case6RS) },
      { label: '6OS', value: fmtCurrency(result.declaration2042.case6OS) },
      { label: '6QS', value: fmtCurrency(result.declaration2042.case6QS) },
    ]
    : [];
  const declarationD2 = result
    ? [
      { label: '6NT', value: fmtCurrency(result.declaration2042.case6NT ?? 0) },
      { label: '6RT', value: fmtCurrency(result.declaration2042.case6RT ?? 0) },
      { label: '6OT', value: fmtCurrency(result.declaration2042.case6OT ?? 0) },
      { label: '6QT', value: fmtCurrency(result.declaration2042.case6QT ?? 0) },
    ]
    : [];
  const projectionD1 = result
    ? [
      { label: 'Reliquat N-2', value: fmtCurrency(result.projectionAvisSuivant.declarant1.nonUtiliseN2) },
      { label: 'Reliquat N-1', value: fmtCurrency(result.projectionAvisSuivant.declarant1.nonUtiliseN1) },
      { label: 'Reliquat N', value: fmtCurrency(result.projectionAvisSuivant.declarant1.nonUtiliseN) },
      { label: 'Plafond calculé', value: fmtCurrency(result.projectionAvisSuivant.declarant1.plafondCalculeN) },
      { label: 'Total', value: fmtCurrency(result.projectionAvisSuivant.declarant1.plafondTotal) },
    ]
    : [];
  const projectionD2 = result?.projectionAvisSuivant.declarant2
    ? [
      { label: 'Reliquat N-2', value: fmtCurrency(result.projectionAvisSuivant.declarant2.nonUtiliseN2) },
      { label: 'Reliquat N-1', value: fmtCurrency(result.projectionAvisSuivant.declarant2.nonUtiliseN1) },
      { label: 'Reliquat N', value: fmtCurrency(result.projectionAvisSuivant.declarant2.nonUtiliseN) },
      { label: 'Plafond calculé', value: fmtCurrency(result.projectionAvisSuivant.declarant2.plafondCalculeN) },
      { label: 'Total', value: fmtCurrency(result.projectionAvisSuivant.declarant2.plafondTotal) },
    ]
    : [];

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
          <h3 className="sim-card__title">Potentiel</h3>
        </div>
        <div className="sim-divider" />
        <div className="per-potentiel-context-list">
          {parcoursPills.length > 0 && (
            <div className="per-potentiel-context-item">
              <span className="per-potentiel-context-label per-potentiel-context-label--small">Parcours</span>
              <div className="per-potentiel-pills">
                {parcoursPills.map((pill) => (
                  <span key={pill.label} className={`per-potentiel-pill${pill.on ? ' is-on' : ''}`}>
                    {pill.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {parcoursPills.length > 0 && showPotentielAvis && <div className="sim-divider sim-divider--tight" />}

          {showPotentielAvis && (
            <div className="per-potentiel-context-item per-potentiel-context-item--avis">
              <span className="per-potentiel-context-label per-potentiel-context-label--small">{potentielLabel}</span>
              <div className="per-potentiel-mini-kpis per-potentiel-mini-kpis--avis">
                <MiniKpi label="Déclarant 1" value={fmtCurrency(potentielD1)} />
                {(isCouple || potentielD2 > 0) && (
                  <MiniKpi label="Déclarant 2" value={fmtCurrency(potentielD2)} />
                )}
              </div>
            </div>
          )}

          {result?.plafondMadelin && (
            <div className="per-potentiel-context-item">
              <span className="per-potentiel-context-label per-potentiel-context-label--small">Enveloppes Madelin N</span>
              <div className="per-potentiel-mini-kpis">
                <MiniKpi
                  label="D1 15 %"
                  value={fmtCurrency(result.plafondMadelin.declarant1.enveloppe15Versement)}
                />
                <MiniKpi
                  label="D1 10 %"
                  value={fmtCurrency(result.plafondMadelin.declarant1.enveloppe10)}
                />
                {isCouple && result.plafondMadelin.declarant2 && (
                  <>
                    <MiniKpi
                      label="D2 15 %"
                      value={fmtCurrency(result.plafondMadelin.declarant2.enveloppe15Versement)}
                    />
                    <MiniKpi
                      label="D2 10 %"
                      value={fmtCurrency(result.plafondMadelin.declarant2.enveloppe10)}
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showLivePreview && result && (
        <>
          {showRevenusPreview ? (
            <div className="premium-card per-potentiel-context-card sim-summary-card sim-summary-card--secondary">
              <div className="sim-card__title-row">
                <div className="sim-card__icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="20" x2="12" y2="10" />
                    <line x1="18" y1="20" x2="18" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="16" />
                  </svg>
                </div>
                <h3 className="sim-card__title">Aperçu en direct</h3>
              </div>
              <div className="sim-divider sim-divider--tight" />

              <div className="per-sidebar-hero">
                <div className="per-sidebar-hero__left">
                  <div className="per-sidebar-hero__label">IR estimé</div>
                  <div className="per-sidebar-hero__value">{fmtCurrency(result.situationFiscale.irEstime)}</div>
                </div>
                <div className="per-potentiel-mini-kpis-row">
                  <MiniKpi label="TMI" value={fmtPercent(result.situationFiscale.tmi)} />
                  <MiniKpi label="6QR" value={result.declaration2042.case6QR ? 'Oui' : 'Non'} />
                </div>
              </div>

              <div className="sim-divider sim-divider--tight" />
              <div className="per-potentiel-preview-section">
                <div className="per-potentiel-context-section__title">Déclaration 2042</div>
                <div className={`per-potentiel-preview-columns${isCouple ? ' is-couple' : ''}`}>
                  <PreviewColumn title="Déclarant 1" items={declarationD1} />
                  {isCouple && <PreviewColumn title="Déclarant 2" items={declarationD2} />}
                </div>
              </div>

              <div className="sim-divider sim-divider--tight" />
              <div className="per-potentiel-preview-section">
                <div className="per-potentiel-context-section__title">Prochain avis IR</div>
                <div className={`per-potentiel-preview-columns${isCouple && projectionD2.length > 0 ? ' is-couple' : ''}`}>
                  <PreviewColumn title="Déclarant 1" items={projectionD1} />
                  {isCouple && projectionD2.length > 0 && (
                    <PreviewColumn title="Déclarant 2" items={projectionD2} />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="premium-card per-potentiel-context-card sim-summary-card sim-summary-card--secondary">
                <div className="sim-card__title-row">
                  <div className="sim-card__icon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="12" y1="20" x2="12" y2="10" />
                      <line x1="18" y1="20" x2="18" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="16" />
                    </svg>
                  </div>
                  <h3 className="sim-card__title">Aperçu en direct</h3>
                </div>
                <div className="sim-divider sim-divider--tight" />

                <div className="per-sidebar-hero">
                  <div className="per-sidebar-hero__left">
                    <div className="per-sidebar-hero__label">IR estimé</div>
                    <div className="per-sidebar-hero__value">{fmtCurrency(result.situationFiscale.irEstime)}</div>
                  </div>
                  <div className="per-potentiel-mini-kpis">
                    <MiniKpi label="TMI" value={fmtPercent(result.situationFiscale.tmi)} />
                    <MiniKpi label="6QR" value={result.declaration2042.case6QR ? 'Oui' : 'Non'} />
                  </div>
                </div>

                <div className="sim-divider sim-divider--tight" />
                <div className="per-potentiel-context-section">
                  <div className="per-potentiel-context-section__title">Déclaration 2042</div>
                  <div className="per-potentiel-mini-kpis">
                    <MiniKpi label="D1 6NS" value={fmtCurrency(result.declaration2042.case6NS)} />
                    <MiniKpi label="D1 6RS" value={fmtCurrency(result.declaration2042.case6RS)} />
                    <MiniKpi label="D1 6OS" value={fmtCurrency(result.declaration2042.case6OS)} />
                    <MiniKpi label="D1 6QS" value={fmtCurrency(result.declaration2042.case6QS)} />
                    {isCouple && typeof result.declaration2042.case6NT === 'number' && (
                      <>
                        <MiniKpi label="D2 6NT" value={fmtCurrency(result.declaration2042.case6NT)} />
                        <MiniKpi label="D2 6RT" value={fmtCurrency(result.declaration2042.case6RT ?? 0)} />
                        <MiniKpi label="D2 6OT" value={fmtCurrency(result.declaration2042.case6OT ?? 0)} />
                        <MiniKpi label="D2 6QT" value={fmtCurrency(result.declaration2042.case6QT ?? 0)} />
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="premium-card per-potentiel-context-card sim-summary-card sim-summary-card--secondary">
                <div className="sim-card__title-row">
                  <div className="sim-card__icon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 7h18" />
                      <path d="M6 11h12" />
                      <path d="M8 15h8" />
                      <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                    </svg>
                  </div>
                  <h3 className="sim-card__title">Aperçu en direct</h3>
                </div>
                <div className="sim-divider sim-divider--tight" />
                <div className="per-potentiel-context-section">
                  <div className="per-potentiel-context-section__title">Prochain avis IR</div>
                  <div className="per-potentiel-mini-kpis">
                    <MiniKpi label="D1 reliquat N-2" value={fmtCurrency(result.projectionAvisSuivant.declarant1.nonUtiliseN2)} />
                    <MiniKpi label="D1 reliquat N-1" value={fmtCurrency(result.projectionAvisSuivant.declarant1.nonUtiliseN1)} />
                    <MiniKpi label="D1 reliquat N" value={fmtCurrency(result.projectionAvisSuivant.declarant1.nonUtiliseN)} />
                    <MiniKpi label="D1 plafond calculé" value={fmtCurrency(result.projectionAvisSuivant.declarant1.plafondCalculeN)} />
                    <MiniKpi label="D1 total" value={fmtCurrency(result.projectionAvisSuivant.declarant1.plafondTotal)} />
                    {isCouple && result.projectionAvisSuivant.declarant2 && (
                      <>
                        <MiniKpi label="D2 reliquat N-2" value={fmtCurrency(result.projectionAvisSuivant.declarant2.nonUtiliseN2)} />
                        <MiniKpi label="D2 reliquat N-1" value={fmtCurrency(result.projectionAvisSuivant.declarant2.nonUtiliseN1)} />
                        <MiniKpi label="D2 reliquat N" value={fmtCurrency(result.projectionAvisSuivant.declarant2.nonUtiliseN)} />
                        <MiniKpi label="D2 plafond calculé" value={fmtCurrency(result.projectionAvisSuivant.declarant2.plafondCalculeN)} />
                        <MiniKpi label="D2 total" value={fmtCurrency(result.projectionAvisSuivant.declarant2.plafondTotal)} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
