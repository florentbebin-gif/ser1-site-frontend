import { CATALOG } from '../src/domain/base-contrat/catalog.ts';
import { getRules } from '../src/domain/base-contrat/rules/index.ts';
import type { RuleBlock } from '../src/domain/base-contrat/rules/types.ts';

const SENSITIVE = [
  /\b\d+([,.]\d+)?\s?%/,
  /\b\d[\d\s]*€/,
  /\bArticle\b/i,
  /\bCGI\b/,
  /\bCSS\b/,
  /BOI-/,
  /\bBOSS\b/i,
  /\bURSSAF\b/i,
  /\bDMTG\b/i,
  /\b990\s*I\b/i,
  /\b757\s*B\b/i,
];
const OFFICIAL = [
  'legifrance.gouv.fr',
  'bofip.impots.gouv.fr',
  'boss.gouv.fr',
  'impots.gouv.fr',
  'service-public.fr',
  'urssaf.fr',
];

const seen = new Set<string>();

for (const p of CATALOG) {
  for (const aud of ['pp', 'pm'] as const) {
    const rules = getRules(p.id, aud);
    const blocks: RuleBlock[] = [...rules.constitution, ...rules.sortie, ...rules.deces];
    for (const b of blocks) {
      const texts = [b.title, ...b.bullets];
      const sensitive = texts.some((t) => SENSITIVE.some((rx) => rx.test(t)));
      if (!sensitive) continue;
      const hasSource = b.sources?.some((s) => OFFICIAL.some((d) => s.url.includes(d)));
      const hasPrudent = b.bullets.some((x) => x.includes('À confirmer'));
      if (!hasSource && !hasPrudent) {
        const key = `${b.title}`;
        if (!seen.has(key)) {
          seen.add(key);
          console.log(`MISSING | ${p.id} | ${b.title}`);
        }
      }
    }
  }
}
