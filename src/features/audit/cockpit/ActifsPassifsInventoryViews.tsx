import type { ReactElement, ReactNode } from 'react';

import { IconBuilding, IconFileText } from '@/icons/ui';

import {
  DELAI_REALISATION_OPTIONS,
  formatDate,
  formatEuro,
  formatEuroOrMissing,
  formatPercent,
  HORIZON_PLACEMENT_OPTIONS,
  labelForOption,
  MODE_DETENTION_OPTIONS,
  PROFIL_RISQUE_OPTIONS,
  sumPositive,
} from './auditCockpitShared';
import {
  ActifsMatrix,
  DetentionMatrixHeader,
  InventoryEmpty,
  ItemLabel,
  type OwnerColumnTotals,
  PassifsMatrix,
} from './ActifsPassifsInventoryMatrix';
import type { ActifGroup, OwnerColumn, PassifGroup } from './auditInventoryModel';

function MissingValue({ label = 'À qualifier' }: { label?: string }): ReactElement {
  return <span className="audit-inventory-missing">{label}</span>;
}

function optionalEuro(value: number | undefined): ReactNode {
  return value && value > 0 ? formatEuro(value) : <MissingValue />;
}

function optionalPercent(value: number | undefined): ReactNode {
  return value && value > 0 ? formatPercent(value) : <MissingValue />;
}

function optionalText(value: string | undefined, options?: { date?: boolean }): ReactNode {
  if (!value) return <MissingValue />;
  return options?.date ? formatDate(value) : value;
}

function Metric({ label, value }: { label: string; value: ReactNode }): ReactElement {
  return (
    <span className="audit-inventory-metric">
      <span className="audit-inventory-metric__label">{label}</span>
      <span className="audit-inventory-metric__value">{value}</span>
    </span>
  );
}

export function ActifsDetentionView({
  actifGroups,
  ownerColumns,
  ownerTotals,
  onAdd,
}: {
  actifGroups: ActifGroup[];
  ownerColumns: OwnerColumn[];
  ownerTotals: OwnerColumnTotals;
  onAdd: () => void;
}): ReactElement {
  const hasActifs = actifGroups.length > 0;
  return (
    <section className="audit-inventory-side">
      <DetentionMatrixHeader
        title="Actifs"
        caption="Valeurs déclarées par détenteur"
        ownerColumns={ownerColumns}
        ownerTotals={ownerTotals}
        showOwners={hasActifs}
      />
      {!hasActifs ? (
        <InventoryEmpty
          config={{
            icon: <IconBuilding />,
            title: 'Commencez l’inventaire',
            body: 'Ajoutez les actifs déclarés du foyer.',
            cta: 'Ajouter un actif',
          }}
          onAdd={onAdd}
        />
      ) : (
        <ActifsMatrix groups={actifGroups} ownerColumns={ownerColumns} />
      )}
    </section>
  );
}

export function ActifsAnalyseView({
  actifGroups,
  onAdd,
}: {
  actifGroups: ActifGroup[];
  onAdd: () => void;
}): ReactElement {
  const totalActifs = sumPositive(actifGroups.map((group) => group.total));
  if (actifGroups.length === 0) {
    return (
      <InventoryEmpty
        config={{
          icon: <IconBuilding />,
          title: 'Analyse à constituer',
          body: 'Ajoutez au moins un actif pour qualifier horizon, risque et liquidité.',
          cta: 'Ajouter un actif',
        }}
        onAdd={onAdd}
      />
    );
  }

  return (
    <div className="audit-analysis">
      {actifGroups.map((group) => (
        <section key={group.key} className="audit-analysis__group">
          <header className="audit-analysis__group-head">
            <span className="audit-matrix__group-label">{group.label}</span>
            <strong className="audit-matrix__group-total">
              {formatEuroOrMissing(group.total)}
            </strong>
          </header>
          <div className="audit-analysis__rows">
            {group.items.map((item) => {
              const repartition = totalActifs > 0 ? (item.montant / totalActifs) * 100 : 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="audit-analysis-row"
                  onClick={item.onEdit}
                  aria-label={`Qualifier ${item.title}`}
                >
                  <ItemLabel
                    icon={item.icon}
                    title={item.title}
                    typeLabel={item.typeLabel}
                    anomaly={item.anomaly}
                  />
                  <div className="audit-analysis-row__metrics">
                    <Metric label="Répartition" value={formatPercent(repartition)} />
                    <Metric
                      label="Détention"
                      value={labelForOption(MODE_DETENTION_OPTIONS, item.modeDetention ?? '')}
                    />
                    <Metric
                      label="Horizon"
                      value={labelForOption(HORIZON_PLACEMENT_OPTIONS, item.horizonPlacement ?? '')}
                    />
                    <Metric
                      label="Risque"
                      value={labelForOption(PROFIL_RISQUE_OPTIONS, item.profilRisque ?? '')}
                    />
                    <Metric
                      label="Réalisation"
                      value={labelForOption(DELAI_REALISATION_OPTIONS, item.delaiRealisation ?? '')}
                    />
                    <Metric
                      label="Revenu / rendement"
                      value={
                        item.tauxRevenu || item.tauxRendement || item.revenus ? (
                          [
                            item.tauxRevenu ? formatPercent(item.tauxRevenu) : null,
                            item.tauxRendement ? formatPercent(item.tauxRendement) : null,
                            item.revenus ? formatEuro(item.revenus) : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')
                        ) : (
                          <MissingValue />
                        )
                      }
                    />
                    <Metric
                      label="Revalorisation"
                      value={optionalPercent(item.tauxRevalorisation)}
                    />
                    <Metric label="Date" value={optionalText(item.dateReference, { date: true })} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function PassifsDetentionView({
  passifGroups,
  ownerColumns,
  ownerTotals,
  onAdd,
}: {
  passifGroups: PassifGroup[];
  ownerColumns: OwnerColumn[];
  ownerTotals: OwnerColumnTotals;
  onAdd: () => void;
}): ReactElement {
  const hasPassifs = passifGroups.length > 0;
  const emprunts = passifGroups.flatMap((group) => (group.key === 'emprunts' ? group.items : []));
  return (
    <section className="audit-inventory-side">
      <DetentionMatrixHeader
        title="Passifs"
        caption="CRD et dettes déclaratives par détenteur"
        ownerColumns={ownerColumns}
        ownerTotals={ownerTotals}
        showOwners={hasPassifs}
      />
      {!hasPassifs ? (
        <InventoryEmpty
          config={{
            icon: <IconFileText />,
            title: 'Aucun passif saisi',
            body: 'Ajoutez un emprunt ou une autre dette.',
            cta: 'Ajouter un passif',
          }}
          onAdd={onAdd}
        />
      ) : (
        <>
          <PassifsMatrix groups={passifGroups} ownerColumns={ownerColumns} />
          {emprunts.length > 0 ? (
            <div className="audit-credit-summary" aria-label="Couverture et échéances">
              {emprunts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="audit-credit-summary__row"
                  onClick={item.onEdit}
                  aria-label={`Compléter la couverture de ${item.title}`}
                >
                  <span className="audit-credit-summary__title">{item.title}</span>
                  <Metric label="Capital initial" value={optionalEuro(item.referenceMontant)} />
                  <Metric label="CRD" value={formatEuroOrMissing(item.montant)} />
                  <Metric
                    label="Couverture décès"
                    value={
                      item.assuranceQuotiteMr || item.assuranceQuotiteMme ? (
                        [
                          item.assuranceQuotiteMr
                            ? `Client ${formatPercent(item.assuranceQuotiteMr)}`
                            : null,
                          item.assuranceQuotiteMme
                            ? `Conjoint ${formatPercent(item.assuranceQuotiteMme)}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      ) : (
                        <MissingValue />
                      )
                    }
                  />
                  <Metric
                    label="Souscription"
                    value={optionalText(item.dateDebut, { date: true })}
                  />
                  <Metric label="Terme" value={optionalText(item.dateFin, { date: true })} />
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

export function PassifsDetailsView({
  passifGroups,
  onAdd,
}: {
  passifGroups: PassifGroup[];
  onAdd: () => void;
}): ReactElement {
  const emprunts = passifGroups.flatMap((group) => (group.key === 'emprunts' ? group.items : []));
  if (emprunts.length === 0) {
    return (
      <InventoryEmpty
        config={{
          icon: <IconFileText />,
          title: 'Aucun crédit détaillé',
          body: 'Ajoutez un emprunt pour suivre taux, assurance et coût du crédit.',
          cta: 'Ajouter un passif',
        }}
        onAdd={onAdd}
      />
    );
  }

  return (
    <div className="audit-credit-details">
      {emprunts.map((item) => (
        <button
          key={item.id}
          type="button"
          className="audit-credit-detail"
          onClick={item.onEdit}
          aria-label={`Modifier les détails de ${item.title}`}
        >
          <ItemLabel
            icon={item.icon}
            title={item.title}
            typeLabel={item.typeLabel}
            anomaly={item.anomaly}
          />
          <div className="audit-credit-detail__metrics">
            <Metric label="CRD" value={formatEuroOrMissing(item.montant)} />
            <Metric label="Capital initial" value={optionalEuro(item.referenceMontant)} />
            <Metric label="Mensualité" value={optionalEuro(item.mensualite)} />
            <Metric label="Assurance mensuelle" value={optionalEuro(item.assuranceMensuelle)} />
            <Metric
              label="Échéance assurance comprise"
              value={optionalEuro(item.echeanceAssuranceComprise)}
            />
            <Metric label="Taux nominal" value={optionalPercent(item.tauxInteret)} />
            <Metric label="TAEG" value={optionalPercent(item.taeg)} />
            <Metric label="Coût global crédit" value={optionalEuro(item.coutGlobalCredit)} />
            <Metric label="Coût assurance" value={optionalEuro(item.coutGlobalAssurance)} />
            <Metric label="TAEA" value={optionalPercent(item.taea)} />
          </div>
        </button>
      ))}
    </div>
  );
}
