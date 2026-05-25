import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('contrat visuel prévoyance', () => {
  it('utilise C3 pour le revenu et des variantes distinctes pour les séries du graphe', () => {
    const css = readFileSync(new URL('../styles/index.css', import.meta.url), 'utf8');
    const sidebar = readFileSync(new URL('../components/Sidebar.tsx', import.meta.url), 'utf8');

    expect(css).toContain('--prevoyance-color-revenu: var(--color-c3);');
    expect(css).not.toContain('--prevoyance-color-revenu: var(--color-c1);');
    expect(css).toContain('--prevoyance-color-ro-alt:');
    expect(sidebar).toContain('prevoyance-mini-chart__segment--ro-alt');
  });
});
