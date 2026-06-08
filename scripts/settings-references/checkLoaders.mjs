import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import ts from 'typescript';

import { BASE_CONTRAT_AUDIENCES, BASE_CONTRAT_PHASES } from './checkConstants.mjs';

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

export function pathExistsInExpression(expression, segments, constants) {
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

export function collectObjectLiteralKeys(expression, constants) {
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

export function loadSettingsDefaults(root) {
  const constants = new Map();

  for (const constantsFileName of ['socialDirigeantDefaults.ts', 'settingsDefaults.ts']) {
    const constantsPath = path.join(root, 'src', 'constants', constantsFileName);
    if (!fs.existsSync(constantsPath)) continue;
    const source = fs.readFileSync(constantsPath, 'utf8');
    const sourceFile = ts.createSourceFile(constantsPath, source, ts.ScriptTarget.Latest, true);
    for (const [name, initializer] of collectTopLevelConstants(sourceFile)) {
      constants.set(name, initializer);
    }
  }

  return constants;
}

export function collectCatalogProductIds(root) {
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

function listTypeScriptFiles(directory) {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listTypeScriptFiles(entryPath);
    return entry.isFile() && entry.name.endsWith('.ts') ? [entryPath] : [];
  });
}

function getStringLiteralValue(expression) {
  const current = unwrapExpression(expression);
  if (ts.isStringLiteral(current) || ts.isNoSubstitutionTemplateLiteral(current)) {
    return current.text;
  }
  return null;
}

function slugifyBlockKey(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function emptyRuleBlockIndex() {
  return {
    constitution: new Set(),
    sortie: new Set(),
    deces: new Set(),
  };
}

function mergeRuleBlockIndex(target, source) {
  for (const phase of BASE_CONTRAT_PHASES) {
    for (const blockKey of source[phase] ?? []) {
      target[phase].add(blockKey);
    }
  }
}

function collectBlocksFromRulesObject(expression) {
  const current = unwrapExpression(expression);
  if (!ts.isObjectLiteralExpression(current)) return null;

  const blocks = emptyRuleBlockIndex();
  let hasPhase = false;

  for (const phase of BASE_CONTRAT_PHASES) {
    const phaseProperty = getProperty(current, phase);
    if (!phaseProperty || !ts.isPropertyAssignment(phaseProperty)) continue;
    const initializer = unwrapExpression(phaseProperty.initializer);
    if (!ts.isArrayLiteralExpression(initializer)) continue;

    hasPhase = true;
    for (const element of initializer.elements) {
      const block = unwrapExpression(element);
      if (!ts.isObjectLiteralExpression(block)) continue;
      const titleProperty = getProperty(block, 'title');
      if (!titleProperty || !ts.isPropertyAssignment(titleProperty)) continue;
      const title = getStringLiteralValue(titleProperty.initializer);
      if (title) blocks[phase].add(slugifyBlockKey(title));
    }
  }

  return hasPhase ? blocks : null;
}

function collectRuleBlocksByName(root) {
  const libraryPath = path.join(root, 'src', 'domain', 'base-contrat', 'rules', 'library');
  const ruleBlocksByName = new Map();

  for (const filePath of listTypeScriptFiles(libraryPath)) {
    const source = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);

    for (const statement of sourceFile.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
        const blocks = collectBlocksFromRulesObject(declaration.initializer);
        if (blocks) ruleBlocksByName.set(declaration.name.text, blocks);
      }
    }
  }

  return ruleBlocksByName;
}

function buildPmLifecycleRuleBlocks(subject) {
  return {
    constitution: new Set([slugifyBlockKey(`Détention et comptabilisation (${subject})`)]),
    sortie: new Set([slugifyBlockKey('Cession / encaissement')]),
    deces: new Set([slugifyBlockKey('Fin de vie / sortie de la PM')]),
  };
}

function isUndefinedReturn(expression) {
  if (!expression) return true;
  const current = unwrapExpression(expression);
  return ts.isIdentifier(current) && current.text === 'undefined';
}

function collectBlocksFromReturnExpression(expression, ruleBlocksByName) {
  if (isUndefinedReturn(expression)) return null;
  const current = unwrapExpression(expression);

  if (ts.isIdentifier(current)) {
    return ruleBlocksByName.get(current.text) ?? null;
  }

  if (ts.isCallExpression(current) && ts.isIdentifier(current.expression)) {
    if (current.expression.text !== 'buildPmLifecycleRules') return null;
    const subject = current.arguments[0] ? getStringLiteralValue(current.arguments[0]) : null;
    return subject ? buildPmLifecycleRuleBlocks(subject) : null;
  }

  return collectBlocksFromRulesObject(current);
}

function getAudienceConditionValue(expression) {
  const current = unwrapExpression(expression);
  if (!ts.isBinaryExpression(current)) return null;
  if (
    current.operatorToken.kind !== ts.SyntaxKind.EqualsEqualsEqualsToken &&
    current.operatorToken.kind !== ts.SyntaxKind.EqualsEqualsToken
  ) {
    return null;
  }

  const left = unwrapExpression(current.left);
  const right = unwrapExpression(current.right);
  if (ts.isIdentifier(left) && left.text === 'audience') return getStringLiteralValue(right);
  if (ts.isIdentifier(right) && right.text === 'audience') return getStringLiteralValue(left);
  return null;
}

function collectAudienceBlocksFromReturn(expression, ruleBlocksByName) {
  const current = unwrapExpression(expression);
  if (ts.isConditionalExpression(current)) {
    const matchingAudience = getAudienceConditionValue(current.condition);
    if (matchingAudience && BASE_CONTRAT_AUDIENCES.has(matchingAudience)) {
      const result = new Map();
      const trueBlocks = collectBlocksFromReturnExpression(current.whenTrue, ruleBlocksByName);
      const falseBlocks = collectBlocksFromReturnExpression(current.whenFalse, ruleBlocksByName);
      const otherAudience = matchingAudience === 'pp' ? 'pm' : 'pp';
      if (trueBlocks) result.set(matchingAudience, trueBlocks);
      if (falseBlocks) result.set(otherAudience, falseBlocks);
      return result;
    }
  }

  const blocks = collectBlocksFromReturnExpression(current, ruleBlocksByName);
  if (!blocks) return new Map();
  return new Map([
    ['pp', blocks],
    ['pm', blocks],
  ]);
}

function addProductRuleBlocks(productRuleBlocks, productId, audience, blocks) {
  const key = `${productId}|${audience}`;
  const target = productRuleBlocks.get(key) ?? emptyRuleBlockIndex();
  mergeRuleBlockIndex(target, blocks);
  productRuleBlocks.set(key, target);
}

function cleanupRuntime(runtimeDir, root) {
  const resolvedRuntime = path.resolve(runtimeDir);
  const resolvedTmp = path.resolve(root, '.tmp');
  if (resolvedRuntime.startsWith(resolvedTmp + path.sep)) {
    fs.rmSync(resolvedRuntime, { recursive: true, force: true });
  }
}

function compileBaseContratRuntime(root) {
  const domainDir = path.join(root, 'src', 'domain', 'base-contrat');
  const runtimeDir = path.join(root, '.tmp', 'settings-references-base-contrat-runtime');
  const constantsDir = path.join(runtimeDir, 'constants');
  const resolvedRuntime = path.resolve(runtimeDir);
  const resolvedTmp = path.resolve(root, '.tmp');
  if (!resolvedRuntime.startsWith(resolvedTmp + path.sep)) {
    throw new Error(`Chemin runtime inattendu: ${resolvedRuntime}`);
  }

  fs.rmSync(runtimeDir, { recursive: true, force: true });
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.mkdirSync(constantsDir, { recursive: true });
  fs.writeFileSync(
    path.join(runtimeDir, 'package.json'),
    JSON.stringify({ type: 'commonjs' }, null, 2),
  );

  for (const filePath of listTypeScriptFiles(domainDir)) {
    if (filePath.includes(`${path.sep}__tests__${path.sep}`)) continue;
    const relativePath = path.relative(domainDir, filePath);
    const outFile = path.join(runtimeDir, relativePath).replace(/\.ts$/, '.js');
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    const compiled = ts.transpileModule(fs.readFileSync(filePath, 'utf8'), {
      fileName: filePath,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
        importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
      },
    });
    const outputText = compiled.outputText
      .replace(
        /require\(["']\.\.\/\.\.\/\.\.\/constants\/settingsDefaults["']\)/g,
        "require('../constants/settingsDefaults')",
      )
      .replace(
        /require\(["']@\/constants\/settingsDefaults["']\)/g,
        "require('../constants/settingsDefaults')",
      );
    fs.writeFileSync(outFile, outputText);
  }

  for (const constantsFileName of ['settingsDefaults.ts', 'socialDirigeantDefaults.ts']) {
    const constantsPath = path.join(root, 'src', 'constants', constantsFileName);
    if (!fs.existsSync(constantsPath)) continue;
    const constantsCompiled = ts.transpileModule(fs.readFileSync(constantsPath, 'utf8'), {
      fileName: constantsPath,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
        importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
      },
    });
    fs.writeFileSync(
      path.join(constantsDir, constantsFileName).replace(/\.ts$/, '.js'),
      constantsCompiled.outputText,
    );
  }

  return runtimeDir;
}

function collectRuntimeBaseContratRuleBlocks(root) {
  const runtimeDir = compileBaseContratRuntime(root);
  try {
    const requireRuntime = createRequire(path.join(runtimeDir, 'index.js'));
    const { CATALOG } = requireRuntime(path.join(runtimeDir, 'catalog.js'));
    const { getRules } = requireRuntime(path.join(runtimeDir, 'rules', 'index.js'));
    const productRuleBlocks = new Map();

    for (const product of CATALOG) {
      const audiences = [];
      if (product.ppEligible) audiences.push('pp');
      if (product.pmEligible) audiences.push('pm');
      for (const audience of audiences) {
        const rules = getRules(product.id, audience);
        const blocks = emptyRuleBlockIndex();
        for (const phase of BASE_CONTRAT_PHASES) {
          for (const block of rules[phase] ?? []) {
            if (typeof block.title === 'string') {
              blocks[phase].add(slugifyBlockKey(block.title));
            }
          }
        }
        productRuleBlocks.set(`${product.id}|${audience}`, blocks);
      }
    }

    return productRuleBlocks;
  } finally {
    cleanupRuntime(runtimeDir, root);
  }
}

function collectStaticBaseContratRuleBlocks(root) {
  const libraryPath = path.join(root, 'src', 'domain', 'base-contrat', 'rules', 'library');
  const ruleBlocksByName = collectRuleBlocksByName(root);
  const productRuleBlocks = new Map();

  for (const filePath of listTypeScriptFiles(libraryPath)) {
    const source = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);

    function visit(node) {
      if (ts.isSwitchStatement(node) && ts.isIdentifier(node.expression)) {
        if (node.expression.text !== 'productId') return;
        let productIds = [];

        for (const clause of node.caseBlock.clauses) {
          if (ts.isCaseClause(clause)) {
            const productId = getStringLiteralValue(clause.expression);
            if (productId) productIds.push(productId);
          }

          for (const statement of clause.statements) {
            if (!ts.isReturnStatement(statement) || !statement.expression) continue;
            const audienceBlocks = collectAudienceBlocksFromReturn(
              statement.expression,
              ruleBlocksByName,
            );
            for (const productId of productIds) {
              for (const [audience, blocks] of audienceBlocks) {
                addProductRuleBlocks(productRuleBlocks, productId, audience, blocks);
              }
            }
            productIds = [];
          }
        }
        return;
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  return productRuleBlocks;
}

export function collectBaseContratRuleBlocks(root) {
  const runtimeEntry = path.join(root, 'src', 'domain', 'base-contrat', 'rules', 'index.ts');
  if (fs.existsSync(runtimeEntry)) {
    return collectRuntimeBaseContratRuleBlocks(root);
  }

  return collectStaticBaseContratRuleBlocks(root);
}
