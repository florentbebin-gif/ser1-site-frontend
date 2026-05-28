#!/usr/bin/env node
// Usage: node scripts/check-base-cg-canonical-migration.mjs --check

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const MIGRATION_FILE = path.join(
  ROOT,
  'supabase',
  'migrations',
  '20260528000100_base_cg_retraite_contracts_canonical.sql',
);

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function normalizeSql(sql) {
  return sql.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();
}

if (!process.argv.includes('--check')) {
  console.error(
    'Ce script sert de verification reproductible de la migration canonique. Utiliser --check.',
  );
  process.exit(1);
}

if (!fs.existsSync(MIGRATION_FILE)) {
  console.error('check-base-cg-canonical-migration --check ❌');
  console.error(`- migration absente: ${path.relative(ROOT, MIGRATION_FILE)}`);
  process.exit(1);
}

const raw = fs.readFileSync(MIGRATION_FILE, 'utf8');
const sql = normalizeSql(raw);
const oldTmpGenerator = ['.tmp', `gen-${'basecg'}.mjs`].join('/');
const valuesBlock = raw.match(
  /INSERT INTO public\.base_cg_retraite_contracts \([\s\S]*?\) VALUES([\s\S]*?)ON CONFLICT \(contract_id\)/,
)?.[1];
const initialContractCount = Number(
  raw.match(/contract_count initial normalisé:\s+(\d+)/)?.[1] ?? NaN,
);

assert(
  /Commande de vérification: node scripts\/check-base-cg-canonical-migration\.mjs --check/.test(
    raw,
  ),
  'commentaire de commande versionnee absent',
);
assert(
  !raw.includes(oldTmpGenerator),
  'ancienne commande .tmp non reproductible encore referencee',
);
assert(Number.isInteger(initialContractCount), 'contract_count initial absent du commentaire');
assert(Boolean(valuesBlock), 'bloc INSERT canonique introuvable');

if (valuesBlock) {
  const rowCount = valuesBlock.match(/\n\s{2}\('/g)?.length ?? 0;
  const rowHashCount = valuesBlock.match(/,\s*'[a-f0-9]{64}',\s*false\)?/g)?.length ?? 0;
  assert(
    rowCount === initialContractCount,
    `nombre de lignes generees ${rowCount} != ${initialContractCount}`,
  );
  assert(
    rowHashCount === rowCount,
    'chaque ligne canonique doit porter un row_hash SHA-256 initial',
  );
}

assert(
  /CREATE OR REPLACE FUNCTION public\.set_base_cg_retraite_contract_row_hash/i.test(raw),
  'fonction SQL row_hash absente',
);
assert(
  /CREATE TRIGGER trg_base_cg_retraite_contracts_row_hash/i.test(raw),
  'trigger SQL row_hash absent',
);
assert(
  /CREATE OR REPLACE FUNCTION public\.refresh_base_cg_retraite_catalog_meta/i.test(raw),
  'fonction SQL refresh meta absente',
);
assert(
  /CREATE TRIGGER trg_base_cg_retraite_contracts_refresh_meta/i.test(raw),
  'trigger refresh meta contrats absent',
);
assert(
  /CREATE TRIGGER trg_base_cg_retraite_documents_refresh_meta/i.test(raw),
  'trigger refresh meta documents absent',
);
assert(
  /ON CONFLICT \(catalog_key\) DO UPDATE SET/i.test(sql),
  'refresh meta doit upsert la ligne catalog_meta',
);

if (failures.length > 0) {
  console.error('check-base-cg-canonical-migration --check ❌');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('check-base-cg-canonical-migration --check ✅');
console.log(`- ${path.relative(ROOT, MIGRATION_FILE)}: migration canonique verifiee`);
