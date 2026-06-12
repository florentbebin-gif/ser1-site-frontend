import type { SettingsFamilyDefinition, SettingsFamilyId } from './types';

export const SETTINGS_FAMILIES = [
  {
    id: 'impots',
    label: 'Impôts',
    description: 'Paramètres IR, PFU, contributions hauts revenus et IFI portés par tax_settings.',
    ownerPages: ['/settings/memento'],
    status: 'ready',
  },
  {
    id: 'comptables-societes',
    label: 'Comptables & sociétés',
    description: 'Paramètres IS, dividendes, mère-fille, cession de titres et holding.',
    ownerPages: ['/settings/memento'],
    status: 'partial',
  },
  {
    id: 'immobilier',
    label: 'Immobilier',
    description: 'Paramètres révisables des revenus, plus-values et régimes immobiliers futurs.',
    ownerPages: ['/settings/memento'],
    status: 'planned',
  },
  {
    id: 'transmission',
    label: 'Transmission',
    description: 'Paramètres DMTG, donations, assurance-vie décès et futurs régimes Dutreil.',
    ownerPages: ['/settings/dmtg-succession'],
    status: 'partial',
  },
  {
    id: 'retraite-prevoyance',
    label: 'Retraite & prévoyance',
    description: 'PASS, cotisations retraite, validation des droits et paramètres prévoyance.',
    ownerPages: ['/settings/memento', '/settings/prevoyance-regimes'],
    status: 'partial',
  },
  {
    id: 'placements',
    label: 'Placements',
    description: 'Règles par enveloppe financière et dispositifs de placement patrimonial.',
    ownerPages: ['/settings/dmtg-succession', '/settings/base-contrat', '/settings/memento'],
    status: 'partial',
  },
  {
    id: 'social-dirigeant',
    label: 'Social dirigeant',
    description: 'Charges sociales, PUMA/CSM et paramètres sociaux propres au dirigeant.',
    ownerPages: ['/settings/memento'],
    status: 'planned',
  },
] as const satisfies readonly SettingsFamilyDefinition[];

export const SETTINGS_FAMILY_IDS = new Set<SettingsFamilyId>(
  SETTINGS_FAMILIES.map((family) => family.id),
);

export function getSettingsFamilyDefinition(id: SettingsFamilyId): SettingsFamilyDefinition {
  const family = SETTINGS_FAMILIES.find((entry) => entry.id === id);
  if (!family) {
    throw new Error(`Famille de settings inconnue : ${id}`);
  }
  return family;
}
