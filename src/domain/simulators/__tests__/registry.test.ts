import { describe, expect, it } from 'vitest';

import { LEGAL_REFERENCES } from '@/domain/legal-references';
import { getSettingsRegistryEntry, SETTINGS_REGISTRY_KEYS } from '@/domain/settings-registry';
import { SIM_ROUTE_CONTRACTS } from '@/routes/simRouteContracts';
import { SIMULATOR_DEFINITIONS } from '../registry';

const ROUTE_IDS = new Set<string>(SIM_ROUTE_CONTRACTS.map((route) => route.id));
const DOMAIN_TAGS = new Set(['foyer', 'societe', 'immobilier', 'placements', 'transmission']);
const INTENT_TAGS = new Set([
  'audit',
  'fiscalite',
  'retraite',
  'investissement',
  'immobilier',
  'placements',
  'societe',
  'cession',
  'transmission',
  'prevoyance',
  'credit',
]);

describe('registry simulateurs', () => {
  it('déclare des ids uniques', () => {
    const ids = SIMULATOR_DEFINITIONS.map((definition) => definition.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

    expect(duplicates, `Simulateurs dupliqués : ${duplicates.join(', ')}`).toEqual([]);
  });

  it('référence les routes existantes par routeId sans recopier les paths', () => {
    const routeBacked = SIMULATOR_DEFINITIONS.filter((definition) => definition.routeId);
    const invalidRouteIds = routeBacked
      .map((definition) => definition.routeId)
      .filter((routeId): routeId is string => Boolean(routeId))
      .filter((routeId) => !ROUTE_IDS.has(routeId));

    const copiedPaths = routeBacked
      .filter((definition) => definition.path !== undefined)
      .map((definition) => definition.id);

    expect(invalidRouteIds, `routeId inconnus : ${invalidRouteIds.join(', ')}`).toEqual([]);
    expect(copiedPaths, `Paths recopiés dans la registry : ${copiedPaths.join(', ')}`).toEqual([]);
  });

  it('couvre toutes les routes simulateur existantes', () => {
    const registryRouteIds = new Set(
      SIMULATOR_DEFINITIONS.map((definition) => definition.routeId).filter(
        (routeId): routeId is string => Boolean(routeId),
      ),
    );
    const missing = SIM_ROUTE_CONTRACTS.map((route) => route.id).filter(
      (routeId) => !registryRouteIds.has(routeId),
    );

    expect(missing, `Routes sans SimulatorDefinition : ${missing.join(', ')}`).toEqual([]);
  });

  it('exige les champs métier avant implémentation ou refonte', () => {
    const incomplete = SIMULATOR_DEFINITIONS.filter((definition) => {
      return (
        definition.objective.length === 0 ||
        definition.inputs.length === 0 ||
        definition.calculates.length === 0 ||
        definition.outputs.length === 0 ||
        definition.dossierFields.length === 0 ||
        definition.testScenarios.length === 0
      );
    }).map((definition) => definition.id);

    expect(incomplete, `Définitions incomplètes : ${incomplete.join(', ')}`).toEqual([]);
  });

  it('exige des tags métier domaine et intention sur chaque SimulatorDefinition', () => {
    const definitionsWithoutTags = SIMULATOR_DEFINITIONS.filter((definition) => {
      const hasDomainTag = definition.tags.some((tag) => DOMAIN_TAGS.has(tag));
      const hasIntentTag = definition.tags.some((tag) => INTENT_TAGS.has(tag));
      return definition.tags.length < 2 || !hasDomainTag || !hasIntentTag;
    }).map((definition) => definition.id);

    expect(
      definitionsWithoutTags,
      `Définitions sans tags domaine/intention : ${definitionsWithoutTags.join(', ')}`,
    ).toEqual([]);
  });

  it('verrouille les legalRefs selon le statut de cycle', () => {
    const missingCompleteStatus = SIMULATOR_DEFINITIONS.filter((definition) =>
      ['active', 'hub', 'placeholder'].includes(definition.lifecycle),
    )
      .filter((definition) => definition.legalRefsStatus !== 'complete')
      .map((definition) => definition.id);

    const missingCompleteRefs = SIMULATOR_DEFINITIONS.filter(
      (definition) => definition.legalRefsStatus === 'complete',
    )
      .filter((definition) => definition.legalRefs.length === 0)
      .map((definition) => definition.id);

    const plannedWithoutStatus = SIMULATOR_DEFINITIONS.filter(
      (definition) => definition.lifecycle === 'planned',
    )
      .filter((definition) => definition.legalRefsStatus === undefined)
      .map((definition) => definition.id);

    const refsToFillThatInventRefs = SIMULATOR_DEFINITIONS.filter(
      (definition) => definition.legalRefsStatus === 'a-renseigner-avant-codage',
    )
      .filter((definition) => definition.legalRefs.length > 0)
      .map((definition) => definition.id);

    expect(
      missingCompleteStatus,
      `Actifs/hubs/placeholders sans statut legalRefs complet : ${missingCompleteStatus.join(', ')}`,
    ).toEqual([]);
    expect(
      missingCompleteRefs,
      `Statuts legalRefs complets sans références : ${missingCompleteRefs.join(', ')}`,
    ).toEqual([]);
    expect(
      plannedWithoutStatus,
      `Planned sans statut legalRefs explicite : ${plannedWithoutStatus.join(', ')}`,
    ).toEqual([]);
    expect(
      refsToFillThatInventRefs,
      `Références à renseigner mais déjà remplies : ${refsToFillThatInventRefs.join(', ')}`,
    ).toEqual([]);
  });

  it('référence uniquement des références juridiques canoniques', () => {
    const legalReferenceIds = new Set(LEGAL_REFERENCES.map((reference) => reference.id));
    const registryReferences = new Map(
      SIMULATOR_DEFINITIONS.map((definition) => [definition.id, new Set(definition.legalRefs)]),
    );

    const unknownReferences = SIMULATOR_DEFINITIONS.filter(
      (definition) => definition.legalRefsStatus === 'complete',
    ).flatMap((definition) =>
      definition.legalRefs
        .filter((referenceId) => !legalReferenceIds.has(referenceId))
        .map((referenceId) => `${definition.id}:${referenceId}`),
    );

    const referencesWithoutUsage = LEGAL_REFERENCES.filter((reference) => {
      return (
        (reference.relatedSimulatorIds?.length ?? 0) === 0 &&
        (reference.relatedSettings?.length ?? 0) === 0 &&
        (reference.relatedCatalogProducts?.length ?? 0) === 0
      );
    }).map((reference) => reference.id);

    const mismatchedSimulatorLinks = LEGAL_REFERENCES.flatMap((reference) =>
      (reference.relatedSimulatorIds ?? [])
        .filter((simulatorId) => !registryReferences.get(simulatorId)?.has(reference.id))
        .map((simulatorId) => `${reference.id}:${simulatorId}`),
    );

    expect(
      unknownReferences,
      `Références inconnues dans la registry : ${unknownReferences.join(', ')}`,
    ).toEqual([]);
    expect(
      referencesWithoutUsage,
      `Références juridiques sans usage déclaré : ${referencesWithoutUsage.join(', ')}`,
    ).toEqual([]);
    expect(
      mismatchedSimulatorLinks,
      `relatedSimulatorIds désynchronisés : ${mismatchedSimulatorLinks.join(', ')}`,
    ).toEqual([]);
  });

  it('déclare seulement des settings fiscaux/métier présents dans le registry', () => {
    const unknownSettings = SIMULATOR_DEFINITIONS.flatMap((definition) =>
      definition.settingsKeys
        .filter((settingKey) => !SETTINGS_REGISTRY_KEYS.has(settingKey))
        .map((settingKey) => `${definition.id}:${settingKey}`),
    );

    const liveSimulatorsWithPlannedSettings = SIMULATOR_DEFINITIONS.filter((definition) =>
      ['active', 'hub', 'placeholder'].includes(definition.lifecycle),
    ).flatMap((definition) =>
      definition.settingsKeys
        .filter((settingKey) => getSettingsRegistryEntry(settingKey).status === 'planned')
        .map((settingKey) => `${definition.id}:${settingKey}`),
    );

    expect(unknownSettings, 'Settings non déclarés dans le registry').toEqual([]);
    expect(
      liveSimulatorsWithPlannedSettings,
      'Actifs/hubs/placeholders liés à un setting planned',
    ).toEqual([]);
  });

  it('intègre les décisions métier structurantes', () => {
    const ids = new Set(SIMULATOR_DEFINITIONS.map((definition) => definition.id));
    const actifPassif = SIMULATOR_DEFINITIONS.find(
      (definition) => definition.id === 'actif-passif',
    );
    const placement = SIMULATOR_DEFINITIONS.find((definition) => definition.id === 'placement');
    const tresorerie = SIMULATOR_DEFINITIONS.find(
      (definition) => definition.id === 'tresorerie-societe',
    );
    const cessionTitres = SIMULATOR_DEFINITIONS.find(
      (definition) => definition.id === 'cession-titres',
    );

    expect(actifPassif?.lifecycle).toBe('internalOnly');
    expect(actifPassif?.visibility).toBe('internal');
    expect(ids.has('pea')).toBe(false);
    expect(ids.has('cto')).toBe(false);
    expect(ids.has('assurance-vie')).toBe(false);
    expect(placement?.subtypes).toEqual(
      expect.arrayContaining(['PEA', 'CTO', 'Assurance-vie / capitalisation']),
    );
    expect(ids.has('placement-tresorerie')).toBe(false);
    expect(tresorerie?.subtypes).toEqual(expect.arrayContaining(['Placement trésorerie intégré']));
    expect(cessionTitres?.space).toBe('societe');
  });

  it('verrouille les libellés canoniques V2-06bis', () => {
    const byId = new Map(SIMULATOR_DEFINITIONS.map((definition) => [definition.id, definition]));

    expect(byId.get('regime-matrimonial')?.fullLabel).toBe(
      'Régime matrimonial & protection conjoint',
    );
    expect(byId.get('placement')?.fullLabel).toBe("Allocation patrimoniale & choix d'enveloppes");
    expect(byId.get('placement')?.subtypes).toContain('Assurance-vie / capitalisation');
    expect(byId.get('sci')?.fullLabel).toBe('SCI & mode de détention');
    expect(byId.get('credit')?.fullLabel).toBe('Crédit & garanties');
    expect(byId.get('arbitrage-reemploi')?.fullLabel).toBe('Vendre / conserver / réemployer');
    expect(byId.get('sortie-capitaux')?.fullLabel).toBe('Sortie de capitaux / CCA');
    expect(byId.get('donation-demembrement')?.fullLabel).toBe(
      'Donation / donation-partage & démembrement',
    );
    expect(byId.get('succession')?.fullLabel).toBe('Droits de succession & liquidité successorale');
    expect(byId.get('cession-titres')?.fullLabel).toBe(
      'Cession de titres & plus-values mobilières',
    );
  });
});
