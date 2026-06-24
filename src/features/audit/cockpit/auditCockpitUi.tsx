import type { KeyboardEvent, ReactElement, ReactNode } from 'react';

import { IconCheck, IconChevronRight, IconClock, IconInfo, IconLock } from '@/icons/ui';

import type { CardStatus, SummaryCardData } from './auditCockpitShared';

export function SummaryCardGrid({
  cards,
  variant,
}: {
  cards: SummaryCardData[];
  variant?: 'five' | 'rows' | 'tiles';
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
  variant?: 'five' | 'rows' | 'tiles';
}): ReactElement {
  const status = statusLabel(card.status, card.badgeLabel);
  const compact = variant === 'tiles';
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
                data-tone={card.ctaTone}
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
              data-tone={card.ctaTone}
              aria-hidden="true"
            >
              {card.ctaLabel}
              <IconChevronRight />
            </span>
          </>
        )}
      </header>
      {!compact ? (
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
}: {
  title: string;
  description?: string;
  children: ReactNode;
}): ReactElement {
  return (
    <section className="audit-drawer-section">
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
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5;
}): ReactElement {
  return (
    <div className="audit-drawer-grid" data-columns={columns}>
      {children}
    </div>
  );
}

export function AuditPageContinuation({
  label,
  detail,
  onClick,
}: {
  label: string;
  detail: string;
  onClick: () => void;
}): ReactElement {
  return (
    <section className="audit-page-continuation" aria-label="Continuer le parcours audit">
      <div>
        <p className="audit-page-continuation__eyebrow">Continuer l’audit</p>
        <h2>{label}</h2>
        <p>{detail}</p>
      </div>
      <button type="button" className="audit-page-continuation__button" onClick={onClick}>
        <span>{label}</span>
        <IconChevronRight />
      </button>
    </section>
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
