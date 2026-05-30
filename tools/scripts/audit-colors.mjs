#!/usr/bin/env node
// Usage: node tools/scripts/audit-colors.mjs — audit ponctuel, non bloquant.

import {
  COLOR_POLICY_ROOTS,
  collectColorPolicyFiles,
  getColorPolicyAllowance,
  scanColorPolicy,
  toRepoPath,
} from '../ser1-color-policy.mjs';

const root = process.cwd();
const files = collectColorPolicyFiles(root);
const findings = scanColorPolicy(root);

const allowedByReason = new Map();
for (const file of files) {
  const repoPath = toRepoPath(file, root);
  const allowance = getColorPolicyAllowance(repoPath);
  if (allowance) {
    allowedByReason.set(allowance.label, (allowedByReason.get(allowance.label) ?? 0) + 1);
  }
}

console.log('\nAudit couleurs SER1');
console.log('='.repeat(70));
console.log(`Racines scannees : ${COLOR_POLICY_ROOTS.join(', ')}`);
console.log(`Fichiers analyses : ${files.length}`);
console.log(`Violations runtime : ${findings.length}`);

if (allowedByReason.size > 0) {
  console.log('\nExceptions appliquees :');
  for (const [reason, count] of [...allowedByReason.entries()].sort()) {
    console.log(`- ${reason}: ${count} fichier(s)`);
  }
}

if (findings.length > 0) {
  console.log('\nViolations :');
  for (const finding of findings.slice(0, 50)) {
    console.log(`- ${finding.file}:${finding.line} ${finding.value} (${finding.kind})`);
  }
  if (findings.length > 50) {
    console.log(`... ${findings.length - 50} violation(s) supplementaire(s)`);
  }
  process.exitCode = 1;
} else {
  console.log('\nAucune violation runtime hors allowlist.');
}
