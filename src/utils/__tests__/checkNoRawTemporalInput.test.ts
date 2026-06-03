import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = join(process.cwd(), 'scripts/check-no-raw-temporal-input.mjs');
const tempRoots: string[] = [];

function createRoot() {
  const root = mkdtempSync(join(tmpdir(), 'ser1-raw-temporal-input-'));
  tempRoots.push(root);
  return root;
}

function writeFixture(root: string, relativePath: string, content: string) {
  const fullPath = join(root, relativePath);
  mkdirSync(join(fullPath, '..'), { recursive: true });
  writeFileSync(fullPath, content, 'utf8');
}

function runCheck(root: string) {
  return spawnSync(process.execPath, [scriptPath, '--root', root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('check-no-raw-temporal-input', () => {
  it('signale les inputs date et month bruts dans les features', () => {
    const root = createRoot();

    writeFixture(
      root,
      'src/features/demo/DemoDate.tsx',
      'export function DemoDate() { return <input aria-label="Date" type="date" />; }',
    );
    writeFixture(
      root,
      'src/features/demo/DemoMonth.tsx',
      'export function DemoMonth() { return <input aria-label="Mois" type="month" />; }',
    );
    writeFixture(
      root,
      'src/pages/settings/DemoSettings.tsx',
      'export function DemoSettings() { return <input type="date" />; }',
    );

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('src/features/demo/DemoDate.tsx');
    expect(output).toContain('src/features/demo/DemoMonth.tsx');
    expect(output).not.toContain('DemoSettings.tsx');
  });

  it('accepte SimTemporalField (pas de type date/month littéral)', () => {
    const root = createRoot();

    writeFixture(
      root,
      'src/features/demo/Demo.tsx',
      'export function Demo() { return <SimTemporalField granularity="month" value="" onChange={() => {}} />; }',
    );

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(0);
    expect(output).toContain('Aucun <input type="date|month"> brut');
  });

  it('signale un input temporel brut exprimé par condition JSX', () => {
    const root = createRoot();

    writeFixture(
      root,
      'src/features/demo/DemoConditional.tsx',
      "export function DemoConditional({ month }: { month: boolean }) { return <input type={month ? 'month' : 'date'} />; }",
    );

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('src/features/demo/DemoConditional.tsx');
  });

  it('autorise la primitive canonique SimTemporalField', () => {
    const root = createRoot();

    writeFixture(
      root,
      'src/components/ui/sim/SimTemporalField.tsx',
      "export function SimTemporalField({ month }: { month: boolean }) { return <input type={month ? 'month' : 'date'} />; }",
    );

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(0);
    expect(output).toContain('Aucun <input type="date|month"> brut');
  });
});
