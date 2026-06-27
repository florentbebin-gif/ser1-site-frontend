import type { CSSProperties, ReactElement, ReactNode } from 'react';

import type { DossierAudit } from '@/domain/audit/types';
import { IconBuilding, IconFileText, IconPlus, IconTable } from '@/icons/ui';

import { FoyerAvatarBadge } from '../components/FoyerAvatarBadge';
import {
  AuditCardHead,
  AuditSurfaceCard,
  formatEuroOrMissing,
  isPatrimoineCouple,
} from './auditCockpitShared';
import {
  buildActifGroups,
  buildOwnerColumns,
  buildPassifGroups,
  type ActifGroup,
  type InventoryKind,
  type OwnerColumn,
  type PassifGroup,
} from './auditInventoryModel';

export type AddKind = 'actif' | 'passif';

interface EmptyConfig {
  icon: ReactNode;
  title: string;
  body: string;
  cta: string;
}

function GhostAdd({ label, onClick }: { label: string; onClick: () => void }): ReactElement {
  return (
    <button type="button" className="audit-ghost-action" onClick={onClick}>
      <IconPlus />
      <span>{label}</span>
    </button>
  );
}

function ownerMatrixTemplate(ownerColumns: OwnerColumn[]): CSSProperties {
  return {
    gridTemplateColumns: `minmax(0, 1.4fr) repeat(${ownerColumns.length + 1}, minmax(112px, 0.8fr))`,
  };
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

function ActifsMatrixHeader({
  ownerColumns,
  onAdd,
  showOwners,
}: {
  ownerColumns: OwnerColumn[];
  onAdd: () => void;
  showOwners: boolean;
}): ReactElement {
  if (!showOwners) {
    return (
      <header className="audit-inventory-side__head">
        <h3 className="audit-inventory-side__title">Actifs</h3>
        <div className="audit-card-actions">
          <GhostAdd label="Ajouter un actif" onClick={onAdd} />
        </div>
      </header>
    );
  }

  const template = ownerMatrixTemplate(ownerColumns);

  return (
    <header className="audit-inventory-side__matrix-head">
      <div className="audit-matrix__toolbar" style={template}>
        <span aria-hidden="true" />
        {ownerColumns.map((column) => (
          <div key={column.key} className="audit-detention-head audit-detention-head--avatars">
            <OwnerAvatarStack column={column} />
          </div>
        ))}
        <span className="audit-matrix__toolbar-action">
          <GhostAdd label="Ajouter un actif" onClick={onAdd} />
        </span>
      </div>
      <div className="audit-matrix__labels" style={template}>
        <h3 className="audit-inventory-side__title">Actifs</h3>
        {ownerColumns.map((column) => (
          <span key={column.key} className="audit-detention-head__label">
            {column.label}
          </span>
        ))}
        <span className="audit-matrix__total-head">Total</span>
      </div>
    </header>
  );
}

function ItemLabel({
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

function ActifsMatrix({
  groups,
  ownerColumns,
}: {
  groups: ActifGroup[];
  ownerColumns: OwnerColumn[];
}): ReactElement {
  const template = ownerMatrixTemplate(ownerColumns);

  return (
    <div className="audit-matrix">
      {groups.map((group) => (
        <div key={group.key} className="audit-matrix__group">
          <div className="audit-matrix__group-row" style={template}>
            <span className="audit-matrix__group-label">{group.label}</span>
            <span className="audit-matrix__group-total">
              {group.total > 0 ? formatEuroOrMissing(group.total) : '—'}
            </span>
          </div>
          {group.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="audit-matrix__row"
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
              <span className="audit-matrix__cell-total" />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function PassifsList({ groups }: { groups: PassifGroup[] }): ReactElement {
  return (
    <div className="audit-matrix">
      {groups.map((group) => (
        <div key={group.key} className="audit-matrix__group">
          <div className="audit-matrix__group-row audit-matrix__group-row--simple">
            <span className="audit-matrix__group-label">{group.label}</span>
            <span className="audit-matrix__group-total">
              {group.total > 0 ? formatEuroOrMissing(group.total) : '—'}
            </span>
          </div>
          {group.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="audit-matrix__row audit-matrix__row--simple"
              onClick={item.onEdit}
              aria-label={`Modifier ${item.title}`}
            >
              <ItemLabel
                icon={item.icon}
                title={item.title}
                typeLabel={item.typeLabel}
                anomaly={item.anomaly}
              />
              <strong
                className="audit-matrix__amount-simple"
                data-missing={item.montant > 0 ? undefined : 'true'}
              >
                {formatEuroOrMissing(item.montant)}
              </strong>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function InventoryEmpty({
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

export function ActifsPassifsInventory({
  dossier,
  onAdd,
  onEdit,
}: {
  dossier: DossierAudit;
  onAdd: (kind: AddKind) => void;
  onEdit: (kind: InventoryKind, id: string) => void;
}): ReactElement {
  const isCouple = isPatrimoineCouple(dossier.situationFamiliale.situationMatrimoniale);
  const actifGroups = buildActifGroups(dossier.actifs, isCouple, onEdit);
  const passifGroups = buildPassifGroups(
    dossier.passif.emprunts,
    dossier.passif.autresDettes,
    onEdit,
  );
  const ownerColumns = buildOwnerColumns(dossier.situationFamiliale, dossier.actifs, isCouple);
  const hasActifs = actifGroups.length > 0;

  return (
    <AuditSurfaceCard className="audit-inventory-card" ariaLabelledby="audit-inventory-title">
      <AuditCardHead
        icon={<IconTable />}
        title="Inventaire déclaré"
        titleId="audit-inventory-title"
      />

      <section className="audit-inventory-side">
        <ActifsMatrixHeader
          ownerColumns={ownerColumns}
          showOwners={hasActifs}
          onAdd={() => onAdd('actif')}
        />
        {!hasActifs ? (
          <InventoryEmpty
            config={{
              icon: <IconBuilding />,
              title: 'Commencez l’inventaire',
              body: 'Ajoutez les actifs déclarés du foyer.',
              cta: 'Ajouter un actif',
            }}
            onAdd={() => onAdd('actif')}
          />
        ) : (
          <ActifsMatrix groups={actifGroups} ownerColumns={ownerColumns} />
        )}
      </section>

      <section className="audit-inventory-side">
        <header className="audit-inventory-side__head">
          <h3 className="audit-inventory-side__title">Passifs</h3>
          <div className="audit-card-actions">
            <GhostAdd label="Ajouter un passif" onClick={() => onAdd('passif')} />
          </div>
        </header>
        {passifGroups.length === 0 ? (
          <InventoryEmpty
            config={{
              icon: <IconFileText />,
              title: 'Aucun passif saisi',
              body: 'Ajoutez un emprunt ou une autre dette.',
              cta: 'Ajouter un passif',
            }}
            onAdd={() => onAdd('passif')}
          />
        ) : (
          <PassifsList groups={passifGroups} />
        )}
      </section>
    </AuditSurfaceCard>
  );
}
