import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  IconBarChart,
  IconCalendar,
  IconChevronDown,
  IconChevronUp,
  IconClose,
  IconDownload,
  IconDuplicate,
  IconFolder,
  IconGift,
  IconHome,
  IconInfo,
  IconLayers,
  IconLogout,
  IconNetwork,
  IconPencil,
  IconPieChart,
  IconPlus,
  IconSave,
  IconSettings,
  IconSliders,
  IconTable,
  IconTrash,
  IconUsers,
} from './index';

const iconEntries = [
  ['Accueil', IconHome],
  ['Dossier', IconFolder],
  ['Sauvegarde', IconSave],
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
  ['Réseau', IconNetwork],
  ['Donation', IconGift],
  ['Secteurs', IconPieChart],
  ['Graphique', IconBarChart],
  ['Paramètres fins', IconSliders],
  ['Tableau', IconTable],
] as const;

const styles = {
  root: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
    gap: 'var(--space-3)',
    width: 720,
    color: 'var(--color-c1)',
    fontFamily: 'var(--font-sans)',
  },
  item: {
    display: 'grid',
    justifyItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-3)',
    border: '1px solid var(--color-c8)',
    borderRadius: 'var(--radius-md)',
    background: '#fff',
  },
  icon: {
    width: 'var(--space-6)',
    height: 'var(--space-6)',
  },
  label: {
    color: 'var(--color-c9)',
    fontSize: 'var(--font-size-sm)',
    textAlign: 'center',
  },
} satisfies Record<string, CSSProperties>;

function IconsPreview() {
  return (
    <>
      <style>{`.icons-story__icon { width: var(--space-6); height: var(--space-6); }`}</style>
      <div style={styles.root} aria-label="Catalogue des icônes UI">
        {iconEntries.map(([label, Icon]) => (
          <figure style={styles.item} key={label}>
            <Icon className="icons-story__icon" />
            <figcaption style={styles.label}>{label}</figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}

const meta = {
  title: 'Design system/Icônes UI',
  component: IconsPreview,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof IconsPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Catalogue: Story = {};
