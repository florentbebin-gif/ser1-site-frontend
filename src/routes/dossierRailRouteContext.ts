import { getPreferredJourneyIdForSimulator, type DossierRailRouteContext } from '@/domain/dossier';
import { SIMULATOR_DEFINITIONS } from '@/domain/simulators/registry';

import { SIM_ROUTE_CONTRACTS } from './simRouteContracts';

function normalizePathname(pathname: string): string {
  if (pathname.length <= 1) return pathname;
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function getDossierRailRouteContext(pathname: string): DossierRailRouteContext | null {
  const normalizedPathname = normalizePathname(pathname);

  // UX-01 : /audit est un cockpit pleine largeur qui possède sa propre colonne
  // gauche (encart dossier + gestion à venir) ; il ne monte plus le rail partagé.
  // Le rail cockpit dédié reste prévu pour UX-02.

  if (normalizedPathname === '/strategy') {
    return {
      kind: 'strategy',
      pathname: normalizedPathname,
    };
  }

  const route = SIM_ROUTE_CONTRACTS.find((entry) => entry.path === normalizedPathname);
  if (!route) {
    return null;
  }

  const simulator = SIMULATOR_DEFINITIONS.find((entry) => entry.routeId === route.id);
  if (!simulator) {
    return null;
  }

  return {
    kind: 'simulator',
    pathname: normalizedPathname,
    simulatorId: simulator.id,
    routeId: route.id,
    preferredJourneyId: getPreferredJourneyIdForSimulator(simulator.id),
  };
}

export function getSimulatorRoutePath(routeId: string | undefined): string | null {
  if (!routeId) return null;
  return SIM_ROUTE_CONTRACTS.find((entry) => entry.id === routeId)?.path ?? null;
}
