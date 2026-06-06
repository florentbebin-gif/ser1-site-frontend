#!/usr/bin/env node
/**
 * check-legal-references.mjs
 *
 * Garde-fou local : valide le référentiel juridique canonique et son raccord
 * aux SimulatorDefinition. Ne navigue jamais sur le web.
 *
 * Usage : node scripts/check-legal-references.mjs [--root <chemin>] [--json]
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';
import officialDomains from '../src/domain/legal-references/officialDomains.json' with { type: 'json' };
import settingKeys from '../src/domain/legal-references/settingKeys.json' with { type: 'json' };

const SOURCE_TYPES = new Set([
  'CGI',
  'Code civil',
  'Code monétaire et financier',
  'Code de la consommation',
  'Code du travail',
  'Code des assurances',
  'Code de la sécurité sociale',
  'BOFiP',
  'BOSS',
  'Service-Public',
  'Doctrine professionnelle',
  'Autre source officielle',
]);

const VOLATILITIES = new Set(['annual', 'lawChange', 'stable']);
const OFFICIAL_DOMAINS = officialDomains;
const KNOWN_SETTING_KEYS = new Set(Object.keys(settingKeys));

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

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasAllowedDomain(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== 'https:') {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();
  return OFFICIAL_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

/**
 * Garde-fou de forme pour les URLs Légifrance (sans résolution web) :
 * - refuse un segment final daté `/AAAA-MM-JJ` qui figerait une version périmable ;
 * - exige la forme canonique `/article_lc/<LEGIARTI…>` (ou `/section_lc/…`),
 *   ce qui écarte les formes fragiles `/codes/id/…` et `/loda/…`.
 */
function legifranceFormError(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname !== 'legifrance.gouv.fr' && !hostname.endsWith('.legifrance.gouv.fr')) {
    return null;
  }

  if (/\/\d{4}-\d{2}-\d{2}\/?$/.test(parsed.pathname)) {
    return 'URL Légifrance datée (version figée) — retirer le segment final /AAAA-MM-JJ';
  }

  if (!/\/(article_lc|section_lc)\/[A-Z0-9]+/i.test(parsed.pathname)) {
    return 'URL Légifrance non canonique — utiliser /codes/article_lc/<LEGIARTI…>';
  }

  return null;
}

function getProperty(objectLiteral, name) {
  return objectLiteral.properties.find((property) => {
    if (!ts.isPropertyAssignment(property)) return false;
    const propertyName = property.name;
    if (ts.isIdentifier(propertyName) || ts.isStringLiteral(propertyName)) {
      return propertyName.text === name;
    }
    return false;
  });
}

function getStringProperty(objectLiteral, name) {
  const property = getProperty(objectLiteral, name);
  if (!property || !ts.isPropertyAssignment(property)) return null;
  const initializer = property.initializer;
  if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
    return initializer.text;
  }
  return null;
}

function getStringArrayProperty(objectLiteral, name) {
  const property = getProperty(objectLiteral, name);
  if (!property || !ts.isPropertyAssignment(property)) return null;
  const initializer = property.initializer;
  if (!ts.isArrayLiteralExpression(initializer)) return null;

  const values = [];
  for (const element of initializer.elements) {
    if (ts.isStringLiteral(element) || ts.isNoSubstitutionTemplateLiteral(element)) {
      values.push(element.text);
      continue;
    }
    return null;
  }
  return values;
}

function listTypeScriptFiles(directory) {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listTypeScriptFiles(absolutePath);
    if (!entry.isFile() || !entry.name.endsWith('.ts')) return [];
    return [absolutePath];
  });
}

function collectSimulatorDefinitions(root) {
  const definitionsDir = path.join(root, 'src', 'domain', 'simulators', 'definitions');
  const files = listTypeScriptFiles(definitionsDir);
  const definitions = [];

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const relativePath = normalize(path.relative(root, file));

    function visit(node) {
      if (ts.isObjectLiteralExpression(node)) {
        const id = getStringProperty(node, 'id');
        const legalRefs = getStringArrayProperty(node, 'legalRefs');
        if (id && legalRefs) {
          definitions.push({
            id,
            legalRefs,
            legalRefsStatus: getStringProperty(node, 'legalRefsStatus'),
            file: relativePath,
          });
        }
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  return definitions;
}

function collectCatalogProductIds(root) {
  const catalogPath = path.join(root, 'src', 'domain', 'base-contrat', 'catalog.ts');
  const ids = new Set();
  if (!fs.existsSync(catalogPath)) return ids;

  const source = fs.readFileSync(catalogPath, 'utf8');
  const sourceFile = ts.createSourceFile(catalogPath, source, ts.ScriptTarget.Latest, true);

  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const id = getStringProperty(node, 'id');
      if (id) ids.add(id);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return ids;
}

function validateUsageArray(reference, field, allowedValues, errors, id) {
  const value = reference[field];
  if (value === undefined) return 0;
  if (!Array.isArray(value)) {
    errors.push(`${id}: ${field} doit être un tableau`);
    return 0;
  }

  let validEntries = 0;
  for (const entry of value) {
    if (!isNonEmptyString(entry)) {
      errors.push(`${id}: ${field} contient une valeur vide`);
      continue;
    }
    validEntries += 1;
    if (allowedValues && !allowedValues.has(entry)) {
      errors.push(`${id}: ${field} inconnu (${entry})`);
    }
  }

  return validEntries;
}

function validateReferences(references, simulatorIds, catalogProductIds) {
  const errors = [];
  const referencesById = new Map();

  if (!Array.isArray(references)) {
    return {
      errors: ['references.json doit contenir un tableau'],
      referencesById,
    };
  }

  for (const [index, reference] of references.entries()) {
    const label = `references.json[${index}]`;
    if (!reference || typeof reference !== 'object' || Array.isArray(reference)) {
      errors.push(`${label}: entrée invalide`);
      continue;
    }

    const id = reference.id;
    if (!isNonEmptyString(id)) {
      errors.push(`${label}: id obligatoire`);
      continue;
    }

    if (referencesById.has(id)) {
      errors.push(`${id}: id dupliqué`);
    }
    referencesById.set(id, reference);

    for (const field of ['label', 'sourceType', 'officialUrl', 'scope', 'volatility']) {
      if (!isNonEmptyString(reference[field])) {
        errors.push(`${id}: champ ${field} obligatoire`);
      }
    }

    if (isNonEmptyString(reference.sourceType) && !SOURCE_TYPES.has(reference.sourceType)) {
      errors.push(`${id}: sourceType inconnu (${reference.sourceType})`);
    }

    if (isNonEmptyString(reference.volatility) && !VOLATILITIES.has(reference.volatility)) {
      errors.push(`${id}: volatility inconnue (${reference.volatility})`);
    }

    if (isNonEmptyString(reference.officialUrl) && !hasAllowedDomain(reference.officialUrl)) {
      errors.push(`${id}: officialUrl non officielle ou non HTTPS (${reference.officialUrl})`);
    } else if (isNonEmptyString(reference.officialUrl)) {
      const formError = legifranceFormError(reference.officialUrl);
      if (formError) {
        errors.push(`${id}: ${formError} (${reference.officialUrl})`);
      }
    }

    const usageCount =
      validateUsageArray(reference, 'relatedSimulatorIds', simulatorIds, errors, id) +
      validateUsageArray(reference, 'relatedSettings', KNOWN_SETTING_KEYS, errors, id) +
      validateUsageArray(reference, 'relatedCatalogProducts', catalogProductIds, errors, id);

    if (usageCount === 0) {
      errors.push(`${id}: aucun usage déclaré`);
    }
  }

  return { errors, referencesById };
}

function validateSimulatorLegalRefs(definitions, referencesById) {
  const errors = [];
  const usageByReferenceId = new Map();

  for (const definition of definitions) {
    if (
      definition.legalRefsStatus === 'a-renseigner-avant-codage' &&
      definition.legalRefs.length > 0
    ) {
      errors.push(
        `${definition.file}:${definition.id}: planned avec références inventées (${definition.legalRefs.join(', ')})`,
      );
    }

    if (definition.legalRefsStatus !== 'complete') continue;

    if (definition.legalRefs.length === 0) {
      errors.push(`${definition.file}:${definition.id}: legalRefs complete vide`);
      continue;
    }

    for (const referenceId of definition.legalRefs) {
      if (!referencesById.has(referenceId)) {
        errors.push(
          `${definition.file}:${definition.id}: référence inconnue ou libellé libre (${referenceId})`,
        );
        continue;
      }

      const usage = usageByReferenceId.get(referenceId) ?? new Set();
      usage.add(definition.id);
      usageByReferenceId.set(referenceId, usage);
    }
  }

  for (const [referenceId, reference] of referencesById.entries()) {
    const actualUsers = usageByReferenceId.get(referenceId) ?? new Set();
    const declaredUsers = new Set(reference.relatedSimulatorIds ?? []);
    for (const simulatorId of actualUsers) {
      if (!declaredUsers.has(simulatorId)) {
        errors.push(
          `${referenceId}: utilisé par ${simulatorId} mais absent de relatedSimulatorIds`,
        );
      }
    }
    for (const simulatorId of declaredUsers) {
      if (!actualUsers.has(simulatorId)) {
        errors.push(`${referenceId}: lié à ${simulatorId} mais absent de legalRefs`);
      }
    }
  }

  return errors;
}

function run() {
  const options = parseArgs(process.argv.slice(2));
  const referencesPath = path.join(
    options.root,
    'src',
    'domain',
    'legal-references',
    'references.json',
  );

  const references = readJsonFile(referencesPath);
  const definitions = collectSimulatorDefinitions(options.root);
  const simulatorIds = new Set(definitions.map((definition) => definition.id));
  const catalogProductIds = collectCatalogProductIds(options.root);
  const { errors: referenceErrors, referencesById } = validateReferences(
    references,
    simulatorIds,
    catalogProductIds,
  );
  const simulatorErrors = validateSimulatorLegalRefs(definitions, referencesById);
  const errors = [...referenceErrors, ...simulatorErrors];
  const ids = Array.from(referencesById.keys()).sort();

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          ok: errors.length === 0,
          referenceCount: ids.length,
          ids,
          errors,
        },
        null,
        2,
      ),
    );
  } else if (errors.length > 0) {
    console.error('check:legal-references ❌');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
  } else {
    console.log(`check:legal-references ✅ ${ids.length} références : ${ids.join(', ')}`);
  }

  if (errors.length > 0) {
    process.exit(1);
  }
}

run();
