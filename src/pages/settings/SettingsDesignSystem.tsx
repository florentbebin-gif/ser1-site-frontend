import {
  IconBarChart,
  IconCalendar,
  IconChevronDown,
  IconChevronUp,
  IconClose,
  IconDownload,
  IconDuplicate,
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
] as const;

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
        <p className="settings-design-system__placeholder">Section réservée aux primitives C06.</p>
      </section>

      <section className="settings-premium-card settings-design-system__section">
        <h3 className="settings-design-system__title">Primitives UI</h3>
        <p className="settings-design-system__placeholder">Section réservée aux primitives C17.</p>
      </section>

      <section className="settings-premium-card settings-design-system__section">
        <h3 className="settings-design-system__title">Modernité et densité</h3>
        <p className="settings-design-system__placeholder">
          Section réservée aux composants C24 à C28.
        </p>
      </section>
    </div>
  );
}
