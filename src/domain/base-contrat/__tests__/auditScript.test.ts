import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

describe('script audit Base-Contrat / DMTG Succession', () => {
  it('produit un JSON exploitable et nettoie son runtime temporaire', () => {
    const output = execFileSync(
      process.execPath,
      ['scripts/audit-base-contrat-dmtg.mjs', '--json'],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
      },
    );

    const metrics = JSON.parse(output) as {
      library?: { total?: { blocks?: number; sources?: number } };
      runtime?: { catalogProducts?: number; byProductAudience?: unknown[] };
      consumers?: Array<{ zone?: string }>;
    };

    expect(metrics.library?.total?.blocks).toBeGreaterThan(0);
    expect(metrics.library?.total?.sources).toBeGreaterThan(0);
    expect(metrics.runtime?.catalogProducts).toBeGreaterThan(0);
    expect(metrics.runtime?.byProductAudience?.length).toBeGreaterThan(0);
    expect(metrics.consumers?.some((consumer) => consumer.zone === 'engine')).toBe(false);
    expect(existsSync(join(process.cwd(), '.tmp', 'audit-base-contrat-runtime'))).toBe(false);
  });
});
