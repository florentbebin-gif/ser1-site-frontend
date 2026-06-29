import type { CSSProperties, ReactElement } from 'react';

import { IconBriefcase } from '@/icons/ui';

import { AuditCardHead, AuditSurfaceCard, formatEuro, formatPercent } from './auditCockpitShared';
import type { AuditBudgetSynthese } from './auditIrAdapter';

export function FiscaliteBudgetCard({ budget }: { budget: AuditBudgetSynthese }): ReactElement {
  return (
    <AuditSurfaceCard className="audit-fiscal-budget" ariaLabelledby="audit-fiscal-budget-title">
      <AuditCardHead
        icon={<IconBriefcase />}
        title="Budget & capacité"
        titleId="audit-fiscal-budget-title"
      />
      {budget.hasBudget ? <BudgetBody budget={budget} /> : <BudgetEmpty />}
    </AuditSurfaceCard>
  );
}

function BudgetEmpty(): ReactElement {
  return (
    <div className="audit-inventory-empty">
      <span className="audit-inventory-empty__icon" aria-hidden="true">
        <IconBriefcase />
      </span>
      <b>Budget à renseigner</b>
      <p>La synthèse s’affichera après saisie des ressources et charges annuelles.</p>
    </div>
  );
}

function BudgetBody({ budget }: { budget: AuditBudgetSynthese }): ReactElement {
  const positiveCapacite = budget.capacite >= 0;

  return (
    <>
      {budget.ressources > 0 ? <BudgetBar budget={budget} /> : null}

      <dl className="audit-fiscal-lines">
        <BudgetLine label="Ressources annuelles" value={formatEuro(budget.ressources)} />
        <BudgetLine label="Charges courantes" value={`− ${formatEuro(budget.charges)}`} />
        <BudgetLine label="Charges d’emprunt" value={`− ${formatEuro(budget.empruntsAnnuels)}`} />
        <BudgetLine label="Imposition estimée" value={`− ${formatEuro(budget.impots)}`} />
        <BudgetLine
          label="Taux d’endettement indicatif"
          value={
            budget.tauxEndettement == null ? 'À qualifier' : formatPercent(budget.tauxEndettement)
          }
        />
      </dl>

      <div className="audit-fiscal-total" data-tone={positiveCapacite ? undefined : 'warning'}>
        <span className="audit-fiscal-total__label">Solde budgétaire</span>
        <strong className="audit-fiscal-total__value">
          {positiveCapacite ? '' : '− '}
          {formatEuro(Math.abs(budget.capacite))}
        </strong>
      </div>
    </>
  );
}

function BudgetBar({ budget }: { budget: AuditBudgetSynthese }): ReactElement {
  const base = budget.ressources;
  const pct = (value: number): number => Math.max(0, Math.min(100, (value / base) * 100));
  const chargesPct = pct(budget.charges);
  const empruntsPct = pct(budget.empruntsAnnuels);
  const impotsPct = pct(budget.impots);
  const capacitePct = Math.max(0, 100 - chargesPct - empruntsPct - impotsPct);

  const segment = (width: number, token: string): CSSProperties => ({
    width: `${width}%`,
    background: `var(${token})`,
  });

  return (
    <div
      className="audit-budget-bar"
      role="img"
      aria-label="Emploi des ressources : charges, emprunts, impôts, capacité d’épargne"
    >
      <span className="audit-budget-bar__seg" style={segment(chargesPct, '--viz-2')} />
      <span className="audit-budget-bar__seg" style={segment(empruntsPct, '--viz-5')} />
      <span className="audit-budget-bar__seg" style={segment(impotsPct, '--viz-4')} />
      <span className="audit-budget-bar__seg" style={segment(capacitePct, '--viz-6')} />
    </div>
  );
}

function BudgetLine({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="audit-fiscal-line">
      <dt className="audit-fiscal-line__label">{label}</dt>
      <dd className="audit-fiscal-line__value">{value}</dd>
    </div>
  );
}
