import type { ReactElement } from 'react';

import type { DossierAudit } from '@/domain/audit/types';
import { IconBuilding, IconFileText } from '@/icons/ui';

import {
  AuditCardHead,
  AuditSurfaceCard,
  formatEuroOrMissing,
  sumPositive,
} from './auditCockpitShared';
import {
  actifAnomaly,
  actifFamilyTotals,
  detteAnomaly,
  empruntAnomaly,
  type FamilyTotal,
  passifTypeTotals,
} from './auditInventoryModel';

function plural(count: number, singular: string): string {
  return `${count} ${count > 1 ? `${singular}s` : singular}`;
}

function Breakdown({ totals, total }: { totals: FamilyTotal[]; total: number }): ReactElement {
  return (
    <div className="audit-breakdown">
      {totals.map((item) => (
        <div key={item.label} className="audit-breakdown__row">
          <span className="audit-breakdown__label">{item.label}</span>
          <span className="audit-breakdown__track" aria-hidden="true">
            <span
              className="audit-breakdown__fill"
              style={{ width: `${total > 0 ? Math.round((item.montant / total) * 100) : 0}%` }}
            />
          </span>
          <span className="audit-breakdown__montant">{formatEuroOrMissing(item.montant)}</span>
        </div>
      ))}
    </div>
  );
}

function SideCard({
  titleId,
  title,
  icon,
  total,
  count,
  totals,
  anomalies,
  emptyLabel,
}: {
  titleId: string;
  title: string;
  icon: ReactElement;
  total: number;
  count: number;
  totals: FamilyTotal[];
  anomalies: number;
  emptyLabel: string;
}): ReactElement {
  return (
    <AuditSurfaceCard className="audit-side-card" ariaLabelledby={titleId}>
      <AuditCardHead
        icon={icon}
        title={title}
        titleId={titleId}
        action={
          <span className="audit-side-total">
            <span className="audit-side-total__label">Total {title.toLowerCase()}</span>
            <strong className="audit-side-total__value">
              {count === 0 ? '—' : formatEuroOrMissing(total)}
            </strong>
            <span className="audit-side-total__count">
              {plural(count, 'élément')}
              {anomalies > 0 ? (
                <span className="audit-side-total__flag"> · {plural(anomalies, 'à vérifier')}</span>
              ) : null}
            </span>
          </span>
        }
      />
      {totals.length > 0 ? (
        <Breakdown totals={totals} total={total} />
      ) : (
        <p className="audit-side-card__empty">{emptyLabel}</p>
      )}
    </AuditSurfaceCard>
  );
}

export function ActifsPassifsOverview({ dossier }: { dossier: DossierAudit }): ReactElement {
  const { actifs } = dossier;
  const { emprunts, autresDettes } = dossier.passif;

  const totalActifs = sumPositive(actifs.map((actif) => actif.valeur));
  const totalPassifs = sumPositive([
    ...emprunts.map((emprunt) => emprunt.capitalRestantDu),
    ...autresDettes.map((dette) => dette.montant),
  ]);
  const actifAnomalies = actifs.filter(actifAnomaly).length;
  const passifAnomalies =
    emprunts.filter(empruntAnomaly).length + autresDettes.filter(detteAnomaly).length;

  return (
    <>
      <SideCard
        titleId="audit-side-actifs"
        title="Actifs"
        icon={<IconBuilding />}
        total={totalActifs}
        count={actifs.length}
        totals={actifFamilyTotals(actifs)}
        anomalies={actifAnomalies}
        emptyLabel="Aucun actif saisi"
      />
      <SideCard
        titleId="audit-side-passifs"
        title="Passifs"
        icon={<IconFileText />}
        total={totalPassifs}
        count={emprunts.length + autresDettes.length}
        totals={passifTypeTotals(emprunts, autresDettes)}
        anomalies={passifAnomalies}
        emptyLabel="Aucun passif saisi"
      />
    </>
  );
}
