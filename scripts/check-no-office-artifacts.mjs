#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

const OFFICE_ARTIFACT_PATTERN = /\.(xls|xlsx|xlsm|ppt|pptx)$/i;

const trackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .map((file) => file.trim())
  .filter(Boolean);

const violations = trackedFiles.filter((file) => OFFICE_ARTIFACT_PATTERN.test(file));

if (violations.length > 0) {
  console.error('check:no-office-artifacts ❌ fichiers Office versionnes interdits');
  violations.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

console.log('check:no-office-artifacts ✅');
