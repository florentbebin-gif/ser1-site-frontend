/**
 * Configuration centralisée des routes Settings
 * 
 * SOURCE DE VÉRITÉ unique pour:
 * - La navigation (SettingsNav/SettingsShell)
 * - Le mapping composants
 * - Les permissions (adminOnly)
 * 
 * NOTE: À mettre à jour lors de l'ajout d'une nouvelle page Settings
 * (ordre = ordre d'affichage dans la navigation)
 */

import { lazy } from 'react';

// Lazy loading des composants Settings pour performance
const Settings = lazy(() => import('../pages/Settings'));
const SettingsImpots = lazy(() => import('../pages/settings/SettingsImpots'));
const SettingsPrelevements = lazy(() => import('../pages/settings/SettingsPrelevements'));
const SettingsBaseContrats = lazy(() => import('../pages/settings/BaseContrat'));
const SettingsComptes = lazy(() => import('../pages/settings/SettingsComptes'));
const SettingsDmtgSuccession = lazy(() => import('../pages/settings/SettingsDmtgSuccession'));

/**
 * Routes Settings - Ordre = ordre d'affichage dans la nav
 * @typedef {Object} SettingsRoute
 * @property {string} key - Identifiant unique (camelCase)
 * @property {string} label - Libellé affiché dans la navigation
 * @property {string} path - Chemin URL (sans /settings prefix)
 * @property {React.ComponentType} component - Composant React à render
 * @property {boolean} [adminOnly] - Accessible uniquement aux admins
 * @property {string} [urlPath] - Chemin URL complet pour la navigation
 */
export const SETTINGS_ROUTES = [
  {
    key: 'general',
    label: 'Généraux',
    path: '',
    urlPath: '/settings',
    component: Settings,
  },
  {
    key: 'impots',
    label: 'Impôts',
    path: 'impots',
    urlPath: '/settings/impots',
    component: SettingsImpots,
  },
  {
    key: 'prelevements',
    label: 'Paramètres sociaux',
    path: 'prelevements',
    urlPath: '/settings/prelevements',
    component: SettingsPrelevements,
  },
  {
    key: 'baseContrats',
    label: 'Référentiel contrats',
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

/**
 * Détermine la clé active à partir du pathname
 * @param {string} pathname - window.location.pathname
 * @returns {string} - Clé de la route active
 */
export const getActiveSettingsKey = (pathname: string): string => {
  if (pathname.startsWith('/settings/impots')) return 'impots';
  if (pathname.startsWith('/settings/prelevements')) return 'prelevements';
  if (pathname.startsWith('/settings/fiscalites')) return 'baseContrats'; // legacy redirect
  if (pathname.startsWith('/settings/base-contrat')) return 'baseContrats';
  if (pathname.startsWith('/settings/dmtg-succession')) return 'dmtgSuccession';
  if (pathname.startsWith('/settings/comptes')) return 'comptes';
  return 'general';
};

/**
 * Routes visibles pour l'utilisateur (filtrées par adminOnly)
 * @param {boolean} isAdmin - L'utilisateur est-il admin
 * @returns {SettingsRoute[]}
 */
export const getVisibleSettingsRoutes = (isAdmin: boolean) => {
  return SETTINGS_ROUTES.filter((route) => !route.adminOnly || isAdmin);
};
