import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';

import Login from '../pages/Login';
import Home from '../pages/Home';
import ForgotPassword from '../pages/ForgotPassword';
import SetPassword from '../pages/SetPassword';
import { getSimRouteContract } from './simRouteContracts';

type RouteProps = Record<string, unknown>;

export type RouteComponent =
  | ComponentType<RouteProps>
  | LazyExoticComponent<ComponentType<RouteProps>>;

// ── Route metadata ────────────────────────────────────────────────────────────

/** Comportement de la topbar pour une route déclarative. */
export interface TopbarMeta {
  /** Affiche le bouton Accueil dans la topbar. */
  showHome?: boolean;
  /** Affiche les boutons Sauvegarder / Charger. */
  showSaveLoad?: boolean;
  /** Affiche le reset global (accueil uniquement). */
  showGlobalReset?: boolean;
  /** Affiche un reset de page via triggerPageReset(resetKey). */
  resetKey?: string;
}

/** Métadonnées résolues pour la route courante. */
export interface RouteMeta {
  contextLabel: string | null;
  showHome: boolean;
  showSaveLoad: boolean;
  showGlobalReset: boolean;
  resetKey: string | null;
}

// ── Route entry type ──────────────────────────────────────────────────────────

export interface AppRouteEntry {
  kind: 'route';
  access: 'public' | 'private';
  path: string;
  component: RouteComponent;
  lazy?: boolean;
  props?: Record<string, unknown>;
  /**
   * Exception minimale : Login (publique) déclenche une navigation après login.
   * Le callback est injecté côté App.tsx (qui a accès à useNavigate()).
   */
  onLoginNavigateTo?: string;
  /** Libellé affiché dans la topbar. */
  contextLabel?: string;
  /** Comportement topbar : boutons et actions de reset. */
  topbar?: TopbarMeta;
}

// ── Lazy-loaded modules ───────────────────────────────────────────────────────

const LoginRoute = Login as unknown as RouteComponent;
const Placement = lazy(() =>
  import('../features/placement').then(({ PlacementPage }) => ({ default: PlacementPage })),
);
const Credit = lazy(() =>
  import('../features/credit').then(({ CreditPage }) => ({ default: CreditPage })),
);
const Ir = lazy(() => import('../features/ir').then(({ IrPage }) => ({ default: IrPage })));
const AuditPage = lazy(() =>
  import('../features/audit').then(({ AuditPage }) => ({ default: AuditPage })),
);
const SuccessionSimulator = lazy(() =>
  import('../features/succession').then(({ SuccessionSimulator }) => ({
    default: SuccessionSimulator,
  })),
);
const PerHome = lazy(() => import('../features/per').then(({ PerHome }) => ({ default: PerHome })));
const PerPotentielSimulator = lazy(() =>
  import('../features/per').then(({ PerPotentielSimulator }) => ({
    default: PerPotentielSimulator,
  })),
);
const PerTransfertSimulator = lazy(() =>
  import('../features/per').then(({ PerTransfertSimulator }) => ({
    default: PerTransfertSimulator,
  })),
);
const UpcomingSimulatorPage = lazy(
  () => import('../pages/UpcomingSimulatorPage'),
) as unknown as LazyExoticComponent<ComponentType<RouteProps>>;
const TresorerieSocietePage = lazy(() =>
  import('../features/tresorerie-societe').then(({ TresorerieSocietePage }) => ({
    default: TresorerieSocietePage,
  })),
);
const PrevoyancePage = lazy(() => import('../features/prevoyance'));
const StrategyPage = lazy(() => import('../pages/StrategyPage'));
// scaffold:sim component
const SettingsShell = lazy(() => import('../pages/SettingsShell'));

// ── Topbar presets (DRY) ──────────────────────────────────────────────────────

const SIM_TOPBAR: TopbarMeta = { showHome: true, showSaveLoad: true };

const SIM_ROUTES = {
  placement: getSimRouteContract('placement'),
  credit: getSimRouteContract('credit'),
  succession: getSimRouteContract('succession'),
  per: getSimRouteContract('per'),
  perPotentiel: getSimRouteContract('per-potentiel'),
  perTransfert: getSimRouteContract('per-transfert'),
  epargneSalariale: getSimRouteContract('epargne-salariale'),
  tresorerieSociete: getSimRouteContract('tresorerie-societe'),
  prevoyance: getSimRouteContract('prevoyance'),
  ir: getSimRouteContract('ir'),
  // scaffold:sim route-contract
};

// ── Routes ────────────────────────────────────────────────────────────────────

export const APP_ROUTES: AppRouteEntry[] = [
  // Public
  {
    kind: 'route',
    access: 'public',
    path: '/login',
    component: LoginRoute,
    onLoginNavigateTo: '/',
  },
  { kind: 'route', access: 'public', path: '/forgot-password', component: ForgotPassword },
  { kind: 'route', access: 'public', path: '/set-password', component: SetPassword },
  { kind: 'route', access: 'public', path: '/reset-password', component: SetPassword },

  // Private (non-lazy)
  {
    kind: 'route',
    access: 'private',
    path: '/',
    component: Home,
    contextLabel: 'Accueil',
    topbar: { showSaveLoad: true, showGlobalReset: true },
  },

  // Private (lazy)
  {
    kind: 'route',
    access: 'private',
    path: '/audit',
    component: AuditPage,
    lazy: true,
    contextLabel: 'Dossier patrimonial',
    topbar: { ...SIM_TOPBAR, resetKey: 'audit' },
  },
  {
    kind: 'route',
    access: 'private',
    path: '/strategy',
    component: StrategyPage,
    lazy: true,
    contextLabel: 'Stratégie',
    topbar: { ...SIM_TOPBAR, resetKey: 'strategy' },
  },

  // Simulators (lazy)
  {
    kind: 'route',
    access: 'private',
    path: SIM_ROUTES.placement.path,
    component: Placement,
    lazy: true,
    contextLabel: SIM_ROUTES.placement.label,
    topbar: { ...SIM_TOPBAR, resetKey: SIM_ROUTES.placement.resetKey },
  },
  {
    kind: 'route',
    access: 'private',
    path: SIM_ROUTES.credit.path,
    component: Credit,
    lazy: true,
    contextLabel: SIM_ROUTES.credit.label,
    topbar: { ...SIM_TOPBAR, resetKey: SIM_ROUTES.credit.resetKey },
  },
  {
    kind: 'route',
    access: 'private',
    path: SIM_ROUTES.succession.path,
    component: SuccessionSimulator,
    lazy: true,
    contextLabel: SIM_ROUTES.succession.label,
    topbar: { ...SIM_TOPBAR, resetKey: SIM_ROUTES.succession.resetKey },
  },
  {
    kind: 'route',
    access: 'private',
    path: SIM_ROUTES.per.path,
    component: PerHome,
    lazy: true,
    contextLabel: SIM_ROUTES.per.label,
    topbar: SIM_TOPBAR,
  },
  {
    kind: 'route',
    access: 'private',
    path: SIM_ROUTES.perPotentiel.path,
    component: PerPotentielSimulator,
    lazy: true,
    contextLabel: SIM_ROUTES.perPotentiel.label,
    topbar: { ...SIM_TOPBAR, resetKey: SIM_ROUTES.perPotentiel.resetKey },
  },
  {
    kind: 'route',
    access: 'private',
    path: SIM_ROUTES.perTransfert.path,
    component: PerTransfertSimulator,
    lazy: true,
    contextLabel: SIM_ROUTES.perTransfert.label,
    topbar: { ...SIM_TOPBAR, resetKey: SIM_ROUTES.perTransfert.resetKey },
  },
  {
    kind: 'route',
    access: 'private',
    path: SIM_ROUTES.epargneSalariale.path,
    component: UpcomingSimulatorPage,
    lazy: true,
    contextLabel: SIM_ROUTES.epargneSalariale.label,
    topbar: SIM_TOPBAR,
    props: {
      title: SIM_ROUTES.epargneSalariale.placeholderTitle,
      subtitle: SIM_ROUTES.epargneSalariale.placeholderSubtitle,
    },
  },
  {
    kind: 'route',
    access: 'private',
    path: SIM_ROUTES.tresorerieSociete.path,
    component: TresorerieSocietePage as unknown as ComponentType<RouteProps>,
    lazy: true,
    contextLabel: SIM_ROUTES.tresorerieSociete.label,
    topbar: { ...SIM_TOPBAR, resetKey: SIM_ROUTES.tresorerieSociete.resetKey },
  },
  {
    kind: 'route',
    access: 'private',
    path: SIM_ROUTES.prevoyance.path,
    component: PrevoyancePage,
    lazy: true,
    contextLabel: SIM_ROUTES.prevoyance.label,
    topbar: { ...SIM_TOPBAR, resetKey: SIM_ROUTES.prevoyance.resetKey },
  },
  {
    kind: 'route',
    access: 'private',
    path: SIM_ROUTES.ir.path,
    component: Ir,
    lazy: true,
    contextLabel: SIM_ROUTES.ir.label,
    topbar: { ...SIM_TOPBAR, resetKey: SIM_ROUTES.ir.resetKey },
  },
  // scaffold:sim app-route

  // Settings
  {
    kind: 'route',
    access: 'private',
    path: '/settings/*',
    component: SettingsShell,
    lazy: true,
    contextLabel: 'Paramètres',
    topbar: { showHome: true },
  },
];

// ── Route metadata resolver ──────────────────────────────────────────────────

const DEFAULT_META: RouteMeta = {
  contextLabel: null,
  showHome: false,
  showSaveLoad: false,
  showGlobalReset: false,
  resetKey: null,
};

/**
 * Résout les métadonnées topbar pour un pathname.
 * Gère les chemins exacts et les wildcards (`/settings/*`).
 */
export function getRouteMetadata(pathname: string): RouteMeta {
  for (const entry of APP_ROUTES) {
    const isMatch = entry.path.endsWith('/*')
      ? pathname.startsWith(entry.path.slice(0, -2))
      : entry.path === pathname;

    if (isMatch) {
      return {
        contextLabel: entry.contextLabel ?? null,
        showHome: entry.topbar?.showHome ?? false,
        showSaveLoad: entry.topbar?.showSaveLoad ?? false,
        showGlobalReset: entry.topbar?.showGlobalReset ?? false,
        resetKey: entry.topbar?.resetKey ?? null,
      };
    }
  }
  return DEFAULT_META;
}
