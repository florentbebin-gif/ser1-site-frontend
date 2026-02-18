import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';

import Login from '../pages/Login';
import Home from '../pages/Home';
import ForgotPassword from '../pages/ForgotPassword';
import SetPassword from '../pages/SetPassword';

export type RouteComponent = ComponentType<any> | LazyExoticComponent<ComponentType<any>>;

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
    }
  | {
      kind: 'redirect';
      path: string;
      to: string;
      replace?: boolean;
    };

// Lazy-loaded modules (as in src/App.jsx baseline)
const Placement = lazy(() => import('../features/placement').then(m => ({ default: m.PlacementPage })));
const Credit = lazy(() => import('../pages/credit/Credit'));
const Ir = lazy(() => import('../features/ir').then(m => ({ default: m.IrPage })));
const AuditWizard = lazy(() => import('../features/audit').then(m => ({ default: m.AuditWizard })));
const SuccessionSimulator = lazy(() => import('../features/succession').then(m => ({ default: m.SuccessionSimulator })));
const PerSimulator = lazy(() => import('../features/per').then(m => ({ default: m.PerSimulator })));
const UpcomingSimulatorPage = lazy(() => import('../pages/UpcomingSimulatorPage'));
const StrategyPage = lazy(() => import('../pages/StrategyPage'));
const SettingsShell = lazy(() => import('../pages/SettingsShell'));

export const APP_ROUTES: AppRouteEntry[] = [
  // Public
  {
    kind: 'route',
    access: 'public',
    path: '/login',
    component: Login,
    onLoginNavigateTo: '/',
  },
  { kind: 'route', access: 'public', path: '/forgot-password', component: ForgotPassword },
  { kind: 'route', access: 'public', path: '/set-password', component: SetPassword },
  { kind: 'route', access: 'public', path: '/reset-password', component: SetPassword },

  // Private (non-lazy)
  { kind: 'route', access: 'private', path: '/', component: Home },

  // Private (lazy)
  { kind: 'route', access: 'private', path: '/audit', component: AuditWizard, lazy: true },
  { kind: 'route', access: 'private', path: '/strategy', component: StrategyPage, lazy: true },

  // Simulators (lazy)
  { kind: 'route', access: 'private', path: '/sim/placement', component: Placement, lazy: true },
  { kind: 'route', access: 'private', path: '/sim/credit', component: Credit, lazy: true },
  { kind: 'route', access: 'private', path: '/sim/succession', component: SuccessionSimulator, lazy: true },
  { kind: 'route', access: 'private', path: '/sim/per', component: PerSimulator, lazy: true },
  {
    kind: 'route',
    access: 'private',
    path: '/sim/epargne-salariale',
    component: UpcomingSimulatorPage,
    lazy: true,
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
    props: {
      title: 'Prévoyance',
      subtitle: 'Ce simulateur premium sera bientôt disponible.',
    },
  },
  { kind: 'route', access: 'private', path: '/sim/ir', component: Ir, lazy: true },

  // Settings
  { kind: 'route', access: 'private', path: '/settings/*', component: SettingsShell, lazy: true },

  // Legacy redirects
  { kind: 'redirect', path: '/placement', to: '/sim/placement', replace: true },
  { kind: 'redirect', path: '/credit', to: '/sim/credit', replace: true },
  { kind: 'redirect', path: '/prevoyance', to: '/sim/prevoyance', replace: true },
];
