import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';

import Login from '../pages/Login';
import Home from '../pages/Home';
import ForgotPassword from '../pages/ForgotPassword';
import SetPassword from '../pages/SetPassword';

type RouteProps = Record<string, unknown>;

export type RouteComponent =
  | ComponentType<RouteProps>
  | LazyExoticComponent<ComponentType<RouteProps>>;

// ── Route metadata ────────────────────────────────────────────────────────────

/** Topbar behavior for a given route (declarative, data-driven). */
export interface TopbarMeta {
  /** Show the Home button in topbar */
  showHome?: boolean;
  /** Show Save / Load buttons */
  showSaveLoad?: boolean;
  /** Show the global reset button (Home page only) */
  showGlobalReset?: boolean;
  /** If set, show a page-specific reset button calling triggerPageReset(resetKey) */
  resetKey?: string;
}

/** Resolved metadata for the current route (returned by getRouteMetadata). */
export interface RouteMeta {
  contextLabel: string | null;
  showHome: boolean;
  showSaveLoad: boolean;
  showGlobalReset: boolean;
  resetKey: string | null;
}

// ── Route entry type ──────────────────────────────────────────────────────────

export type AppRouteEntry =
  | {
      kind: 'route';
      access: 'public' | 'private';
      path: string;
      component: RouteComponent;
      lazy?: boolean;
      props?: Record<string, unknown>;
      /**
       * Exception minimale : Login (publique) déclenche une navigation après login.
       * Le callback est injecté côté App.jsx (qui a accès à useNavigate()).
       */
      onLoginNavigateTo?: string;
      /** Breadcrumb label displayed in the topbar */
      contextLabel?: string;
      /** Topbar behavior — buttons, reset actions */
      topbar?: TopbarMeta;
    }
  | {
      kind: 'redirect';
      path: string;
      to: string;
      replace?: boolean;
    };

// ── Lazy-loaded modules ───────────────────────────────────────────────────────

const LoginRoute = Login as unknown as RouteComponent;
const Placement = lazy(() => import('../features/placement/PlacementPage'));
const Credit = lazy(() => import('../features/credit/Credit'));
const Ir = lazy(() => import('../features/ir/IrPage'));
const AuditWizard = lazy(() => import('../features/audit/AuditWizard'));
const SuccessionSimulator = lazy(() => import('../features/succession/SuccessionSimulator'));
const PerHome = lazy(() => import('../features/per/PerHome'));
const PerPotentielSimulator = lazy(() => import('../features/per/components/potentiel/PerPotentielSimulator'));
const UpcomingSimulatorPage = lazy(() => import('../pages/UpcomingSimulatorPage')) as unknown as LazyExoticComponent<ComponentType<RouteProps>>;
const StrategyPage = lazy(() => import('../pages/StrategyPage'));
const SettingsShell = lazy(() => import('../pages/SettingsShell'));

// ── Topbar presets (DRY) ──────────────────────────────────────────────────────

const SIM_TOPBAR: TopbarMeta = { showHome: true, showSaveLoad: true };

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
    component: AuditWizard,
    lazy: true,
    contextLabel: 'Audit',
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
    path: '/sim/placement',
    component: Placement,
    lazy: true,
    contextLabel: 'Placement',
    topbar: { ...SIM_TOPBAR, resetKey: 'placement' },
  },
  {
    kind: 'route',
    access: 'private',
    path: '/sim/credit',
    component: Credit,
    lazy: true,
    contextLabel: 'Crédit',
    topbar: { ...SIM_TOPBAR, resetKey: 'credit' },
  },
  {
    kind: 'route',
    access: 'private',
    path: '/sim/succession',
    component: SuccessionSimulator,
    lazy: true,
    contextLabel: 'Succession',
    topbar: { ...SIM_TOPBAR, resetKey: 'succession' },
  },
  {
    kind: 'route',
    access: 'private',
    path: '/sim/per',
    component: PerHome,
    lazy: true,
    contextLabel: 'PER',
    topbar: SIM_TOPBAR,
  },
  {
    kind: 'route',
    access: 'private',
    path: '/sim/per/potentiel',
    component: PerPotentielSimulator,
    lazy: true,
    contextLabel: 'PER — Potentiel',
    topbar: { ...SIM_TOPBAR, resetKey: 'per-potentiel' },
  },
  {
    kind: 'route',
    access: 'private',
    path: '/sim/per/transfert',
    component: UpcomingSimulatorPage,
    lazy: true,
    contextLabel: 'PER — Transfert',
    topbar: SIM_TOPBAR,
    props: {
      title: 'Transfert épargne retraite',
      subtitle: 'Ce simulateur premium sera bientôt disponible.',
    },
  },
  {
    kind: 'route',
    access: 'private',
    path: '/sim/per/ouverture',
    component: UpcomingSimulatorPage,
    lazy: true,
    contextLabel: 'PER — Ouverture',
    topbar: SIM_TOPBAR,
    props: {
      title: 'Ouverture PER',
      subtitle: 'Ce simulateur premium sera bientôt disponible.',
    },
  },
  {
    kind: 'route',
    access: 'private',
    path: '/sim/epargne-salariale',
    component: UpcomingSimulatorPage,
    lazy: true,
    contextLabel: 'Épargne salariale',
    topbar: SIM_TOPBAR,
    props: {
      title: 'Epargne salariale',
      subtitle: 'Ce simulateur premium sera bientôt disponible.',
    },
  },
  {
    kind: 'route',
    access: 'private',
    path: '/sim/tresorerie-societe',
    component: UpcomingSimulatorPage,
    lazy: true,
    contextLabel: 'Trésorerie société',
    topbar: SIM_TOPBAR,
    props: {
      title: 'Trésorerie société',
      subtitle: 'Ce simulateur premium sera bientôt disponible.',
    },
  },
  {
    kind: 'route',
    access: 'private',
    path: '/sim/prevoyance',
    component: UpcomingSimulatorPage,
    lazy: true,
    contextLabel: 'Prévoyance',
    topbar: SIM_TOPBAR,
    props: {
      title: 'Prévoyance',
      subtitle: 'Ce simulateur premium sera bientôt disponible.',
    },
  },
  {
    kind: 'route',
    access: 'private',
    path: '/sim/ir',
    component: Ir,
    lazy: true,
    contextLabel: 'Impôt',
    topbar: { ...SIM_TOPBAR, resetKey: 'ir' },
  },

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

  // Legacy redirects
  { kind: 'redirect', path: '/placement', to: '/sim/placement', replace: true },
  { kind: 'redirect', path: '/credit', to: '/sim/credit', replace: true },
  { kind: 'redirect', path: '/prevoyance', to: '/sim/prevoyance', replace: true },
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
 * Resolve topbar metadata for the given pathname.
 * Matches exact paths and wildcard paths (e.g. `/settings/*`).
 */
export function getRouteMetadata(pathname: string): RouteMeta {
  for (const entry of APP_ROUTES) {
    if (entry.kind === 'redirect') continue;

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
