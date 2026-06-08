#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  COLOR_POLICY_TOKENS_FILE,
  findVizTokenViolations,
  scanColorPolicy,
} from '../tools/ser1-color-policy.mjs';

const violations = scanColorPolicy();

// Extension UX-00b : le fichier tokens est allowlisté pour les fallbacks hex
// C1-C10, mais les tokens data-viz --viz-* doivent rester dérivés du thème.
const tokensPath = join(process.cwd(), COLOR_POLICY_TOKENS_FILE);
try {
  const tokensText = readFileSync(tokensPath, 'utf8');
  for (const violation of findVizTokenViolations(tokensText)) {
    violations.push({ file: COLOR_POLICY_TOKENS_FILE, ...violation });
  }
} catch {
  // Fichier tokens absent : le scan principal gère déjà l'absence.
}

if (violations.length > 0) {
  console.error('check:css-colors ❌  Couleurs runtime hors contrat :');
  for (const violation of violations) {
    console.error(`  ${violation.file}:${violation.line}  ${violation.value} (${violation.kind})`);
    console.error(`    ${violation.message}`);
  }
  process.exit(1);
}

console.log('check:css-colors ✅');
