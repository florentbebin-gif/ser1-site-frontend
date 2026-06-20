/**
 * AuditLanding — cockpit /audit (UX-01).
 *
 * Cockpit pleine largeur : panneau contextuel gauche (encart dossier + gestion des
 * avancement) et zone principale en 3 cartes. Les cartes Synthèse et Objectifs
 * SONT les actions (vrai <button> plein-carte, libellé d'action, focus visible).
 * La Synthèse restitue l'état civil réel et la filiation F1. Les cartes Masses,
 * Organigramme société et Stratégie affichent un aperçu à venir explicite tant
 * que les données métier ne sont pas raccordées. Aucune donnée patrimoniale
 * inventée, aucune valeur par défaut comme certitude.
 */

import type { ReactElement, ReactNode } from 'react';

import {
  IconBuilding,
  IconChevronRight,
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
import { AuditProgressRail } from './components/AuditProgressRail';
import { AuditStatusBar } from './components/AuditStatusBar';
import { DossierTravailCard } from './components/DossierTravailCard';
import { FoyerFiliation } from './components/FoyerFiliation';
import '@/styles/sim/index.css';
import './styles/index.css';

export type { AuditLandingDestination } from './auditLandingViewModel';

interface AuditLandingProps {
  viewModel: AuditLandingViewModel;
  onOpenAudit: (destination: AuditLandingDestination) => void;
}

export default function AuditLanding({ viewModel, onOpenAudit }: AuditLandingProps): ReactElement {
  const { dossierClientLabel, synthese, objectifs, pilotage, statusBar, progress } = viewModel;

  return (
    <div className="audit-landing premium-page">
      <div className="audit-landing__layout">
        <aside className="audit-landing__rail" aria-label="Contexte de travail">
          <DossierTravailCard dossierClientLabel={dossierClientLabel} />
          <AuditProgressRail sections={progress} />
        </aside>

        <main className="audit-landing__main">
          <AuditStatusBar statusBar={statusBar} />
          <div className="audit-landing__title-divider" aria-hidden="true" />

          <div className="audit-landing__grid">
            <div className="audit-landing__primary">
              <SyntheseCard card={synthese} onOpenAudit={onOpenAudit} />

              <div className="audit-landing__preview-row">
                <MassesPreviewCard />
                <SocietePreviewCard />
              </div>
            </div>

            <div className="audit-landing__side">
              <ObjectifsCard card={objectifs} onOpenAudit={onOpenAudit} />

              <StrategiePreviewCard card={pilotage} />
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
      <CardHead
        icon={<IconFolder className="audit-card__icon-svg" />}
        action={
          <CardActionButton
            label="Voir l'audit complet"
            accessibleContext={card.ariaLabel}
            onClick={() => onOpenAudit(card.action.destination)}
          />
        }
      >
        <h2 className="audit-card__title" id="audit-card-synthese">
          Synthèse dossier
        </h2>
      </CardHead>
      <CardDivider />

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
      </div>
    </section>
  );
}

function EtatCivil({ card }: { card: AuditLandingSyntheseCard }): ReactElement {
  if (!card.principal) {
    return <p className="audit-tile__empty">Foyer à renseigner</p>;
  }
  const { principal, conjoint, enfants, situationLabel, partsFiscales, tmiLabel } = card;
  const completionPercent = Math.round(card.etatCivilCompletion.ratio * 100);
  return (
    <div className="audit-ec">
      <div className="audit-ec__top">
        <p className="audit-ec__principal">
          {principal.fullName}
          {principal.age != null && <span className="audit-ec__age"> · {principal.age} ans</span>}
        </p>
        <span
          className="audit-ec__progress"
          aria-label={card.etatCivilCompletion.label}
          title={card.etatCivilCompletion.label}
        >
          <span className="audit-ec__progress-fill" style={{ width: `${completionPercent}%` }} />
        </span>
      </div>
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

function MassesPreviewCard(): ReactElement {
  return (
    <section
      className="audit-card audit-card--preview audit-card--compact"
      aria-labelledby="audit-card-masses"
    >
      <CardHead icon={<IconPieChart className="audit-card__icon-svg" />} action={<PreviewBadge />}>
        <h2 className="audit-card__title" id="audit-card-masses">
          Masses successorales
        </h2>
      </CardHead>
      <CardDivider />
      <div className="audit-masses-preview" aria-hidden="true">
        <div className="audit-masses-preview__ring">
          <span className="audit-masses-preview__center">
            <IconLock className="audit-masses-preview__lock" />
          </span>
        </div>
        <div className="audit-masses-preview__bars">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <p className="audit-card__caption">Calcul disponible après structuration du patrimoine.</p>
    </section>
  );
}

function SocietePreviewCard(): ReactElement {
  return (
    <section
      className="audit-card audit-card--preview audit-card--compact"
      aria-labelledby="audit-card-societe"
    >
      <CardHead icon={<IconBuilding className="audit-card__icon-svg" />} action={<PreviewBadge />}>
        <h2 className="audit-card__title" id="audit-card-societe">
          Organigramme société
        </h2>
      </CardHead>
      <CardDivider />
      <div className="audit-org-preview" aria-hidden="true">
        <span className="audit-org-preview__node audit-org-preview__node--root">Détenteur</span>
        <span className="audit-org-preview__line audit-org-preview__line--vertical" />
        <span className="audit-org-preview__node audit-org-preview__node--main">Société</span>
        <span className="audit-org-preview__line audit-org-preview__line--split" />
        <span className="audit-org-preview__node">Filiale</span>
        <span className="audit-org-preview__node">Participation</span>
      </div>
      <p className="audit-card__caption">Structure société à renseigner.</p>
    </section>
  );
}

function StrategiePreviewCard({ card }: { card: AuditLandingViewModel['pilotage'] }): ReactElement {
  return (
    <section
      className="audit-card audit-card--locked audit-card--strategy"
      aria-labelledby="audit-card-strategie"
    >
      <CardHead
        icon={<IconLock className="audit-card__icon-svg" />}
        variant="locked"
        action={<CardActionText label="Verrouillé" />}
      >
        <h2 className="audit-card__title" id="audit-card-strategie">
          {card.title}
        </h2>
      </CardHead>
      <CardDivider />
      <div className="audit-strategy-preview" aria-hidden="true">
        <div className="audit-strategy-preview__timeline">
          <span />
          <span />
          <span />
        </div>
        <div className="audit-strategy-preview__matrix">
          <span>Protection</span>
          <span>Transmission</span>
          <span>Fiscalité</span>
        </div>
      </div>
      <p className="audit-card__sub">{card.description}</p>
      <p className="audit-card__caption">{card.caption}</p>
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
      <CardHead
        icon={<IconClipboardCheck className="audit-card__icon-svg" />}
        action={
          <CardActionButton
            label="Définir les objectifs client"
            accessibleContext={card.ariaLabel}
            onClick={() => onOpenAudit(card.action.destination)}
          />
        }
      >
        <h2 className="audit-card__title" id="audit-card-objectifs">
          Objectifs
        </h2>
      </CardHead>
      <CardDivider />

      <div className="audit-objectifs__content">
        <div className="audit-objectifs__text">
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
        </div>
        <ObjectifsIllustration />
      </div>
    </section>
  );
}

function ObjectifsIllustration(): ReactElement {
  return (
    <svg
      className="audit-objectifs-visual"
      viewBox="0 0 132 92"
      role="img"
      aria-label="Illustration d'une liste d'objectifs"
    >
      <path
        className="audit-objectifs-visual__leaf audit-objectifs-visual__leaf--left"
        d="M29 63 C11 51 8 33 28 40 C41 45 43 58 29 63 Z"
      />
      <path
        className="audit-objectifs-visual__leaf audit-objectifs-visual__leaf--right"
        d="M104 58 C124 43 126 26 106 34 C92 40 91 53 104 58 Z"
      />
      <path className="audit-objectifs-visual__stem" d="M35 73 C53 58 66 46 79 20" />
      <path className="audit-objectifs-visual__stem" d="M98 73 C85 56 76 42 70 20" />
      <rect
        className="audit-objectifs-visual__board-shadow"
        x="45"
        y="17"
        width="48"
        height="64"
        rx="4"
      />
      <rect className="audit-objectifs-visual__board" x="42" y="14" width="48" height="64" rx="4" />
      <rect className="audit-objectifs-visual__clip" x="55" y="9" width="22" height="10" rx="3" />
      <path className="audit-objectifs-visual__line" d="M58 31 H78" />
      <path className="audit-objectifs-visual__line" d="M58 45 H78" />
      <path className="audit-objectifs-visual__line" d="M58 59 H78" />
      <path className="audit-objectifs-visual__check" d="M49 30 L52 33 L56 27" />
      <path className="audit-objectifs-visual__check" d="M49 44 L52 47 L56 41" />
      <path className="audit-objectifs-visual__check" d="M49 58 L52 61 L56 55" />
    </svg>
  );
}

interface CardHeadProps {
  icon: ReactNode;
  variant?: 'locked';
  action?: ReactNode;
  children: ReactNode;
}

function CardHead({ icon, variant, action, children }: CardHeadProps): ReactElement {
  return (
    <div className="audit-card__head">
      <span
        className={`audit-card__icon${variant === 'locked' ? ' audit-card__icon--locked' : ''}`}
      >
        {icon}
      </span>
      {children}
      {action && <span className="audit-card__head-action">{action}</span>}
    </div>
  );
}

function CardDivider(): ReactElement {
  return <div className="audit-card__divider sim-divider sim-divider--soft" aria-hidden="true" />;
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

interface CardActionButtonProps {
  label: string;
  accessibleContext: string;
  onClick: () => void;
}

/** Libellé d'action : vrai <button> dont la zone de clic couvre la carte. */
function CardActionButton({
  label,
  accessibleContext,
  onClick,
}: CardActionButtonProps): ReactElement {
  return (
    <button
      type="button"
      className="audit-card__action-link"
      aria-label={`${label} — ${accessibleContext}`}
      onClick={onClick}
    >
      <span>{label}</span>
      <IconChevronRight className="audit-card__action-chevron" />
    </button>
  );
}

function CardActionText({ label }: { label: string }): ReactElement {
  return (
    <span className="audit-card__action-link audit-card__action-link--static" aria-disabled="true">
      <span>{label}</span>
    </span>
  );
}

function PreviewBadge(): ReactElement {
  return <span className="audit-preview-badge">À venir</span>;
}

function formatParts(parts: number): string {
  return Number.isInteger(parts)
    ? String(parts)
    : parts
        .toFixed(2)
        .replace(/\.?0+$/, '')
        .replace('.', ',');
}
