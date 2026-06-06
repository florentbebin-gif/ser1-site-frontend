import {
  BASE_CONTRAT_AUDIENCES,
  BASE_CONTRAT_PHASES,
  BASE_CONTRAT_INCOMPLETE_SOURCE_PATTERNS,
  CATEGORIES,
  COVERAGE_EXPECTED_CLAIMS_BY_PAGE,
  DEFAULT_EXPORT_BY_TABLE,
  GENERIC_TEXT_PATTERNS,
  PREVOYANCE_TABLES,
  SETTINGS_DEFAULT_TABLES,
  SETTINGS_PAGES,
  VOLATILITIES,
} from './checkConstants.mjs';
import { collectObjectLiteralKeys, pathExistsInExpression } from './checkLoaders.mjs';

export { SETTINGS_PAGES };

export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isNonEmptyString(value) {
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

function validateBaseContratTarget(target, context, errors, label) {
  const catalogProductIds = context.catalogProductIds;

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

  if (
    catalogProductIds.has(target.productId) &&
    BASE_CONTRAT_AUDIENCES.has(target.audience) &&
    BASE_CONTRAT_PHASES.has(target.phase) &&
    isNonEmptyString(target.blockKey)
  ) {
    const key = `${target.productId}|${target.audience}`;
    const blocks = context.baseContratRuleBlocks.get(key);
    const phaseBlocks = blocks?.[target.phase];

    if (!phaseBlocks || !phaseBlocks.has(target.blockKey)) {
      const available = phaseBlocks ? Array.from(phaseBlocks).sort().join(', ') : 'aucun bloc';
      errors.push(
        `${label}: blockKey Base-Contrat introuvable (${target.productId}/${target.audience}/${target.phase}/${target.blockKey}); clés disponibles: ${available}`,
      );
    }
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
    validateBaseContratTarget(target, context, errors, label);
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
    } else if (
      binding.pagePath === '/settings/base-contrat' &&
      BASE_CONTRAT_INCOMPLETE_SOURCE_PATTERNS.some((pattern) => pattern.test(binding.noRefReason))
    ) {
      errors.push(
        `${label}: noRefReason Base-Contrat interdit car il signale seulement un sourcing incomplet`,
      );
    }
  }

  validateTarget(binding.target, context, errors, label);
  return errors;
}

export function validateChain(chain, context) {
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

function countBaseContratRuntimeClaims(context) {
  if (!(context?.baseContratRuleBlocks instanceof Map)) return null;
  let count = 0;
  for (const blocks of context.baseContratRuleBlocks.values()) {
    for (const phase of BASE_CONTRAT_PHASES) {
      count += blocks[phase]?.size ?? 0;
    }
  }
  return count;
}

function expectedClaimsForPage(pagePath, context) {
  const expected = COVERAGE_EXPECTED_CLAIMS_BY_PAGE[pagePath];
  if (pagePath === '/settings/base-contrat') {
    return countBaseContratRuntimeClaims(context);
  }
  return expected;
}

export function buildCoverage(chain, context = {}) {
  const bindingsByPage = countBindingsByPage(chain);
  const missingClaims = [];
  const extraClaims = [];
  const byPage = Object.fromEntries(
    Array.from(SETTINGS_PAGES).map((pagePath) => {
      const expected = expectedClaimsForPage(pagePath, context);
      const expectedDefined = Number.isInteger(expected) && expected >= 0;
      const declared = bindingsByPage[pagePath] ?? 0;
      const missingCount = expectedDefined ? Math.max(0, expected - declared) : 0;
      const extraCount = expectedDefined ? Math.max(0, declared - expected) : 0;
      if (missingCount > 0) {
        missingClaims.push(`${pagePath}: ${missingCount} claim(s) attendu(s) non déclarés`);
      }
      if (extraCount > 0) {
        extraClaims.push(`${pagePath}: ${extraCount} claim(s) surnuméraire(s)`);
      }
      return [
        pagePath,
        {
          expected,
          declared,
          expectedDefined,
          complete: expectedDefined && declared === expected,
          missing: missingCount,
          extra: extraCount,
        },
      ];
    }),
  );
  const pageCoverage = Object.values(byPage);
  const expectedClaimsDefined = pageCoverage.every((entry) => entry.expectedDefined);
  const isExhaustive =
    expectedClaimsDefined && pageCoverage.every((entry) => entry.complete && entry.expected > 0);
  const errors = [
    ...Object.entries(byPage)
      .filter(([, entry]) => !entry.expectedDefined)
      .map(
        ([pagePath, entry]) =>
          `Couverture Settings: attendu non défini pour ${pagePath} (${String(entry.expected)})`,
      ),
    ...missingClaims,
    ...extraClaims,
  ];

  return {
    mode: 'exhaustive',
    isExhaustive,
    expectedClaimsDefined,
    bindingsByPage,
    byPage,
    missingClaims,
    extraClaims,
    errors,
    note: 'Registre exhaustif : chaque surface Settings doit déclarer exactement le nombre de claims attendus, Base-Contrat étant mesuré depuis CATALOG + getRules().',
  };
}
