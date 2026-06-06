#!/usr/bin/env node
/**
 * check-settings-references.mjs
 *
 * Valide le chaînage statique entre les pages Settings et les références
 * juridiques canoniques. Ne navigue jamais sur le web et ne lit pas Supabase.
 *
 * Usage : node scripts/check-settings-references.mjs [--root <chemin>] [--json]
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const SETTINGS_PAGES = new Set([
  '/settings/impots',
  '/settings/prelevements',
  '/settings/base-contrat',
  '/settings/dmtg-succession',
  '/settings/prevoyance-regimes',
]);

const COVERAGE_EXPECTED_CLAIMS_BY_PAGE = Object.fromEntries(
  Array.from(SETTINGS_PAGES).map((pagePath) => [pagePath, null]),
);

const CATEGORIES = new Set([
  'constitution',
  'sortie-rachat',
  'deces-transmission',
  'arret',
  'invalidite',
  'cotisations',
  'maintien-employeur',
  'valeur-fiscale',
  'regle-civile',
  'transverse',
]);

const VOLATILITIES = new Set(['annual', 'lawChange', 'stable']);
const SETTINGS_DEFAULT_TABLES = new Set(['tax_settings', 'ps_settings', 'fiscality_settings']);
const BASE_CONTRAT_AUDIENCES = new Set(['pp', 'pm']);
const BASE_CONTRAT_PHASES = new Set(['constitution', 'sortie', 'deces']);
const PREVOYANCE_TABLES = new Set([
  'prevoyance_regime_settings',
  'prevoyance_maintien_employeur_settings',
]);

const DEFAULT_EXPORT_BY_TABLE = {
  tax_settings: 'DEFAULT_TAX_SETTINGS',
  ps_settings: 'DEFAULT_PS_SETTINGS',
  fiscality_settings: 'DEFAULT_FISCALITY_SETTINGS',
};

const GENERIC_TEXT_PATTERNS = [
  /source officielle ou contractuelle applicable/i,
  /à compléter/i,
  /a completer/i,
  /todo/i,
  /non renseign/i,
  /^aucune$/i,
  /^n\/a$/i,
];

function parseArgs(argv) {
  const options = {
    root: process.cwd(),
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (arg === '--root') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Option --root sans valeur');
      }
      options.root = path.resolve(value);
      index += 1;
      continue;
    }
    throw new Error(`Option inconnue : ${arg}`);
  }

  return options;
}

function normalize(filePath) {
  return filePath.split(path.sep).join('/');
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isSpecificText(value) {
  if (!isNonEmptyString(value)) return false;
  const normalized = value.trim();
  if (normalized.length < 40) return false;
  return !GENERIC_TEXT_PATTERNS.some((pattern) => pattern.test(normalized));
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isPastOrToday(value) {
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const [year, month, day] = value.split('-').map(Number);
  const checked = Date.UTC(year, month - 1, day);
  return Number.isFinite(checked) && checked <= todayUtc;
}

function getPropertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return null;
}

function getProperty(objectLiteral, propertyName) {
  return objectLiteral.properties.find((property) => {
    if (!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property)) {
      return false;
    }
    return getPropertyName(property.name) === propertyName;
  });
}

function unwrapExpression(expression) {
  let current = expression;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function collectTopLevelConstants(sourceFile) {
  const constants = new Map();

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
      constants.set(declaration.name.text, declaration.initializer);
    }
  }

  return constants;
}

function pathExistsInExpression(expression, segments, constants) {
  const current = unwrapExpression(expression);
  if (segments.length === 0) return true;

  if (ts.isIdentifier(current)) {
    const resolved = constants.get(current.text);
    if (!resolved) return false;
    return pathExistsInExpression(resolved, segments, constants);
  }

  if (ts.isObjectLiteralExpression(current)) {
    const [head, ...tail] = segments;
    const property = getProperty(current, head);
    if (!property) return false;
    if (tail.length === 0) return true;

    if (ts.isPropertyAssignment(property)) {
      return pathExistsInExpression(property.initializer, tail, constants);
    }
    if (ts.isShorthandPropertyAssignment(property)) {
      const resolved = constants.get(property.name.text);
      return resolved ? pathExistsInExpression(resolved, tail, constants) : false;
    }
    return false;
  }

  if (ts.isArrayLiteralExpression(current)) {
    const [head, ...tail] = segments;
    if (!/^\d+$/.test(head)) return false;
    const index = Number(head);
    const element = current.elements[index];
    if (!element) return false;
    return tail.length === 0 || pathExistsInExpression(element, tail, constants);
  }

  return false;
}

function collectObjectLiteralKeys(expression, constants) {
  const current = unwrapExpression(expression);
  if (ts.isIdentifier(current)) {
    const resolved = constants.get(current.text);
    return resolved ? collectObjectLiteralKeys(resolved, constants) : [];
  }
  if (!ts.isObjectLiteralExpression(current)) return [];
  return current.properties.flatMap((property) => {
    if (!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property)) {
      return [];
    }
    const name = getPropertyName(property.name);
    return name ? [name] : [];
  });
}

function loadSettingsDefaults(root) {
  const defaultsPath = path.join(root, 'src', 'constants', 'settingsDefaults.ts');
  const source = fs.readFileSync(defaultsPath, 'utf8');
  const sourceFile = ts.createSourceFile(defaultsPath, source, ts.ScriptTarget.Latest, true);
  return collectTopLevelConstants(sourceFile);
}

function collectCatalogProductIds(root) {
  const catalogPath = path.join(root, 'src', 'domain', 'base-contrat', 'catalog.ts');
  const ids = new Set();
  if (!fs.existsSync(catalogPath)) return ids;

  const source = fs.readFileSync(catalogPath, 'utf8');
  const sourceFile = ts.createSourceFile(catalogPath, source, ts.ScriptTarget.Latest, true);

  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      for (const propertyName of ['id', 'ppId', 'pmId']) {
        const property = getProperty(node, propertyName);
        if (property && ts.isPropertyAssignment(property)) {
          const initializer = property.initializer;
          if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
            ids.add(initializer.text);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return ids;
}

function validateSettingsDefaultTarget(target, defaultsConstants, errors, label) {
  if (!SETTINGS_DEFAULT_TABLES.has(target.table)) {
    errors.push(`${label}: target.table settings-default inconnu (${target.table})`);
    return;
  }
  if (!isNonEmptyString(target.path)) {
    errors.push(`${label}: target.path obligatoire`);
    return;
  }

  const exportName = DEFAULT_EXPORT_BY_TABLE[target.table];
  const rootExpression = defaultsConstants.get(exportName);
  if (!rootExpression) {
    errors.push(`${label}: export ${exportName} introuvable dans settingsDefaults.ts`);
    return;
  }

  const segments = target.path.split('.').filter(Boolean);
  if (segments.length === 0) {
    errors.push(`${label}: target.path vide`);
    return;
  }
  if (!pathExistsInExpression(rootExpression, segments, defaultsConstants)) {
    errors.push(`${label}: chemin settings-default introuvable (${target.table}.${target.path})`);
  }
}

function validatePassTarget(target, defaultsConstants, errors, label) {
  const passExpression = defaultsConstants.get('DEFAULT_PASS_HISTORY');
  if (!passExpression) {
    errors.push(`${label}: export DEFAULT_PASS_HISTORY introuvable dans settingsDefaults.ts`);
    return;
  }

  const years = collectObjectLiteralKeys(passExpression, defaultsConstants);
  if (years.length === 0) {
    errors.push(`${label}: DEFAULT_PASS_HISTORY ne contient aucun millésime`);
    return;
  }

  if (target.year === 'latest') return;
  if (!Number.isInteger(target.year) || target.year < 2000) {
    errors.push(`${label}: target.year PASS invalide (${String(target.year)})`);
    return;
  }
  if (!years.includes(String(target.year))) {
    errors.push(`${label}: millésime PASS absent du fallback (${target.year})`);
  }
}

function validateBaseContratTarget(target, catalogProductIds, errors, label) {
  if (!catalogProductIds.has(target.productId)) {
    errors.push(`${label}: productId Base-Contrat inconnu (${target.productId})`);
  }
  if (!BASE_CONTRAT_AUDIENCES.has(target.audience)) {
    errors.push(`${label}: audience Base-Contrat inconnue (${target.audience})`);
  }
  if (!BASE_CONTRAT_PHASES.has(target.phase)) {
    errors.push(`${label}: phase Base-Contrat inconnue (${target.phase})`);
  }
  if (!isNonEmptyString(target.blockKey)) {
    errors.push(`${label}: blockKey Base-Contrat obligatoire`);
  }
}

function validatePrevoyanceTarget(target, errors, label) {
  if (!PREVOYANCE_TABLES.has(target.table)) {
    errors.push(`${label}: table prévoyance inconnue (${target.table})`);
  }
  if (!isNonEmptyString(target.code)) {
    errors.push(`${label}: code prévoyance obligatoire`);
  }
  if (!isNonEmptyString(target.jsonPath)) {
    errors.push(`${label}: jsonPath prévoyance obligatoire`);
  }
}

function validateTarget(target, context, errors, label) {
  if (!isPlainObject(target) || !isNonEmptyString(target.kind)) {
    errors.push(`${label}: target.kind obligatoire`);
    return;
  }

  if (target.kind === 'settings-default') {
    validateSettingsDefaultTarget(target, context.defaultsConstants, errors, label);
    return;
  }
  if (target.kind === 'pass-history') {
    validatePassTarget(target, context.defaultsConstants, errors, label);
    return;
  }
  if (target.kind === 'base-contrat-rule') {
    validateBaseContratTarget(target, context.catalogProductIds, errors, label);
    return;
  }
  if (target.kind === 'prevoyance-db') {
    validatePrevoyanceTarget(target, errors, label);
    return;
  }

  errors.push(`${label}: target.kind inconnu (${target.kind})`);
}

function validateBinding(binding, index, context) {
  const errors = [];
  const label = `chain.json[${index}]`;

  if (!isPlainObject(binding)) {
    return [`${label}: entrée invalide`];
  }

  for (const field of [
    'pagePath',
    'sectionKey',
    'sectionLabel',
    'category',
    'claimKey',
    'claimLabel',
    'verifiedAt',
    'volatility',
  ]) {
    if (!isNonEmptyString(binding[field])) {
      errors.push(`${label}: champ ${field} obligatoire`);
    }
  }

  if (isNonEmptyString(binding.pagePath) && !SETTINGS_PAGES.has(binding.pagePath)) {
    errors.push(`${label}: pagePath non couvert (${binding.pagePath})`);
  }
  if (isNonEmptyString(binding.category) && !CATEGORIES.has(binding.category)) {
    errors.push(`${label}: category inconnue (${binding.category})`);
  }
  if (isNonEmptyString(binding.volatility) && !VOLATILITIES.has(binding.volatility)) {
    errors.push(`${label}: volatility inconnue (${binding.volatility})`);
  }
  if (isNonEmptyString(binding.verifiedAt)) {
    if (!isIsoDate(binding.verifiedAt)) {
      errors.push(`${label}: verifiedAt doit être au format YYYY-MM-DD`);
    } else if (!isPastOrToday(binding.verifiedAt)) {
      errors.push(`${label}: verifiedAt est dans le futur (${binding.verifiedAt})`);
    }
  }

  if (!Array.isArray(binding.refIds)) {
    errors.push(`${label}: refIds doit être un tableau`);
  } else {
    for (const refId of binding.refIds) {
      if (!isNonEmptyString(refId)) {
        errors.push(`${label}: refIds contient une valeur vide`);
        continue;
      }
      if (!context.referencesById.has(refId)) {
        errors.push(`${label}: référence inconnue (${refId})`);
      }
    }

    if (binding.refIds.length > 0) {
      if (!isSpecificText(binding.relevanceNote)) {
        errors.push(`${label}: relevanceNote spécifique obligatoire avec refIds`);
      }
      if (binding.noRefReason !== undefined) {
        errors.push(`${label}: noRefReason interdit quand refIds est non vide`);
      }
    } else if (!isSpecificText(binding.noRefReason)) {
      errors.push(`${label}: noRefReason spécifique obligatoire quand refIds est vide`);
    }
  }

  validateTarget(binding.target, context, errors, label);
  return errors;
}

function validateChain(chain, context) {
  const errors = [];
  const bindingKeys = new Set();

  if (!Array.isArray(chain)) {
    return ['chain.json doit contenir un tableau'];
  }

  for (const [index, binding] of chain.entries()) {
    errors.push(...validateBinding(binding, index, context));
    if (!isPlainObject(binding)) continue;

    const key = [
      binding.pagePath,
      binding.sectionKey,
      binding.category,
      binding.claimKey,
      binding.target?.kind,
    ].join('|');
    if (bindingKeys.has(key)) {
      errors.push(`chain.json[${index}]: binding dupliqué (${key})`);
    }
    bindingKeys.add(key);
  }

  return errors;
}

function countBindingsByPage(chain) {
  const counts = new Map();
  if (!Array.isArray(chain)) return {};

  for (const binding of chain) {
    if (!isPlainObject(binding) || !isNonEmptyString(binding.pagePath)) continue;
    counts.set(binding.pagePath, (counts.get(binding.pagePath) ?? 0) + 1);
  }

  return Object.fromEntries(
    Array.from(counts.entries()).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function buildCoverage(chain) {
  const bindingsByPage = countBindingsByPage(chain);
  const byPage = Object.fromEntries(
    Array.from(SETTINGS_PAGES).map((pagePath) => {
      const expected = COVERAGE_EXPECTED_CLAIMS_BY_PAGE[pagePath];
      const expectedDefined = Number.isInteger(expected) && expected >= 0;
      const declared = bindingsByPage[pagePath] ?? 0;
      return [
        pagePath,
        {
          expected,
          declared,
          expectedDefined,
          complete: expectedDefined && declared >= expected,
        },
      ];
    }),
  );
  const pageCoverage = Object.values(byPage);
  const expectedClaimsDefined = pageCoverage.every((entry) => entry.expectedDefined);
  const isExhaustive =
    expectedClaimsDefined && pageCoverage.every((entry) => entry.complete && entry.expected > 0);

  return {
    mode: 'partial',
    isExhaustive,
    expectedClaimsDefined,
    bindingsByPage,
    byPage,
    note: 'Registre partiel non exhaustif : le check valide les bindings déclarés sans garantir encore la couverture complète des 5 surfaces Settings. Une surface ne peut être complète que si son nombre de claims attendus est défini explicitement.',
  };
}

function run() {
  const options = parseArgs(process.argv.slice(2));
  const root = options.root;
  const chainPath = path.join(root, 'src', 'domain', 'settings-references', 'chain.json');
  const referencesPath = path.join(root, 'src', 'domain', 'legal-references', 'references.json');

  const chain = readJsonFile(chainPath);
  const references = readJsonFile(referencesPath);
  const referencesById = new Map(
    Array.isArray(references)
      ? references
          .filter((reference) => isPlainObject(reference) && isNonEmptyString(reference.id))
          .map((reference) => [reference.id, reference])
      : [],
  );
  const context = {
    referencesById,
    defaultsConstants: loadSettingsDefaults(root),
    catalogProductIds: collectCatalogProductIds(root),
  };
  const errors = validateChain(chain, context);
  const pages = Array.isArray(chain)
    ? Array.from(new Set(chain.map((binding) => binding.pagePath).filter(isNonEmptyString))).sort()
    : [];
  const missingPages = Array.from(SETTINGS_PAGES).filter((pagePath) => !pages.includes(pagePath));
  const coverage = buildCoverage(chain);

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          ok: errors.length === 0,
          bindingCount: Array.isArray(chain) ? chain.length : 0,
          pages,
          missingPages,
          coverage,
          chainPath: normalize(path.relative(root, chainPath)),
          errors,
        },
        null,
        2,
      ),
    );
  } else if (errors.length > 0) {
    console.error('check:settings-references ❌');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
  } else {
    const representedPages = pages
      .map((pagePath) => `${pagePath} (${coverage.bindingsByPage[pagePath]} bindings)`)
      .join(', ');
    const completeness = Object.entries(coverage.byPage)
      .map(([pagePath, pageCoverage]) => {
        const expected = pageCoverage.expectedDefined
          ? pageCoverage.expected
          : 'attendu non défini';
        return `${pagePath} (${pageCoverage.declared}/${expected})`;
      })
      .join(', ');
    console.log(
      `check:settings-references ✅ ${chain.length} bindings, registre partiel non exhaustif`,
    );
    console.log(`Pages représentées : ${representedPages || 'aucune'}`);
    console.log(`Complétude déclarée : ${completeness}`);
    if (missingPages.length > 0) {
      console.log(`Pages sans binding dans ce registre partiel : ${missingPages.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    process.exit(1);
  }
}

run();
