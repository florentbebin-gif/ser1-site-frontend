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

type BreakdownTone = 'asset' | 'liability';

function breakdownTone(index: number, tone: BreakdownTone): string {
  if (tone === 'liability') return 'audit-breakdown__row--liability';
  return `audit-breakdown__row--tone-${(index % 5) + 1}`;
}

function Breakdown({
  totals,
  total,
  tone,
}: {
  totals: FamilyTotal[];
  total: number;
  tone: BreakdownTone;
}): ReactElement {
  return (
    <div className={`audit-breakdown audit-breakdown--${tone}`}>
      {totals.map((item, index) => {
        const reference =
          item.referenceMontant && item.referenceMontant > 0 ? item.referenceMontant : total;
        const ratio =
          reference > 0 ? Math.min(100, Math.round((item.montant / reference) * 100)) : 0;
        const showsCapitalReference = tone === 'liability' && Boolean(item.referenceMontant);
        return (
          <div key={item.label} className={`audit-breakdown__row ${breakdownTone(index, tone)}`}>
            <span className="audit-breakdown__label">{item.label}</span>
            <span className="audit-breakdown__track" aria-hidden="true">
              <span className="audit-breakdown__fill" style={{ width: `${ratio}%` }} />
            </span>
            <span className="audit-breakdown__value">
              <span className="audit-breakdown__montant">
                {showsCapitalReference ? 'CRD ' : ''}
                {formatEuroOrMissing(item.montant)}
              </span>
              {showsCapitalReference && item.referenceMontant !== item.montant ? (
                <span className="audit-breakdown__hint">
                  Initial {formatEuroOrMissing(item.referenceMontant)}
                </span>
              ) : null}
            </span>
          </div>
        );
      })}
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
  breakdownTone,
}: {
  titleId: string;
  title: string;
  icon: ReactElement;
  total: number;
  count: number;
  totals: FamilyTotal[];
  anomalies: number;
  emptyLabel: string;
  breakdownTone: BreakdownTone;
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
        <Breakdown totals={totals} total={total} tone={breakdownTone} />
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
        breakdownTone="asset"
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
        breakdownTone="liability"
      />
    </>
  );
}
