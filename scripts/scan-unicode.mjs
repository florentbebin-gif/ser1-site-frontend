import fs from 'fs';
import path from 'path';

function walkDir(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const skip = ['node_modules', 'dist', '.git', '.claude'];
      if (!skip.includes(entry.name)) walkDir(fullPath, fileList);
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx|sql)$/.test(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const base = path.resolve('.');
let allFiles = [];
for (const d of ['src', 'tests', 'supabase']) {
  const full = path.join(base, d);
  if (fs.existsSync(full)) allFiles = allFiles.concat(walkDir(full));
}

// Bidi + invisible Unicode: Cf category + bidi controls
const BIDI = /[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF\u00AD]/g;
let hits = [];

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    const matches = [...line.matchAll(BIDI)];
    if (matches.length > 0) {
      const rel = path.relative(base, file);
      hits.push({
        file: rel,
        line: i + 1,
        chars: matches.map(m => 'U+' + m[0].charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'))
      });
    }
  });
}

if (hits.length === 0) {
  console.log(`CLEAN: Aucun caractere invisible/bidi detecte (${allFiles.length} fichiers scannes)`);
} else {
  console.log(`ALERT: ${hits.length} occurrence(s) trouvee(s):`);
  hits.forEach(h => console.log(`  ${h.file}:${h.line} -> ${h.chars.join(', ')}`));
}
