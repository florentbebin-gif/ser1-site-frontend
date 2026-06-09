/**
 * AuditLanding — entrée /audit en 3 cartes (UX-01).
 *
 * Point d'entrée premium qui répond en 3 secondes : où en est la collecte F1,
 * quelle est la prochaine action, quels blocs sont prêts / à compléter / à venir.
 * Composant présentiel pur : consomme un `AuditLandingViewModel`, délègue la
 * navigation via callbacks. Aucune donnée inventée, aucun radar, aucun score,
 * aucune valeur par défaut présentée comme une certitude.
 */

import type { ReactElement } from 'react';

import type {
  AuditLandingBadge as AuditLandingBadgeModel,
  AuditLandingChecklistItem,
  AuditLandingDestination,
  AuditLandingTone,
  AuditLandingViewModel,
} from './auditLandingViewModel';
import '@/styles/sim/index.css';
import './styles/index.css';

export type { AuditLandingDestination } from './auditLandingViewModel';

interface AuditLandingProps {
  viewModel: AuditLandingViewModel;
  onOpenAudit: (destination: AuditLandingDestination) => void;
}

const TONE_GLYPHS: Record<AuditLandingTone, string> = {
  progress: '◐',
  done: '✓',
  todo: '○',
  locked: '🔒',
};

export default function AuditLanding({ viewModel, onOpenAudit }: AuditLandingProps): ReactElement {
  const { summary, synthese, objectifs, pilotage } = viewModel;

  return (
    <div className="audit-landing premium-page">
      <header className="audit-landing__header">
        <p className="audit-landing__eyebrow">Cockpit patrimonial</p>
        <h1 className="audit-landing__title">Audit patrimonial</h1>
        <p className="audit-landing__lead">
          Préparez le dossier avant d’activer les simulations patrimoniales.
        </p>
      </header>

      {/* Bande de statut non interactive : lecture du dossier en un coup d'œil. */}
      <div className="audit-landing__statusband" role="group" aria-label="État de la collecte">
        <div className="audit-landing__status-item">
          <span className="audit-landing__status-label">Collecte</span>
          <Badge badge={summary.collecte} />
        </div>
        <div className="audit-landing__status-item">
          <span className="audit-landing__status-label">Données clés</span>
          <span className="audit-landing__gauge">
            <span className="audit-landing__gauge-track" aria-hidden="true">
              <span
                className="audit-landing__gauge-fill"
                style={{ width: `${Math.round(summary.ratio * 100)}%` }}
              />
            </span>
            <span className="audit-landing__gauge-value">
              {summary.keyDataDone} / {summary.keyDataTotal}
            </span>
          </span>
        </div>
        <div className="audit-landing__status-item">
          <span className="audit-landing__status-label">Restant</span>
          <span className="audit-landing__status-value">
            {summary.requisRemaining} requis · {summary.recommandeRemaining} recommandé
          </span>
        </div>
        <div className="audit-landing__status-item">
          <span className="audit-landing__status-label">Stratégie</span>
          <Badge badge={summary.strategy} />
        </div>
        <div className="audit-landing__status-item audit-landing__status-item--next">
          <span className="audit-landing__status-label">Prochaine action</span>
          <span className="audit-landing__status-next">{summary.nextAction.label}</span>
        </div>
      </div>

      <div className="audit-landing__grid">
        {/* Carte 1 — Synthèse dossier (dominante) */}
        <section
          className="audit-landing__card audit-landing__card--hero premium-card"
          aria-labelledby="audit-landing-synthese"
        >
          <div className="audit-landing__card-head">
            <div>
              <p className="audit-landing__card-eyebrow">Collecte du foyer</p>
              <h2 className="audit-landing__card-title" id="audit-landing-synthese">
                Synthèse dossier
              </h2>
            </div>
            <Badge badge={synthese.badge} />
          </div>

          <ul className="audit-landing__checklist">
            {synthese.checklist.map((checkItem) => (
              <ChecklistRow key={checkItem.id} item={checkItem} onOpenAudit={onOpenAudit} />
            ))}
          </ul>

          <div className="audit-landing__actions">
            <button
              type="button"
              className="premium-btn premium-btn-primary"
              onClick={() => onOpenAudit(synthese.primaryAction.destination)}
            >
              {synthese.primaryAction.label}
            </button>
          </div>
        </section>

        <div className="audit-landing__side">
          {/* Carte 2 — Objectifs */}
          <section
            className="audit-landing__card premium-card"
            aria-labelledby="audit-landing-objectifs"
          >
            <div className="audit-landing__card-head">
              <h2 className="audit-landing__card-title" id="audit-landing-objectifs">
                Objectifs
              </h2>
              <Badge badge={objectifs.badge} />
            </div>

            {objectifs.objectifs.length > 0 ? (
              <>
                <ol className="audit-landing__objectifs">
                  {objectifs.objectifs.map((objectif) => (
                    <li key={objectif.id} className="audit-landing__objectif">
                      <span className="audit-landing__objectif-rank">{objectif.priority}</span>
                      <span className="audit-landing__objectif-label">{objectif.label}</span>
                    </li>
                  ))}
                </ol>
                {objectifs.notes.length > 0 && (
                  <p className="audit-landing__objectif-notes">{objectifs.notes.join(' · ')}</p>
                )}
              </>
            ) : (
              <div className="audit-landing__empty">
                <span className="audit-landing__empty-glyph" aria-hidden="true">
                  ○
                </span>
                {objectifs.emptyLabel}
              </div>
            )}

            <div className="audit-landing__actions">
              <button
                type="button"
                className="premium-btn"
                onClick={() => onOpenAudit(objectifs.action.destination)}
              >
                {objectifs.action.label}
              </button>
            </div>
          </section>

          {/* Carte 3 — Pilotage stratégique (placeholder verrouillé, peu textuel) */}
          <section
            className="audit-landing__card audit-landing__card--locked premium-card"
            aria-labelledby="audit-landing-pilotage"
          >
            <div className="audit-landing__card-head">
              <h2 className="audit-landing__card-title" id="audit-landing-pilotage">
                Pilotage stratégique
              </h2>
              <Badge badge={pilotage.badge} />
            </div>

            <div className="audit-landing__skeleton" aria-hidden="true">
              <div className="audit-landing__skeleton-bars">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <span className="audit-landing__skeleton-lock">{TONE_GLYPHS.locked}</span>
            </div>

            <p className="audit-landing__headline">{pilotage.headline}</p>
            <p className="audit-landing__note">{pilotage.description}</p>
            <p className="audit-landing__caption">{pilotage.caption}</p>
          </section>
        </div>
      </div>
    </div>
  );
}

interface ChecklistRowProps {
  item: AuditLandingChecklistItem;
  onOpenAudit: (destination: AuditLandingDestination) => void;
}

function ChecklistRow({ item, onOpenAudit }: ChecklistRowProps): ReactElement {
  return (
    <li className={`audit-landing__check${item.done ? ' is-done' : ''}`}>
      <span className="audit-landing__check-glyph" aria-hidden="true">
        {item.done ? '✓' : '○'}
      </span>
      <span className="audit-landing__check-label">{item.label}</span>
      <span className={`audit-landing__check-req audit-landing__check-req--${item.requirement}`}>
        {item.requirementLabel}
      </span>
      {item.done ? (
        <span className="audit-landing__check-value">{item.value}</span>
      ) : (
        item.action && (
          <button
            type="button"
            className="audit-landing__check-action"
            onClick={() => onOpenAudit(item.action!.destination)}
          >
            {item.action.label}
          </button>
        )
      )}
    </li>
  );
}

interface BadgeProps {
  badge: AuditLandingBadgeModel;
}

export function Badge({ badge }: BadgeProps): ReactElement {
  return (
    <span className={`audit-landing__badge audit-landing__badge--${badge.tone}`}>
      <span className="audit-landing__badge-glyph" aria-hidden="true">
        {TONE_GLYPHS[badge.tone]}
      </span>
      <span className="audit-landing__badge-label">{badge.label}</span>
    </span>
  );
}
