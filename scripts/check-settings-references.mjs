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

import {
  collectBaseContratRuleBlocks,
  collectCatalogProductIds,
  loadSettingsDefaults,
} from './settings-references/checkLoaders.mjs';
import {
  SETTINGS_PAGES,
  buildCoverage,
  isNonEmptyString,
  isPlainObject,
  validateChain,
} from './settings-references/checkValidation.mjs';

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

function buildReferencesById(references) {
  return new Map(
    Array.isArray(references)
      ? references
          .filter((reference) => isPlainObject(reference) && isNonEmptyString(reference.id))
          .map((reference) => [reference.id, reference])
      : [],
  );
}

function printJsonResult(result) {
  console.log(JSON.stringify(result, null, 2));
}

function printHumanResult(result) {
  if (result.errors.length > 0) {
    console.error('check:settings-references ❌');
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    return;
  }

  const representedPages = result.pages
    .map((pagePath) => `${pagePath} (${result.coverage.bindingsByPage[pagePath]} bindings)`)
    .join(', ');
  const completeness = Object.entries(result.coverage.byPage)
    .map(([pagePath, pageCoverage]) => {
      const expected = pageCoverage.expectedDefined ? pageCoverage.expected : 'attendu non défini';
      return `${pagePath} (${pageCoverage.declared}/${expected})`;
    })
    .join(', ');

  console.log(
    `check:settings-references ✅ ${result.bindingCount} bindings, registre partiel non exhaustif`,
  );
  console.log(`Pages représentées : ${representedPages || 'aucune'}`);
  console.log(`Complétude déclarée : ${completeness}`);
  if (result.missingPages.length > 0) {
    console.log(`Pages sans binding dans ce registre partiel : ${result.missingPages.join(', ')}`);
  }
}

function buildResult(root) {
  const chainPath = path.join(root, 'src', 'domain', 'settings-references', 'chain.json');
  const referencesPath = path.join(root, 'src', 'domain', 'legal-references', 'references.json');
  const chain = readJsonFile(chainPath);
  const references = readJsonFile(referencesPath);
  const context = {
    referencesById: buildReferencesById(references),
    defaultsConstants: loadSettingsDefaults(root),
    catalogProductIds: collectCatalogProductIds(root),
    baseContratRuleBlocks: collectBaseContratRuleBlocks(root),
  };
  const errors = validateChain(chain, context);
  const pages = Array.isArray(chain)
    ? Array.from(new Set(chain.map((binding) => binding.pagePath).filter(isNonEmptyString))).sort()
    : [];
  const missingPages = Array.from(SETTINGS_PAGES).filter((pagePath) => !pages.includes(pagePath));

  return {
    ok: errors.length === 0,
    bindingCount: Array.isArray(chain) ? chain.length : 0,
    pages,
    missingPages,
    coverage: buildCoverage(chain),
    chainPath: normalize(path.relative(root, chainPath)),
    errors,
  };
}

function run() {
  const options = parseArgs(process.argv.slice(2));
  const root = options.root;
  const result = buildResult(root);

  if (options.json) {
    printJsonResult(result);
  } else {
    printHumanResult(result);
  }

  if (!result.ok) {
    process.exit(1);
  }
}

run();
