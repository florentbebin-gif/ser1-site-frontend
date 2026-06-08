/**
 * AuditLanding — entrée /audit en 3 cartes (UX-01).
 *
 * Restitue l'état du dossier F1 avant toute saisie : Synthèse dossier, Pilotage
 * stratégique (placeholder honnête, dépend de F6) et Objectifs. Composant
 * présentiel pur : il consomme un `AuditLandingViewModel` et délègue la
 * navigation via callbacks. Aucune donnée inventée, aucun radar, aucun score.
 */

import type { ReactElement, ReactNode } from 'react';

import type { AuditLandingState, AuditLandingViewModel } from './auditLandingViewModel';
import './styles/index.css';

/** Destination de navigation demandée depuis la landing. */
export type AuditLandingDestination = 'dossier' | 'objectifs';

interface AuditLandingProps {
  viewModel: AuditLandingViewModel;
  onOpenAudit: (destination: AuditLandingDestination) => void;
}

const STATE_GLYPHS: Record<AuditLandingState, string> = {
  vide: '○',
  partiel: '◐',
  complet: '✓',
  'a-completer': '○',
  'a-venir': '→',
};

export default function AuditLanding({ viewModel, onOpenAudit }: AuditLandingProps): ReactElement {
  const { synthese, pilotage, objectifs } = viewModel;

  return (
    <div className="audit-landing premium-page">
      <header className="audit-landing__header premium-header">
        <p className="premium-section-title">Cockpit patrimonial</p>
        <h1 className="premium-title">Audit</h1>
        <p className="premium-subtitle">
          Ce que le dossier sait, ce qui manque, et ce qui reste à venir — avant toute saisie.
        </p>
      </header>

      <div className="audit-landing__grid">
        {/* Carte 1 — Synthèse dossier */}
        <section
          className="audit-landing__card premium-card"
          aria-labelledby="audit-landing-synthese"
        >
          <div className="audit-landing__card-head">
            <h2 className="audit-landing__card-title" id="audit-landing-synthese">
              Synthèse dossier
            </h2>
            <AuditLandingBadge state={synthese.state} label={synthese.stateLabel} />
          </div>
          <p className="audit-landing__card-subtitle">{synthese.title}</p>

          <div className="sim-band sim-band--first">
            <p className="audit-landing__band-title">Données connues</p>
            <dl className="audit-landing__facts">
              {synthese.facts.map((fact) => (
                <div
                  key={fact.id}
                  className={`sim-kpi-line${fact.known ? '' : ' audit-landing__fact--missing'}`}
                >
                  <dt className="sim-kpi-line__label">{fact.label}</dt>
                  <dd className="sim-kpi-line__value">
                    {!fact.known && (
                      <span className="audit-landing__fact-glyph" aria-hidden="true">
                        ○{' '}
                      </span>
                    )}
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="sim-band">
            <p className="audit-landing__band-title">Manques</p>
            {synthese.missing.length > 0 ? (
              <ul className="audit-landing__missing">
                {synthese.missing.map((item) => (
                  <li key={item.id} className="audit-landing__missing-item">
                    <span className="audit-landing__missing-glyph" aria-hidden="true">
                      !
                    </span>
                    {item.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="audit-landing__note">Socle F1 complet : aucun manque bloquant.</p>
            )}
          </div>

          <div className="audit-landing__actions">
            <button
              type="button"
              className="premium-btn premium-btn-primary"
              onClick={() => onOpenAudit('dossier')}
            >
              {synthese.state === 'a-completer' ? 'Compléter le dossier' : 'Reprendre l’audit'}
            </button>
          </div>
        </section>

        {/* Carte 2 — Pilotage stratégique (placeholder honnête, dépend de F6) */}
        <section
          className="audit-landing__card premium-card"
          aria-labelledby="audit-landing-pilotage"
        >
          <div className="audit-landing__card-head">
            <h2 className="audit-landing__card-title" id="audit-landing-pilotage">
              Pilotage stratégique
            </h2>
            <AuditLandingBadge state={pilotage.state} label={pilotage.stateLabel} />
          </div>
          <p className="audit-landing__card-subtitle">
            Dépend de la fondation {pilotage.dependsOn}
          </p>

          <div className="sim-band sim-band--first">
            <p className="audit-landing__note">{pilotage.description}</p>
          </div>

          <div className="sim-band">
            <p className="audit-landing__band-title">À venir</p>
            <ul className="audit-landing__upcoming">
              {pilotage.upcoming.map((item) => (
                <li key={item} className="audit-landing__upcoming-item">
                  <span className="audit-landing__upcoming-glyph" aria-hidden="true">
                    →
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="audit-landing__actions">
            <button type="button" className="premium-btn" disabled aria-disabled="true">
              Pilotage à venir
            </button>
          </div>
        </section>

        {/* Carte 3 — Objectifs */}
        <section
          className="audit-landing__card premium-card"
          aria-labelledby="audit-landing-objectifs"
        >
          <div className="audit-landing__card-head">
            <h2 className="audit-landing__card-title" id="audit-landing-objectifs">
              Objectifs
            </h2>
            <AuditLandingBadge state={objectifs.state} label={objectifs.stateLabel} />
          </div>
          <p className="audit-landing__card-subtitle">
            Objectifs, contraintes et opérations prévues
          </p>

          <div className="audit-landing__tiles">
            <FlatTile label="Objectifs" value={objectifs.objectifs.length} />
            <FlatTile label="Contraintes" value={objectifs.contraintes.length} />
            <FlatTile label="Opérations" value={objectifs.operationsPrevues.length} />
          </div>

          <div className="sim-band">
            <p className="audit-landing__band-title">Objectifs prioritaires</p>
            {objectifs.objectifs.length > 0 ? (
              <ol className="audit-landing__objectifs">
                {objectifs.objectifs.map((objectif) => (
                  <li key={objectif.id} className="sim-kpi-line">
                    <span className="sim-kpi-line__label">Priorité {objectif.priority}</span>
                    <span className="sim-kpi-line__value">{objectif.label}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="audit-landing__note">Aucun objectif renseigné — à compléter.</p>
            )}
          </div>

          {(objectifs.contraintes.length > 0 || objectifs.operationsPrevues.length > 0) && (
            <div className="sim-band">
              {objectifs.contraintes.length > 0 && (
                <>
                  <p className="audit-landing__band-title">Contraintes</p>
                  <ul className="audit-landing__list">
                    {objectifs.contraintes.map((contrainte) => (
                      <li key={contrainte.id} className="sim-kpi-line">
                        <span className="sim-kpi-line__value">{contrainte.label}</span>
                        <span className="sim-kpi-line__label">{contrainte.priorityLabel}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {objectifs.operationsPrevues.length > 0 && (
                <>
                  <p className="audit-landing__band-title">Opérations prévues</p>
                  <ul className="audit-landing__list">
                    {objectifs.operationsPrevues.map((operation) => (
                      <li key={operation.id} className="sim-kpi-line">
                        <span className="sim-kpi-line__value">{operation.label}</span>
                        <span className="sim-kpi-line__label">{operation.statusLabel}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <div className="audit-landing__actions">
            <button type="button" className="premium-btn" onClick={() => onOpenAudit('objectifs')}>
              Voir / compléter les objectifs
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

interface AuditLandingBadgeProps {
  state: AuditLandingState;
  label: string;
}

export function AuditLandingBadge({ state, label }: AuditLandingBadgeProps): ReactElement {
  return (
    <span className={`audit-landing__badge audit-landing__badge--${state}`}>
      <span className="audit-landing__badge-glyph" aria-hidden="true">
        {STATE_GLYPHS[state]}
      </span>
      <span className="audit-landing__badge-label">{label}</span>
    </span>
  );
}

interface FlatTileProps {
  label: string;
  value: ReactNode;
}

function FlatTile({ label, value }: FlatTileProps): ReactElement {
  return (
    <div className="sim-tile-flat">
      <span className="sim-tile-flat__label">{label}</span>
      <span className="sim-tile-flat__value">{value}</span>
    </div>
  );
}
