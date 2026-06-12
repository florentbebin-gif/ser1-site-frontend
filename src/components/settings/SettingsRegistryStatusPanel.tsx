import type { ReactElement } from 'react';
import { useUserRole } from '@/auth/useUserRole';
import {
  listSettingsForOwnerPage,
  type SettingsFamilyId,
  type SettingsOwnerPagePath,
  type SettingsRegistryEntry,
  type SettingsRegistryStatus,
} from '@/domain/settings-registry';
import SettingsSectionCard from './SettingsSectionCard';

const STATUS_ORDER = [
  'ready',
  'partial',
  'planned',
] as const satisfies readonly SettingsRegistryStatus[];

const STATUS_LABELS: Record<SettingsRegistryStatus, string> = {
  ready: 'Prêt',
  partial: 'Partiel',
  planned: 'Planifié',
};

const STATUS_COUNT_LABELS: Record<SettingsRegistryStatus, { singular: string; plural: string }> = {
  ready: { singular: 'prêt', plural: 'prêts' },
  partial: { singular: 'partiel', plural: 'partiels' },
  planned: { singular: 'planifié', plural: 'planifiés' },
};

const OWNER_PAGE_TITLES: Record<SettingsOwnerPagePath, string> = {
  '/settings/memento': 'Registre settings mémento',
  '/settings/comptables-societes': 'Registre settings comptables & sociétés',
  '/settings/prelevements': 'Registre settings paramètres sociaux',
  '/settings/base-contrat': 'Registre settings référentiel contrats',
  '/settings/base-contrat-retraite': 'Registre settings Base CG retraite',
  '/settings/dmtg-succession': 'Registre settings DMTG & Succession',
  '/settings/prevoyance-regimes': 'Registre settings Prévoyance — régimes',
};

interface SettingsRegistryStatusPanelProps {
  ownerPage: SettingsOwnerPagePath;
  families?: readonly SettingsFamilyId[];
  title?: string;
}

function RegistryIcon(): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4h16v16H4z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

function groupByStatus(entries: readonly SettingsRegistryEntry[]) {
  return STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = entries.filter((entry) => entry.status === status);
      return acc;
    },
    {} as Record<SettingsRegistryStatus, SettingsRegistryEntry[]>,
  );
}

function formatStatusCount(status: SettingsRegistryStatus, count: number): string {
  const labels = STATUS_COUNT_LABELS[status];
  return `${count} ${count > 1 ? labels.plural : labels.singular}`;
}

function SettingsRegistryItem({ entry }: { entry: SettingsRegistryEntry }): ReactElement {
  const sourceNote =
    entry.source.referenceToComplete ??
    (entry.source.status === 'complete' ? 'Référence settings-references complète.' : null);

  return (
    <li className={`settings-registry-status-panel__item is-${entry.status}`}>
      <div className="settings-registry-status-panel__item-header">
        <span className="settings-registry-status-panel__item-label">{entry.label}</span>
        <span className="settings-registry-status-panel__item-millesime">{entry.millesime}</span>
      </div>
      <p className="settings-registry-status-panel__description">{entry.description}</p>
      <p className="settings-registry-status-panel__reason">{entry.statusReason}</p>
      <div className="settings-registry-status-panel__meta">
        <span>{entry.key}</span>
        <span>{entry.family}</span>
        {sourceNote ? <span>{sourceNote}</span> : null}
      </div>
    </li>
  );
}

export function SettingsRegistryStatusPanel({
  ownerPage,
  families,
  title,
}: SettingsRegistryStatusPanelProps): ReactElement | null {
  const { isAdmin } = useUserRole();
  if (!isAdmin) return null;

  const ownerEntries = listSettingsForOwnerPage(ownerPage);
  const entries =
    families && families.length > 0
      ? ownerEntries.filter((entry) => families.includes(entry.family))
      : ownerEntries;
  if (entries.length === 0) return null;

  const groupedEntries = groupByStatus(entries);

  return (
    <SettingsSectionCard
      title={title ?? OWNER_PAGE_TITLES[ownerPage]}
      subtitle="Lecture propriétaire des paramètres déclarés, avec séparation des statuts prêts, partiels et planifiés."
      icon={<RegistryIcon />}
      collapsible
      defaultOpen={false}
    >
      <div className="settings-registry-status-panel">
        <div
          className="settings-registry-status-panel__counts"
          aria-label="Synthèse des statuts registry"
        >
          {STATUS_ORDER.map((status) => (
            <span key={status} className={`settings-registry-status-panel__count is-${status}`}>
              {formatStatusCount(status, groupedEntries[status].length)}
            </span>
          ))}
        </div>

        <div className="settings-registry-status-panel__groups">
          {STATUS_ORDER.map((status) => {
            const statusEntries = groupedEntries[status];
            if (statusEntries.length === 0) return null;

            return (
              <section key={status} className="settings-registry-status-panel__group">
                <h4 className={`settings-registry-status-panel__group-title is-${status}`}>
                  {STATUS_LABELS[status]}
                </h4>
                <ul className="settings-registry-status-panel__list">
                  {statusEntries.map((entry) => (
                    <SettingsRegistryItem key={entry.key} entry={entry} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </SettingsSectionCard>
  );
}
