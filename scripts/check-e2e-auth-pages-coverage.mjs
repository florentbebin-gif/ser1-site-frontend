#!/usr/bin/env node
// Usage: npm run check:e2e-auth-pages-coverage

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const ROOT = process.cwd();
const APP_ROUTES_FILE = path.join(ROOT, 'src', 'routes', 'appRoutes.ts');
const SETTINGS_ROUTES_FILE = path.join(ROOT, 'src', 'routes', 'settingsRoutes.ts');
const AUTH_SMOKE_FILE = path.join(ROOT, 'scripts', 'e2e-auth-pages-smoke.mjs');

function readSource(file) {
  return fs.readFileSync(file, 'utf8');
}

function parse(file, scriptKind = ts.ScriptKind.TS) {
  return ts.createSourceFile(file, readSource(file), ts.ScriptTarget.Latest, true, scriptKind);
}

function getPropertyString(objectLiteral, propertyName) {
  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const name = property.name;
    if (!ts.isIdentifier(name) || name.text !== propertyName) continue;
    const initializer = property.initializer;
    if (ts.isStringLiteral(initializer)) return initializer.text;
  }
  return null;
}

function findConstArray(sourceFile, name) {
  let found = null;

  function visit(node) {
    if (found) return;
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) {
      if (node.initializer && ts.isArrayLiteralExpression(node.initializer)) {
        found = node.initializer;
      }
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  if (!found) throw new Error(`Tableau ${name} introuvable dans ${sourceFile.fileName}`);
  return found;
}

function collectPrivateAppRoutes() {
  const sourceFile = parse(APP_ROUTES_FILE);
  const appRoutes = findConstArray(sourceFile, 'APP_ROUTES');

  return appRoutes.elements
    .filter(ts.isObjectLiteralExpression)
    .filter((entry) => getPropertyString(entry, 'access') === 'private')
    .map((entry) => getPropertyString(entry, 'path'))
    .filter((route) => route && !route.endsWith('/*'));
}

function collectSettingsRoutes() {
  const sourceFile = parse(SETTINGS_ROUTES_FILE);
  const settingsRoutes = findConstArray(sourceFile, 'SETTINGS_ROUTES');

  return settingsRoutes.elements
    .filter(ts.isObjectLiteralExpression)
    .map((entry) => getPropertyString(entry, 'urlPath'))
    .filter(Boolean);
}

function collectSmokeAuthRoutes() {
  const sourceFile = parse(AUTH_SMOKE_FILE, ts.ScriptKind.JS);
  const authRoutes = findConstArray(sourceFile, 'AUTH_ROUTES');

  return authRoutes.elements.filter(ts.isStringLiteral).map((route) => route.text);
}

const requiredRoutes = new Set([...collectPrivateAppRoutes(), ...collectSettingsRoutes()]);
const smokeRoutes = new Set(collectSmokeAuthRoutes());

const missing = [...requiredRoutes].filter((route) => !smokeRoutes.has(route)).sort();
const stale = [...smokeRoutes].filter((route) => !requiredRoutes.has(route)).sort();

if (missing.length > 0 || stale.length > 0) {
  console.error('check:e2e-auth-pages-coverage ❌');

  if (missing.length > 0) {
    console.error('Routes privées absentes de scripts/e2e-auth-pages-smoke.mjs :');
    for (const route of missing) console.error(`- ${route}`);
  }

  if (stale.length > 0) {
    console.error('Routes auth smoke absentes des sources de vérité :');
    for (const route of stale) console.error(`- ${route}`);
  }

  process.exit(1);
}

console.log('check:e2e-auth-pages-coverage ✅');
