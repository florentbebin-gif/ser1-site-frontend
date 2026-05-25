import type { ComponentType } from 'react';
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

export type PrimitiveState = 'idle' | 'hover' | 'focus' | 'disabled';
type IconComponent = ComponentType<{ className?: string }>;

export const primitiveStates: Array<{ state: PrimitiveState; label: string }> = [
  { state: 'idle', label: 'Repos' },
  { state: 'hover', label: 'Survol' },
  { state: 'focus', label: 'Focus' },
  { state: 'disabled', label: 'Désactivé' },
];

export const tokenGroups = [
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
  { title: 'Rayons', tokens: ['--radius-sm', '--radius-md', '--radius-lg', '--radius-full'] },
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

export const icons: Array<readonly [string, IconComponent]> = [
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
];

export const tableRows = [
  { year: '2026', versement: '12 000 €', impact: '+ 3 600 €' },
  { year: '2027', versement: '18 000 €', impact: '+ 5 220 €' },
  { year: '2028', versement: '24 000 €', impact: '+ 6 840 €' },
];

export const snippets = {
  inputs: `<SimAmountInputEuro label="Montant" value={montant} onChange={setMontant} min={0} />
<SimAmountInputPercent label="Taux" value={taux} onChange={setTaux} min={0} max={20} />
<SimSelect value={profil} onChange={setProfil} options={options} ariaLabel="Profil" />`,
  actions: `<SimActionButton variant="add" mode="text" label="Ajouter une ligne" />
<SimActionButton variant="edit" mode="icon" label="Modifier" ariaLabel="Modifier" />
<SimDisclosureButton expanded={open} onToggle={toggleOpen} controls="detail" />`,
  data: `<SimMetric variant="hero" label="Impôt estimé" value="12 400" unit="€" />
<SimStatusBadge variant="attention">À revoir</SimStatusBadge>
<SimCollapsibleTable title="Projection" rows={rows} columns={columns} />`,
  modal: `<SimModalShell title="Versement" mobileVariant="bottom-sheet" footer={footer}>
  <SimModalSectionNav sections={sections} activeId={activeId} onChange={setActiveId} />
</SimModalShell>`,
  mobile: `<div className="viewport-390">
  <SimAmountInputEuro label="Versement" value={value} onChange={setValue} />
  <SimMobileStickyActions>{actions}</SimMobileStickyActions>
</div>`,
} as const;

export const selectOptions = [
  { value: 'prudent', label: 'Prudent', description: 'Volatilité contenue' },
  { value: 'equilibre', label: 'Équilibré', description: 'Allocation diversifiée' },
  { value: 'dynamique', label: 'Dynamique', description: 'Horizon long' },
];

export const modalSections = [
  { id: 'identite', label: 'Identité', controls: 'settings-ui-identite' },
  { id: 'revenus', label: 'Revenus', controls: 'settings-ui-revenus' },
  { id: 'sortie', label: 'Sortie', controls: 'settings-ui-sortie' },
];
