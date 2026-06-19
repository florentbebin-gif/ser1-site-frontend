import { useMemo, type ReactElement } from 'react';

import {
  type ReferenceAuditReportSummary,
  useReferenceAuditNotification,
} from '@/hooks/useReferenceAuditNotification';
import { listSettingsReferenceBindings } from '@/domain/settings-references';
import { listSettingsForOwnerPage, type SettingsRegistryStatus } from '@/domain/settings-registry';
import type { LegalReferenceVolatility } from '@/domain/legal-references';

const SETTINGS_OWNER_PAGE = '/settings/memento';

const STATUS_ORDER = [
  'ready',
  'partial',
  'planned',
] as const satisfies readonly SettingsRegistryStatus[];

const STATUS_LABELS: Record<SettingsRegistryStatus, string> = {
  ready: 'D - Paramètres prêts',
  partial: 'D - Paramètres partiels',
  planned: 'D - Paramètres prévus',
};

const VOLATILITY_LABELS: Record<LegalReferenceVolatility, string> = {
  annual: 'C2 - Fraîcheur : révision annuelle',
  lawChange: 'C2 - Fraîcheur : changement de texte',
  stable: 'C2 - Fraîcheur : source stable',
};

const WORKFLOW_STEPS = [
  {
    title: 'Détecter',
    axis: 'C2 - Fraîcheur',
    body: 'Partir du rapport d’audit, d’un changement de texte connu ou d’un écart signalé par les checks.',
  },
  {
    title: 'Vérifier',
    axis: 'C1 - Source qualité',
    body: 'Relire la source officielle ou la raison d’absence de source avant toute modification.',
  },
  {
    title: 'Rattacher',
    axis: 'C1 - Rattachement source',
    body: 'Mettre à jour refIds, claimKeys, notes de pertinence et dates d’attestation sans inventer de référence.',
  },
  {
    title: 'Éditer',
    axis: 'D - Paramètre',
    body: 'Modifier les valeurs uniquement dans la zone Paramètres des calculateurs ou dans les defaults centralisés.',
  },
  {
    title: 'Contrôler',
    axis: 'D - Contrôle paramètres',
    body: 'Lancer les checks de références, registry, hardcode fiscal et le gate complet avant publication.',
  },
  {
    title: 'Valider',
    axis: 'B - Revue humaine',
    body: 'L’admin confirme la source officielle, la valeur et la publication ; l’agent ne valide pas seul.',
  },
] as const;

const REQUIRED_CHECKS = [
  'npm run audit:settings-references -- --stale --with-db',
  'npm run check:settings-references',
  'npm run check:legal-references',
  'npm run check:settings-registry',
  'npm run check:fiscal-hardcode',
  'npm run check',
] as const;

export interface MementoAdminWorkflowSummary {
  bindingCount: number;
  uniqueClaimCount: number;
  bindingWithRefCount: number;
  bindingWithNoRefReasonCount: number;
  bindingWithoutSourceProofCount: number;
  latestVerifiedAt: string | null;
  volatilityCounts: Record<LegalReferenceVolatility, number>;
  settingsStatusCounts: Record<SettingsRegistryStatus, number>;
}

function emptyStatusCounts(): Record<SettingsRegistryStatus, number> {
  return { ready: 0, partial: 0, planned: 0 };
}

function emptyVolatilityCounts(): Record<LegalReferenceVolatility, number> {
  return { annual: 0, lawChange: 0, stable: 0 };
}

function maxIsoDate(current: string | null, next: string): string {
  if (!current) return next;
  return next > current ? next : current;
}

export function buildMementoAdminWorkflowSummary(): MementoAdminWorkflowSummary {
  const bindings = listSettingsReferenceBindings().filter(
    (binding) => binding.pagePath === SETTINGS_OWNER_PAGE,
  );
  const settingsEntries = listSettingsForOwnerPage(SETTINGS_OWNER_PAGE);
  const volatilityCounts = emptyVolatilityCounts();
  const settingsStatusCounts = emptyStatusCounts();
  let latestVerifiedAt: string | null = null;

  for (const binding of bindings) {
    volatilityCounts[binding.volatility] += 1;
    latestVerifiedAt = maxIsoDate(latestVerifiedAt, binding.verifiedAt);
  }

  for (const entry of settingsEntries) {
    settingsStatusCounts[entry.status] += 1;
  }

  return {
    bindingCount: bindings.length,
    uniqueClaimCount: new Set(bindings.map((binding) => binding.claimKey)).size,
    bindingWithRefCount: bindings.filter((binding) => binding.refIds.length > 0).length,
    bindingWithNoRefReasonCount: bindings.filter(
      (binding) => binding.refIds.length === 0 && Boolean(binding.noRefReason),
    ).length,
    bindingWithoutSourceProofCount: bindings.filter(
      (binding) => binding.refIds.length === 0 && !binding.noRefReason,
    ).length,
    latestVerifiedAt,
    volatilityCounts,
    settingsStatusCounts,
  };
}

function formatDate(value: string | null): string {
  if (!value) return 'Non renseignée';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date à relire';

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatReportActionCount(report: ReferenceAuditReportSummary): number {
  const detailedCount =
    report.staleBindingCount +
    report.staleReferenceCount +
    report.urlFailureCount +
    report.dbFindingCount;

  return Math.max(detailedCount, report.errorCount);
}

function AdminWorkflowStat({
  value,
  label,
  note,
}: {
  value: number | string;
  label: string;
  note?: string;
}): ReactElement {
  return (
    <div className="settings-memento-admin-workflow__stat">
      <strong>{value}</strong>
      <span>{label}</span>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

function AuditFreshnessBlock(): ReactElement {
  const audit = useReferenceAuditNotification();
  const report = audit.report;

  if (audit.isLoading) {
    return (
      <p className="settings-memento-admin-workflow__muted">
        Chargement du dernier rapport de fraîcheur...
      </p>
    );
  }

  if (audit.error) {
    return (
      <p className="settings-memento-admin-workflow__warning" role="alert">
        Dernier rapport indisponible : {audit.error}
      </p>
    );
  }

  if (!report) {
    return (
      <p className="settings-memento-admin-workflow__muted">
        Aucun dernier rapport chargé ici. L’audit hebdomadaire et l’audit manuel restent la source
        de fraîcheur.
      </p>
    );
  }

  const actionCount = formatReportActionCount(report);

  return (
    <div className="settings-memento-admin-workflow__report">
      <div>
        <strong>
          Rapport du {formatDate(report.createdAt)} ·{' '}
          {report.ok ? 'aucune action bloquante' : `${actionCount} point(s) à traiter`}
        </strong>
        <span>
          {report.staleBindingCount} attestation(s), {report.staleReferenceCount} référence(s),{' '}
          {report.urlFailureCount} URL morte(s), {report.dbFindingCount} écart(s) DB.
        </span>
      </div>
      {report.runUrl ? (
        <a className="settings-memento-owner-link" href={report.runUrl}>
          Ouvrir le run GitHub
        </a>
      ) : null}
    </div>
  );
}

export default function MementoAdminWorkflowPanel(): ReactElement {
  const summary = useMemo(() => buildMementoAdminWorkflowSummary(), []);

  return (
    <div className="settings-memento-admin-workflow">
      <section className="settings-premium-card settings-memento-admin-workflow__hero">
        <div className="settings-memento-admin-workflow__header">
          <h4>Chaîne de mise à jour</h4>
          <p>
            Cette zone relie les sources, les claims, le registry et les valeurs administrées. Elle
            guide l’agent IA dans le repo sans remplacer la validation humaine.
          </p>
        </div>

        <div className="settings-memento-admin-workflow__stats" aria-label="Synthèse pilotage">
          <AdminWorkflowStat
            value={summary.bindingCount}
            label="bindings settings-references"
            note={`${summary.uniqueClaimCount} claims uniques`}
          />
          <AdminWorkflowStat
            value={summary.bindingWithRefCount}
            label="bindings avec refIds"
            note={`${summary.bindingWithNoRefReasonCount} avec raison explicite`}
          />
          <AdminWorkflowStat
            value={summary.bindingWithoutSourceProofCount}
            label="bindings sans preuve"
            note="Doit rester à zéro"
          />
          <AdminWorkflowStat
            value={formatDate(summary.latestVerifiedAt)}
            label="dernière attestation"
          />
        </div>
      </section>

      <section className="settings-premium-card settings-memento-admin-workflow__section">
        <h5>Fraîcheur des sources</h5>
        <AuditFreshnessBlock />
        <div className="settings-memento-admin-workflow__chips" aria-label="Volatilité déclarée">
          {Object.entries(summary.volatilityCounts).map(([volatility, count]) => (
            <span key={volatility} className="settings-memento-source-chip">
              {VOLATILITY_LABELS[volatility as LegalReferenceVolatility]} : {count}
            </span>
          ))}
        </div>
      </section>

      <section className="settings-premium-card settings-memento-admin-workflow__section">
        <h5>Registry settings</h5>
        <div className="settings-memento-admin-workflow__chips" aria-label="Readiness settings">
          {STATUS_ORDER.map((status) => (
            <span key={status} className={`settings-registry-status-panel__count is-${status}`}>
              {STATUS_LABELS[status]} : {summary.settingsStatusCounts[status]}
            </span>
          ))}
        </div>
      </section>

      <section className="settings-premium-card settings-memento-admin-workflow__section">
        <h5>Rôles et garde-fous</h5>
        <div className="settings-memento-admin-workflow__roles">
          <article>
            <h6>Agent IA dans le repo</h6>
            <p>
              Prépare les diffs, vérifie les rattachements, lance les checks et signale les écarts.
            </p>
          </article>
          <article>
            <h6>Validation humaine</h6>
            <p>Confirme la source officielle, la valeur révisable et la publication finale.</p>
          </article>
        </div>
      </section>

      <section className="settings-premium-card settings-memento-admin-workflow__section">
        <h5>Étapes de mise à jour</h5>
        <ol className="settings-memento-admin-workflow__steps">
          {WORKFLOW_STEPS.map((step) => (
            <li key={step.title}>
              <span>{step.axis}</span>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="settings-premium-card settings-memento-admin-workflow__section">
        <h5>Checks avant validation</h5>
        <div className="settings-memento-admin-workflow__checks">
          {REQUIRED_CHECKS.map((command) => (
            <code key={command}>{command}</code>
          ))}
        </div>
      </section>
    </div>
  );
}
