/**
 * Configuration centralisee des routes Settings.
 *
 * Source de verite unique pour :
 * - la navigation (`SettingsShell`)
 * - le mapping composants
 * - les permissions (`adminOnly`)
 *
 * Ordre = ordre d'affichage dans la navigation.
 */

import { lazy, type ComponentType } from 'react';

const SettingsGeneral = lazy(() => import('../pages/settings/SettingsGeneral'));
const SettingsMemento = lazy(() => import('../pages/settings/SettingsMemento'));
const SettingsBaseCgRetraite = lazy(() => import('../pages/settings/BaseCgRetraite'));
const SettingsComptes = lazy(() => import('../pages/settings/SettingsComptes'));
const SettingsPrevoyanceRegimes = lazy(() => import('../pages/settings/PrevoyanceRegimes'));
const SettingsDesignSystem = lazy(() => import('../pages/settings/SettingsDesignSystem'));

export interface SettingsRouteEntry {
  key: string;
  label: string;
  path: string;
  urlPath: string;
  component: ComponentType;
  adminOnly?: boolean;
}

export const SETTINGS_ROUTES: SettingsRouteEntry[] = [
  {
    key: 'general',
    label: 'G\u00e9n\u00e9raux',
    path: '',
    urlPath: '/settings',
    component: SettingsGeneral,
  },
  {
    key: 'memento',
    label: 'Mémento',
    path: 'memento',
    urlPath: '/settings/memento',
    component: SettingsMemento,
  },
  {
    key: 'baseCgRetraite',
    label: 'Base CG retraite',
    path: 'base-contrat-retraite',
    urlPath: '/settings/base-contrat-retraite',
    component: SettingsBaseCgRetraite,
  },
  {
    key: 'prevoyanceRegimes',
    label: 'Prévoyance — régimes',
    path: 'prevoyance-regimes',
    urlPath: '/settings/prevoyance-regimes',
    component: SettingsPrevoyanceRegimes,
  },
  {
    key: 'designSystem',
    label: 'Design system',
    path: 'design-system',
    urlPath: '/settings/design-system',
    component: SettingsDesignSystem,
    adminOnly: true,
  },
  {
    key: 'comptes',
    label: 'Comptes',
    path: 'comptes',
    urlPath: '/settings/comptes',
    component: SettingsComptes,
    adminOnly: true,
  },
];

export function getActiveSettingsKey(pathname: string): string {
  if (pathname.startsWith('/settings/memento')) return 'memento';
  if (pathname.startsWith('/settings/base-contrat-retraite')) return 'baseCgRetraite';
  if (pathname.startsWith('/settings/prevoyance-regimes')) return 'prevoyanceRegimes';
  if (pathname.startsWith('/settings/design-system')) return 'designSystem';
  if (pathname.startsWith('/settings/comptes')) return 'comptes';
  if (pathname.startsWith('/settings/')) return 'memento';
  return 'general';
}

export function getVisibleSettingsRoutes(isAdmin: boolean) {
  return SETTINGS_ROUTES.filter((route) => !route.adminOnly || isAdmin);
}

export function isDeclaredSettingsPath(pathname: string): boolean {
  if (pathname === '/settings') return true;

  return SETTINGS_ROUTES.some(
    (route) =>
      route.urlPath !== '/settings' &&
      (pathname === route.urlPath || pathname.startsWith(`${route.urlPath}/`)),
  );
}
