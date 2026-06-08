import type { SettingsRegistryEntry } from './types';
import { completeSource, currentJsonb, ownerPrelevements, settingsDefault } from './entryHelpers';

export const SETTINGS_SOCIAL_DIRIGEANT_REGISTRY = [
  {
    family: 'social-dirigeant',
    key: 'social-dirigeant.charges-sociales',
    label: 'Charges sociales dirigeant',
    description:
      'Seuil social des dividendes TNS centralisé ; rémunérations, tranches TA/TB/TC et Madelin restent bloqués.',
    valueType: 'object',
    unit: 'none',
    millesime: '2026',
    effectiveFrom: '2026-01-01',
    source: completeSource(
      ['urssaf-dividendes-tns-cotisations-sociales'],
      ['social-dirigeant-dividendes-tns'],
      'Le claim Settings couvre le seuil dividendes TNS consommé par Trésorerie société ; aucun taux caisse n’est déclaré prêt.',
    ),
    defaultValue: settingsDefault('ps_settings', 'socialDirigeant.current'),
    currentValue: currentJsonb('ps_settings', 'socialDirigeant.current'),
    validation: {
      validators: ['validatePrelevementsSettings', 'check:settings-references'],
      rules: [
        'Seuil dividendes TNS exprimé en pourcentage utilisateur entre 0 et 100.',
        'Aucune valeur de rémunération TNS, assimilé salarié, TA/TB/TC ou Madelin ne devient consommable sans source et consommateur dédié.',
      ],
      requiredBeforeConsumption: true,
    },
    ownerSettingsPage: ownerPrelevements,
    consumerSimulatorIds: ['tresorerie-societe', 'remuneration', 'retraite', 'sortie-capitaux'],
    status: 'partial',
    statusReason:
      'Seuil dividendes TNS sourcé, éditable et consommé par tresorerie-societe ; rémunération TNS/salarié, TA/TB/TC et Madelin restent à compléter avant moteurs rémunération/retraite.',
  },
] as const satisfies readonly SettingsRegistryEntry[];
