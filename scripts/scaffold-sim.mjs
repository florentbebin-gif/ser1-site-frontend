#!/usr/bin/env node
// Usage: npm run scaffold:sim -- --id nouveau-sim --label "Nouveau simulateur"

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();

function readArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token?.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args.set(key, 'true');
      continue;
    }
    args.set(key, next);
    index += 1;
  }
  return args;
}

function requireArg(args, name) {
  const value = args.get(name);
  if (!value) {
    throw new Error(`Argument manquant : --${name}`);
  }
  return value;
}

function toPascalCase(value) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join('');
}

function toCamelCase(value) {
  const pascal = toPascalCase(value);
  return `${pascal[0].toLowerCase()}${pascal.slice(1)}`;
}

function validateId(id) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error('--id doit être en kebab-case, ex. nouveau-sim');
  }
}

function escapeSingleQuoted(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function writeNewFile(relativePath, content) {
  const absolutePath = path.join(ROOT, relativePath);
  if (fs.existsSync(absolutePath)) {
    throw new Error(`Fichier déjà existant : ${relativePath}`);
  }
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, 'utf8');
}

function replaceMarker(relativePath, marker, insertion) {
  const absolutePath = path.join(ROOT, relativePath);
  const content = fs.readFileSync(absolutePath, 'utf8');
  if (!content.includes(marker)) {
    throw new Error(`Marqueur introuvable dans ${relativePath} : ${marker}`);
  }
  fs.writeFileSync(absolutePath, content.replace(marker, `${insertion}${marker}`), 'utf8');
}

function main() {
  const args = readArgs(process.argv.slice(2));
  const id = requireArg(args, 'id');
  const label = requireArg(args, 'label');
  const pathValue = args.get('path') ?? `/sim/${id}`;
  const pageTestId = args.get('page-test-id') ?? `${id}-page`;
  const resetKey = args.get('reset-key') ?? id;

  validateId(id);
  if (!pathValue.startsWith('/sim/')) {
    throw new Error('--path doit commencer par /sim/');
  }

  const pascal = toPascalCase(id);
  const camel = toCamelCase(id);
  const safeLabel = escapeSingleQuoted(label);
  const safePath = escapeSingleQuoted(pathValue);
  const safePageTestId = escapeSingleQuoted(pageTestId);
  const safeResetKey = escapeSingleQuoted(resetKey);
  const tsxLabel = JSON.stringify(label);
  const tsxPageTestId = JSON.stringify(pageTestId);

  writeNewFile(
    `src/features/${id}/${pascal}Page.tsx`,
    `import { SimEmptyState, SimPageShell } from '@/components/ui/sim';
import { use${pascal}PageUXContract } from './hooks/use${pascal}PageUXContract';

export function ${pascal}Page() {
  const pageUX = use${pascal}PageUXContract({ synthesisReady: false });

  return (
    <SimPageShell
      title={${tsxLabel}}
      subtitle="Préparer le simulateur avec le gabarit SER1 standard."
      pageTestId={${tsxPageTestId}}
      notice={!pageUX.synthesisReady ? 'Complétez les paramètres pour activer la synthèse.' : null}
    >
      <SimPageShell.Main>
        <SimEmptyState
          illustration="chart"
          title="Simulateur prêt à configurer"
          description="Ajoutez les champs métier et branchez les calculs dans le moteur avant d'activer les résultats."
        />
      </SimPageShell.Main>
    </SimPageShell>
  );
}
`,
  );

  writeNewFile(
    `src/features/${id}/hooks/use${pascal}PageUXContract.ts`,
    `import { useMemo } from 'react';
import type { SimPageUXContract } from '@/components/ui/sim';

interface ${pascal}PageUXContractInput {
  synthesisReady: boolean;
}

export function use${pascal}PageUXContract({
  synthesisReady,
}: ${pascal}PageUXContractInput): SimPageUXContract {
  return useMemo(
    () => ({
      readiness: {
        status: synthesisReady ? 'ready' : 'waiting',
        reasons: synthesisReady ? undefined : ['inputs'],
      },
      synthesisReady,
      synthesisTargetId: '${id}-synthese',
      sections: [
        { id: '${id}-saisie', label: 'Saisie', targetId: '${id}-saisie' },
        { id: '${id}-synthese', label: 'Synthèse', targetId: '${id}-synthese' },
      ],
    }),
    [synthesisReady],
  );
}
`,
  );

  writeNewFile(
    `src/features/${id}/index.ts`,
    `export { ${pascal}Page } from './${pascal}Page';
export { use${pascal}PageUXContract } from './hooks/use${pascal}PageUXContract';
`,
  );

  replaceMarker(
    'src/routes/simRouteContracts.ts',
    '  // scaffold:sim contract',
    `  {
    id: '${id}',
    path: '${safePath}',
    label: '${safeLabel}',
    status: 'active',
    resetKey: '${safeResetKey}',
    pageTestId: '${safePageTestId}',
  },
`,
  );

  replaceMarker(
    'src/routes/appRoutes.ts',
    '// scaffold:sim component',
    `const ${pascal}Page = lazy(() =>
  import('../features/${id}').then(({ ${pascal}Page }) => ({ default: ${pascal}Page })),
);
`,
  );

  replaceMarker(
    'src/routes/appRoutes.ts',
    '  // scaffold:sim route-contract',
    `  ${camel}: getSimRouteContract('${id}'),
`,
  );

  replaceMarker(
    'src/routes/appRoutes.ts',
    '  // scaffold:sim app-route',
    `  {
    kind: 'route',
    access: 'private',
    path: SIM_ROUTES.${camel}.path,
    component: ${pascal}Page,
    lazy: true,
    contextLabel: SIM_ROUTES.${camel}.label,
    topbar: { ...SIM_TOPBAR, resetKey: SIM_ROUTES.${camel}.resetKey },
  },
`,
  );

  replaceMarker(
    'src/features/__tests__/simPageUXContracts.test.tsx',
    '// scaffold:sim ux-import',
    `import { use${pascal}PageUXContract } from '../${id}/hooks/use${pascal}PageUXContract';
`,
  );

  replaceMarker(
    'src/features/__tests__/simPageUXContracts.test.tsx',
    '  // scaffold:sim ux-contract',
    `  '${id}': {
    waiting: () => readContract(() => use${pascal}PageUXContract({ synthesisReady: false })),
    ready: () => readContract(() => use${pascal}PageUXContract({ synthesisReady: true })),
  },
`,
  );

  console.log(`Scaffold simulateur créé : ${pathValue}`);
  console.log('À lancer avant commit : npm run check puis npm run test:e2e:auth-pages');
}

main();
