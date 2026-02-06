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
const SettingsImpots = lazy(() => import('../pages/Sous-Settings/SettingsImpots'));
const SettingsPrelevements = lazy(() => import('../pages/Sous-Settings/SettingsPrelevements'));
const SettingsFiscalites = lazy(() => import('../pages/Sous-Settings/SettingsFiscalites'));
const SettingsBaseContrats = lazy(() => import('../pages/Sous-Settings/SettingsBaseContrats'));
const SettingsTableMortalite = lazy(() => import('../pages/Sous-Settings/SettingsTableMortalite'));
const SettingsComptes = lazy(() => import('../pages/Sous-Settings/SettingsComptes'));

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
    key: 'fiscalites',
    label: 'Fiscalités contrats',
    path: 'fiscalites',
    urlPath: '/settings/fiscalites',
    component: SettingsFiscalites,
  },
  {
    key: 'baseContrats',
    label: 'Base contrats',
    path: 'base-contrat',
    urlPath: '/settings/base-contrat',
    component: SettingsBaseContrats,
  },
  {
    key: 'tableMortalite',
    label: 'Table de mortalité',
    path: 'table-mortalite',
    urlPath: '/settings/table-mortalite',
    component: SettingsTableMortalite,
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
 * Récupère une route par sa clé
 * @param {string} key - Clé de la route
 * @returns {SettingsRoute|undefined}
 */
export const getSettingsRouteByKey = (key) => {
  return SETTINGS_ROUTES.find((route) => route.key === key);
};

/**
 * Récupère une route par son chemin URL
 * @param {string} path - Chemin URL (ex: '/settings/impots' ou 'impots')
 * @returns {SettingsRoute|undefined}
 */
export const getSettingsRouteByPath = (path) => {
  const normalizedPath = path.replace(/^\/settings\/?/, '');
  return SETTINGS_ROUTES.find((route) => route.path === normalizedPath);
};

/**
 * Détermine la clé active à partir du pathname
 * @param {string} pathname - window.location.pathname
 * @returns {string} - Clé de la route active
 */
export const getActiveSettingsKey = (pathname) => {
  if (pathname.startsWith('/settings/impots')) return 'impots';
  if (pathname.startsWith('/settings/prelevements')) return 'prelevements';
  if (pathname.startsWith('/settings/fiscalites')) return 'fiscalites';
  if (pathname.startsWith('/settings/base-contrat')) return 'baseContrats';
  if (pathname.startsWith('/settings/table-mortalite')) return 'tableMortalite';
  if (pathname.startsWith('/settings/comptes')) return 'comptes';
  return 'general';
};

/**
 * Routes visibles pour l'utilisateur (filtrées par adminOnly)
 * @param {boolean} isAdmin - L'utilisateur est-il admin
 * @returns {SettingsRoute[]}
 */
export const getVisibleSettingsRoutes = (isAdmin) => {
  return SETTINGS_ROUTES.filter((route) => !route.adminOnly || isAdmin);
};
