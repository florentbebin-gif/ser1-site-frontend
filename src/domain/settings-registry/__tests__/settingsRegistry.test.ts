import { describe, expect, it } from 'vitest';

import { SETTINGS_REFERENCE_CHAIN } from '@/domain/settings-references';
import { SIMULATOR_DEFINITIONS } from '@/domain/simulators/registry';

import {
  SETTINGS_FAMILIES,
  SETTINGS_REGISTRY,
  SETTINGS_REGISTRY_KEYS,
  assertDeclaredSettingKeys,
  getSettingsRegistryEntry,
  listSettingsByStatus,
  validateSettingsRegistryEntries,
  validateSettingsRegistry,
} from '../index';
import type { SettingsRegistryEntry } from '../types';

const CORE_SETTINGS_PAGE_PATHS = new Set([
  '/settings/impots',
  '/settings/comptables-societes',
  '/settings/prelevements',
  '/settings/dmtg-succession',
]);

describe('settings-registry', () => {
  it('valide le contrat transverse du registry', () => {
    const result = validateSettingsRegistry();

    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('déclare les familles fondation attendues', () => {
    expect(SETTINGS_FAMILIES.map((family) => family.id)).toEqual([
      'impots',
      'comptables-societes',
      'immobilier',
      'transmission',
      'retraite-prevoyance',
      'placements',
      'social-dirigeant',
    ]);

    const familiesWithoutSetting = SETTINGS_FAMILIES.filter(
      (family) => !SETTINGS_REGISTRY.some((setting) => setting.family === family.id),
    ).map((family) => family.id);

    expect(familiesWithoutSetting, 'Familles sans setting déclaré').toEqual([]);
  });

  it('conserve les paramètres planned comme inventaire non éditable', () => {
    const planned = listSettingsByStatus('planned');

    expect(planned.map((setting) => setting.key)).not.toContain(
      'social-dirigeant.charges-sociales',
    );
    expect(planned.map((setting) => setting.key)).toEqual(
      expect.arrayContaining([
        'social-dirigeant.puma-csm',
        'retraite-prevoyance.validation-retraite-600-smic',
        'immobilier.pv-immobilieres.abattements-duree',
        'immobilier.revenus-fonciers.micro-foncier',
        'immobilier.lmnp-lmp.regimes',
        'transmission.dutreil',
        'placements.epargne-salariale',
      ]),
    );

    const plannedWithValues = planned
      .filter((setting) => setting.defaultValue !== null || setting.currentValue !== null)
      .map((setting) => setting.key);
    const plannedWithReadyMillesime = planned
      .filter((setting) => setting.millesime !== 'a-renseigner-avant-codage')
      .map((setting) => setting.key);
    const plannedWithoutReference = planned
      .filter(
        (setting) => setting.source.status !== 'a-completer' || !setting.source.referenceToComplete,
      )
      .map((setting) => setting.key);

    expect(plannedWithValues, 'planned avec valeur exposée').toEqual([]);
    expect(plannedWithReadyMillesime, 'planned avec millésime prêt').toEqual([]);
    expect(plannedWithoutReference, 'planned sans référence à compléter').toEqual([]);
  });

  it('déclare les charges sociales dirigeant comme pack partiel sourcé et consommé', () => {
    const setting = getSettingsRegistryEntry('social-dirigeant.charges-sociales');

    expect(setting.status).toBe('partial');
    expect(setting.defaultValue).toEqual({
      kind: 'settings-default',
      table: 'ps_settings',
      path: 'socialDirigeant.current',
    });
    expect(setting.currentValue).toEqual({
      kind: 'supabase-jsonb',
      table: 'ps_settings',
      path: 'socialDirigeant.current',
    });
    expect(setting.source.settingsReferenceClaimKeys).toEqual(['social-dirigeant-dividendes-tns']);
    expect(setting.consumerSimulatorIds).toEqual(
      expect.arrayContaining(['tresorerie-societe', 'remuneration', 'sortie-capitaux']),
    );
    expect(setting.statusReason).toContain('TA/TB/TC');
  });

  it('chaîne les paramètres prêts aux settings-references des pages propriétaires', () => {
    const declaredClaimsByOwner = new Set(
      SETTINGS_REGISTRY.flatMap((setting) =>
        setting.source.settingsReferenceClaimKeys.map(
          (claimKey) => `${setting.ownerSettingsPage}:${claimKey}`,
        ),
      ),
    );

    const orphanOwnerClaims = SETTINGS_REFERENCE_CHAIN.filter((binding) =>
      CORE_SETTINGS_PAGE_PATHS.has(binding.pagePath),
    )
      .filter((binding) => !declaredClaimsByOwner.has(`${binding.pagePath}:${binding.claimKey}`))
      .map((binding) => `${binding.pagePath}:${binding.claimKey}`);

    expect(orphanOwnerClaims, 'Claims settings-references non couverts').toEqual([]);
  });

  it('ne référence que des simulateurs et claims existants', () => {
    const simulatorIds = new Set(SIMULATOR_DEFINITIONS.map((definition) => definition.id));
    const claimKeys = new Set(SETTINGS_REFERENCE_CHAIN.map((binding) => binding.claimKey));

    const unknownConsumers = SETTINGS_REGISTRY.flatMap((setting) =>
      setting.consumerSimulatorIds
        .filter((simulatorId) => !simulatorIds.has(simulatorId))
        .map((simulatorId) => `${setting.key}:${simulatorId}`),
    );
    const unknownClaims = SETTINGS_REGISTRY.flatMap((setting) =>
      setting.source.settingsReferenceClaimKeys
        .filter((claimKey) => !claimKeys.has(claimKey))
        .map((claimKey) => `${setting.key}:${claimKey}`),
    );

    expect(unknownConsumers, 'Consommateurs inconnus').toEqual([]);
    expect(unknownClaims, 'Claims settings-references inconnus').toEqual([]);
  });

  it('refuse un pointeur de valeur qui ne résout pas les defaults settings', () => {
    const invalidSetting: SettingsRegistryEntry = {
      ...getSettingsRegistryEntry('impots.ir.bareme'),
      defaultValue: {
        kind: 'settings-default',
        table: 'tax_settings',
        path: 'incomeTax.scaleInconnue',
      },
    };
    const invalidRegistry: readonly SettingsRegistryEntry[] = SETTINGS_REGISTRY.map((setting) =>
      setting.key === invalidSetting.key ? invalidSetting : setting,
    );

    const result = validateSettingsRegistryEntries(invalidRegistry);

    expect(result.errors).toContain(
      'impots.ir.bareme: defaultValue introuvable dans tax_settings.incomeTax.scaleInconnue.',
    );
  });

  it('synchronise les consommateurs registry et les settingsKeys simulateurs', () => {
    const settingsBySimulator = new Map(
      SIMULATOR_DEFINITIONS.map((definition) => [definition.id, new Set(definition.settingsKeys)]),
    );

    const registryToSimulatorDrift = SETTINGS_REGISTRY.flatMap((setting) =>
      setting.consumerSimulatorIds
        .filter((simulatorId) => !settingsBySimulator.get(simulatorId)?.has(setting.key))
        .map((simulatorId) => `${setting.key}:${simulatorId}`),
    );
    const simulatorToRegistryDrift = SIMULATOR_DEFINITIONS.flatMap((definition) =>
      definition.settingsKeys
        .filter((settingKey) => {
          const setting = getSettingsRegistryEntry(settingKey);
          return !setting.consumerSimulatorIds.includes(definition.id);
        })
        .map((settingKey) => `${definition.id}:${settingKey}`),
    );

    expect(registryToSimulatorDrift, 'consumerSimulatorIds non déclarés côté simulateur').toEqual(
      [],
    );
    expect(simulatorToRegistryDrift, 'settingsKeys non déclarés côté registry').toEqual([]);
  });

  it('expose un contrat de déclaration obligatoire des clés', () => {
    expect(assertDeclaredSettingKeys(['impots.ir.bareme'])).toEqual(['impots.ir.bareme']);
    expect(getSettingsRegistryEntry('impots.ir.bareme').status).toBe('ready');
    expect(SETTINGS_REGISTRY_KEYS.has('impots.ir.bareme')).toBe(true);
    expect(() => assertDeclaredSettingKeys(['impots.ir.non-declare'])).toThrow(
      'Settings fiscaux non déclarés dans le registry',
    );
  });
});
