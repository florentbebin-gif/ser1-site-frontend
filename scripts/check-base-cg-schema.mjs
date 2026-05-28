#!/usr/bin/env node
// Usage: npm run check:base-cg-schema

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');
const MIGRATION_FILE = '20260528000100_base_cg_retraite_contracts_canonical.sql';
const MIGRATION_PATH = path.join(MIGRATIONS_DIR, MIGRATION_FILE);

const EXPECTED_COLUMNS = [
  'contract_id text PRIMARY KEY',
  'source_id text NOT NULL',
  'company text NOT NULL',
  'contract_name text NOT NULL',
  'contract_type text NOT NULL',
  'per_compartment text NULL',
  'contract_data jsonb NOT NULL',
  'row_hash text NOT NULL',
  'is_deleted boolean NOT NULL DEFAULT false',
  'created_at timestamptz NOT NULL DEFAULT now()',
  'updated_at timestamptz NOT NULL DEFAULT now()',
];

const EXPECTED_INDEXES = [
  'idx_base_cg_retraite_contracts_is_deleted',
  'idx_base_cg_retraite_contracts_company',
  'idx_base_cg_retraite_contracts_type',
  'idx_base_cg_retraite_contracts_compartment',
];

const EXPECTED_CONSTRAINTS = [
  'base_cg_retraite_contracts_contract_type_chk',
  'base_cg_retraite_contracts_per_compartment_chk',
];

function normalizeSql(sql) {
  return sql.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();
}

function fail(message) {
  console.error(`- ${message}`);
  return false;
}

if (!fs.existsSync(MIGRATION_PATH)) {
  console.error('check:base-cg-schema ❌');
  console.error(`- migration absente: ${MIGRATION_FILE}`);
  process.exit(1);
}

const raw = fs.readFileSync(MIGRATION_PATH, 'utf8');
const sql = normalizeSql(raw);
const oldTmpGenerator = ['.tmp', `gen-${'basecg'}.mjs`].join('/');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

assert(
  /canonical_hash initial normalisé:\s+[a-f0-9]{64}/i.test(raw),
  'commentaire provenance canonical_hash initial absent ou invalide',
);
assert(
  /Commande de vérification: node scripts\/check-base-cg-canonical-migration\.mjs --check/i.test(
    raw,
  ),
  'commande de vérification reproductible absente du commentaire',
);
assert(!raw.includes(oldTmpGenerator), 'ancienne commande .tmp non reproductible interdite');
assert(
  /contract_count initial normalisé:\s+392\b/.test(raw),
  'contract_count initial attendu absent du commentaire',
);
assert(
  /points_contract_count initial normalisé:\s+12\b/.test(raw),
  'points_contract_count initial attendu absent du commentaire',
);
assert(
  /CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions/i.test(raw),
  'extension pgcrypto requise pour hashes SQL absente',
);
assert(
  /CREATE TABLE IF NOT EXISTS public\.base_cg_retraite_contracts/i.test(raw),
  'table base_cg_retraite_contracts absente',
);
assert(
  /CREATE TABLE IF NOT EXISTS public\.base_cg_retraite_catalog_meta/i.test(raw),
  'table base_cg_retraite_catalog_meta absente',
);

for (const column of EXPECTED_COLUMNS) {
  assert(sql.toLowerCase().includes(column.toLowerCase()), `colonne attendue absente: ${column}`);
}

for (const indexName of EXPECTED_INDEXES) {
  assert(sql.includes(indexName), `index attendu absent: ${indexName}`);
}

for (const constraintName of EXPECTED_CONSTRAINTS) {
  assert(sql.includes(constraintName), `contrainte attendue absente: ${constraintName}`);
}

assert(
  /contract_type IN \('PERIN', 'PERP', 'MADELIN', 'ARTICLE83', 'PEROB', 'PERCO', 'PERECO', 'PER_POINTS', 'AUTRE'\)/i.test(
    raw,
  ),
  'contrainte contract_type incomplète',
);
assert(
  /per_compartment IS NULL OR per_compartment IN \('C0', 'C1', 'C1_BIS', 'C2', 'C3'\)/i.test(raw),
  'contrainte per_compartment incomplète',
);

assert(
  /trg_base_cg_retraite_contracts_updated_at/i.test(sql),
  'trigger updated_at contrats absent',
);
assert(
  /CREATE OR REPLACE FUNCTION public\.set_base_cg_retraite_contract_row_hash/i.test(raw),
  'fonction SQL row_hash contrats absente',
);
assert(
  /CREATE TRIGGER trg_base_cg_retraite_contracts_row_hash/i.test(raw),
  'trigger SQL row_hash contrats absent',
);
assert(
  /ALTER TABLE public\.base_cg_retraite_contracts ENABLE ROW LEVEL SECURITY/i.test(raw),
  'RLS contrats absente',
);
assert(
  /FOREIGN KEY \(contract_id\) REFERENCES public\.base_cg_retraite_contracts\(contract_id\)/i.test(
    raw,
  ),
  'FK documents -> contracts absente',
);
assert(
  /FROM public\.base_cg_retraite_overrides\s+WHERE is_deleted IS DISTINCT FROM true/i.test(sql),
  'backfill additive depuis anciennes overrides absent',
);
assert(
  /contract_data - 'documents'/i.test(raw),
  'backfill legacy doit persister contract_data sans documents',
);
assert(
  /encode\(extensions\.digest\(\(contract_data - 'documents'\)::text, 'sha256'\), 'hex'\)/i.test(
    raw,
  ),
  'row_hash legacy SHA-256 sur contract_data persisté absent',
);
assert(!/legacy-\s*\|\|\s*md5/i.test(raw), 'row_hash legacy md5/prefixé interdit');
assert(
  /UPDATE public\.base_cg_retraite_contracts AS contracts SET is_deleted = true/i.test(sql),
  'soft-delete depuis anciennes overrides absent',
);
assert(
  /UPDATE public\.base_cg_retraite_contracts SET row_hash = encode\(extensions\.digest\(contract_data::text, 'sha256'\), 'hex'\)/i.test(
    sql,
  ),
  'recalcul final row_hash sur contract_data persisté absent',
);
assert(
  /CREATE OR REPLACE FUNCTION public\.refresh_base_cg_retraite_catalog_meta/i.test(raw),
  'fonction refresh catalog_meta absente',
);
assert(
  /WITH active_contracts AS \( SELECT .*? FROM public\.base_cg_retraite_contracts WHERE is_deleted IS false \)/i.test(
    sql,
  ),
  'catalog_meta doit être recalculée sur les contrats actifs finaux',
);
assert(
  /string_agg\( contract_id \|\| .*? row_hash, .*? ORDER BY contract_id \)/i.test(sql),
  'canonical_hash final doit dépendre des contrats actifs et row_hash',
);
assert(
  /SELECT count\(\*\)::integer FROM public\.base_cg_retraite_documents/i.test(sql),
  'recalcul document_count depuis base_cg_retraite_documents absent',
);
assert(
  /SELECT public\.refresh_base_cg_retraite_catalog_meta\(\)/i.test(raw),
  'appel initial refresh catalog_meta absent',
);
assert(
  /CREATE TRIGGER trg_base_cg_retraite_contracts_refresh_meta/i.test(raw),
  'trigger refresh catalog_meta sur contrats absent',
);
assert(
  /CREATE TRIGGER trg_base_cg_retraite_documents_refresh_meta/i.test(raw),
  'trigger refresh catalog_meta sur documents absent',
);

const allMigrations = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter((file) => file.endsWith('.sql'))
  .map((file) => fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'))
  .join('\n');
const allSql = normalizeSql(allMigrations);
for (const functionName of [
  'set_base_cg_retraite_contract_row_hash',
  'refresh_base_cg_retraite_catalog_meta',
  'refresh_base_cg_retraite_catalog_meta_trigger',
]) {
  assert(
    new RegExp(
      String.raw`REVOKE EXECUTE ON FUNCTION public\.${functionName}\s*\(\s*\)\s+FROM PUBLIC\s*,\s*anon\s*,\s*authenticated`,
      'i',
    ).test(allSql),
    `REVOKE EXECUTE anon/authenticated absent: ${functionName}`,
  );
}

const BASE_CG_GRANTS = [
  { table: 'base_cg_retraite_contracts', writesAllowed: true },
  { table: 'base_cg_retraite_catalog_meta', writesAllowed: false },
  { table: 'base_cg_retraite_documents', writesAllowed: true },
];
for (const { table, writesAllowed } of BASE_CG_GRANTS) {
  assert(
    new RegExp(String.raw`GRANT SELECT ON public\.${table} TO authenticated`, 'i').test(allSql),
    `GRANT SELECT authenticated absent: ${table}`,
  );
  const writeGrantPattern = new RegExp(
    String.raw`GRANT INSERT, UPDATE, DELETE ON public\.${table} TO authenticated`,
    'i',
  );
  if (writesAllowed) {
    assert(
      writeGrantPattern.test(allSql),
      `GRANT INSERT/UPDATE/DELETE authenticated absent: ${table}`,
    );
  } else {
    assert(!writeGrantPattern.test(allSql), `GRANT INSERT/UPDATE/DELETE interdit: ${table}`);
    assert(
      new RegExp(
        String.raw`REVOKE INSERT, UPDATE, DELETE ON public\.${table} FROM authenticated`,
        'i',
      ).test(allSql),
      `REVOKE INSERT/UPDATE/DELETE authenticated absent: ${table}`,
    );
  }
}
assert(
  !/CREATE POLICY "base_cg_retraite_catalog_meta_(insert|update|delete)_admin"/i.test(raw),
  'policy write admin interdite sur base_cg_retraite_catalog_meta',
);
assert(
  !/DROP TABLE IF EXISTS public\.base_cg_retraite_overrides/i.test(allMigrations),
  'drop destructif base_cg_retraite_overrides interdit dans cette PR additive',
);

if (failures.length > 0) {
  console.error('check:base-cg-schema ❌');
  failures.forEach(fail);
  process.exit(1);
}

console.log('check:base-cg-schema ✅');
console.log(`- ${MIGRATION_FILE}: contrats, meta, hashes, soft-delete, indexes, trigger, FK`);
