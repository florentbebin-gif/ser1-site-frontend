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

const Settings = lazy(() => import('../pages/Settings'));
const SettingsImpots = lazy(() => import('../pages/settings/SettingsImpots'));
const SettingsPrelevements = lazy(() => import('../pages/settings/SettingsPrelevements'));
const SettingsBaseContrats = lazy(() => import('../pages/settings/BaseContrat'));
const SettingsComptes = lazy(() => import('../pages/settings/SettingsComptes'));
const SettingsDmtgSuccession = lazy(() => import('../pages/settings/SettingsDmtgSuccession'));

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
    component: Settings,
  },
  {
    key: 'impots',
    label: 'Imp\u00f4ts',
    path: 'impots',
    urlPath: '/settings/impots',
    component: SettingsImpots,
  },
  {
    key: 'prelevements',
    label: 'Param\u00e8tres sociaux',
    path: 'prelevements',
    urlPath: '/settings/prelevements',
    component: SettingsPrelevements,
  },
  {
    key: 'baseContrats',
    label: 'R\u00e9f\u00e9rentiel contrats',
    path: 'base-contrat',
    urlPath: '/settings/base-contrat',
    component: SettingsBaseContrats,
  },
  {
    key: 'dmtgSuccession',
    label: 'DMTG & Succession',
    path: 'dmtg-succession',
    urlPath: '/settings/dmtg-succession',
    component: SettingsDmtgSuccession,
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
  if (pathname.startsWith('/settings/impots')) return 'impots';
  if (pathname.startsWith('/settings/prelevements')) return 'prelevements';
  if (pathname.startsWith('/settings/fiscalites')) return 'baseContrats';
  if (pathname.startsWith('/settings/base-contrat')) return 'baseContrats';
  if (pathname.startsWith('/settings/dmtg-succession')) return 'dmtgSuccession';
  if (pathname.startsWith('/settings/comptes')) return 'comptes';
  return 'general';
}

export function getVisibleSettingsRoutes(isAdmin: boolean) {
  return SETTINGS_ROUTES.filter((route) => !route.adminOnly || isAdmin);
}
