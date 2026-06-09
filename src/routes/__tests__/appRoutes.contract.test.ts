import { describe, expect, it } from 'vitest';

import { APP_ROUTES, getRouteMetadata } from '../appRoutes';
import {
  ACTIVE_SIM_ROUTE_CONTRACTS,
  HUB_OR_PLACEHOLDER_SIM_ROUTE_CONTRACTS,
  SIM_ROUTE_CONTRACTS,
} from '../simRouteContracts';

const ACTIVE_SIMULATOR_PATHS = new Set<string>(
  ACTIVE_SIM_ROUTE_CONTRACTS.map((route) => route.path),
);

const HUBS_OR_PLACEHOLDERS = new Set<string>(
  HUB_OR_PLACEHOLDER_SIM_ROUTE_CONTRACTS.map((route) => route.path),
);

const SIMULATOR_REGISTRY_PATHS = new Set<string>(SIM_ROUTE_CONTRACTS.map((route) => route.path));

const routePaths = new Set(APP_ROUTES.map((route) => route.path));

const simulatorRoutes = APP_ROUTES.filter((route) => route.path.startsWith('/sim/'));

describe('Contrat APP_ROUTES', () => {
  it('nomme /audit comme dossier patrimonial dans la topbar', () => {
    expect(getRouteMetadata('/audit').contextLabel).toBe('Dossier patrimonial');
  });

  it('déclare des chemins uniques', () => {
    const paths = APP_ROUTES.map((route) => route.path);
    const duplicates = paths.filter((path, index) => paths.indexOf(path) !== index);

    expect(duplicates, `Chemins APP_ROUTES dupliqués : ${duplicates.join(', ')}`).toEqual([]);
  });

  it('verrouille le contrat minimal des routes simulateur', () => {
    const violations = simulatorRoutes.flatMap((route) => {
      const errors: string[] = [];
      const metadata = getRouteMetadata(route.path);

      if (route.access !== 'private') errors.push('access !== private');
      if (route.lazy !== true) errors.push('lazy !== true');
      if (!route.contextLabel?.trim()) errors.push('contextLabel vide');
      if (metadata.showHome !== true) errors.push('topbar Home absente');

      return errors.map((error) => `${route.path}: ${error}`);
    });

    expect(violations, `Contrat /sim/* invalide : ${violations.join(', ')}`).toEqual([]);
  });

  it('recense toutes les routes simulateur actives attendues', () => {
    const missingActiveRoutes = [...ACTIVE_SIMULATOR_PATHS].filter((path) => !routePaths.has(path));

    expect(
      missingActiveRoutes,
      `Routes /sim/* actives absentes de APP_ROUTES : ${missingActiveRoutes.join(', ')}`,
    ).toEqual([]);
  });

  it('garde APP_ROUTES synchronisé avec le registre simulateur', () => {
    const appSimulatorPaths = simulatorRoutes.map((route) => route.path).sort();
    const registryPaths = [...SIMULATOR_REGISTRY_PATHS].sort();

    expect(
      appSimulatorPaths,
      [
        'Routes /sim/* désynchronisées du registre.',
        `APP_ROUTES : ${appSimulatorPaths.join(', ')}`,
        `Registre : ${registryPaths.join(', ')}`,
      ].join('\n'),
    ).toEqual(registryPaths);
  });

  it('réutilise les libellés et resetKey du registre simulateur', () => {
    const registryByPath = new Map<string, (typeof SIM_ROUTE_CONTRACTS)[number]>(
      SIM_ROUTE_CONTRACTS.map((route) => [route.path, route]),
    );
    const violations = simulatorRoutes.flatMap((route) => {
      const contract = registryByPath.get(route.path);
      const errors: string[] = [];
      if (!contract) return [`${route.path}: absent du registre`];
      if (route.contextLabel !== contract.label) errors.push('contextLabel désynchronisé');
      if (contract.status === 'active' && route.topbar?.resetKey !== contract.resetKey) {
        errors.push('resetKey désynchronisé');
      }
      return errors.map((error) => `${route.path}: ${error}`);
    });

    expect(violations, `Métadonnées /sim/* désynchronisées : ${violations.join(', ')}`).toEqual([]);
  });

  it('classe chaque route simulateur comme active ou hub/placeholder', () => {
    const unclassifiedRoutes = simulatorRoutes
      .map((route) => route.path)
      .filter((path) => !ACTIVE_SIMULATOR_PATHS.has(path) && !HUBS_OR_PLACEHOLDERS.has(path));

    expect(
      unclassifiedRoutes,
      [
        `Routes /sim/* non classées : ${unclassifiedRoutes.join(', ')}`,
        'Ajouter le path dans ACTIVE_SIMULATOR_PATHS si le simulateur est actif.',
        'Sinon, ajouter le path dans HUBS_OR_PLACEHOLDERS.',
      ].join('\n'),
    ).toEqual([]);
  });

  it('exige un resetKey sur les simulateurs actifs uniquement', () => {
    const missingResetKey = simulatorRoutes
      .filter((route) => ACTIVE_SIMULATOR_PATHS.has(route.path))
      .filter((route) => !route.topbar?.resetKey)
      .map((route) => route.path);

    const unexpectedResetlessRoute = simulatorRoutes
      .filter((route) => !route.topbar?.resetKey)
      .filter((route) => !HUBS_OR_PLACEHOLDERS.has(route.path))
      .map((route) => route.path);

    expect(
      missingResetKey,
      [
        `Routes /sim/* actives sans resetKey : ${missingResetKey.join(', ')}`,
        'Ajouter topbar.resetKey si le simulateur a un état persistant.',
      ].join('\n'),
    ).toEqual([]);

    expect(
      unexpectedResetlessRoute,
      [
        `Routes /sim/* sans resetKey non classées hub/placeholder : ${unexpectedResetlessRoute.join(', ')}`,
        'Ajouter topbar.resetKey ou classer explicitement la route dans HUBS_OR_PLACEHOLDERS.',
      ].join('\n'),
    ).toEqual([]);
  });

  it('conserve les simulateurs actifs sans props placeholder', () => {
    const activeRoutesWithProps = simulatorRoutes
      .filter((route) => ACTIVE_SIMULATOR_PATHS.has(route.path))
      .filter((route) => route.props !== undefined)
      .map((route) => route.path);

    expect(
      activeRoutesWithProps,
      `Simulateurs actifs avec props placeholder : ${activeRoutesWithProps.join(', ')}`,
    ).toEqual([]);
  });
});
