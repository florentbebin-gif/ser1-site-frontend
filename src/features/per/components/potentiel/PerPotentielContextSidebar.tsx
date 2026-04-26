import React from 'react';
import type { PerPotentielResult } from '../../../../engine/per';
import type { WizardStep } from '../../hooks/usePerPotentiel';

interface PerPotentielContextSidebarProps {
  step: WizardStep;
  isCouple: boolean;
  showRevenusPreview: boolean;
  showAdjustedPotentiel: boolean;
  fiscalPreviewTitle: string;
  projectionPreviewTitle: string;
  showProjectedPlafondCalcule: boolean;
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

type MetricItem = {
  label: string;
  value: string;
};

function HeroDeclarantPair({
  items,
  compact = false,
}: {
  items: MetricItem[];
  compact?: boolean;
}): React.ReactElement {
  return (
    <div className={`per-potentiel-declarant-pair${compact ? ' per-potentiel-declarant-pair--compact' : ''}`}>
      {items.map((item) => (
        <div key={item.label} className="per-potentiel-declarant-metric">
          <span className="per-potentiel-declarant-metric__label">{item.label}</span>
          <strong className="per-potentiel-declarant-metric__value">{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function SecondaryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div className="per-potentiel-secondary-metric">
      <span className="per-potentiel-secondary-metric__label">{label}</span>
      <strong className="per-potentiel-secondary-metric__value">{value}</strong>
    </div>
  );
}

function CompactMetricList({
  items,
}: {
  items: MetricItem[];
}): React.ReactElement {
  return (
    <dl className="per-potentiel-compact-metrics">
      {items.map((item) => (
        <div key={item.label} className="per-potentiel-compact-metric">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function PreviewColumn({
  title,
  items,
}: {
  title: string;
  items: MetricItem[];
}): React.ReactElement {
  return (
    <div className="per-potentiel-preview-column">
      <div className="per-potentiel-preview-column__title">{title}</div>
      <CompactMetricList items={items} />
    </div>
  );
}

function PreviewSection({
  title,
  isCouple,
  declarant1,
  declarant2,
}: {
  title: string;
  isCouple: boolean;
  declarant1: MetricItem[];
  declarant2?: MetricItem[];
}): React.ReactElement {
  const hasDeclarant2 = isCouple && declarant2 && declarant2.length > 0;

  return (
    <div className="per-potentiel-preview-section">
      <div className="per-potentiel-context-section__title">{title}</div>
      <div className={`per-potentiel-preview-columns${hasDeclarant2 ? ' is-couple' : ''}`}>
        <PreviewColumn title="Déclarant 1" items={declarant1} />
        {hasDeclarant2 && <PreviewColumn title="Déclarant 2" items={declarant2} />}
      </div>
    </div>
  );
}

export function PerPotentielContextSidebar({
  step,
  isCouple,
  showRevenusPreview,
  showAdjustedPotentiel,
  fiscalPreviewTitle,
  projectionPreviewTitle,
  showProjectedPlafondCalcule,
  parcoursPills,
  totalAvisIrD1,
  totalAvisIrD2,
  result,
}: PerPotentielContextSidebarProps): React.ReactElement {
  const showPotentielAvis = step !== 1 && (step <= 3 || showAdjustedPotentiel);
  const showLivePreview = Boolean(result);
  const potentielD1 = showAdjustedPotentiel && result
    ? result.deductionFlow163Q.declarant1.disponibleRestant
    : totalAvisIrD1;
  const potentielD2 = showAdjustedPotentiel && result
    ? result.deductionFlow163Q.declarant2?.disponibleRestant ?? totalAvisIrD2
    : totalAvisIrD2;
  const potentielLabel = showAdjustedPotentiel
    ? '163 quatervicies disponible après saisie'
    : "163 quatervicies issu de l'avis IR";
  const potentielItems = [
    { label: 'Déclarant 1', value: fmtCurrency(potentielD1) },
    ...((isCouple || potentielD2 > 0)
      ? [{ label: 'Déclarant 2', value: fmtCurrency(potentielD2) }]
      : []),
  ];
  const madelinItems = result?.plafondMadelin
    ? [
      { label: 'Déclarant 1', value: fmtCurrency(result.plafondMadelin.declarant1.disponibleRestant) },
      ...(isCouple && result.plafondMadelin.declarant2
        ? [{ label: 'Déclarant 2', value: fmtCurrency(result.plafondMadelin.declarant2.disponibleRestant) }]
        : []),
    ]
    : [];

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
      {
        label: 'Plafond calculé',
        value: showProjectedPlafondCalcule
          ? fmtCurrency(result.projectionAvisSuivant.declarant1.plafondCalculeN)
          : 'À déterminer',
      },
      { label: 'Total', value: fmtCurrency(result.projectionAvisSuivant.declarant1.plafondTotal) },
    ]
    : [];
  const projectionD2 = result?.projectionAvisSuivant.declarant2
    ? [
      { label: 'Reliquat N-2', value: fmtCurrency(result.projectionAvisSuivant.declarant2.nonUtiliseN2) },
      { label: 'Reliquat N-1', value: fmtCurrency(result.projectionAvisSuivant.declarant2.nonUtiliseN1) },
      { label: 'Reliquat N', value: fmtCurrency(result.projectionAvisSuivant.declarant2.nonUtiliseN) },
      {
        label: 'Plafond calculé',
        value: showProjectedPlafondCalcule
          ? fmtCurrency(result.projectionAvisSuivant.declarant2.plafondCalculeN)
          : 'À déterminer',
      },
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
              <HeroDeclarantPair items={potentielItems} />
            </div>
          )}

          {madelinItems.length > 0 && (
            <div className="per-potentiel-context-item">
              <span className="per-potentiel-context-label per-potentiel-context-label--small">Enveloppes Madelin N</span>
              <HeroDeclarantPair items={madelinItems} compact />
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
                <h3 className="sim-card__title">{fiscalPreviewTitle}</h3>
              </div>
              <div className="sim-divider sim-divider--tight" />

              <div className="per-sidebar-hero">
                <div className="per-sidebar-hero__left">
                  <div className="per-sidebar-hero__label">IR estimé</div>
                  <div className="per-sidebar-hero__value">{fmtCurrency(result.situationFiscale.irEstime)}</div>
                </div>
                <div className="per-potentiel-mini-kpis-row">
                  <SecondaryMetric label="TMI" value={fmtPercent(result.situationFiscale.tmi)} />
                  <SecondaryMetric label="6QR" value={result.declaration2042.case6QR ? 'Oui' : 'Non'} />
                </div>
              </div>

              <div className="sim-divider sim-divider--tight" />
              <PreviewSection
                title="Déclaration 2042"
                isCouple={isCouple}
                declarant1={declarationD1}
                declarant2={declarationD2}
              />

              <div className="sim-divider sim-divider--tight" />
              <PreviewSection
                title="Prochain avis IR"
                isCouple={isCouple}
                declarant1={projectionD1}
                declarant2={projectionD2}
              />
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
                  <h3 className="sim-card__title">{fiscalPreviewTitle}</h3>
                </div>
                <div className="sim-divider sim-divider--tight" />

                <div className="per-sidebar-hero">
                  <div className="per-sidebar-hero__left">
                    <div className="per-sidebar-hero__label">IR estimé</div>
                    <div className="per-sidebar-hero__value">{fmtCurrency(result.situationFiscale.irEstime)}</div>
                  </div>
                  <div className="per-potentiel-mini-kpis-row">
                    <SecondaryMetric label="TMI" value={fmtPercent(result.situationFiscale.tmi)} />
                    <SecondaryMetric label="6QR" value={result.declaration2042.case6QR ? 'Oui' : 'Non'} />
                  </div>
                </div>

                <div className="sim-divider sim-divider--tight" />
                <PreviewSection
                  title="Déclaration 2042"
                  isCouple={isCouple}
                  declarant1={declarationD1}
                  declarant2={declarationD2}
                />
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
                  <h3 className="sim-card__title">{projectionPreviewTitle}</h3>
                </div>
                <div className="sim-divider sim-divider--tight" />
                <PreviewSection
                  title="Prochain avis IR"
                  isCouple={isCouple}
                  declarant1={projectionD1}
                  declarant2={projectionD2}
                />
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
