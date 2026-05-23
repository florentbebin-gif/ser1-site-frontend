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
const AuditWizard = lazy(() =>
  import('../features/audit').then(({ AuditWizard }) => ({ default: AuditWizard })),
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
    component: PerTransfertSimulator,
    lazy: true,
    contextLabel: 'PER — Transfert',
    topbar: { ...SIM_TOPBAR, resetKey: 'per-transfert' },
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
      title: 'Épargne salariale',
      subtitle: 'Ce simulateur premium sera bientôt disponible.',
    },
  },
  {
    kind: 'route',
    access: 'private',
    path: '/sim/tresorerie-societe',
    component: TresorerieSocietePage as unknown as ComponentType<RouteProps>,
    lazy: true,
    contextLabel: 'Trésorerie société',
    topbar: { ...SIM_TOPBAR, resetKey: 'tresorerie-societe' },
  },
  {
    kind: 'route',
    access: 'private',
    path: '/sim/prevoyance',
    component: PrevoyancePage,
    lazy: true,
    contextLabel: 'Prévoyance',
    topbar: { ...SIM_TOPBAR, resetKey: 'prevoyance' },
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
