/**
 * audit-settings-references.mjs
 *
 * Audit non CI du chaînage Settings : fraîcheur des attestations, liveness
 * des URLs officielles et, sur demande, cohérence des sources prévoyance en DB.
 *
 * Usage :
 *   node scripts/audit-settings-references.mjs [--root <chemin>] [--json] [--stale] [--with-db] [--fetch] [--write-supabase-report]
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const STALE_DAYS_BY_VOLATILITY = {
  lawChange: 730,
  stable: 1825,
};

const UNSTABLE_URL_SEGMENTS = /\/(actus|actualites|news|blog)(\/|$)/i;
const GENERIC_PREVOYANCE_TITLE = /référentiel prévoyance 2026 publié par organisme officiel/i;
const PREVOYANCE_ROOT_URL = /^https:\/\/(?:www\.)?[^/]+\/?$/i;
const GENERIC_PREVOYANCE_URL_PATHS = new Set([
  '/',
  '/accueil',
  '/assure',
  '/entreprise',
  '/particuliers',
]);
const FOUR_CATEGORIES = new Set(['arret', 'invalidite', 'deces', 'cotisations']);
const MAINTIEN_EMPLOYEUR_CATEGORIES = new Set(['maintien_employeur']);
const DEAD_HTTP_STATUSES = new Set([404, 410]);
const BLOCKED_HTTP_STATUSES = new Set([401, 403, 429]);
const LIVENESS_HEADERS = {
  'User-Agent': 'SER1-settings-references-audit/1.0',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
};
const SERVICE_ROLE_KEY_ENV = ['SUPABASE', 'SERVICE', 'ROLE', 'KEY'].join('_');
const SER1_SERVICE_KEY_ENV = ['SER1', 'SUPABASE', 'SERVICE', 'KEY'].join('_');

function getUrlPathname(value) {
  try {
    return new URL(value).pathname;
  } catch {
    return '';
  }
}

function isGenericPrevoyanceUrl(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    const parsed = new URL(value);
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    return PREVOYANCE_ROOT_URL.test(value) || GENERIC_PREVOYANCE_URL_PATHS.has(pathname);
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const options = {
    root: process.cwd(),
    json: false,
    stale: false,
    withDb: false,
    fetchUrls: process.env.CI !== 'true',
    writeSupabaseReport: false,
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
    if (arg === '--fetch') {
      options.fetchUrls = true;
      continue;
    }
    if (arg === '--no-fetch') {
      options.fetchUrls = false;
      continue;
    }
    if (arg === '--write-supabase-report') {
      options.writeSupabaseReport = true;
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

function parseIsoDateUtc(isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return Number.POSITIVE_INFINITY;
  const [year, month, day] = isoDate.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function todayUtc(date = new Date()) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function daysBetween(fromUtc, toUtc) {
  if (!Number.isFinite(fromUtc) || !Number.isFinite(toUtc)) return Number.POSITIVE_INFINITY;
  return Math.floor((toUtc - fromUtc) / 86_400_000);
}

function formatIsoDateFromUtc(value) {
  return new Date(value).toISOString().slice(0, 10);
}

export function getStaleAssessment(isoDate, volatility, now = new Date()) {
  const checked = parseIsoDateUtc(isoDate);
  const today = todayUtc(now);
  const ageDays = daysBetween(checked, today);

  if (volatility === 'annual') {
    if (!Number.isFinite(checked)) {
      return { stale: true, ageDays, deadline: 'date invalide' };
    }
    const checkedDate = new Date(checked);
    const deadlineUtc = Date.UTC(checkedDate.getUTCFullYear() + 1, 1, 1);
    return {
      stale: today >= deadlineUtc,
      ageDays,
      deadline: formatIsoDateFromUtc(deadlineUtc),
    };
  }

  const thresholdDays = STALE_DAYS_BY_VOLATILITY[volatility] ?? 365;
  return {
    stale: ageDays > thresholdDays,
    ageDays,
    thresholdDays,
  };
}

function findStaleChainBindings(chain) {
  return chain.flatMap((binding) => {
    if (!isPlainObject(binding)) return [];
    const assessment = getStaleAssessment(binding.verifiedAt, binding.volatility);
    if (!assessment.stale) return [];
    return [
      {
        pagePath: binding.pagePath,
        claimKey: binding.claimKey,
        verifiedAt: binding.verifiedAt,
        volatility: binding.volatility,
        ageDays: assessment.ageDays,
        ...(assessment.deadline
          ? { deadline: assessment.deadline }
          : { thresholdDays: assessment.thresholdDays }),
      },
    ];
  });
}

function findStaleReferences(references) {
  return references.flatMap((reference) => {
    if (!isPlainObject(reference) || !isNonEmptyString(reference.lastCheckedAt)) return [];
    const assessment = getStaleAssessment(reference.lastCheckedAt, reference.volatility);
    if (!assessment.stale) return [];
    return [
      {
        id: reference.id,
        lastCheckedAt: reference.lastCheckedAt,
        volatility: reference.volatility,
        ageDays: assessment.ageDays,
        ...(assessment.deadline
          ? { deadline: assessment.deadline }
          : { thresholdDays: assessment.thresholdDays }),
      },
    ];
  });
}

function formatStaleDetail(item) {
  if (item.deadline) {
    return `échéance ${item.deadline}, âge ${item.ageDays} jours`;
  }
  return `${item.ageDays} jours > ${item.thresholdDays}`;
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
  const serviceRoleKey = process.env[SERVICE_ROLE_KEY_ENV] ?? process.env[SER1_SERVICE_KEY_ENV];
  const key = serviceRoleKey ?? process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  const email = process.env.E2E_EMAIL ?? process.env.SER1_LLM_TEST_EMAIL;
  const password = process.env.E2E_PASSWORD ?? process.env.SER1_LLM_TEST_PASSWORD;

  return { url, key, email, password, usesServiceRole: Boolean(serviceRoleKey) };
}

function normalizeEnvValue(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadLocalEnv(root) {
  for (const filename of ['.env.local', '.env']) {
    const envPath = path.join(root, filename);
    if (!fs.existsSync(envPath)) continue;

    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex <= 0) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] !== undefined) continue;
      process.env[key] = normalizeEnvValue(trimmed.slice(separatorIndex + 1));
    }
  }
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

function expectedCategoriesForPrevoyanceTable(table) {
  if (table === 'prevoyance_regime_settings') {
    return FOUR_CATEGORIES;
  }
  if (table === 'prevoyance_maintien_employeur_settings') {
    return MAINTIEN_EMPLOYEUR_CATEGORIES;
  }
  return new Set();
}

function categorySearchTokens(category) {
  return [category, category.replace(/_/g, ' '), category.replace(/_/g, '-')]
    .map(normalizeSearchText)
    .filter(Boolean);
}

function noRefReasonMentionsCategory(row, noRefReason, category) {
  const reason = normalizeSearchText(noRefReason);
  if (!reason || !noRefReasonMentionsRow(row, noRefReason)) return false;
  return categorySearchTokens(category).some((token) => reason.includes(token));
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
    missingCategoryClaims: 0,
    rootOrGenericUrls: 0,
  };
  const expectedCategories = expectedCategoriesForPrevoyanceTable(table);

  for (const row of rows) {
    const rowLabel = `${table}:${row.code ?? '(code absent)'}`;
    const references = sourceReferences(row.sources);
    const noRefReason = sourceNoRefReason(row.sources);
    const coveredCategories = new Set();

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
      if (isGenericPrevoyanceUrl(url)) {
        counters.rootOrGenericUrls += 1;
        findings.push(`${rowLabel}: URL prévoyance racine ou générique (${url})`);
      }
      if (isNonEmptyString(url) && url.includes('F3053')) {
        counters.f3053References += 1;
      }
      if (!isNonEmptyString(reference.relevanceNote) || !isNonEmptyString(reference.verifiedAt)) {
        counters.referencesWithoutAttestation += 1;
        findings.push(`${rowLabel}: reference sans relevanceNote ou verifiedAt`);
      }

      const values = new Set(coveredValues(reference));
      for (const value of values) {
        coveredCategories.add(value);
      }
      const hasFourCategoryClaim = Array.from(FOUR_CATEGORIES).every((category) =>
        values.has(category),
      );
      if (hasFourCategoryClaim) {
        counters.fourCategoryClaims += 1;
        findings.push(`${rowLabel}: couverture simultanée arrêt/invalidité/décès/cotisations`);
      }
    }

    for (const category of expectedCategories) {
      if (coveredCategories.has(category)) continue;
      if (noRefReasonMentionsCategory(row, noRefReason, category)) continue;
      counters.missingCategoryClaims += 1;
      findings.push(`${rowLabel}: catégorie prévoyance non couverte (${category})`);
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
        'Audit DB ignoré : définir une URL Supabase et une clé de lecture autorisée (service-role ou anon authentifiée).',
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

export function summarizeReferenceAuditReport(report) {
  return {
    ok: report.ok,
    requiresAction: !report.ok,
    bindingCount: report.bindingCount,
    referencedUrlCount: report.referencedUrlCount,
    staleBindingCount: report.stale.bindings.length,
    staleReferenceCount: report.stale.references.length,
    urlFailureCount: report.liveness.failures.length,
    urlBlockedCount: report.liveness.blocked.length,
    urlInconclusiveCount: report.liveness.inconclusive.length,
    dbFindingCount: report.db.findings.length,
    warningCount: report.warnings.length,
    errorCount: report.errors.length,
  };
}

function buildRunContext(env = process.env) {
  const repository = env.GITHUB_REPOSITORY ?? null;
  const runId = env.GITHUB_RUN_ID ?? null;
  const runAttempt = env.GITHUB_RUN_ATTEMPT ?? null;
  const serverUrl = env.GITHUB_SERVER_URL ?? 'https://github.com';

  return {
    source: env.GITHUB_ACTIONS === 'true' ? 'github_actions' : 'local',
    workflowName: env.GITHUB_WORKFLOW ?? null,
    githubRunId: runId,
    githubRunAttempt: runAttempt,
    commitSha: env.GITHUB_SHA ?? null,
    repository,
    runUrl: repository && runId ? `${serverUrl}/${repository}/actions/runs/${runId}` : null,
  };
}

export function buildReferenceAuditReportRow(report, context = buildRunContext()) {
  const summary = summarizeReferenceAuditReport(report);

  return {
    ok: summary.ok,
    requires_action: summary.requiresAction,
    binding_count: summary.bindingCount,
    referenced_url_count: summary.referencedUrlCount,
    stale_binding_count: summary.staleBindingCount,
    stale_reference_count: summary.staleReferenceCount,
    url_failure_count: summary.urlFailureCount,
    url_blocked_count: summary.urlBlockedCount,
    url_inconclusive_count: summary.urlInconclusiveCount,
    db_finding_count: summary.dbFindingCount,
    warning_count: summary.warningCount,
    error_count: summary.errorCount,
    report,
    source: context.source,
    workflow_name: context.workflowName,
    github_run_id: context.githubRunId,
    github_run_attempt: context.githubRunAttempt,
    commit_sha: context.commitSha,
    run_url: context.runUrl,
  };
}

async function writeSupabaseReferenceAuditReport(report) {
  const env = getSupabaseEnv();
  const serviceRoleKey = process.env[SERVICE_ROLE_KEY_ENV] ?? process.env[SER1_SERVICE_KEY_ENV];

  if (!env.url || !serviceRoleKey) {
    throw new Error(
      'Écriture Supabase ignorée : définir une URL Supabase et une clé de service Supabase.',
    );
  }

  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(env.url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const row = buildReferenceAuditReportRow(report);
  const { data, error } = await client
    .from('reference_audit_reports')
    .insert(row)
    .select('id')
    .single();

  if (error) {
    throw new Error(`Écriture Supabase impossible : ${error.message}`);
  }

  return {
    enabled: true,
    table: 'reference_audit_reports',
    id: data?.id ?? null,
  };
}

async function buildReferenceAuditReport(options) {
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
      (item) => `${item.pagePath}:${item.claimKey}: attestation stale (${formatStaleDetail(item)})`,
    ),
    ...stale.references.map(
      (item) =>
        `${item.id}: référence stale (${formatStaleDetail(item)}, lastCheckedAt ${item.lastCheckedAt})`,
    ),
    ...liveness.failures.map((item) => `${item.id}: URL non vivante (${item.status}) ${item.url}`),
    ...db.findings,
  ];
  const warnings = [...liveness.warnings, ...db.warnings];

  return {
    ok: errors.length === 0,
    bindingCount: Array.isArray(chain) ? chain.length : 0,
    referencedUrlCount: referencedUrls.length,
    stale,
    liveness,
    db,
    warnings,
    errors,
  };
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  loadLocalEnv(options.root);
  const report = await buildReferenceAuditReport(options);
  let outputReport = {
    ...report,
    storage: { enabled: false },
  };

  if (options.writeSupabaseReport) {
    try {
      const storage = await writeSupabaseReferenceAuditReport(report);
      outputReport = { ...report, storage };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      outputReport = {
        ...report,
        ok: false,
        storage: { enabled: true, error: message },
        errors: [...report.errors, message],
      };
    }
  }

  if (options.json) {
    console.log(JSON.stringify(outputReport, null, 2));
  } else {
    if (outputReport.errors.length > 0) {
      console.error('audit:settings-references ❌');
      for (const error of outputReport.errors) {
        console.error(`- ${error}`);
      }
    } else {
      console.log(`audit:settings-references ✅ ${outputReport.bindingCount} bindings audités`);
    }
    if (outputReport.storage.enabled && !outputReport.storage.error) {
      console.log(
        `Rapport Supabase écrit dans ${outputReport.storage.table} (${outputReport.storage.id ?? 'id inconnu'}).`,
      );
    }
    for (const warning of outputReport.warnings) {
      console.warn(`Avertissement : ${warning}`);
    }
  }

  if (outputReport.errors.length > 0) {
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run();
}
