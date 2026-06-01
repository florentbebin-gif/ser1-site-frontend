import { describe, expect, it } from 'vitest';

import { SIM_ROUTE_CONTRACTS } from '@/routes/simRouteContracts';
import { SIMULATOR_DEFINITIONS } from '../registry';

const ROUTE_IDS = new Set<string>(SIM_ROUTE_CONTRACTS.map((route) => route.id));

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
});
