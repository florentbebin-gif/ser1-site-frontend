#!/usr/bin/env node
// Usage: npm run check:supabase-rls

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

const COVERED_TABLES = {
  admin_accounts: {
    sensitivity: 'sensitive',
    reason: 'Allowlist admin globale, accessible uniquement via service_role.',
    read: 'service_role',
    writes: { insert: 'service_role', update: 'service_role', delete: 'service_role' },
  },
  admin_action_audit: {
    sensitivity: 'sensitive',
    reason: 'Journal admin, lecture/ecriture reservees a service_role.',
    read: 'service_role',
    writes: { insert: 'service_role' },
  },
  app_settings_meta: {
    sensitivity: 'sensitive',
    reason: 'Meta settings globale lue par les utilisateurs authentifies, ecriture admin.',
    read: 'authenticated',
    writes: { insert: 'admin', update: 'admin', delete: 'admin' },
  },
  base_cg_retraite_catalog_meta: {
    sensitivity: 'sensitive',
    reason: 'Meta catalogue canonique Base CG, lecture auth et ecritures client interdites.',
    read: 'authenticated',
    writes: 'forbidden',
  },
  base_cg_retraite_contracts: {
    sensitivity: 'sensitive',
    reason: 'Catalogue canonique Base CG retraite, lecture auth et ecriture admin.',
    read: 'authenticated',
    writes: { insert: 'admin', update: 'admin', delete: 'admin' },
  },
  base_cg_retraite_documents: {
    sensitivity: 'sensitive',
    reason: 'Index documents Base CG retraite, lecture auth et ecriture admin.',
    read: 'authenticated',
    writes: { insert: 'admin', update: 'admin', delete: 'admin' },
  },
  base_cg_retraite_overrides: {
    sensitivity: 'sensitive',
    reason:
      'Ancienne table Base CG conservee pour parite/rollback, lecture auth et ecriture admin.',
    read: 'authenticated',
    writes: { insert: 'admin', update: 'admin', delete: 'admin' },
  },
  base_contrat_overrides: {
    sensitivity: 'sensitive',
    reason: 'Overrides Base-Contrat, lecture/ecriture reservees admin.',
    read: 'admin',
    writes: { insert: 'admin', update: 'admin', delete: 'admin' },
  },
  base_contrat_settings: {
    sensitivity: 'sensitive',
    reason: 'Settings Base-Contrat globaux, lecture auth et ecriture admin.',
    read: 'authenticated',
    writes: { insert: 'admin', update: 'admin', delete: 'admin' },
  },
  cabinets: {
    sensitivity: 'sensitive',
    reason: 'Tenant cabinet, lecture cabinet courant/admin et ecriture admin.',
    read: 'tenant_or_admin',
    writes: { insert: 'admin', update: 'admin', delete: 'admin' },
  },
  fiscality_settings: {
    sensitivity: 'sensitive',
    reason: 'Settings fiscaux globaux, lecture auth et ecriture admin.',
    read: 'authenticated',
    writes: { insert: 'admin', update: 'admin', delete: 'admin' },
  },
  issue_reports: {
    sensitivity: 'sensitive',
    reason: 'Signalements utilisateur, lecture own/admin, insertion owner, moderation admin.',
    read: 'own_or_admin',
    writes: { insert: 'own', update: 'admin', delete: 'admin' },
  },
  logos: {
    sensitivity: 'sensitive',
    reason: 'Logos cabinets, lecture cabinet courant/admin et ecriture admin.',
    read: 'tenant_or_admin',
    writes: { insert: 'admin', update: 'admin', delete: 'admin' },
  },
  pass_history: {
    sensitivity: 'sensitive',
    reason:
      'Historique PASS global consomme par la chaine fiscale, lecture auth et ecriture admin.',
    read: 'authenticated',
    writes: { insert: 'admin', update: 'admin', delete: 'admin' },
  },
  prevoyance_maintien_employeur_settings: {
    sensitivity: 'sensitive',
    reason: 'Settings Prevoyance globaux, lecture auth et ecriture admin.',
    read: 'authenticated',
    writes: { insert: 'admin', update: 'admin', delete: 'admin' },
  },
  prevoyance_regime_settings: {
    sensitivity: 'sensitive',
    reason: 'Settings Prevoyance globaux, lecture auth et ecriture admin.',
    read: 'authenticated',
    writes: { insert: 'admin', update: 'admin', delete: 'admin' },
  },
  profiles: {
    sensitivity: 'sensitive',
    reason: 'Profil user/cabinet, lecture own/admin et update admin.',
    read: 'own_or_admin',
    writes: { update: 'admin' },
  },
  ps_settings: {
    sensitivity: 'sensitive',
    reason: 'Settings sociaux globaux, lecture auth et ecriture admin.',
    read: 'authenticated',
    writes: { insert: 'admin', update: 'admin', delete: 'admin' },
  },
  tax_settings: {
    sensitivity: 'sensitive',
    reason: 'Settings IR/DMTG globaux, lecture auth et ecriture admin.',
    read: 'authenticated',
    writes: { insert: 'admin', update: 'admin', delete: 'admin' },
  },
  themes: {
    sensitivity: 'sensitive',
    reason: 'Themes partages, lecture publique assumee et ecriture admin.',
    read: 'public',
    writes: { insert: 'admin', update: 'admin', delete: 'admin' },
  },
  ui_settings: {
    sensitivity: 'sensitive',
    reason: 'Preferences UI utilisateur, lecture/ecriture owner uniquement.',
    read: 'own',
    writes: { insert: 'own', update: 'own', delete: 'own' },
  },
};

const IGNORED_TABLES = {};
const NON_SENSITIVE_TABLES = {};

function normalizeSql(sql) {
  return sql.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();
}

function normalizeIdentifier(identifier) {
  return identifier.replaceAll('"', '').trim();
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

function tableRefPattern(table) {
  return new RegExp(
    String.raw`\bon\s+(?:(?:"public"|public)\s*\.\s*)?(?:"${table}"|${table})(?=\s|;|$)`,
    'i',
  );
}

function enabledRlsTable(statement) {
  const match = statement.match(
    /\balter\s+table\s+(?:(?:"public"|public)\s*\.\s*)?(?:"([^"]+)"|([a-zA-Z0-9_]+))(?=\s|;|$)[\s\S]*\benable\s+row\s+level\s+security\b/i,
  );
  return match ? normalizeIdentifier(match[1] ?? match[2]) : null;
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

function usesAdminGuard(statement) {
  return /\bpublic\.is_admin\s*\(/i.test(statement);
}

function usesAuthUid(statement) {
  return /\bauth\.uid\s*\(/i.test(statement);
}

function usesTenantGuard(statement) {
  return /\bget_my_cabinet_id\s*\(/i.test(statement);
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
      const raw = current.join('\n');
      const sql = normalizeSql(raw);
      if (sql) statements.push({ file, line: startLine, sql });
      current = [];
    }
  }

  const trailing = normalizeSql(current.join('\n'));
  if (trailing) statements.push({ file, line: startLine, sql: trailing });
  return statements;
}

function createTableState() {
  return { rlsEnabled: false, rlsEvidence: null, policies: new Map() };
}

function collectMigrationState() {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();
  const state = new Map();

  for (const file of files) {
    for (const statement of collectStatements(file)) {
      const enabledTable = enabledRlsTable(statement.sql);
      if (enabledTable) {
        if (!state.has(enabledTable)) state.set(enabledTable, createTableState());
        const tableState = state.get(enabledTable);
        tableState.rlsEnabled = true;
        tableState.rlsEvidence = { file: statement.file, line: statement.line };
      }

      for (const table of Object.keys(COVERED_TABLES)) {
        if (!tableRefPattern(table).test(statement.sql)) continue;
        if (!state.has(table)) state.set(table, createTableState());
        const tableState = state.get(table);

        if (/\bdrop\s+policy\s+if\s+exists\b/i.test(statement.sql)) {
          const name = policyNameFrom(statement.sql);
          if (name) tableState.policies.delete(name);
          continue;
        }

        if (/\bcreate\s+policy\b/i.test(statement.sql)) {
          const name = policyNameFrom(statement.sql);
          if (!name) continue;

          tableState.policies.set(name, {
            policy: name,
            command: policyCommand(statement.sql),
            role: policyRole(statement.sql),
            usesAdmin: usesAdminGuard(statement.sql),
            usesAuthUid: usesAuthUid(statement.sql),
            usesTenantGuard: usesTenantGuard(statement.sql),
            file: statement.file,
            line: statement.line,
          });
        }
      }
    }
  }

  return state;
}

function commandMatches(policy, expected) {
  return policy.command === expected || policy.command === 'all';
}

function roleAllowsClient(policy) {
  return policy.role === 'authenticated' || policy.role === 'public';
}

function matchesAccess(policy, expected) {
  if (expected === 'public') return policy.role === 'public' || policy.role === 'authenticated';
  if (expected === 'authenticated') return roleAllowsClient(policy) && !policy.usesAdmin;
  if (expected === 'admin') return roleAllowsClient(policy) && policy.usesAdmin;
  if (expected === 'own')
    return roleAllowsClient(policy) && policy.usesAuthUid && !policy.usesAdmin;
  if (expected === 'own_or_admin') {
    return roleAllowsClient(policy) && policy.usesAuthUid && policy.usesAdmin;
  }
  if (expected === 'tenant_or_admin') {
    return roleAllowsClient(policy) && policy.usesTenantGuard && policy.usesAdmin;
  }
  if (expected === 'service_role') return policy.role === 'service_role';
  return false;
}

function hasPolicy(policies, command, expected) {
  return policies.some(
    (policy) => commandMatches(policy, command) && matchesAccess(policy, expected),
  );
}

function summarizeTable(table, target, tableState) {
  const policies = [...(tableState?.policies.values() ?? [])];
  const failures = [];
  const readOk = hasPolicy(policies, 'select', target.read);

  if (!tableState?.rlsEnabled) {
    failures.push(`${table}: RLS non activee dans les migrations`);
  }
  if (!readOk) {
    failures.push(`${table}: policy SELECT attendue absente (${target.read})`);
  }

  let writesOk = true;
  if (target.writes === 'forbidden') {
    const writePolicies = policies.filter(
      (policy) =>
        commandMatches(policy, 'insert') ||
        commandMatches(policy, 'update') ||
        commandMatches(policy, 'delete'),
    );
    writesOk = writePolicies.length === 0;
    if (!writesOk)
      failures.push(`${table}: policies d'ecriture client presentes alors qu'interdites`);
  } else {
    for (const [command, expected] of Object.entries(target.writes)) {
      const commandOk = hasPolicy(policies, command, expected);
      writesOk = writesOk && commandOk;
      if (!commandOk)
        failures.push(`${table}: policy ${command.toUpperCase()} attendue absente (${expected})`);
    }
  }

  return {
    table,
    sensitivity: target.sensitivity,
    reason: target.reason,
    rlsEnabled: Boolean(tableState?.rlsEnabled),
    expectedRead: readOk,
    expectedWrites: writesOk,
    evidence: [
      tableState?.rlsEvidence && {
        policy: 'ENABLE ROW LEVEL SECURITY',
        ...tableState.rlsEvidence,
      },
      ...policies.map(({ policy, command, role, file, line }) => ({
        policy,
        command,
        role,
        file,
        line,
      })),
    ].filter(Boolean),
    failures,
  };
}

function buildReport() {
  const migrationState = collectMigrationState();
  const discoveredRlsTables = [...migrationState.entries()]
    .filter(([, tableState]) => tableState.rlsEnabled)
    .map(([table]) => table)
    .sort();
  const covered = {};
  const failures = [];
  const sensitiveWithoutExpectation = discoveredRlsTables.filter(
    (table) => !COVERED_TABLES[table] && !IGNORED_TABLES[table] && !NON_SENSITIVE_TABLES[table],
  );

  for (const [table, target] of Object.entries(COVERED_TABLES)) {
    const summary = summarizeTable(table, target, migrationState.get(table));
    covered[table] = summary;
    failures.push(...summary.failures);
  }

  for (const table of sensitiveWithoutExpectation) {
    failures.push(`${table}: table RLS publique sans classification dans check:supabase-rls`);
  }

  return {
    ok: failures.length === 0,
    covered,
    ignored: IGNORED_TABLES,
    nonSensitive: NON_SENSITIVE_TABLES,
    sensitiveWithoutExpectation,
    discoveredRlsTables,
    failures,
  };
}

const report = buildReport();

if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else if (report.ok) {
  console.log('check:supabase-rls ✅');
  console.log(`Tables RLS publiques detectees : ${report.discoveredRlsTables.length}`);
  console.log(`Tables couvertes : ${Object.keys(report.covered).length}`);
  console.log(`Tables ignorees : ${Object.keys(report.ignored).length}`);
  console.log(`Tables non sensibles : ${Object.keys(report.nonSensitive).length}`);
  console.log(
    `Tables sensibles sans policy attendue : ${report.sensitiveWithoutExpectation.length}`,
  );
  for (const table of Object.values(report.covered)) {
    const writeLabel =
      COVERED_TABLES[table.table].writes === 'forbidden'
        ? 'ecritures client interdites'
        : 'ecritures attendues';
    console.log(`- ${table.table}: RLS active, lecture attendue, ${writeLabel}`);
  }
} else {
  console.error('check:supabase-rls ❌');
  console.error(`Tables couvertes : ${Object.keys(report.covered).length}`);
  console.error(`Tables ignorees : ${Object.keys(report.ignored).length}`);
  console.error(`Tables non sensibles : ${Object.keys(report.nonSensitive).length}`);
  console.error(
    `Tables sensibles sans policy attendue : ${report.sensitiveWithoutExpectation.length}`,
  );
  for (const failure of report.failures) {
    console.error(`- ${failure}`);
  }
}

if (!report.ok) {
  process.exit(1);
}
