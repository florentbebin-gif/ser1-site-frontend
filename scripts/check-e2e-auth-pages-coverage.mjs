#!/usr/bin/env node
// Usage: npm run check:e2e-auth-pages-coverage

import process from 'node:process';
import {
  collectActiveSimRouteContracts,
  collectAuthenticatedSmokeRoutes,
  collectPrivateAppRoutes,
  collectSettingsRoutes,
  collectSimRouteContracts,
} from './lib/route-sources.mjs';

const privateRoutes = collectPrivateAppRoutes();
const settingsRoutes = collectSettingsRoutes();
const requiredRoutes = new Set([...privateRoutes, ...settingsRoutes]);
const smokeRoutes = new Set(collectAuthenticatedSmokeRoutes());
const simRouteContracts = collectSimRouteContracts();
const activeSimRoutes = collectActiveSimRouteContracts();

const missing = [...requiredRoutes].filter((route) => !smokeRoutes.has(route)).sort();
const stale = [...smokeRoutes].filter((route) => !requiredRoutes.has(route)).sort();

const appSimRoutes = privateRoutes.filter((route) => route.startsWith('/sim/')).sort();
const registrySimRoutes = simRouteContracts.map((route) => route.path).sort();
const missingFromRegistry = appSimRoutes.filter((route) => !registrySimRoutes.includes(route));
const missingFromAppRoutes = registrySimRoutes.filter((route) => !appSimRoutes.includes(route));

const activeWithoutShellProbe = activeSimRoutes
  .filter((route) => !route.pageTestId)
  .map((route) => route.path);
const activeMissingFromSmoke = activeSimRoutes
  .map((route) => route.path)
  .filter((route) => !smokeRoutes.has(route));

if (
  missing.length > 0 ||
  stale.length > 0 ||
  missingFromRegistry.length > 0 ||
  missingFromAppRoutes.length > 0 ||
  activeWithoutShellProbe.length > 0 ||
  activeMissingFromSmoke.length > 0
) {
  console.error('check:e2e-auth-pages-coverage ❌');

  if (missing.length > 0) {
    console.error('Routes privées absentes du smoke auth :');
    for (const route of missing) console.error(`- ${route}`);
  }

  if (stale.length > 0) {
    console.error('Routes auth smoke absentes des sources de vérité :');
    for (const route of stale) console.error(`- ${route}`);
  }

  if (missingFromRegistry.length > 0) {
    console.error('Routes /sim/* APP_ROUTES absentes du registre simulateur :');
    for (const route of missingFromRegistry) console.error(`- ${route}`);
  }

  if (missingFromAppRoutes.length > 0) {
    console.error('Routes /sim/* du registre absentes de APP_ROUTES :');
    for (const route of missingFromAppRoutes) console.error(`- ${route}`);
  }

  if (activeWithoutShellProbe.length > 0) {
    console.error('Simulateurs actifs sans pageTestId pour vérifier SimPageShell :');
    for (const route of activeWithoutShellProbe) console.error(`- ${route}`);
  }

  if (activeMissingFromSmoke.length > 0) {
    console.error('Simulateurs actifs absents du smoke navigateur :');
    for (const route of activeMissingFromSmoke) console.error(`- ${route}`);
  }

  process.exit(1);
}

console.log('check:e2e-auth-pages-coverage ✅');
