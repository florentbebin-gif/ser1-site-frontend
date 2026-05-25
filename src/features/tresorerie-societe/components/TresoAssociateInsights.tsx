/**
 * TresoAssociateInsights.tsx — Synthèse visuelle de l’associé actif.
 */

import type { TresoInputsRuntime, TresoProjectionRow } from '../../../engine/tresorerie/types';
import { SimMetric } from '../../../components/ui/sim';
import { IconUsers } from '../../../icons/ui';
import {
  buildTresoAssociateInsightViewModel,
  type TresoAssociateInsightSegment,
} from '../utils/tresorerieSidebarViewModels';

interface Props {
  inputs: TresoInputsRuntime;
  rows: TresoProjectionRow[];
}

function fmtEuro(n: number): string {
  return `${Math.round(n || 0).toLocaleString('fr-FR')} €`;
}

function fmtSignedEuro(n: number): string {
  const rounded = Math.round(n || 0);
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded.toLocaleString('fr-FR')} €`;
}

function segmentClass(segment: TresoAssociateInsightSegment): string {
  return `ts-associate-donut__segment ts-associate-donut__segment--${segment.key}`;
}

function AssociateDonut({
  segments,
  annualNeed,
}: {
  segments: TresoAssociateInsightSegment[];
  annualNeed: number;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const denominator = annualNeed > 0 ? Math.max(annualNeed, total) : total;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (denominator <= 0 || total <= 0) {
    return (
      <svg className="ts-associate-donut" viewBox="0 0 72 72" aria-hidden="true">
        <circle cx="36" cy="36" r={radius} className="ts-associate-donut__empty" />
      </svg>
    );
  }

  return (
    <svg
      className="ts-associate-donut"
      viewBox="0 0 72 72"
      role="img"
      aria-label="Couverture du besoin moyen par source"
    >
      <circle cx="36" cy="36" r={radius} className="ts-associate-donut__base" />
      {segments.map((segment) => {
        const length = (segment.value / denominator) * circumference;
        const dashOffset = offset;
        offset -= length;
        return (
          <circle
            key={segment.key}
            cx="36"
            cy="36"
            r={radius}
            className={segmentClass(segment)}
            strokeDasharray={`${length} ${circumference}`}
            strokeDashoffset={dashOffset}
          >
            <title>{`${segment.label} : ${fmtEuro(segment.value)}`}</title>
          </circle>
        );
      })}
    </svg>
  );
}

export function TresoAssociateInsights({ inputs, rows }: Props) {
  const view = buildTresoAssociateInsightViewModel(inputs, rows);
  const deltaStatus = view.deltaNeed < 0 ? 'warning' : view.deltaNeed > 0 ? 'positive' : 'neutral';
  const coverageStatus =
    view.needTotal > 0 && view.revenusTotalRecupere + 0.5 < view.needTotal ? 'partial' : 'total';
  const coverageLabel =
    view.annualNeed > 0
      ? coverageStatus === 'partial'
        ? 'Couverture partielle'
        : 'Couverture totale'
      : 'Revenu projeté';
  const subtitle =
    view.analysisMode === 'needs' && view.analysisYearsCount > 0
      ? `Moyenne sur ${view.analysisYearsCount} année${view.analysisYearsCount > 1 ? 's' : ''} de besoin`
      : 'Année cible : revenus par source';

  return (
    <div className="premium-card sim-summary-card ts-associate-insights">
      <div className="ts-kpi-sidebar__header sim-card__header sim-card__header--bleed">
        <div className="ts-kpi-sidebar__title-row sim-card__title-row">
          <span className="sim-card__icon sim-card__icon--sm">
            <IconUsers />
          </span>
          <div className="ts-kpi-sidebar__title-text">
            <h2 className="ts-kpi-sidebar__title">Revenus de l’associé</h2>
            <p className="ts-kpi-sidebar__subtitle">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="ts-kpi-sidebar__divider sim-divider sim-divider--tight" />

      {view.status === 'pm' ? (
        <p className="ts-kpi-sidebar__empty">
          Une personne morale ne porte pas de revenus personnels.
        </p>
      ) : view.status === 'empty' ? (
        <p className="ts-kpi-sidebar__empty">Aucun revenu associé projeté pour l’instant.</p>
      ) : (
        <>
          <div className="ts-associate-hero">
            <AssociateDonut segments={view.segments} annualNeed={view.annualNeed} />
            <div className="ts-associate-hero__text">
              <span>Revenu moyen servi</span>
              <strong>{fmtEuro(view.netIncome)}</strong>
              <small>
                {view.associateLabel} · {view.periodLabel}
                {view.targetAge != null ? ` · ${view.targetAge} ans` : ''}
              </small>
              <em className={`ts-associate-coverage is-${coverageStatus}`}>{coverageLabel}</em>
            </div>
          </div>

          <div className="ts-associate-legend">
            {view.segments.map((segment) => (
              <div key={segment.key} className="ts-associate-legend__item">
                <span
                  className={`ts-associate-legend__dot ts-associate-legend__dot--${segment.key}`}
                />
                <span>{segment.label}</span>
                <strong>{fmtEuro(segment.value)}</strong>
              </div>
            ))}
          </div>

          <div className="ts-associate-kpis">
            <SimMetric
              variant="secondary"
              className="ts-associate-kpi"
              label="Besoin moyen / an"
              value={fmtEuro(view.annualNeed)}
            />
            <SimMetric
              variant="secondary"
              className={`ts-associate-kpi ts-associate-kpi--${deltaStatus}`}
              label="Écart moyen / an"
              value={fmtSignedEuro(view.deltaNeed)}
            />
          </div>

          <div className="ts-associate-kpis ts-associate-kpis--cca">
            <SimMetric
              variant="secondary"
              className="ts-associate-kpi"
              label="Besoin total période"
              value={fmtEuro(view.needTotal)}
              note={`Apport CCA : ${fmtEuro(view.ccaTotalContribution)}`}
            />
            <SimMetric
              variant="secondary"
              className="ts-associate-kpi"
              label="Revenus servis période"
              value={fmtEuro(view.revenusTotalRecupere)}
              note={`Moyenne annuelle servie : ${fmtEuro(view.revenusMoyenAnnuel)}/an`}
            />
          </div>
        </>
      )}
    </div>
  );
}
