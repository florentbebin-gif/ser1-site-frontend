import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import { describe, expect, it } from 'vitest';

const SWITCH_OFF_RULES = [
  {
    file: 'src/components/ModeToggle.css',
    selector: '.mode-toggle-pill',
  },
  {
    file: 'src/features/placement/styles/controls.css',
    selector: '.pl-toggle__switch',
  },
  {
    file: 'src/features/credit/styles/fields.css',
    selector: '.ci-toggle__switch',
  },
] as const;

function readRule(file: string, selector: string): string {
  const source = readFileSync(join(process.cwd(), file), 'utf8');
  const start = source.indexOf(`${selector} {`);

  expect(start, `${file} doit contenir ${selector}`).toBeGreaterThanOrEqual(0);

  const end = source.indexOf('}', start);
  expect(end, `${file} doit fermer la regle ${selector}`).toBeGreaterThan(start);

  return source.slice(start, end);
}

describe('switches canoniques', () => {
  it('gardent la piste off en C8', () => {
    for (const { file, selector } of SWITCH_OFF_RULES) {
      expect(readRule(file, selector)).toContain('background: var(--color-c8);');
    }
  });
});
