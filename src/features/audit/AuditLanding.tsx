/**
 * AuditLanding — cockpit /audit (UX-01).
 *
 * Cockpit pleine largeur : panneau contextuel gauche (encart dossier + gestion des
 * versions « à venir ») et zone principale en 3 cartes. Les cartes Synthèse et
 * Objectifs SONT les actions (vrai <button> plein-carte, flèche premium, focus
 * visible). La Synthèse restitue l'état civil réel et la filiation F1 ; les masses
 * successorales (F3) restent un placeholder honnête réduit. L'organigramme société
 * n'apparaît pas tant qu'aucune société n'est saisie (F5). Stratégie verrouillée.
 * Aucune donnée inventée, aucune valeur par défaut comme certitude.
 */

import type { ReactElement, ReactNode } from 'react';

import { DossierLoadedCard } from '@/components/ui/dossier/DossierLoadedCard';
import {
  IconArrowRight,
  IconClipboardCheck,
  IconFolder,
  IconInfo,
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
          <EtatCivil card={card} />
        </Tile>

        <Tile icon={<IconNetwork className="audit-tile__icon-svg" />} label="Filiation">
          <FoyerFiliation
            principal={card.principal}
            conjoint={card.conjoint}
            enfants={card.enfants}
            hasData={card.filiationHasData}
          />
        </Tile>

        <MassesPlaceholder />
      </div>

      <CardGo ariaLabel={card.ariaLabel} onClick={() => onOpenAudit(card.action.destination)} />
    </section>
  );
}

function EtatCivil({ card }: { card: AuditLandingSyntheseCard }): ReactElement {
  if (!card.principal) {
    return <p className="audit-tile__empty">Foyer à renseigner</p>;
  }
  const { principal, conjoint, enfants, situationLabel, partsFiscales, tmiLabel } = card;
  return (
    <div className="audit-ec">
      <p className="audit-ec__principal">
        {principal.fullName}
        {principal.age != null && <span className="audit-ec__age"> · {principal.age} ans</span>}
      </p>
      {principal.profession && <p className="audit-ec__prof">{principal.profession}</p>}
      {situationLabel && <p className="audit-ec__line">{situationLabel}</p>}
      {conjoint && (
        <p className="audit-ec__line">
          Conjoint&nbsp;: {conjoint.fullName}
          {conjoint.age != null && ` · ${conjoint.age} ans`}
          {conjoint.profession && ` · ${conjoint.profession}`}
        </p>
      )}
      {enfants.length > 0 && (
        <p className="audit-ec__line">
          Enfants&nbsp;:{' '}
          {enfants
            .map((enfant) =>
              enfant.age != null ? `${enfant.prenom} (${enfant.age})` : enfant.prenom,
            )
            .join(', ')}
        </p>
      )}
      {partsFiscales != null && (
        <p className="audit-ec__fiscal">
          <strong>{formatParts(partsFiscales)} parts</strong>
          <span className="audit-ec__sep"> · </span>
          TMI <span className="audit-ec__soon">{tmiLabel}</span>
        </p>
      )}
    </div>
  );
}

/** Masses successorales : bloc présent mais non calculable (F3) — réduit, sans
 *  remplissage, avec un mini-anneau atténué pour suggérer le futur contenu. */
function MassesPlaceholder(): ReactElement {
  return (
    <div className="audit-soon">
      <div className="audit-soon__main">
        <span className="audit-soon__icon">
          <IconPieChart className="audit-soon__icon-svg" />
        </span>
        <span className="audit-soon__label">Masses successorales</span>
        <span className="audit-soon__badge">
          <IconLock className="audit-soon__badge-icon" />à venir
        </span>
      </div>
      <svg className="audit-soon__ring" viewBox="0 0 36 36" aria-hidden="true">
        <circle className="audit-soon__ring-track" cx="18" cy="18" r="14" />
        <circle
          className="audit-soon__ring-seg audit-soon__ring-seg--a"
          cx="18"
          cy="18"
          r="14"
          strokeDasharray="40 88"
        />
        <circle
          className="audit-soon__ring-seg audit-soon__ring-seg--b"
          cx="18"
          cy="18"
          r="14"
          strokeDasharray="26 88"
          strokeDashoffset="-40"
        />
      </svg>
    </div>
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
          {card.note && (
            <p className="audit-objectifs__note">
              <IconInfo className="audit-objectifs__note-icon" />
              {card.note}
            </p>
          )}
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

function formatParts(parts: number): string {
  return Number.isInteger(parts)
    ? String(parts)
    : parts
        .toFixed(2)
        .replace(/\.?0+$/, '')
        .replace('.', ',');
}
