import type { ReactElement, ReactNode } from 'react';

import {
  IconChevronRight,
  IconClipboardCheck,
  IconFolder,
  IconInfo,
  IconLock,
  IconNetwork,
  IconUsers,
} from '@/icons/ui';

import type {
  AuditLandingDestination,
  AuditLandingObjectifsCard,
  AuditProgressSectionId,
  AuditLandingSyntheseCard,
  AuditLandingViewModel,
} from './auditLandingViewModel';
import { AuditPreviewCarousel } from './components/AuditPreviewCarousel';
import { AuditProgressRail } from './components/AuditProgressRail';
import { AuditStatusBar } from './components/AuditStatusBar';
import { DossierTravailCard } from './components/DossierTravailCard';
import { FoyerFiliation } from './components/FoyerFiliation';
import { PointsAConfirmerCard, type AuditPriorityItem } from './components/PointsAConfirmerCard';

export type { AuditLandingDestination } from './auditLandingViewModel';

interface AuditLandingProps {
  viewModel: AuditLandingViewModel;
  onOpenAudit: (destination: AuditLandingDestination) => void;
  currentSectionId?: AuditProgressSectionId;
  onSelectSection?: (sectionId: AuditProgressSectionId) => void;
}

export default function AuditLanding({
  viewModel,
  onOpenAudit,
  currentSectionId,
  onSelectSection,
}: AuditLandingProps): ReactElement {
  const {
    dossierClientLabel,
    isNewAnalysisEmpty,
    synthese,
    objectifs,
    pilotage,
    pointsAConfirmer,
    previewSlides,
    statusBar,
    progress,
  } = viewModel;
  const pageState = isNewAnalysisEmpty ? 'new' : synthese.hasData ? 'filled' : 'empty';
  const priorityItems: AuditPriorityItem[] = pointsAConfirmer.map((point) => {
    const action = point.action;
    return {
      id: point.id,
      label: point.label,
      statusLabel: 'À confirmer',
      tone: point.tone,
      actionLabel: action ? 'Compléter' : undefined,
      onAction: action ? () => onOpenAudit(action.destination) : undefined,
    };
  });

  return (
    <div className="audit-landing premium-page" data-state={pageState}>
      <div className="audit-landing__layout">
        <aside className="audit-landing__rail" aria-label="Contexte de travail">
          <DossierTravailCard dossierClientLabel={dossierClientLabel} />
          <AuditProgressRail
            sections={progress}
            currentSectionId={currentSectionId}
            onSelectSection={onSelectSection}
          />
        </aside>

        <main className="audit-landing__main">
          <AuditStatusBar statusBar={statusBar} />
          <div className="audit-landing__title-divider" aria-hidden="true" />

          {isNewAnalysisEmpty ? (
            <div className="audit-landing__start-grid">
              <NewAnalysisCard card={synthese} onOpenAudit={onOpenAudit} />
            </div>
          ) : (
            <div className="audit-landing__grid">
              <SyntheseCard card={synthese} onOpenAudit={onOpenAudit} />
              <div className="audit-landing__summary-side">
                <PointsAConfirmerCard
                  title="Points à confirmer"
                  items={priorityItems}
                  emptyLabel="Aucun point prioritaire."
                  countLabel={(count) => `${count} point(s) à confirmer`}
                />
                <ObjectifsCard card={objectifs} onOpenAudit={onOpenAudit} />
              </div>
              <AuditPreviewCarousel slides={previewSlides} />
              <StrategiePreviewCard card={pilotage} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

interface SyntheseCardProps {
  card: AuditLandingSyntheseCard;
  onOpenAudit: (destination: AuditLandingDestination) => void;
}

function NewAnalysisCard({ card, onOpenAudit }: SyntheseCardProps): ReactElement {
  return (
    <section
      className="audit-card audit-card--hero audit-card--action audit-card--new-analysis"
      aria-labelledby="audit-card-new-analysis"
    >
      <CardHead
        icon={<IconFolder className="audit-card__icon-svg" />}
        action={
          <CardActionButton
            label="Commencer par le client"
            accessibleContext={card.ariaLabel}
            onClick={() => onOpenAudit(card.action.destination)}
          />
        }
      >
        <h2 className="audit-card__title" id="audit-card-new-analysis">
          Nouvelle analyse patrimoniale
        </h2>
      </CardHead>
      <CardDivider />

      <div className="audit-empty-start audit-empty-start--main">
        <p className="audit-empty-start__text">
          Renseignez d’abord le client principal pour structurer le foyer.
        </p>
        <span className="audit-empty-start__cta" aria-hidden="true">
          <span>Commencer par le client</span>
          <IconChevronRight className="audit-empty-start__cta-icon" />
        </span>
      </div>
    </section>
  );
}

function SyntheseCard({ card, onOpenAudit }: SyntheseCardProps): ReactElement {
  const actionLabel = card.hasData ? "Voir l'audit complet" : 'Commencer par le client';

  return (
    <section
      className="audit-card audit-card--hero audit-card--action audit-card--synthese"
      aria-labelledby="audit-card-synthese"
      data-state={card.hasData ? 'filled' : 'empty'}
    >
      <CardHead
        icon={<IconFolder className="audit-card__icon-svg" />}
        action={
          <CardActionButton
            label={actionLabel}
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

      {card.hasData ? (
        <div className="audit-card__tiles">
          <Tile icon={<IconUsers className="audit-tile__icon-svg" />} label="État civil">
            <EtatCivil card={card} />
          </Tile>

          <Tile icon={<IconNetwork className="audit-tile__icon-svg" />} label="Filiation">
            <FoyerFiliation
              principal={card.principal}
              conjoint={card.conjoint}
              enfants={card.enfants}
              proches={card.proches}
              hasData={card.filiationHasData}
            />
          </Tile>
        </div>
      ) : (
        <div className="audit-empty-start">
          <p className="audit-empty-start__title">Nouvelle analyse patrimoniale</p>
          <p className="audit-empty-start__text">
            Renseignez d’abord le client principal pour structurer le foyer.
          </p>
          <span className="audit-empty-start__cta" aria-hidden="true">
            <span>Commencer par le client</span>
            <IconChevronRight className="audit-empty-start__cta-icon" />
          </span>
        </div>
      )}
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
      <ul className="audit-strategy-prereqs" aria-label="Prérequis de déblocage">
        {card.prerequis.map((prerequis) => (
          <li
            className="audit-strategy-prereqs__item"
            data-status={prerequis.status}
            key={prerequis.id}
          >
            <span className="audit-strategy-prereqs__marker" aria-hidden="true" />
            <span className="audit-strategy-prereqs__label">{prerequis.label}</span>
            <span className="audit-strategy-prereqs__status">{prerequis.statusLabel}</span>
          </li>
        ))}
      </ul>
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
  const actionLabel =
    card.totalObjectifs === 0 ? 'Définir les objectifs client' : 'Compléter les objectifs client';
  const objectifsCountLabel = formatObjectifsCountLabel(card.totalObjectifs, card.overflowCount);
  const objectifsCountAria = formatObjectifsCountAria(card.totalObjectifs, card.overflowCount);

  return (
    <section
      className="audit-card audit-card--action audit-card--objectifs"
      aria-labelledby="audit-card-objectifs"
      data-state={card.totalObjectifs > 0 ? 'filled' : 'empty'}
    >
      <CardHead
        icon={<IconClipboardCheck className="audit-card__icon-svg" />}
        action={
          <CardActionButton
            label={actionLabel}
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
          {card.totalObjectifs > 0 ? (
            <>
              <ol className="audit-objectifs">
                {card.visibleObjectifs.map((objectif) => (
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
        <div className="audit-objectifs__visual-stack">
          {objectifsCountLabel && objectifsCountAria && (
            <span className="audit-objectifs__count" aria-label={objectifsCountAria}>
              {objectifsCountLabel}
            </span>
          )}
          <ObjectifsIllustration />
        </div>
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

function formatParts(parts: number): string {
  return Number.isInteger(parts)
    ? String(parts)
    : parts
        .toFixed(2)
        .replace(/\.?0+$/, '')
        .replace('.', ',');
}

function formatObjectifsCountLabel(total: number, overflow: number): string | null {
  if (total <= 0) return null;
  if (overflow > 0) return `+${overflow} objectif${overflow > 1 ? 's' : ''}`;
  return `${total} objectif${total > 1 ? 's' : ''}`;
}

function formatObjectifsCountAria(total: number, overflow: number): string | null {
  if (total <= 0) return null;
  if (overflow > 0) {
    return `${overflow} objectif${overflow > 1 ? 's' : ''} non affiché${
      overflow > 1 ? 's' : ''
    } sur ${total}`;
  }
  return `${total} objectif${total > 1 ? 's' : ''} renseigné${total > 1 ? 's' : ''}`;
}
