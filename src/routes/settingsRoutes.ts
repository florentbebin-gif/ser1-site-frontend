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
const SettingsImpots = lazy(() => import('../pages/settings/SettingsImpots'));
const SettingsComptablesSocietes = lazy(
  () => import('../pages/settings/SettingsComptablesSocietes'),
);
const SettingsPrelevements = lazy(() => import('../pages/settings/SettingsPrelevements'));
const SettingsBaseContrats = lazy(() => import('../pages/settings/BaseContrat'));
const SettingsBaseCgRetraite = lazy(() => import('../pages/settings/BaseCgRetraite'));
const SettingsComptes = lazy(() => import('../pages/settings/SettingsComptes'));
const SettingsDmtgSuccession = lazy(() => import('../pages/settings/SettingsDmtgSuccession'));
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
    key: 'impots',
    label: 'Imp\u00f4ts',
    path: 'impots',
    urlPath: '/settings/impots',
    component: SettingsImpots,
  },
  {
    key: 'comptablesSocietes',
    label: 'Comptables & soci\u00e9t\u00e9s',
    path: 'comptables-societes',
    urlPath: '/settings/comptables-societes',
    component: SettingsComptablesSocietes,
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
    key: 'baseCgRetraite',
    label: 'Base CG retraite',
    path: 'base-contrat-retraite',
    urlPath: '/settings/base-contrat-retraite',
    component: SettingsBaseCgRetraite,
  },
  {
    key: 'dmtgSuccession',
    label: 'DMTG & Succession',
    path: 'dmtg-succession',
    urlPath: '/settings/dmtg-succession',
    component: SettingsDmtgSuccession,
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
  if (pathname.startsWith('/settings/impots')) return 'impots';
  if (pathname.startsWith('/settings/comptables-societes')) return 'comptablesSocietes';
  if (pathname.startsWith('/settings/prelevements')) return 'prelevements';
  if (pathname.startsWith('/settings/fiscalites')) return 'baseContrats';
  if (pathname.startsWith('/settings/base-contrat-retraite')) return 'baseCgRetraite';
  if (pathname.startsWith('/settings/base-contrat')) return 'baseContrats';
  if (pathname.startsWith('/settings/dmtg-succession')) return 'dmtgSuccession';
  if (pathname.startsWith('/settings/prevoyance-regimes')) return 'prevoyanceRegimes';
  if (pathname.startsWith('/settings/design-system')) return 'designSystem';
  if (pathname.startsWith('/settings/comptes')) return 'comptes';
  return 'general';
}

export function getVisibleSettingsRoutes(isAdmin: boolean) {
  return SETTINGS_ROUTES.filter((route) => !route.adminOnly || isAdmin);
}
