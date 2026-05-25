import { useState } from 'react';
import '@/styles/sim/index.css';
import {
  SimAmountInputEuro,
  SimAmountInputNumeric,
  SimAmountInputPercent,
  SimActionButton,
  SimDelta,
  SimDisclosureButton,
  SimKpiReference,
  SimMetric,
  SimModalSectionNav,
  SimSkeletonCard,
  SimSkeletonKpi,
  SimSkeletonText,
  SimSparkline,
  SimStatusBadge,
  SimTooltip,
} from '@/components/ui/sim';
import { CGP_GLOSSARY_ENTRIES } from '@/constants/cgpGlossary';
import {
  IconBarChart,
  IconCalendar,
  IconChevronDown,
  IconChevronUp,
  IconClose,
  IconDownload,
  IconDuplicate,
  IconEmptyChart,
  IconEmptyDocs,
  IconEmptyTable,
  IconFolder,
  IconHome,
  IconInfo,
  IconLayers,
  IconLogout,
  IconPencil,
  IconPlus,
  IconSave,
  IconSettings,
  IconTrash,
  IconUsers,
} from '@/icons/ui';

const tokenGroups = [
  {
    title: 'Espacements',
    tokens: [
      '--space-1',
      '--space-2',
      '--space-3',
      '--space-4',
      '--space-5',
      '--space-6',
      '--space-7',
      '--space-8',
    ],
  },
  {
    title: 'Rayons',
    tokens: ['--radius-sm', '--radius-md', '--radius-lg', '--radius-full'],
  },
  {
    title: 'Typographie',
    tokens: [
      '--font-size-xs',
      '--font-size-sm',
      '--font-size-md',
      '--font-size-lg',
      '--font-size-xl',
      '--font-size-2xl',
      '--font-size-3xl',
    ],
  },
  {
    title: 'Mouvement',
    tokens: ['--transition-fast', '--transition-base', '--transition-slow', '--easing-standard'],
  },
] as const;

const icons = [
  ['Accueil', IconHome],
  ['Dossier', IconFolder],
  ['Sauvegarder', IconSave],
  ['Réglages', IconSettings],
  ['Déconnexion', IconLogout],
  ['Modifier', IconPencil],
  ['Fermer', IconClose],
  ['Chevron bas', IconChevronDown],
  ['Chevron haut', IconChevronUp],
  ['Ajouter', IconPlus],
  ['Dupliquer', IconDuplicate],
  ['Supprimer', IconTrash],
  ['Information', IconInfo],
  ['Télécharger', IconDownload],
  ['Calendrier', IconCalendar],
  ['Utilisateurs', IconUsers],
  ['Couches', IconLayers],
  ['Graphique', IconBarChart],
  ['État vide tableau', IconEmptyTable],
  ['État vide graphique', IconEmptyChart],
  ['État vide documents', IconEmptyDocs],
] as const;

function DesignSystemInputPreview() {
  const [montant, setMontant] = useState(250000);
  const [taux, setTaux] = useState(4.5);
  const [parts, setParts] = useState(2.5);

  return (
    <div className="settings-design-system__input-grid">
      <SimAmountInputEuro label="Montant euro" value={montant} onChange={setMontant} min={0} />
      <SimAmountInputPercent
        label="Taux décimal"
        value={taux}
        onChange={setTaux}
        min={0}
        max={20}
      />
      <SimAmountInputNumeric
        label="Nombre libre"
        unit="parts"
        value={parts}
        onChange={setParts}
        min={0}
      />
    </div>
  );
}

function DesignSystemUiPreview() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('identite');

  return (
    <div className="settings-design-system__ui-grid">
      <article className="settings-design-system__ui-card">
        <h4>Actions</h4>
        <div className="settings-design-system__action-row">
          <SimActionButton variant="add" mode="text" label="Ajouter une ligne" />
          <SimActionButton variant="edit" mode="icon" label="Modifier" ariaLabel="Modifier" />
          <SimActionButton
            variant="duplicate"
            mode="icon"
            label="Dupliquer"
            ariaLabel="Dupliquer"
          />
          <SimActionButton
            variant="delete"
            mode="icon"
            label="Supprimer"
            ariaLabel="Supprimer"
            danger
          />
        </div>
      </article>

      <article className="settings-design-system__ui-card">
        <h4>Disclosure</h4>
        <SimDisclosureButton
          expanded={detailsOpen}
          onToggle={() => setDetailsOpen((open) => !open)}
          labelClosed="Afficher le détail"
          labelOpen="Masquer le détail"
          controls="settings-design-system-ui-detail"
        />
      </article>

      <article className="settings-design-system__ui-card">
        <h4>Métriques</h4>
        <SimMetric
          variant="hero"
          label="Impôt estimé"
          value="12 400"
          unit="€"
          note={
            <span className="sim-kpi-note">
              <SimSparkline />
              <SimKpiReference kind="ir" />
            </span>
          }
        />
        <SimMetric
          variant="secondary"
          label="Avancement"
          value="42"
          unit="%"
          delta={<SimDelta value={2} unit="pts" precision={0} />}
        />
        <div className="settings-design-system__action-row">
          <SimStatusBadge variant="optimal">Optimal</SimStatusBadge>
          <SimStatusBadge variant="attention">À revoir</SimStatusBadge>
          <SimStatusBadge variant="info">Info</SimStatusBadge>
        </div>
      </article>

      <article className="settings-design-system__ui-card">
        <h4>Navigation modale</h4>
        <SimModalSectionNav
          sections={[
            { id: 'identite', label: 'Identité', controls: 'settings-ui-identite' },
            { id: 'revenus', label: 'Revenus', controls: 'settings-ui-revenus' },
            { id: 'sortie', label: 'Sortie', controls: 'settings-ui-sortie' },
          ]}
          activeId={activeSection}
          ariaLabel="Rubriques de modale"
          onChange={setActiveSection}
        />
      </article>
    </div>
  );
}

function DesignSystemModernityPreview() {
  return (
    <div className="settings-design-system__modernity-grid">
      <article className="settings-design-system__ui-card">
        <h4>Squelette page</h4>
        <SimSkeletonCard />
      </article>

      <article className="settings-design-system__ui-card">
        <h4>Squelette KPI</h4>
        <SimSkeletonKpi />
      </article>

      <article className="settings-design-system__ui-card">
        <h4>Texte en attente</h4>
        <SimSkeletonText lines={3} />
      </article>
    </div>
  );
}

function DesignSystemGlossaryPreview() {
  return (
    <div className="settings-design-system__glossary-grid">
      {CGP_GLOSSARY_ENTRIES.map((entry) => (
        <article className="settings-design-system__ui-card" key={entry.id}>
          <SimTooltip label={entry.label} description={entry.description} />
          <p className="settings-design-system__glossary-description">{entry.description}</p>
        </article>
      ))}
    </div>
  );
}

export default function SettingsDesignSystem() {
  return (
    <div className="settings-design-system" data-testid="settings-design-system">
      <section className="settings-premium-card">
        <header className="settings-premium-header">
          <div className="settings-action-text">
            <h2 className="settings-premium-title">Design system simulateurs</h2>
            <p className="settings-premium-subtitle">
              Référence runtime des fondations SIM SER1 2026.
            </p>
          </div>
        </header>
      </section>

      <section className="settings-premium-card settings-design-system__section">
        <h3 className="settings-design-system__title">Tokens</h3>
        <div className="settings-design-system__token-groups">
          {tokenGroups.map((group) => (
            <article className="settings-design-system__token-group" key={group.title}>
              <h4>{group.title}</h4>
              <div className="settings-design-system__token-grid">
                {group.tokens.map((token) => (
                  <div className="settings-design-system__token" key={token}>
                    <span className="settings-design-system__token-sample" />
                    <code>{token}</code>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="settings-premium-card settings-design-system__section">
        <h3 className="settings-design-system__title">Icônes</h3>
        <div className="settings-design-system__icon-grid" aria-label="Catalogue icônes UI">
          {icons.map(([label, Icon]) => (
            <figure className="settings-design-system__icon-item" key={label}>
              <Icon className="settings-design-system__icon" />
              <figcaption>{label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="settings-premium-card settings-design-system__section">
        <h3 className="settings-design-system__title">Primitives inputs</h3>
        <DesignSystemInputPreview />
      </section>

      <section className="settings-premium-card settings-design-system__section">
        <h3 className="settings-design-system__title">Primitives UI</h3>
        <DesignSystemUiPreview />
      </section>

      <section className="settings-premium-card settings-design-system__section">
        <h3 className="settings-design-system__title">Modernité</h3>
        <DesignSystemModernityPreview />
      </section>

      <section className="settings-premium-card settings-design-system__section">
        <h3 className="settings-design-system__title">Glossaire</h3>
        <DesignSystemGlossaryPreview />
      </section>
    </div>
  );
}
