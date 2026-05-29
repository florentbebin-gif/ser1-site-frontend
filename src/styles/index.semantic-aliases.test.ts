import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./index.css', import.meta.url), 'utf8');

const semanticAliases = [
  '--surface-page',
  '--surface-card',
  '--surface-muted',
  '--surface-elevated',
  '--text-primary',
  '--text-secondary',
  '--text-muted',
  '--text-on-action',
  '--border-default',
  '--border-strong',
  '--border-subtle',
  '--action-primary',
  '--action-primary-hover',
  '--action-secondary',
  '--state-success',
  '--state-warning',
  '--state-danger',
  '--state-info',
  '--overlay-modal',
  '--focus-ring-color',
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('alias semantiques du theme', () => {
  it('derive chaque alias runtime des tokens C1-C10', () => {
    for (const alias of semanticAliases) {
      expect(css, alias).toMatch(
        new RegExp(
          `${escapeRegExp(alias)}:\\s*(?:var\\(--color-c\\d+\\)|color-mix\\([^;]*var\\(--color-c\\d+\\)[^;]*\\));`,
        ),
      );
    }
  });

  it('conserve le focus ring compose tout en exposant sa couleur', () => {
    expect(css).toMatch(/--focus-ring-color:\s*var\(--color-c3\);/);
    expect(css).toMatch(/--focus-ring:\s*0 0 0 2px var\(--focus-ring-color\), 0 0 0 4px #fff;/);
  });
});
