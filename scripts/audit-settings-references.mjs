#!/usr/bin/env node
/**
 * audit-settings-references.mjs
 *
 * Audit non CI du chaînage Settings : fraîcheur des attestations, liveness
 * des URLs officielles et, sur demande, cohérence des sources prévoyance en DB.
 *
 * Usage :
 *   node scripts/audit-settings-references.mjs [--root <chemin>] [--json] [--stale] [--with-db]
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const STALE_DAYS_BY_VOLATILITY = {
  annual: 400,
  lawChange: 730,
  stable: 1825,
};

const UNSTABLE_URL_SEGMENTS = /\/(actus|actualites|news|blog)(\/|$)/i;
const GENERIC_PREVOYANCE_TITLE = /référentiel prévoyance 2026 publié par organisme officiel/i;
const FOUR_CATEGORIES = new Set(['arret', 'invalidite', 'deces', 'cotisations']);
const DEAD_HTTP_STATUSES = new Set([404, 410]);
const BLOCKED_HTTP_STATUSES = new Set([401, 403, 429]);
const LIVENESS_HEADERS = {
  'User-Agent': 'SER1-settings-references-audit/1.0',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
};

function getUrlPathname(value) {
  try {
    return new URL(value).pathname;
  } catch {
    return '';
  }
}

function parseArgs(argv) {
  const options = {
    root: process.cwd(),
    json: false,
    stale: false,
    withDb: false,
    fetchUrls: process.env.CI !== 'true',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (arg === '--stale') {
      options.stale = true;
      continue;
    }
    if (arg === '--with-db') {
      options.withDb = true;
      continue;
    }
    if (arg === '--no-fetch') {
      options.fetchUrls = false;
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

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeSearchText(value) {
  return isNonEmptyString(value)
    ? value
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
    : '';
}

function daysSince(isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return Number.POSITIVE_INFINITY;
  const [year, month, day] = isoDate.split('-').map(Number);
  const checked = Date.UTC(year, month - 1, day);
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((today - checked) / 86_400_000);
}

function findStaleChainBindings(chain) {
  return chain.flatMap((binding) => {
    if (!isPlainObject(binding)) return [];
    const threshold = STALE_DAYS_BY_VOLATILITY[binding.volatility] ?? 365;
    const ageDays = daysSince(binding.verifiedAt);
    if (ageDays <= threshold) return [];
    return [
      {
        pagePath: binding.pagePath,
        claimKey: binding.claimKey,
        verifiedAt: binding.verifiedAt,
        volatility: binding.volatility,
        ageDays,
        threshold,
      },
    ];
  });
}

function findStaleReferences(references) {
  return references.flatMap((reference) => {
    if (!isPlainObject(reference) || !isNonEmptyString(reference.lastCheckedAt)) return [];
    const threshold = STALE_DAYS_BY_VOLATILITY[reference.volatility] ?? 365;
    const ageDays = daysSince(reference.lastCheckedAt);
    if (ageDays <= threshold) return [];
    return [
      {
        id: reference.id,
        lastCheckedAt: reference.lastCheckedAt,
        volatility: reference.volatility,
        ageDays,
        threshold,
      },
    ];
  });
}

function collectReferencedOfficialUrls(chain, references) {
  const referencesById = new Map(
    references
      .filter((reference) => isPlainObject(reference) && isNonEmptyString(reference.id))
      .map((reference) => [reference.id, reference]),
  );
  const refIds = new Set(
    chain.flatMap((binding) => (Array.isArray(binding.refIds) ? binding.refIds : [])),
  );

  return Array.from(refIds)
    .map((refId) => referencesById.get(refId))
    .filter((reference) => reference && isNonEmptyString(reference.officialUrl))
    .map((reference) => ({
      id: reference.id,
      url: reference.officialUrl,
    }));
}

export function classifyHttpStatus(status) {
  if (status >= 200 && status < 400) {
    return 'alive';
  }
  if (DEAD_HTTP_STATUSES.has(status)) {
    return 'dead';
  }
  if (BLOCKED_HTTP_STATUSES.has(status)) {
    return 'blocked';
  }
  return 'inconclusive';
}

async function fetchWithMethod(url, method, fetcher = fetch) {
  const response = await fetcher(url, {
    method,
    redirect: 'follow',
    headers: LIVENESS_HEADERS,
    signal: AbortSignal.timeout(5000),
  });
  return {
    status: response.status,
    classification: classifyHttpStatus(response.status),
  };
}

export async function auditUrlLiveness(urls, enabled, fetcher = fetch) {
  if (!enabled) {
    return {
      checked: 0,
      failures: [],
      blocked: [],
      inconclusive: [],
      warnings: ['Liveness URL ignoré (CI ou --no-fetch).'],
    };
  }

  const failures = [];
  const blocked = [];
  const inconclusive = [];
  const warnings = [];

  for (const item of urls) {
    try {
      const head = await fetchWithMethod(item.url, 'HEAD', fetcher);
      if (head.classification === 'alive') continue;

      const get = await fetchWithMethod(item.url, 'GET', fetcher);
      if (get.classification === 'alive') {
        continue;
      }
      if (get.classification === 'dead') {
        failures.push({ ...item, status: get.status });
        continue;
      }
      if (get.classification === 'blocked') {
        blocked.push({ ...item, status: get.status });
        warnings.push(
          `${item.id}: liveness bloquée ou non vérifiable automatiquement (${get.status})`,
        );
        continue;
      }
      inconclusive.push({ ...item, status: get.status });
      warnings.push(`${item.id}: liveness non concluante (${get.status})`);
    } catch (error) {
      inconclusive.push({ ...item, error: error.message });
      warnings.push(`${item.id}: liveness non concluante (${error.message})`);
    }
  }

  return {
    checked: urls.length,
    failures,
    blocked,
    inconclusive,
    warnings,
  };
}

function getSupabaseEnv() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceRoleKey ?? process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  const email = process.env.E2E_EMAIL ?? process.env.SER1_LLM_TEST_EMAIL;
  const password = process.env.E2E_PASSWORD ?? process.env.SER1_LLM_TEST_PASSWORD;

  return { url, key, email, password, usesServiceRole: Boolean(serviceRoleKey) };
}

function sourceReferences(sources) {
  if (!isPlainObject(sources) || !Array.isArray(sources.references)) return [];
  return sources.references.filter(isPlainObject);
}

function sourceNoRefReason(sources) {
  return isPlainObject(sources) && isNonEmptyString(sources.noRefReason)
    ? sources.noRefReason.trim()
    : '';
}

function noRefReasonMentionsRow(row, noRefReason) {
  const reason = normalizeSearchText(noRefReason);
  const tokens = [row.code, row.label, row.caisse].map(normalizeSearchText).filter(Boolean);
  return tokens.some((token) => reason.includes(token));
}

function coveredValues(reference) {
  if (!Array.isArray(reference.valeursCouvertes)) return [];
  return reference.valeursCouvertes.filter(isNonEmptyString).map((value) =>
    value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase(),
  );
}

export function auditPrevoyanceSourceRows(table, rows) {
  const findings = [];
  const counters = {
    rowCount: rows.length,
    rowsWithoutReferenceOrReason: 0,
    genericTitles: 0,
    unstableUrls: 0,
    f3053References: 0,
    fourCategoryClaims: 0,
    referencesWithoutAttestation: 0,
    nonSpecificNoRefReasons: 0,
  };

  for (const row of rows) {
    const rowLabel = `${table}:${row.code ?? '(code absent)'}`;
    const references = sourceReferences(row.sources);
    const noRefReason = sourceNoRefReason(row.sources);

    if (references.length === 0 && !noRefReason) {
      counters.rowsWithoutReferenceOrReason += 1;
      findings.push(`${rowLabel}: aucune reference et aucun noRefReason`);
    }
    if (references.length === 0 && noRefReason && !noRefReasonMentionsRow(row, noRefReason)) {
      counters.nonSpecificNoRefReasons += 1;
      findings.push(`${rowLabel}: noRefReason sans code, label ou caisse du régime`);
    }

    for (const reference of references) {
      const title = reference.titre ?? reference.title ?? '';
      const url = reference.url ?? '';

      if (GENERIC_PREVOYANCE_TITLE.test(title)) {
        counters.genericTitles += 1;
        findings.push(`${rowLabel}: titre générique "${title}"`);
      }
      if (isNonEmptyString(url) && UNSTABLE_URL_SEGMENTS.test(getUrlPathname(url))) {
        counters.unstableUrls += 1;
        findings.push(`${rowLabel}: URL institutionnelle instable (${url})`);
      }
      if (isNonEmptyString(url) && url.includes('F3053')) {
        counters.f3053References += 1;
      }
      if (!isNonEmptyString(reference.relevanceNote) || !isNonEmptyString(reference.verifiedAt)) {
        counters.referencesWithoutAttestation += 1;
        findings.push(`${rowLabel}: reference sans relevanceNote ou verifiedAt`);
      }

      const values = new Set(coveredValues(reference));
      const hasFourCategoryClaim = Array.from(FOUR_CATEGORIES).every((category) =>
        values.has(category),
      );
      if (hasFourCategoryClaim) {
        counters.fourCategoryClaims += 1;
        findings.push(`${rowLabel}: couverture simultanée arrêt/invalidité/décès/cotisations`);
      }
    }
  }

  return { counters, findings };
}

async function auditPrevoyanceDb(withDb) {
  if (!withDb) {
    return {
      enabled: false,
      warnings: ['Audit DB ignoré (ajouter --with-db).'],
      findings: [],
      counters: {},
    };
  }

  const env = getSupabaseEnv();
  if (!env.url || !env.key) {
    return {
      enabled: false,
      warnings: [
        'Audit DB ignoré : définir SUPABASE_URL/VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY.',
      ],
      findings: [],
      counters: {},
    };
  }

  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(env.url, env.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  if (!env.usesServiceRole && env.email && env.password) {
    const { error } = await client.auth.signInWithPassword({
      email: env.email,
      password: env.password,
    });
    if (error) {
      return {
        enabled: false,
        warnings: [`Audit DB ignoré : authentification E2E impossible (${error.message}).`],
        findings: [],
        counters: {},
      };
    }
  }

  const [regimesResult, maintienResult] = await Promise.all([
    client.from('prevoyance_regime_settings').select('code, label, caisse, sources').order('code'),
    client
      .from('prevoyance_maintien_employeur_settings')
      .select('code, label, sources')
      .order('code'),
  ]);

  const findings = [];
  const warnings = [];

  if (regimesResult.error) {
    findings.push(`prevoyance_regime_settings: ${regimesResult.error.message}`);
  }
  if (maintienResult.error) {
    findings.push(`prevoyance_maintien_employeur_settings: ${maintienResult.error.message}`);
  }

  const regimesAudit = auditPrevoyanceSourceRows(
    'prevoyance_regime_settings',
    regimesResult.data ?? [],
  );
  const maintienAudit = auditPrevoyanceSourceRows(
    'prevoyance_maintien_employeur_settings',
    maintienResult.data ?? [],
  );

  findings.push(...regimesAudit.findings, ...maintienAudit.findings);

  return {
    enabled: true,
    warnings,
    findings,
    counters: {
      regimes: regimesAudit.counters,
      maintienEmployeur: maintienAudit.counters,
    },
  };
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  const chainPath = path.join(options.root, 'src', 'domain', 'settings-references', 'chain.json');
  const referencesPath = path.join(
    options.root,
    'src',
    'domain',
    'legal-references',
    'references.json',
  );
  const chain = readJsonFile(chainPath);
  const references = readJsonFile(referencesPath);
  const referencedUrls = collectReferencedOfficialUrls(chain, references);
  const stale = options.stale
    ? {
        bindings: findStaleChainBindings(chain),
        references: findStaleReferences(references),
      }
    : { bindings: [], references: [] };
  const liveness = await auditUrlLiveness(referencedUrls, options.fetchUrls);
  const db = await auditPrevoyanceDb(options.withDb);
  const errors = [
    ...stale.bindings.map(
      (item) =>
        `${item.pagePath}:${item.claimKey}: attestation stale (${item.ageDays} jours > ${item.threshold})`,
    ),
    ...stale.references.map(
      (item) =>
        `${item.id}: référence stale (${item.ageDays} jours > ${item.threshold}, lastCheckedAt ${item.lastCheckedAt})`,
    ),
    ...liveness.failures.map((item) => `${item.id}: URL non vivante (${item.status}) ${item.url}`),
    ...db.findings,
  ];
  const warnings = [...liveness.warnings, ...db.warnings];

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          ok: errors.length === 0,
          bindingCount: Array.isArray(chain) ? chain.length : 0,
          referencedUrlCount: referencedUrls.length,
          stale,
          liveness,
          db,
          warnings,
          errors,
        },
        null,
        2,
      ),
    );
  } else {
    if (errors.length > 0) {
      console.error('audit:settings-references ❌');
      for (const error of errors) {
        console.error(`- ${error}`);
      }
    } else {
      console.log(
        `audit:settings-references ✅ ${Array.isArray(chain) ? chain.length : 0} bindings audités`,
      );
    }
    for (const warning of warnings) {
      console.warn(`Avertissement : ${warning}`);
    }
  }

  if (errors.length > 0) {
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run();
}
