import type { KeyboardEvent, ReactElement, ReactNode } from 'react';

import { IconCheck, IconChevronRight, IconClock, IconInfo, IconLock, IconTrash } from '@/icons/ui';

import type { CardStatus, SummaryCardData } from './auditCockpitShared';

type SummaryCardVariant = 'five' | 'rows' | 'tiles' | 'decision';

export function AuditPivot({
  children,
  className,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}): ReactElement {
  return (
    <section
      className={['audit-pivot', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
    >
      {children}
    </section>
  );
}

export function AuditSurfaceCard({
  children,
  className,
  ariaLabel,
  ariaLabelledby,
}: {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
}): ReactElement {
  return (
    <section
      className={['audit-surface-card', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
    >
      {children}
    </section>
  );
}

export function AuditCardHead({
  icon,
  title,
  titleId,
  action,
}: {
  icon: ReactNode;
  title: ReactNode;
  titleId?: string;
  action?: ReactNode;
}): ReactElement {
  return (
    <header className="audit-surface-card-head">
      <div className="audit-surface-card-head__main">
        <span className="audit-surface-card-head__icon" aria-hidden="true">
          {icon}
        </span>
        <h2 id={titleId}>{title}</h2>
      </div>
      {action}
    </header>
  );
}

export function SummaryCardGrid({
  cards,
  variant,
}: {
  cards: SummaryCardData[];
  variant?: SummaryCardVariant;
}): ReactElement {
  return (
    <section className="audit-cockpit__cards" data-variant={variant} aria-label="Cartes audit">
      {cards.map((card) => (
        <SummaryCard key={card.id} card={card} variant={variant} />
      ))}
    </section>
  );
}

function SummaryCard({
  card,
  variant,
}: {
  card: SummaryCardData;
  variant?: SummaryCardVariant;
}): ReactElement {
  const status = statusLabel(card.status, card.badgeLabel);
  const compact = variant === 'tiles';
  const decision = variant === 'decision';
  const actionTone = card.ctaTone ?? (card.ctaLabel === 'Compléter' ? 'required' : undefined);
  const ariaLabel = [card.title, card.summaryLine, status, card.ctaLabel]
    .filter(Boolean)
    .join(' — ');

  return (
    <div
      className="audit-cockpit-card"
      data-status={card.status}
      role="button"
      tabIndex={0}
      onClick={card.onAction}
      onKeyDown={(event) => handleCardKeyDown(event, card.onAction)}
      aria-label={ariaLabel}
    >
      <header className="audit-cockpit-card__header">
        {compact ? (
          <>
            <span className="audit-cockpit-card__icon" aria-hidden="true">
              {card.icon}
            </span>
            <div className="audit-cockpit-card__copy">
              <h2 className="audit-cockpit-card__title">{card.title}</h2>
              {card.summaryLine ? (
                <p className="audit-cockpit-card__micro">{card.summaryLine}</p>
              ) : null}
            </div>
            <div className="audit-cockpit-card__tile-meta">
              <StatusBadge status={card.status} label={status} compact />
              <span
                className="audit-cockpit-card__head-action"
                data-tone={actionTone}
                aria-hidden="true"
              >
                {card.ctaLabel}
                <IconChevronRight />
              </span>
            </div>
          </>
        ) : (
          <>
            <span className="audit-cockpit-card__icon" aria-hidden="true">
              {card.icon}
            </span>
            <div>
              <h2 className="audit-cockpit-card__title">{card.title}</h2>
              <StatusBadge status={card.status} label={status} />
            </div>
            <span
              className="audit-cockpit-card__head-action"
              data-tone={actionTone}
              aria-hidden="true"
            >
              {card.ctaLabel}
              <IconChevronRight />
            </span>
          </>
        )}
      </header>
      {!compact && decision ? <DecisionCardFacts card={card} /> : null}
      {!compact && !decision ? (
        <>
          <CardFacts label="Données connues" values={card.known} empty="Aucune donnée renseignée" />
          <CardFacts label="Manques" values={card.missing} empty="Aucun manque identifié" />
        </>
      ) : null}
      {!compact && card.alert ? (
        <p className="audit-cockpit-card__alert">
          <IconInfo className="audit-cockpit-card__alert-icon" />
          {card.alert}
        </p>
      ) : null}
    </div>
  );
}

function DecisionCardFacts({ card }: { card: SummaryCardData }): ReactElement {
  const missingLabel = card.status === 'vide' ? 'À renseigner' : 'À qualifier';

  return (
    <div className="audit-cockpit-card__decision">
      {card.known.length > 0 ? (
        <ul className="audit-cockpit-card__decision-list">
          {card.known.map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      ) : null}
      {card.missing.length > 0 ? (
        <p className="audit-cockpit-card__decision-missing">
          <span>{missingLabel}</span>
          {card.missing.join(' · ')}
        </p>
      ) : null}
      {card.known.length === 0 && card.missing.length === 0 ? (
        <p className="audit-cockpit-card__empty">Aucun point bloquant identifié</p>
      ) : null}
    </div>
  );
}

export function StatusBadge({
  status,
  label,
  compact = false,
}: {
  status: CardStatus;
  label?: string;
  compact?: boolean;
}): ReactElement {
  const statusLabel = label ?? statusLabelFor(status);
  return (
    <span
      className="audit-status-badge"
      data-status={status}
      data-compact={compact ? 'true' : undefined}
      aria-label={statusLabel}
      title={statusLabel}
    >
      <span className="audit-status-badge__glyph" aria-hidden="true">
        <StatusIcon status={status} />
      </span>
      {compact ? null : <span>{statusLabel}</span>}
    </span>
  );
}

function CardFacts({
  label,
  values,
  empty,
}: {
  label: string;
  values: string[];
  empty: string;
}): ReactElement {
  return (
    <div className="audit-cockpit-card__facts">
      <p className="audit-cockpit-card__facts-label">{label}</p>
      {values.length > 0 ? (
        <ul className="audit-cockpit-card__list">
          {values.map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      ) : (
        <p className="audit-cockpit-card__empty">{empty}</p>
      )}
    </div>
  );
}

export function AuditDrawerSection({
  title,
  description,
  children,
  className,
  density,
  first,
}: {
  title: ReactNode;
  description?: string;
  children: ReactNode;
  className?: string;
  density?: 'simple' | 'rich';
  first?: boolean;
}): ReactElement {
  return (
    <section
      className={['audit-drawer-section', 'sim-band', first ? 'sim-band--first' : null, className]
        .filter(Boolean)
        .join(' ')}
      data-density={density}
    >
      <header className="audit-drawer-section__header">
        <h3 className="audit-drawer-section__title">{title}</h3>
      </header>
      {description ? <p className="audit-drawer-section__description">{description}</p> : null}
      {children}
    </section>
  );
}

export function AuditDrawerFieldGrid({
  children,
  columns = 2,
  compact,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5;
  compact?: boolean;
}): ReactElement {
  return (
    <div className="audit-drawer-grid" data-columns={columns} data-compact={compact || undefined}>
      {children}
    </div>
  );
}

export function AuditRepeatableCard({
  title,
  children,
  onRemove,
  removeLabel,
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  onRemove: () => void;
  removeLabel: string;
  className?: string;
}): ReactElement {
  return (
    <article className={['audit-repeatable-card', className].filter(Boolean).join(' ')}>
      <header className="audit-repeatable-card__head">
        <span className="audit-repeatable-card__title">{title}</span>
        <button
          type="button"
          className="audit-drawer-remove audit-repeatable-card__remove"
          aria-label={removeLabel}
          onClick={onRemove}
        >
          <IconTrash />
          <span>Retirer</span>
        </button>
      </header>
      <div className="audit-repeatable-card__body">{children}</div>
    </article>
  );
}

export function AuditSubjectPanel({
  title,
  subtitle,
  avatar,
  children,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  avatar: ReactNode;
  children: ReactNode;
  className?: string;
}): ReactElement {
  const ariaLabel = typeof title === 'string' ? title : undefined;

  return (
    <section
      className={['audit-subject-panel', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
    >
      <header className="audit-subject-panel__head">
        <span className="audit-subject-panel__avatar" aria-hidden="true">
          {avatar}
        </span>
        <span className="audit-subject-panel__identity">
          <span className="audit-subject-panel__title">{title}</span>
          {subtitle ? <span className="audit-subject-panel__subtitle">{subtitle}</span> : null}
        </span>
      </header>
      <div className="audit-subject-panel__body">{children}</div>
    </section>
  );
}

export function AuditInlineEmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}): ReactElement {
  return (
    <div className="audit-inline-empty-state">
      <p className="audit-inline-empty-state__title">{title}</p>
      {description ? <p className="audit-inline-empty-state__description">{description}</p> : null}
    </div>
  );
}

function handleCardKeyDown(event: KeyboardEvent<HTMLElement>, onAction: () => void): void {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onAction();
}

function statusLabel(status: CardStatus, override?: string): string {
  if (override) return override;
  return statusLabelFor(status);
}

function statusLabelFor(status: CardStatus): string {
  if (status === 'complet') return 'Complet';
  if (status === 'partiel') return 'Partiel';
  if (status === 'a-venir') return 'À venir';
  if (status === 'verrouille') return 'Verrouillé';
  return 'À compléter';
}

function StatusIcon({ status }: { status: CardStatus }): ReactElement {
  if (status === 'complet') return <IconCheck />;
  if (status === 'a-venir' || status === 'verrouille') return <IconLock />;
  if (status === 'partiel' || status === 'a-verifier') return <IconClock />;
  return <IconInfo />;
}
