#!/usr/bin/env node
// Usage: npm run check:pptx-images

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const CHAPTERS_DIR = path.join(process.cwd(), 'public', 'pptx', 'chapters');
const MAX_IMAGE_BYTES = 1_200_000;
const MAX_TOTAL_BYTES = 9_000_000;

const images = fs
  .readdirSync(CHAPTERS_DIR)
  .filter((file) => /^ch-\d{2}\.png$/.test(file))
  .sort()
  .map((file) => {
    const fullPath = path.join(CHAPTERS_DIR, file);
    return {
      file: path.relative(process.cwd(), fullPath).split(path.sep).join('/'),
      bytes: fs.statSync(fullPath).size,
    };
  });

const total = images.reduce((sum, image) => sum + image.bytes, 0);
const failures = [];

for (const image of images) {
  if (image.bytes > MAX_IMAGE_BYTES) {
    failures.push(`${image.file}: ${image.bytes} octets > budget ${MAX_IMAGE_BYTES}`);
  }
}
if (total > MAX_TOTAL_BYTES) {
  failures.push(`public/pptx/chapters: total ${total} octets > budget ${MAX_TOTAL_BYTES}`);
}

if (failures.length > 0) {
  console.error('check:pptx-images ❌');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('check:pptx-images ✅');
console.log(`- images : ${images.length}`);
console.log(`- total : ${total} octets`);
