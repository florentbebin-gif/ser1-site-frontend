export type SimRouteStatus = 'active' | 'hub' | 'placeholder';

export interface SimRouteContract {
  id: string;
  path: `/sim/${string}`;
  label: string;
  status: SimRouteStatus;
  resetKey?: string;
  pageTestId?: string;
  placeholderTitle?: string;
  placeholderSubtitle?: string;
}

export const SIM_ROUTE_CONTRACTS = [
  {
    id: 'placement',
    path: '/sim/placement',
    label: 'Placement',
    status: 'active',
    resetKey: 'placement',
    pageTestId: 'placement-page',
  },
  {
    id: 'credit',
    path: '/sim/credit',
    label: 'Crédit',
    status: 'active',
    resetKey: 'credit',
    pageTestId: 'credit-page',
  },
  {
    id: 'succession',
    path: '/sim/succession',
    label: 'Succession',
    status: 'active',
    resetKey: 'succession',
    pageTestId: 'succession-page',
  },
  {
    id: 'per',
    path: '/sim/per',
    label: 'PER',
    status: 'hub',
  },
  {
    id: 'per-potentiel',
    path: '/sim/per/potentiel',
    label: 'PER — Potentiel',
    status: 'active',
    resetKey: 'per-potentiel',
    pageTestId: 'per-potentiel-page',
  },
  {
    id: 'per-transfert',
    path: '/sim/per/transfert',
    label: 'PER — Transfert',
    status: 'active',
    resetKey: 'per-transfert',
    pageTestId: 'per-transfert-page',
  },
  {
    id: 'epargne-salariale',
    path: '/sim/epargne-salariale',
    label: 'Épargne salariale',
    status: 'placeholder',
    placeholderTitle: 'Épargne salariale',
    placeholderSubtitle: 'Ce simulateur premium sera bientôt disponible.',
  },
  {
    id: 'tresorerie-societe',
    path: '/sim/tresorerie-societe',
    label: 'Trésorerie société',
    status: 'active',
    resetKey: 'tresorerie-societe',
    pageTestId: 'tresorerie-societe-page',
  },
  {
    id: 'prevoyance',
    path: '/sim/prevoyance',
    label: 'Prévoyance',
    status: 'active',
    resetKey: 'prevoyance',
    pageTestId: 'prevoyance-page',
  },
  {
    id: 'ir',
    path: '/sim/ir',
    label: 'Impôt sur le revenu',
    status: 'active',
    resetKey: 'ir',
    pageTestId: 'ir-page',
  },
  // scaffold:sim contract
] as const satisfies readonly SimRouteContract[];

export type SimRouteContractEntry = (typeof SIM_ROUTE_CONTRACTS)[number];
export type ActiveSimRouteContract = Extract<SimRouteContractEntry, { status: 'active' }>;
export type ActiveSimRouteId = ActiveSimRouteContract['id'];

export const ACTIVE_SIM_ROUTE_CONTRACTS = SIM_ROUTE_CONTRACTS.filter(
  (route): route is ActiveSimRouteContract => route.status === 'active',
);

export const HUB_OR_PLACEHOLDER_SIM_ROUTE_CONTRACTS = SIM_ROUTE_CONTRACTS.filter(
  (route) => route.status !== 'active',
);

export function getSimRouteContract<TId extends SimRouteContractEntry['id']>(
  id: TId,
): Extract<SimRouteContractEntry, { id: TId }> {
  const route = SIM_ROUTE_CONTRACTS.find((entry) => entry.id === id);
  if (!route) {
    throw new Error(`Contrat simulateur introuvable : ${id}`);
  }
  return route as Extract<SimRouteContractEntry, { id: TId }>;
}
