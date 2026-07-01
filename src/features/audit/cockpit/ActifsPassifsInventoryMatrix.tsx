import type { CSSProperties, ReactElement, ReactNode } from 'react';

import { IconPlus } from '@/icons/ui';

import { FoyerAvatarBadge } from '../components/FoyerAvatarBadge';
import { formatEuroOrMissing, sumPositive } from './auditCockpitShared';
import type { ActifGroup, OwnerColumn, PassifGroup } from './auditInventoryModel';

export type OwnerColumnTotals = Record<OwnerColumn['key'], number>;

type OwnedInventoryGroup = {
  items: Array<{ owner: OwnerColumn['key']; montant: number }>;
};

export interface EmptyConfig {
  icon: ReactNode;
  title: string;
  body: string;
  cta: string;
}

function hasTotalColumn(ownerColumns: OwnerColumn[]): boolean {
  return ownerColumns.length > 1;
}

function ownerMatrixTemplate(ownerColumns: OwnerColumn[]): CSSProperties {
  return {
    '--audit-matrix-cols': `minmax(0, 1.35fr) repeat(${ownerColumns.length}, minmax(112px, 0.78fr))${
      hasTotalColumn(ownerColumns) ? ' minmax(104px, 0.6fr)' : ''
    }`,
  } as CSSProperties;
}

export function buildOwnerColumnTotals(groups: OwnedInventoryGroup[]): OwnerColumnTotals {
  return {
    client: sumPositive(
      groups.flatMap((group) =>
        group.items.filter((item) => item.owner === 'client').map((item) => item.montant),
      ),
    ),
    conjoint: sumPositive(
      groups.flatMap((group) =>
        group.items.filter((item) => item.owner === 'conjoint').map((item) => item.montant),
      ),
    ),
    commun: sumPositive(
      groups.flatMap((group) =>
        group.items.filter((item) => item.owner === 'commun').map((item) => item.montant),
      ),
    ),
  };
}

function formatColumnTotal(value: number): string {
  return value > 0 ? formatEuroOrMissing(value) : '—';
}

function OwnerAvatarStack({ column }: { column: OwnerColumn }): ReactElement {
  return (
    <span className="audit-detention-head__avatars">
      {column.avatars.map((avatar, index) => (
        <FoyerAvatarBadge
          key={`${column.key}-${index}`}
          kind={avatar.kind}
          appearance={avatar.appearance}
          label={avatar.label}
        />
      ))}
    </span>
  );
}

export function DetentionMatrixHeader({
  title,
  caption,
  ownerColumns,
  ownerTotals,
  showOwners,
}: {
  title: string;
  caption?: string;
  ownerColumns: OwnerColumn[];
  ownerTotals: OwnerColumnTotals;
  showOwners: boolean;
}): ReactElement {
  if (!showOwners) {
    return (
      <header className="audit-inventory-side__head">
        <div className="audit-inventory-side__heading">
          <h3 className="audit-inventory-side__title">{title}</h3>
        </div>
      </header>
    );
  }

  const template = ownerMatrixTemplate(ownerColumns);

  return (
    <header className="audit-inventory-side__matrix-head">
      <div className="audit-matrix__detention" style={template}>
        <div className="audit-inventory-side__heading">
          <h3 className="audit-inventory-side__title">{title}</h3>
          {caption ? <span className="audit-inventory-side__caption">{caption}</span> : null}
        </div>
        {ownerColumns.map((column) => (
          <div key={column.key} className="audit-detention-head audit-detention-head--avatars">
            <OwnerAvatarStack column={column} />
            <span className="audit-detention-head__label">{column.label}</span>
            <span
              className="audit-detention-head__sum"
              data-empty={ownerTotals[column.key] > 0 ? undefined : 'true'}
            >
              {formatColumnTotal(ownerTotals[column.key])}
            </span>
          </div>
        ))}
        {hasTotalColumn(ownerColumns) ? (
          <span className="audit-matrix__total-head">Total</span>
        ) : null}
      </div>
    </header>
  );
}

export function ItemLabel({
  icon,
  title,
  typeLabel,
  anomaly,
}: {
  icon: ReactNode;
  title: string;
  typeLabel: string;
  anomaly: boolean;
}): ReactElement {
  return (
    <span className="audit-row__libelle">
      <span className="audit-row__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="audit-row__text">
        <span className="audit-row__title">{title}</span>
        <span className="audit-row__type">{typeLabel}</span>
      </span>
      {anomaly ? <span className="audit-inventory-flag">À vérifier</span> : null}
    </span>
  );
}

export function ActifsMatrix({
  groups,
  ownerColumns,
}: {
  groups: ActifGroup[];
  ownerColumns: OwnerColumn[];
}): ReactElement {
  const template = ownerMatrixTemplate(ownerColumns);
  const showTotal = hasTotalColumn(ownerColumns);

  return (
    <div className="audit-matrix">
      {groups.map((group) => (
        <div key={group.key} className="audit-matrix__group">
          <div className="audit-matrix__group-row" style={template}>
            <span className="audit-matrix__group-label">{group.label}</span>
            {showTotal
              ? ownerColumns.map((column) => <span key={column.key} aria-hidden="true" />)
              : null}
            <span className="audit-matrix__group-total">
              {group.total > 0 ? formatEuroOrMissing(group.total) : '—'}
            </span>
          </div>
          {group.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="audit-matrix__row audit-inventory-row audit-inventory-row--actif"
              style={template}
              onClick={item.onEdit}
              aria-label={`Modifier ${item.title}`}
            >
              <ItemLabel
                icon={item.icon}
                title={item.title}
                typeLabel={item.typeLabel}
                anomaly={item.anomaly}
              />
              {ownerColumns.map((column) => (
                <span key={column.key} className="audit-matrix__amount">
                  {column.key === item.owner ? (
                    <>
                      <strong data-missing={item.montant > 0 ? undefined : 'true'}>
                        {formatEuroOrMissing(item.montant)}
                      </strong>
                      <span className="audit-matrix__owner-tag">{column.label}</span>
                    </>
                  ) : null}
                </span>
              ))}
              {showTotal ? (
                <strong
                  className="audit-matrix__cell-total"
                  data-missing={item.montant > 0 ? undefined : 'true'}
                >
                  {formatEuroOrMissing(item.montant)}
                </strong>
              ) : null}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export function PassifsMatrix({
  groups,
  ownerColumns,
}: {
  groups: PassifGroup[];
  ownerColumns: OwnerColumn[];
}): ReactElement {
  const template = ownerMatrixTemplate(ownerColumns);
  const showTotal = hasTotalColumn(ownerColumns);

  return (
    <div className="audit-matrix">
      {groups.map((group) => (
        <div key={group.key} className="audit-matrix__group">
          <div className="audit-matrix__group-row" style={template}>
            <span className="audit-matrix__group-label">{group.label}</span>
            {showTotal
              ? ownerColumns.map((column) => <span key={column.key} aria-hidden="true" />)
              : null}
            <span className="audit-matrix__group-total">
              {group.total > 0 ? formatEuroOrMissing(group.total) : '—'}
            </span>
          </div>
          {group.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="audit-matrix__row audit-inventory-row audit-inventory-row--passif"
              style={template}
              onClick={item.onEdit}
              aria-label={`Modifier ${item.title}`}
            >
              <ItemLabel
                icon={item.icon}
                title={item.title}
                typeLabel={item.typeLabel}
                anomaly={item.anomaly}
              />
              {ownerColumns.map((column) => (
                <span key={column.key} className="audit-matrix__amount">
                  {column.key === item.owner ? (
                    <>
                      <strong data-missing={item.montant > 0 ? undefined : 'true'}>
                        {formatEuroOrMissing(item.montant)}
                      </strong>
                      <span className="audit-matrix__owner-tag">{column.label}</span>
                    </>
                  ) : null}
                </span>
              ))}
              {showTotal ? (
                <strong
                  className="audit-matrix__cell-total"
                  data-missing={item.montant > 0 ? undefined : 'true'}
                >
                  {formatEuroOrMissing(item.montant)}
                </strong>
              ) : null}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export function InventoryEmpty({
  config,
  onAdd,
}: {
  config: EmptyConfig;
  onAdd: () => void;
}): ReactElement {
  return (
    <div className="audit-inventory-empty">
      <span className="audit-inventory-empty__icon" aria-hidden="true">
        {config.icon}
      </span>
      <b>{config.title}</b>
      <p>{config.body}</p>
      <button type="button" className="audit-mini-button" onClick={onAdd}>
        <IconPlus />
        <span>{config.cta}</span>
      </button>
    </div>
  );
}
