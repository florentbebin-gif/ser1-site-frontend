import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const STYLE_FILES = [
  '../styles/layout.css',
  '../styles/forms.css',
  '../styles/contracts.css',
  '../styles/sidebar.css',
  '../styles/frais.css',
  '../styles/modals.css',
  '../styles/responsive.css',
];

function readPrevoyanceCss(): string {
  return STYLE_FILES.map((file) => readFileSync(new URL(file, import.meta.url), 'utf8')).join('\n');
}

describe('contrat visuel prévoyance', () => {
  it('utilise C3 pour le revenu et des variantes distinctes pour les séries du graphe', () => {
    const css = readPrevoyanceCss();
    const sidebar = readFileSync(new URL('../components/Sidebar.tsx', import.meta.url), 'utf8');

    expect(css).toContain('--prevoyance-color-revenu: var(--color-c3);');
    expect(css).not.toContain('--prevoyance-color-revenu: var(--color-c1);');
    expect(css).toContain('--prevoyance-color-ro-alt:');
    expect(sidebar).toContain('prevoyance-mini-chart__segment--ro-alt');
  });
});
