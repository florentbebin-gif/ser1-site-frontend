#!/usr/bin/env node

import { scanColorPolicy } from '../tools/ser1-color-policy.mjs';

const violations = scanColorPolicy();

if (violations.length > 0) {
  console.error('check:css-colors ❌  Couleurs runtime hors contrat :');
  for (const violation of violations) {
    console.error(`  ${violation.file}:${violation.line}  ${violation.value} (${violation.kind})`);
    console.error(`    ${violation.message}`);
  }
  process.exit(1);
}

console.log('check:css-colors ✅');
