#!/usr/bin/env node
// Usage: npm run check:storage-policies

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

const BUCKETS = {
  'base-cg-retraite-cg': {
    status: 'runtime',
    reason: 'PDF privés Base CG retraite, upload admin et lecture authentifiée.',
    expected: { select: 'authenticated', insert: 'admin', update: 'admin', delete: 'admin' },
    forbidPublicRead: true,
  },
  logos: {
    status: 'runtime',
    reason:
      'Logos cabinet, upload admin ; getPublicUrl ne nécessite pas de policy SELECT publique.',
    expected: { select: 'admin', insert: 'admin', update: 'admin', delete: 'admin' },
    forbidPublicRead: true,
  },
  'issue-reports': {
    status: 'runtime',
    reason: 'Pièces jointes signalements, accès propriétaire ou admin.',
    expected: { select: 'owner_or_admin', insert: 'own', delete: 'owner_or_admin' },
    forbidPublicRead: true,
  },
  covers: {
    status: 'historical',
    reason: 'Bucket historique sans usage runtime trouvé ; conservé sans neutralisation.',
    expected: {},
    forbidPublicRead: true,
  },
};

function normalizeSql(sql) {
  return sql.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();
}

function policyNameFrom(statement) {
  return (
    statement.match(/\bcreate\s+policy\s+"([^"]+)"/i)?.[1] ??
    statement.match(/\bcreate\s+policy\s+([^\s"]+)/i)?.[1] ??
    statement.match(/\bdrop\s+policy\s+if\s+exists\s+"([^"]+)"/i)?.[1] ??
    statement.match(/\bdrop\s+policy\s+if\s+exists\s+([^\s"]+)/i)?.[1] ??
    null
  );
}

function policyCommand(statement) {
  return (
    statement.match(/\bfor\s+(all|select|insert|update|delete)\b/i)?.[1].toLowerCase() ?? 'all'
  );
}

function policyRole(statement) {
  return (
    statement.match(/\bto\s+(authenticated|anon|public|service_role)\b/i)?.[1].toLowerCase() ??
    'public'
  );
}

function bucketsFromStatement(statement) {
  return [...statement.matchAll(/\bbucket_id\s*=\s*'([^']+)'(?:::text)?/gi)].map(
    (match) => match[1],
  );
}

function bucketInsertFromStatement(statement) {
  const normalized = statement.toLowerCase();
  if (!normalized.includes('insert into storage.buckets')) return null;
  return statement.match(/\bvalues\s*\(\s*'([^']+)'/i)?.[1] ?? null;
}

function usesAdminGuard(statement) {
  return /\bpublic\.is_admin\s*\(/i.test(statement);
}

function usesAuthUid(statement) {
  return /\bauth\.uid\s*\(/i.test(statement);
}

function collectStatements(file) {
  const fullPath = path.join(MIGRATIONS_DIR, file);
  const lines = fs.readFileSync(fullPath, 'utf8').split(/\r?\n/);
  const statements = [];
  let current = [];
  let startLine = 1;

  for (const [index, line] of lines.entries()) {
    if (current.length === 0 && !line.trim()) continue;
    if (current.length === 0) startLine = index + 1;
    current.push(line);
    if (line.includes(';')) {
      const sql = normalizeSql(current.join('\n'));
      if (sql) statements.push({ file, line: startLine, sql });
      current = [];
    }
  }

  const trailing = normalizeSql(current.join('\n'));
  if (trailing) statements.push({ file, line: startLine, sql: trailing });
  return statements;
}

function collectStorageState() {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();
  const policies = new Map();
  const declaredBuckets = new Map();

  for (const file of files) {
    for (const statement of collectStatements(file)) {
      const bucketInsert = bucketInsertFromStatement(statement.sql);
      if (bucketInsert)
        declaredBuckets.set(bucketInsert, { file: statement.file, line: statement.line });

      if (
        !/\bon\s+(?:(?:"storage"|storage)\s*\.\s*)?(?:"objects"|objects)(?=\s|;|$)/i.test(
          statement.sql,
        )
      ) {
        continue;
      }

      if (/\bdrop\s+policy\s+if\s+exists\b/i.test(statement.sql)) {
        const name = policyNameFrom(statement.sql);
        if (name) policies.delete(name);
        continue;
      }

      if (/\bcreate\s+policy\b/i.test(statement.sql)) {
        const name = policyNameFrom(statement.sql);
        if (!name) continue;
        policies.set(name, {
          policy: name,
          command: policyCommand(statement.sql),
          role: policyRole(statement.sql),
          buckets: bucketsFromStatement(statement.sql),
          usesAdmin: usesAdminGuard(statement.sql),
          usesAuthUid: usesAuthUid(statement.sql),
          file: statement.file,
          line: statement.line,
        });
      }
    }
  }

  return { policies: [...policies.values()], declaredBuckets };
}

function commandMatches(policy, expected) {
  return policy.command === expected || policy.command === 'all';
}

function roleAllowsClient(policy) {
  return policy.role === 'authenticated' || policy.role === 'public';
}

function matchesAccess(policy, expected) {
  if (expected === 'authenticated') return roleAllowsClient(policy) && !policy.usesAdmin;
  if (expected === 'admin') return roleAllowsClient(policy) && policy.usesAdmin;
  if (expected === 'own')
    return roleAllowsClient(policy) && policy.usesAuthUid && !policy.usesAdmin;
  if (expected === 'owner_or_admin') {
    return roleAllowsClient(policy) && policy.usesAuthUid && policy.usesAdmin;
  }
  return false;
}

function isPublicRead(policy) {
  return commandMatches(policy, 'select') && (policy.role === 'public' || policy.role === 'anon');
}

function summarizeBucket(bucket, config, state) {
  const policies = state.policies.filter((policy) => policy.buckets.includes(bucket));
  const failures = [];

  for (const [command, expected] of Object.entries(config.expected)) {
    const ok = policies.some(
      (policy) => commandMatches(policy, command) && matchesAccess(policy, expected),
    );
    if (!ok)
      failures.push(`${bucket}: policy ${command.toUpperCase()} attendue absente (${expected})`);
  }

  if (config.forbidPublicRead && policies.some(isPublicRead)) {
    failures.push(
      `${bucket}: policy SELECT publique presente alors que le bucket doit rester prive`,
    );
  }

  return {
    bucket,
    status: config.status,
    reason: config.reason,
    declaredInMigrations: state.declaredBuckets.has(bucket),
    expectedPolicies: Object.keys(config.expected),
    policies: policies.map(({ policy, command, role, file, line }) => ({
      policy,
      command,
      role,
      file,
      line,
    })),
    failures,
  };
}

function buildReport() {
  const state = collectStorageState();
  const discoveredBuckets = [
    ...new Set([
      ...state.policies.flatMap((policy) => policy.buckets),
      ...state.declaredBuckets.keys(),
    ]),
  ].sort();
  const covered = {};
  const historicalOrUnused = {};
  const failures = [];

  for (const [bucket, config] of Object.entries(BUCKETS)) {
    const summary = summarizeBucket(bucket, config, state);
    if (config.status === 'runtime') covered[bucket] = summary;
    else historicalOrUnused[bucket] = summary;
    failures.push(...summary.failures);
  }

  const unknownBuckets = discoveredBuckets.filter((bucket) => !BUCKETS[bucket]);
  for (const bucket of unknownBuckets) {
    failures.push(
      `${bucket}: bucket/policy Storage sans classification dans check:storage-policies`,
    );
  }

  return {
    ok: failures.length === 0,
    covered,
    historicalOrUnused,
    unknownBuckets,
    discoveredBuckets,
    failures,
  };
}

const report = buildReport();

if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else if (report.ok) {
  console.log('check:storage-policies ✅');
  console.log(`Buckets detectes : ${report.discoveredBuckets.length}`);
  console.log(`Buckets couverts : ${Object.keys(report.covered).length}`);
  console.log(
    `Buckets historiques ou non utilises : ${Object.keys(report.historicalOrUnused).length}`,
  );
  console.log(`Buckets sans classification : ${report.unknownBuckets.length}`);
  for (const bucket of [
    ...Object.values(report.covered),
    ...Object.values(report.historicalOrUnused),
  ]) {
    console.log(
      `- ${bucket.bucket}: ${bucket.status}, ${bucket.policies.length} policy(s) active(s)`,
    );
  }
} else {
  console.error('check:storage-policies ❌');
  for (const failure of report.failures) {
    console.error(`- ${failure}`);
  }
}

if (!report.ok) {
  process.exit(1);
}
