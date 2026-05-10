/**
 * TresoAssociateInsights.tsx — Synthèse visuelle de l’associé actif.
 */

import type { TresoInputsRuntime, TresoProjectionRow } from '../../../engine/tresorerie/types';
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

function AssociateDonut({ segments }: { segments: TresoAssociateInsightSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (total <= 0) {
    return (
      <svg className="ts-associate-donut" viewBox="0 0 72 72" aria-hidden="true">
        <circle cx="36" cy="36" r={radius} className="ts-associate-donut__empty" />
      </svg>
    );
  }

  return (
    <svg className="ts-associate-donut" viewBox="0 0 72 72" role="img" aria-label="Répartition des revenus nets">
      <circle cx="36" cy="36" r={radius} className="ts-associate-donut__base" />
      {segments.map(segment => {
        const length = (segment.value / total) * circumference;
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
  const deltaStatus = view.deltaNeed > 0 ? 'warning' : view.deltaNeed < 0 ? 'positive' : 'neutral';

  return (
    <div className="premium-card ts-associate-insights">
      <div className="ts-kpi-sidebar__header">
        <h2 className="ts-kpi-sidebar__title">Associé actif</h2>
        <p className="ts-kpi-sidebar__subtitle">
          Revenus projetés à l’année cible du parcours
        </p>
      </div>
      <div className="ts-kpi-sidebar__divider" />

      {view.status === 'pm' ? (
        <p className="ts-kpi-sidebar__empty">
          Une personne morale ne porte pas de revenus personnels.
        </p>
      ) : view.status === 'empty' ? (
        <p className="ts-kpi-sidebar__empty">
          Aucun revenu associé projeté pour l’instant.
        </p>
      ) : (
        <>
          <div className="ts-associate-hero">
            <AssociateDonut segments={view.segments} />
            <div className="ts-associate-hero__text">
              <span>{view.associateLabel}</span>
              <strong>{fmtEuro(view.netIncome)}</strong>
              <small>
                {view.targetYear}
                {view.targetAge != null ? ` · ${view.targetAge} ans` : ''}
              </small>
            </div>
          </div>

          <div className="ts-associate-legend">
            {view.segments.map(segment => (
              <div key={segment.key} className="ts-associate-legend__item">
                <span className={`ts-associate-legend__dot ts-associate-legend__dot--${segment.key}`} />
                <span>{segment.label}</span>
                <strong>{fmtEuro(segment.value)}</strong>
              </div>
            ))}
          </div>

          <div className="ts-associate-kpis">
            <div>
              <span>Besoin net</span>
              <strong>{fmtEuro(view.annualNeed)}</strong>
            </div>
            <div className={`is-${deltaStatus}`}>
              <span>Écart besoin</span>
              <strong>{fmtSignedEuro(view.deltaNeed)}</strong>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
