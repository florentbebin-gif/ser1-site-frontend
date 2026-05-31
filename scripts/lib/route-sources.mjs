import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const ROOT = process.cwd();
const APP_ROUTES_FILE = path.join(ROOT, 'src', 'routes', 'appRoutes.ts');
const SETTINGS_ROUTES_FILE = path.join(ROOT, 'src', 'routes', 'settingsRoutes.ts');
const SIM_ROUTE_CONTRACTS_FILE = path.join(ROOT, 'src', 'routes', 'simRouteContracts.ts');

function readSource(file) {
  return fs.readFileSync(file, 'utf8');
}

function parse(file) {
  return ts.createSourceFile(
    file,
    readSource(file),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

function findConstArray(sourceFile, name) {
  let found = null;

  function visit(node) {
    if (found) return;
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) {
      let initializer = node.initializer;
      if (initializer && ts.isAsExpression(initializer)) initializer = initializer.expression;
      if (initializer && ts.isSatisfiesExpression(initializer))
        initializer = initializer.expression;
      if (initializer && ts.isAsExpression(initializer)) initializer = initializer.expression;
      if (initializer && ts.isArrayLiteralExpression(initializer)) {
        found = initializer;
      }
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  if (!found) throw new Error(`Tableau ${name} introuvable dans ${sourceFile.fileName}`);
  return found;
}

function getPropertyInitializer(objectLiteral, propertyName) {
  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const name = property.name;
    if (!ts.isIdentifier(name) || name.text !== propertyName) continue;
    return property.initializer;
  }
  return null;
}

function getPropertyString(objectLiteral, propertyName) {
  const initializer = getPropertyInitializer(objectLiteral, propertyName);
  if (initializer && ts.isStringLiteral(initializer)) return initializer.text;
  return null;
}

function collectSimRouteAliases(sourceFile) {
  const aliases = new Map();

  function visit(node) {
    if (
      !ts.isVariableDeclaration(node) ||
      !ts.isIdentifier(node.name) ||
      node.name.text !== 'SIM_ROUTES' ||
      !node.initializer ||
      !ts.isObjectLiteralExpression(node.initializer)
    ) {
      ts.forEachChild(node, visit);
      return;
    }

    for (const property of node.initializer.properties) {
      if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) continue;
      const initializer = property.initializer;
      if (
        ts.isCallExpression(initializer) &&
        ts.isIdentifier(initializer.expression) &&
        initializer.expression.text === 'getSimRouteContract' &&
        initializer.arguments.length === 1 &&
        ts.isStringLiteral(initializer.arguments[0])
      ) {
        aliases.set(property.name.text, initializer.arguments[0].text);
      }
    }
  }

  ts.forEachChild(sourceFile, visit);
  return aliases;
}

function resolvePathInitializer(initializer, simRouteAliases, simRoutePathById) {
  if (!initializer) return null;
  if (ts.isStringLiteral(initializer)) return initializer.text;

  if (
    ts.isPropertyAccessExpression(initializer) &&
    initializer.name.text === 'path' &&
    ts.isPropertyAccessExpression(initializer.expression) &&
    ts.isIdentifier(initializer.expression.expression) &&
    initializer.expression.expression.text === 'SIM_ROUTES'
  ) {
    const alias = initializer.expression.name.text;
    const simRouteId = simRouteAliases.get(alias);
    return simRouteId ? (simRoutePathById.get(simRouteId) ?? null) : null;
  }

  return null;
}

function uniqueOrdered(routes) {
  return [...new Set(routes)];
}

export function collectPrivateAppRoutes() {
  const sourceFile = parse(APP_ROUTES_FILE);
  const appRoutes = findConstArray(sourceFile, 'APP_ROUTES');
  const simRouteAliases = collectSimRouteAliases(sourceFile);
  const simRoutePathById = new Map(
    collectSimRouteContracts().map((route) => [route.id, route.path]),
  );

  return appRoutes.elements
    .filter(ts.isObjectLiteralExpression)
    .filter((entry) => getPropertyString(entry, 'access') === 'private')
    .map((entry) =>
      resolvePathInitializer(
        getPropertyInitializer(entry, 'path'),
        simRouteAliases,
        simRoutePathById,
      ),
    )
    .filter((route) => route && !route.endsWith('/*'));
}

export function collectSettingsRoutes() {
  const sourceFile = parse(SETTINGS_ROUTES_FILE);
  const settingsRoutes = findConstArray(sourceFile, 'SETTINGS_ROUTES');

  return settingsRoutes.elements
    .filter(ts.isObjectLiteralExpression)
    .map((entry) => getPropertyString(entry, 'urlPath'))
    .filter(Boolean);
}

export function collectSimRouteContracts() {
  const sourceFile = parse(SIM_ROUTE_CONTRACTS_FILE);
  const simRoutes = findConstArray(sourceFile, 'SIM_ROUTE_CONTRACTS');

  return simRoutes.elements.filter(ts.isObjectLiteralExpression).map((entry) => ({
    id: getPropertyString(entry, 'id'),
    path: getPropertyString(entry, 'path'),
    label: getPropertyString(entry, 'label'),
    status: getPropertyString(entry, 'status'),
    resetKey: getPropertyString(entry, 'resetKey'),
    pageTestId: getPropertyString(entry, 'pageTestId'),
  }));
}

export function collectActiveSimRouteContracts() {
  return collectSimRouteContracts().filter((route) => route.status === 'active');
}

export function collectAuthenticatedSmokeRoutes() {
  return uniqueOrdered([...collectPrivateAppRoutes(), ...collectSettingsRoutes()]);
}
