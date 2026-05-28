#!/usr/bin/env node
// Usage: npm run check:supabase-migrations

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');
const MIGRATION_NAME_PATTERN = /^(\d{14})_[a-z0-9_]+\.sql$/;

const DANGEROUS_PATTERNS = [
  {
    pattern: /\bdisable\s+row\s+level\s+security\b/i,
    message: 'désactivation RLS interdite sans migration de rollback et justification explicite',
  },
  {
    pattern: /\bdrop\s+schema\s+public\b/i,
    message: 'DROP SCHEMA public interdit',
  },
  {
    pattern: /\bgrant\s+all\s+on\s+(table|schema)\b[\s\S]*\bto\s+(anon|authenticated)\b/i,
    message: 'GRANT ALL sur table/schema à anon/authenticated interdit',
  },
];

function runJsonCheck(scriptPath) {
  const raw = execFileSync(process.execPath, [scriptPath, '--json'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(raw);
}

function collectMigrations() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();
}

function checkMigrationNames(files) {
  const failures = [];
  const seen = new Set();

  for (const file of files) {
    const match = file.match(MIGRATION_NAME_PATTERN);
    if (!match) {
      failures.push(`${file}: nom de migration invalide, format attendu YYYYMMDDHHMMSS_slug.sql`);
      continue;
    }
    const timestamp = match[1];
    if (seen.has(timestamp)) failures.push(`${file}: timestamp de migration dupliqué`);
    seen.add(timestamp);
  }

  const sorted = [...files].sort();
  files.forEach((file, index) => {
    if (file !== sorted[index]) failures.push(`${file}: ordre lexicographique incohérent`);
  });

  return failures;
}

function checkDangerousSql(files) {
  const failures = [];
  for (const file of files) {
    const source = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8').replace(/--.*$/gm, '');
    if (/\bsecurity\s+definer\b/i.test(source) && !/\bset\s+search_path\b/i.test(source)) {
      failures.push(`${file}: SECURITY DEFINER sans SET search_path`);
    }
    for (const { pattern, message } of DANGEROUS_PATTERNS) {
      if (pattern.test(source)) failures.push(`${file}: ${message}`);
    }
  }
  return failures;
}

function buildReport() {
  const files = collectMigrations();
  const failures = [...checkMigrationNames(files), ...checkDangerousSql(files)];

  const rls = runJsonCheck(path.join('scripts', 'check-supabase-rls-policies.mjs'));
  const storage = runJsonCheck(path.join('scripts', 'check-storage-policies.mjs'));
  if (!rls.ok) failures.push(...rls.failures.map((failure) => `RLS: ${failure}`));
  if (!storage.ok) failures.push(...storage.failures.map((failure) => `Storage: ${failure}`));

  return {
    ok: failures.length === 0,
    migrations: files.length,
    rlsCoveredTables: Object.keys(rls.covered).length,
    storageCoveredBuckets: Object.keys(storage.covered).length,
    storageHistoricalBuckets: Object.keys(storage.historicalOrUnused).length,
    failures,
  };
}

const report = buildReport();

if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else if (report.ok) {
  console.log('check:supabase-migrations ✅');
  console.log(`- migrations : ${report.migrations}`);
  console.log(`- tables RLS couvertes : ${report.rlsCoveredTables}`);
  console.log(`- buckets Storage couverts : ${report.storageCoveredBuckets}`);
  console.log(`- buckets historiques/non utilises : ${report.storageHistoricalBuckets}`);
} else {
  console.error('check:supabase-migrations ❌');
  for (const failure of report.failures) {
    console.error(`- ${failure}`);
  }
}

if (!report.ok) {
  process.exit(1);
}
