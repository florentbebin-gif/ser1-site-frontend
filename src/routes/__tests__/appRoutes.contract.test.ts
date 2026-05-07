import { describe, expect, it } from 'vitest';

import { APP_ROUTES, getRouteMetadata } from '../appRoutes';
import type { AppRouteEntry } from '../appRoutes';

type RouteEntry = Extract<AppRouteEntry, { kind: 'route' }>;
type RedirectEntry = Extract<AppRouteEntry, { kind: 'redirect' }>;

function isRouteEntry(route: AppRouteEntry): route is RouteEntry {
  return route.kind === 'route';
}

function isRedirectEntry(route: AppRouteEntry): route is RedirectEntry {
  return route.kind === 'redirect';
}

const ACTIVE_SIMULATOR_PATHS = new Set([
  '/sim/placement',
  '/sim/credit',
  '/sim/succession',
  '/sim/per/potentiel',
  '/sim/tresorerie-societe',
  '/sim/ir',
]);

const HUBS_OR_PLACEHOLDERS = new Set([
  '/sim/per',
  '/sim/per/transfert',
  '/sim/per/ouverture',
  '/sim/epargne-salariale',
  '/sim/prevoyance',
]);

const routePaths = new Set(
  APP_ROUTES
    .filter(isRouteEntry)
    .map(route => route.path),
);

const simulatorRoutes = APP_ROUTES.filter(
  (route): route is RouteEntry => isRouteEntry(route) && route.path.startsWith('/sim/'),
);

describe('Contrat APP_ROUTES', () => {
  it('déclare des chemins uniques', () => {
    const paths = APP_ROUTES.map(route => route.path);
    const duplicates = paths.filter((path, index) => paths.indexOf(path) !== index);

    expect(duplicates, `Chemins APP_ROUTES dupliqués : ${duplicates.join(', ')}`).toEqual([]);
  });

  it('redirige uniquement vers des routes existantes', () => {
    const invalidRedirects = APP_ROUTES
      .filter(isRedirectEntry)
      .filter(route => !routePaths.has(route.to))
      .map(route => `${route.path} -> ${route.to}`);

    expect(
      invalidRedirects,
      `Redirects vers des routes absentes : ${invalidRedirects.join(', ')}`,
    ).toEqual([]);
  });

  it('verrouille le contrat minimal des routes simulateur', () => {
    const violations = simulatorRoutes.flatMap(route => {
      const errors: string[] = [];
      const metadata = getRouteMetadata(route.path);

      if (route.access !== 'private') errors.push('access !== private');
      if (route.lazy !== true) errors.push('lazy !== true');
      if (!route.contextLabel?.trim()) errors.push('contextLabel vide');
      if (metadata.showHome !== true) errors.push('topbar Home absente');

      return errors.map(error => `${route.path}: ${error}`);
    });

    expect(
      violations,
      `Contrat /sim/* invalide : ${violations.join(', ')}`,
    ).toEqual([]);
  });

  it('exige un resetKey sur les simulateurs actifs uniquement', () => {
    const missingResetKey = simulatorRoutes
      .filter(route => ACTIVE_SIMULATOR_PATHS.has(route.path))
      .filter(route => !route.topbar?.resetKey)
      .map(route => route.path);

    const unexpectedResetlessRoute = simulatorRoutes
      .filter(route => !route.topbar?.resetKey)
      .filter(route => !HUBS_OR_PLACEHOLDERS.has(route.path))
      .map(route => route.path);

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
      .filter(route => ACTIVE_SIMULATOR_PATHS.has(route.path))
      .filter(route => route.props !== undefined)
      .map(route => route.path);

    expect(
      activeRoutesWithProps,
      `Simulateurs actifs avec props placeholder : ${activeRoutesWithProps.join(', ')}`,
    ).toEqual([]);
  });
});
