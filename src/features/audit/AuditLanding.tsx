/**
 * AuditLanding — cockpit /audit (UX-01).
 *
 * Cockpit pleine largeur : colonne gauche (encart « Dossier de travail » + gestion
 * des versions « à venir ») et zone principale en 3 cartes. Les cartes Synthèse
 * dossier et Objectifs SONT les actions (toute la surface est cliquable via un vrai
 * <button>, focus visible, aria-label). La Synthèse restitue l'état civil réel et la
 * filiation issus de F1 ; les blocs masses successorales (F3) et organigramme société
 * (F5) restent des placeholders honnêtes « à venir ». La carte Stratégie est un
 * placeholder verrouillé non interactif. Aucune donnée inventée, aucun radar, aucun
 * score, aucune valeur par défaut présentée comme certitude.
 */

import type { ReactElement, ReactNode } from 'react';

import { DossierLoadedCard } from '@/components/ui/dossier/DossierLoadedCard';
import {
  IconArrowRight,
  IconBuilding,
  IconClipboardCheck,
  IconFolder,
  IconLock,
  IconNetwork,
  IconPieChart,
  IconUsers,
} from '@/icons/ui';

import type {
  AuditLandingDestination,
  AuditLandingObjectifsCard,
  AuditLandingSyntheseCard,
  AuditLandingViewModel,
} from './auditLandingViewModel';
import { FoyerFiliation } from './components/FoyerFiliation';
import '@/styles/sim/index.css';
import './styles/index.css';

export type { AuditLandingDestination } from './auditLandingViewModel';

interface AuditLandingProps {
  viewModel: AuditLandingViewModel;
  onOpenAudit: (destination: AuditLandingDestination) => void;
}

export default function AuditLanding({ viewModel, onOpenAudit }: AuditLandingProps): ReactElement {
  const { hasDossier, synthese, objectifs, pilotage } = viewModel;

  return (
    <div className="audit-landing premium-page">
      <div className="audit-landing__layout">
        <aside className="audit-landing__rail" aria-label="Contexte de travail">
          <DossierLoadedCard
            testId="dossier-loaded-card"
            filenameTestId="dossier-loaded-filename"
            disclaimerTestId="dossier-loaded-disclaimer"
          />
          {hasDossier && <DossierVersionsPlaceholder />}
        </aside>

        <main className="audit-landing__main">
          <header className="audit-landing__header">
            <h1 className="audit-landing__title">Dossier patrimonial</h1>
          </header>

          <div className="audit-landing__grid">
            <SyntheseCard card={synthese} onOpenAudit={onOpenAudit} />

            <div className="audit-landing__side">
              <ObjectifsCard card={objectifs} onOpenAudit={onOpenAudit} />

              {/* Carte Stratégie : placeholder verrouillé, non interactif. */}
              <section
                className="audit-card audit-card--locked"
                aria-labelledby="audit-card-strategie"
              >
                <CardHead icon={<IconLock className="audit-card__icon-svg" />} variant="locked">
                  <h2 className="audit-card__title" id="audit-card-strategie">
                    {pilotage.title}
                  </h2>
                </CardHead>
                <div className="audit-card__skeleton" aria-hidden="true">
                  <div className="audit-card__skeleton-bars">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="audit-card__skeleton-lock">
                    <IconLock className="audit-card__skeleton-lock-svg" />
                  </span>
                </div>
                <p className="audit-card__sub">{pilotage.description}</p>
                <p className="audit-card__caption">{pilotage.caption}</p>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

interface SyntheseCardProps {
  card: AuditLandingSyntheseCard;
  onOpenAudit: (destination: AuditLandingDestination) => void;
}

function SyntheseCard({ card, onOpenAudit }: SyntheseCardProps): ReactElement {
  const { etatCivil, filiation } = card;
  return (
    <section
      className="audit-card audit-card--hero audit-card--action"
      aria-labelledby="audit-card-synthese"
    >
      <CardHead icon={<IconFolder className="audit-card__icon-svg" />}>
        <h2 className="audit-card__title" id="audit-card-synthese">
          Synthèse dossier
        </h2>
      </CardHead>

      <div className="audit-card__tiles">
        <Tile icon={<IconUsers className="audit-tile__icon-svg" />} label="État civil">
          {etatCivil.principalName ? (
            <div className="audit-etatcivil">
              <p className="audit-etatcivil__name">
                {etatCivil.principalName}
                {etatCivil.principalAge != null && (
                  <span className="audit-etatcivil__age"> · {etatCivil.principalAge} ans</span>
                )}
              </p>
              {etatCivil.situationLabel && (
                <p className="audit-etatcivil__line">{etatCivil.situationLabel}</p>
              )}
              {etatCivil.conjointName && (
                <p className="audit-etatcivil__line">Conjoint&nbsp;: {etatCivil.conjointName}</p>
              )}
              {etatCivil.enfantsPrenoms.length > 0 && (
                <p className="audit-etatcivil__line">
                  Enfants&nbsp;: {etatCivil.enfantsPrenoms.join(', ')}
                </p>
              )}
            </div>
          ) : (
            <p className="audit-tile__empty">Foyer à renseigner</p>
          )}
        </Tile>

        <Tile icon={<IconNetwork className="audit-tile__icon-svg" />} label="Filiation">
          <FoyerFiliation filiation={filiation} />
        </Tile>

        <SoonTile
          icon={<IconPieChart className="audit-tile__icon-svg" />}
          label="Masses successorales"
        />
        <SoonTile
          icon={<IconBuilding className="audit-tile__icon-svg" />}
          label="Organigramme société"
        />
      </div>

      <CardGo ariaLabel={card.ariaLabel} onClick={() => onOpenAudit(card.action.destination)} />
    </section>
  );
}

interface ObjectifsCardProps {
  card: AuditLandingObjectifsCard;
  onOpenAudit: (destination: AuditLandingDestination) => void;
}

function ObjectifsCard({ card, onOpenAudit }: ObjectifsCardProps): ReactElement {
  return (
    <section className="audit-card audit-card--action" aria-labelledby="audit-card-objectifs">
      <CardHead icon={<IconClipboardCheck className="audit-card__icon-svg" />}>
        <h2 className="audit-card__title" id="audit-card-objectifs">
          Objectifs
        </h2>
      </CardHead>

      {card.objectifs.length > 0 ? (
        <>
          <ol className="audit-objectifs">
            {card.objectifs.slice(0, 4).map((objectif) => (
              <li key={objectif.id} className="audit-objectifs__item">
                <span className="audit-objectifs__rank">{objectif.priority}</span>
                <span className="audit-objectifs__label">{objectif.label}</span>
              </li>
            ))}
          </ol>
          {card.note && <p className="audit-objectifs__note">{card.note}</p>}
        </>
      ) : (
        <p className="audit-tile__empty">{card.emptyLabel}</p>
      )}

      <CardGo ariaLabel={card.ariaLabel} onClick={() => onOpenAudit(card.action.destination)} />
    </section>
  );
}

interface CardHeadProps {
  icon: ReactNode;
  variant?: 'locked';
  children: ReactNode;
}

function CardHead({ icon, variant, children }: CardHeadProps): ReactElement {
  return (
    <div className="audit-card__head">
      <span
        className={`audit-card__icon${variant === 'locked' ? ' audit-card__icon--locked' : ''}`}
      >
        {icon}
      </span>
      {children}
    </div>
  );
}

interface TileProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}

function Tile({ icon, label, children }: TileProps): ReactElement {
  return (
    <div className="audit-tile">
      <div className="audit-tile__head">
        <span className="audit-tile__icon">{icon}</span>
        <span className="audit-tile__label">{label}</span>
      </div>
      <div className="audit-tile__body">{children}</div>
    </div>
  );
}

interface SoonTileProps {
  icon: ReactNode;
  label: string;
}

/** Tuile « à venir » honnête : la donnée dépend d'une fondation non livrée (F3/F5). */
function SoonTile({ icon, label }: SoonTileProps): ReactElement {
  return (
    <div className="audit-tile audit-tile--soon">
      <div className="audit-tile__head">
        <span className="audit-tile__icon">{icon}</span>
        <span className="audit-tile__label">{label}</span>
      </div>
      <div className="audit-tile__soon">
        <IconLock className="audit-tile__soon-icon" />
        <span>à venir</span>
      </div>
    </div>
  );
}

interface CardGoProps {
  ariaLabel: string;
  onClick: () => void;
}

/** Flèche d'action premium : vrai <button> dont la zone de clic couvre la carte. */
function CardGo({ ariaLabel, onClick }: CardGoProps): ReactElement {
  return (
    <div className="audit-card__foot">
      <button type="button" className="audit-card__go" aria-label={ariaLabel} onClick={onClick}>
        <IconArrowRight className="audit-card__go-arrow" />
      </button>
    </div>
  );
}

/** Gestion des versions / sauvegardes du dossier — placeholder honnête (F6). */
function DossierVersionsPlaceholder(): ReactElement {
  return (
    <section className="audit-aside-card">
      <div className="audit-aside-card__head">
        <IconLock className="audit-aside-card__icon" />
        <span className="audit-aside-card__title">Versions &amp; sauvegardes</span>
      </div>
      <p className="audit-aside-card__note">
        Historique, simulations et restauration du dossier — à venir.
      </p>
    </section>
  );
}
