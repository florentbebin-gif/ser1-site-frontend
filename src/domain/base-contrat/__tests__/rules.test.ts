/**
 * Tests du référentiel des règles fiscales (PR5).
 *
 * 1. Tous les produits du catalogue retournent des règles non-nulles.
 * 2. Pas de jargon dev dans les strings UI (title/bullets).
 * 3. Coverage : 100% de produits avec règles réelles.
 * 4. Confidence policy : chaque bloc a confidence, politique d'écriture respectée.
 */

import { describe, it, expect, vi } from 'vitest';
import { CATALOG, CATALOG_PP_PM_SPLIT_MAP } from '../catalog';
import { getRules, hasSocleRules } from '../rules/index';
import type { RuleBlock } from '../rules/types';

const AUDIENCES = ['pp', 'pm'] as const;

// ─────────────────────────────────────────────────────────────
// 1. Tous les produits retournent des règles rendables
// ─────────────────────────────────────────────────────────────

describe('getRules — couverture universelle', () => {
  for (const product of CATALOG) {
    const audience = product.ppEligible ? 'pp' : 'pm';
    it(`${product.id} (${audience}) — règles non-nulles avec les 3 phases`, () => {
      const rules = getRules(product.id, audience);
      expect(rules).toBeDefined();
      expect(Array.isArray(rules.constitution)).toBe(true);
      expect(Array.isArray(rules.sortie)).toBe(true);
      expect(Array.isArray(rules.deces)).toBe(true);
      expect(rules.constitution.length).toBeGreaterThanOrEqual(1);
      expect(rules.sortie.length).toBeGreaterThanOrEqual(1);
      expect(rules.deces.length).toBeGreaterThanOrEqual(1);
    });
  }
});

describe('getRules — chaque bloc a title + bullets non vides', () => {
  for (const product of CATALOG) {
    const audience = product.ppEligible ? 'pp' : 'pm';
    it(`${product.id} — blocs valides`, () => {
      const rules = getRules(product.id, audience);
      const allBlocks = [...rules.constitution, ...rules.sortie, ...rules.deces];
      for (const block of allBlocks) {
        expect(block.title, `title vide dans ${product.id}`).toBeTruthy();
        expect(Array.isArray(block.bullets), `bullets non-array dans ${product.id}`).toBe(true);
        expect(block.bullets.length, `bullets vide dans ${product.id}`).toBeGreaterThanOrEqual(1);
        for (const bullet of block.bullets) {
          expect(bullet.trim().length, `bullet vide dans ${product.id}`).toBeGreaterThan(0);
        }
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. Pas de jargon dev dans les strings UI
// ─────────────────────────────────────────────────────────────

const DEV_PATTERNS = [
  /_pp\b/,
  /_pm\b/,
  /\[.*\]/,
  /\{.*\}/,
  /\bpayload\b/i,
  /\bschema\b/i,
  /\bslug\b/i,
  /\bcontrat_capitalisation\b/,
  /\bassurance_vie\b/,
  /\bproductId\b/,
  /\bundefined\b/,
  /\bnull\b/,
];

describe('getRules — pas de jargon technique dans title/bullets', () => {
  for (const product of CATALOG) {
    const audience = product.ppEligible ? 'pp' : 'pm';
    it(`${product.id} — UI clean (no dev jargon)`, () => {
      const rules = getRules(product.id, audience);
      const allBlocks = [...rules.constitution, ...rules.sortie, ...rules.deces];
      for (const block of allBlocks) {
        for (const pattern of DEV_PATTERNS) {
          expect(
            pattern.test(block.title),
            `Jargon "${pattern}" trouvé dans title de ${product.id}: "${block.title}"`,
          ).toBe(false);
          for (const bullet of block.bullets) {
            expect(
              pattern.test(bullet),
              `Jargon "${pattern}" trouvé dans bullet de ${product.id}: "${bullet}"`,
            ).toBe(false);
          }
        }
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. Coverage — produits avec règles réelles
// ─────────────────────────────────────────────────────────────

describe('hasSocleRules — coverage report', () => {
  it('100 % des produits ont des règles réelles', () => {
    const withRules = CATALOG.filter((p) => hasSocleRules(p.id));
    expect(withRules.length).toBe(CATALOG.length);
  });

  it('legacy split id — warning explicite en dev', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    getRules('cto', 'pp');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Legacy productId "cto" is deprecated.'),
    );

    warnSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────
// 4. Produits clés — règles réelles attendues
// ─────────────────────────────────────────────────────────────

describe('socle PR5 — produits clés avec règles réelles', () => {
  const SOCLE_IDS = [
    'assurance_vie',
    'contrat_capitalisation_pp',
    'cto_pp',
    'pea',
    'pea_pme',
    'perin_assurance',
    'perin_bancaire',
    'residence_principale',
    'locatif_nu_pp',
    'locatif_meuble_lmnp',
    'parts_scpi_pp',
    'tontine_pp',
    'prevoyance_individuelle_deces',
    'prevoyance_individuelle_itt_invalidite',
    'livret_a',
    'ldds',
    'lep',
    'crypto_actifs_pp',
    'metaux_precieux_pp',
  ];

  for (const id of SOCLE_IDS) {
    it(`${id} — règles réelles (non vide)`, () => {
      expect(hasSocleRules(id), `${id} n'a pas de règles`).toBe(true);
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. Audience PM — produits non éligibles retournent quand même des règles
// ─────────────────────────────────────────────────────────────

describe('getRules — audience PM sur produits PP-only', () => {
  it('assurance_vie (PP only) — getRules(pm) retourne quand même des règles (fallback)', () => {
    const rules = getRules('assurance_vie', 'pm');
    expect(rules).toBeDefined();
    // Peut être les règles spécifiques PM ou les règles PP (fallback) — toujours rendable
    expect(rules.constitution.length).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────
// 6. Stabilité pour id inconnu
// ─────────────────────────────────────────────────────────────

describe('getRules — id inconnu', () => {
  for (const audience of AUDIENCES) {
    it(`getRules("produit_inexistant", "${audience}") → objet vide sans crash`, () => {
      const rules = getRules('produit_inexistant', audience);
      expect(rules).toBeDefined();
      expect(rules.constitution.length).toBe(0);
      expect(rules.sortie.length).toBe(0);
      expect(rules.deces.length).toBe(0);
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 7. Confidence policy — tous les blocs ont un niveau de confiance valide
// ─────────────────────────────────────────────────────────────

const VALID_CONFIDENCE = ['elevee', 'moyenne', 'faible'];

function allBlocks(productId: string): RuleBlock[] {
  const pp = getRules(productId, 'pp');
  const pm = getRules(productId, 'pm');
  return [
    ...pp.constitution, ...pp.sortie, ...pp.deces,
    ...pm.constitution, ...pm.sortie, ...pm.deces,
  ];
}

describe('confidence policy — chaque bloc a une confiance valide', () => {
  for (const product of CATALOG) {
    it(`${product.id} — confidence présente et valide`, () => {
      const blocks = allBlocks(product.id);
      for (const block of blocks) {
        expect(
          VALID_CONFIDENCE.includes(block.confidence),
          `Confidence invalide "${block.confidence}" dans ${product.id} / "${block.title}"`,
        ).toBe(true);
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 8. Confidence policy — blocs moyenne/faible doivent avoir "À confirmer"
// ─────────────────────────────────────────────────────────────

describe('confidence policy — moyenne/faible → "À confirmer" dans au moins 1 bullet', () => {
  for (const product of CATALOG) {
    it(`${product.id} — prudence rédactionnelle`, () => {
      const blocks = allBlocks(product.id);
      for (const block of blocks) {
        if (block.confidence === 'moyenne' || block.confidence === 'faible') {
          const hasConfirmer = block.bullets.some((b) => b.includes('À confirmer'));
          expect(
            hasConfirmer,
            `Bloc "${block.title}" (${product.id}) confidence=${block.confidence} sans "À confirmer" dans les bullets`,
          ).toBe(true);
        }
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 9. Confidence policy — moyenne/faible doivent avoir dependencies
// ─────────────────────────────────────────────────────────────

describe('confidence policy — moyenne/faible → dependencies non vides', () => {
  for (const product of CATALOG) {
    it(`${product.id} — dependencies présentes`, () => {
      const blocks = allBlocks(product.id);
      for (const block of blocks) {
        if (block.confidence === 'moyenne' || block.confidence === 'faible') {
          expect(
            Array.isArray(block.dependencies) && block.dependencies.length > 0,
            `Bloc "${block.title}" (${product.id}) confidence=${block.confidence} sans dependencies`,
          ).toBe(true);
        }
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 10. Sources — URLs valides https://
// ─────────────────────────────────────────────────────────────
// (Section 12 below enforces official domains for sensitive claims)

describe('confidence policy — sources ont des URLs https valides', () => {
  for (const product of CATALOG) {
    it(`${product.id} — sources URLs`, () => {
      const blocks = allBlocks(product.id);
      for (const block of blocks) {
        if (block.sources) {
          for (const src of block.sources) {
            expect(src.label.length, `Source sans label dans ${product.id}`).toBeGreaterThan(0);
            expect(
              src.url.startsWith('https://'),
              `URL invalide "${src.url}" dans ${product.id} / "${block.title}"`,
            ).toBe(true);
          }
        }
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 11. Strings interdites — PR6 qualité rédactionnelle
// ─────────────────────────────────────────────────────────────

describe('strings interdites — PR6 fiabilisation', () => {
  it('audience PM — couverture pmEligible (3 phases non vides + contenu PM safe)', () => {
    const PM_FORBIDDEN_PATTERNS: RegExp[] = [
      /décès/i,
      /deces/i,
      /ne\s+d[eé]c[eè]de\s+pas/i,
      /succession/i,
      /990\s*I/i,
      /757\s*B/i,
      /usufruitier au décès/i,
      /au jour du décès/i,
      /\bDMTG\b/i,
    ];

    for (const product of CATALOG.filter((p) => p.pmEligible)) {
      const rules = getRules(product.id, 'pm');
      expect(rules.constitution.length, `constitution vide en PM pour ${product.id}`).toBeGreaterThanOrEqual(1);
      expect(rules.sortie.length, `sortie vide en PM pour ${product.id}`).toBeGreaterThanOrEqual(1);
      expect(rules.deces.length, `fin de vie vide en PM pour ${product.id}`).toBeGreaterThanOrEqual(1);

      const pmDeathTexts = rules.deces.flatMap((b) => [b.title, ...b.bullets]).join(' ');
      expect(
        /dissolution|liquidation|cession|clôture|cloture|cessation/i.test(pmDeathTexts),
        `Phase fin de vie PM sans événement de sortie explicite pour ${product.id}`,
      ).toBe(true);
      expect(
        /r[eé]sultat|fiscal|imposition|assiette|IS|IR|boni|mali/i.test(pmDeathTexts),
        `Phase fin de vie PM sans traitement fiscal/résultat explicite pour ${product.id}`,
      ).toBe(true);

      const allTexts = [
        ...rules.constitution.flatMap((b) => [b.title, ...b.bullets]),
        ...rules.sortie.flatMap((b) => [b.title, ...b.bullets]),
        ...rules.deces.flatMap((b) => [b.title, ...b.bullets]),
      ];

      for (const text of allTexts) {
        for (const pattern of PM_FORBIDDEN_PATTERNS) {
          expect(
            pattern.test(text),
            `Pattern interdit ${pattern} trouvé en PM pour ${product.id}: "${text}"`,
          ).toBe(false);
        }
      }
    }
  });

  it('audience routing — produits PP+PM retournent des règles distinctes', () => {
    for (const split of Object.values(CATALOG_PP_PM_SPLIT_MAP)) {
      const ppRules = getRules(split.ppId, 'pp');
      const pmRules = getRules(split.pmId, 'pm');

      expect(
        JSON.stringify(ppRules) !== JSON.stringify(pmRules),
        `Routing audience non différencié pour ${split.ppId} / ${split.pmId}`,
      ).toBe(true);
    }
  });

  it('audience PM — phase 3 standardisée sur produits PM éligibles', () => {
    const PM_PHASE_3_TITLE = 'Fin de vie / sortie de la PM';

    for (const product of CATALOG.filter((p) => p.pmEligible)) {
      const rules = getRules(product.id, 'pm');

      expect(
        rules.deces.length,
        `Phase 3 vide en PM pour ${product.id}`,
      ).toBeGreaterThanOrEqual(1);

      for (const block of rules.deces) {
        expect(
          block.title,
          `Titre phase 3 PM non standardisé pour ${product.id}: "${block.title}"`,
        ).toBe(PM_PHASE_3_TITLE);
      }
    }
  });

  it('prevoyance_deces (PP) — pas de "2,5 % du PASS" dans constitution', () => {
    const rules = getRules('prevoyance_individuelle_deces', 'pp');
    const allBullets = rules.constitution.flatMap((b) => b.bullets);
    for (const bullet of allBullets) {
      expect(
        bullet,
        'Bullet interdit : "2,5 % du PASS" détecté dans prevoyance_deces constitution',
      ).not.toContain('2,5 % du PASS');
    }
  });

  it('article_83 — pas de mention "Article 39" dans les bullets', () => {
    const pp = getRules('article_83_pp', 'pp');
    const pm = getRules('article_83_pm', 'pm');
    const allBullets = [
      ...pp.constitution, ...pp.sortie, ...pp.deces,
      ...pm.constitution, ...pm.sortie, ...pm.deces,
    ].flatMap((b) => b.bullets);
    for (const bullet of allBullets) {
      expect(
        bullet,
        'Bullet interdit : "Article 39" détecté dans article_83',
      ).not.toMatch(/[Aa]rticle 39/);
    }
  });

  it('contrat_capitalisation (PP) — pas de "238 septies E" dans les bullets', () => {
    const rules = getRules('contrat_capitalisation_pp', 'pp');
    const allBullets = [
      ...rules.constitution, ...rules.sortie, ...rules.deces,
    ].flatMap((b) => b.bullets);
    for (const bullet of allBullets) {
      expect(
        bullet,
        'Bullet interdit : "238 septies E" visible côté PP dans contrat_capitalisation',
      ).not.toContain('238 septies E');
    }
  });

  it('audience PM — vocabulaire décès/succession/990I/757B interdit', () => {
    const PM_FORBIDDEN_PATTERNS: RegExp[] = [
      /décès/i,
      /deces/i,
      /ne\s+d[eé]c[eè]de\s+pas/i,
      /succession/i,
      /990\s*I/i,
      /757\s*B/i,
      /usufruitier au décès/i,
      /au jour du décès/i,
      /\bDMTG\b/i,
    ];

    for (const product of CATALOG.filter((p) => p.pmEligible)) {
      const rules = getRules(product.id, 'pm');
      const texts = [
        ...rules.constitution.flatMap((b) => [b.title, ...b.bullets]),
        ...rules.sortie.flatMap((b) => [b.title, ...b.bullets]),
        ...rules.deces.flatMap((b) => [b.title, ...b.bullets]),
      ];

      for (const text of texts) {
        for (const pattern of PM_FORBIDDEN_PATTERNS) {
          expect(
            pattern.test(text),
            `Pattern interdit ${pattern} trouvé en PM pour ${product.id}: "${text}"`,
          ).toBe(false);
        }
      }
    }
  });

  it('audience PP — pas de vocabulaire PM/IS sur produits sensibles', () => {
    const PP_SENSITIVE_IDS = Object.values(CATALOG_PP_PM_SPLIT_MAP).map((split) => split.ppId);

    const PP_FORBIDDEN_PM_PATTERNS: RegExp[] = [
      /\bIS\b/i,
      /impôt sur les sociétés/i,
      /personne morale/i,
      /société/i,
      /sortie de la PM/i,
      /\bPM\b/,
    ];

    for (const productId of PP_SENSITIVE_IDS) {
      const rules = getRules(productId, 'pp');
      const texts = [
        ...rules.constitution.flatMap((b) => [b.title, ...b.bullets]),
        ...rules.sortie.flatMap((b) => [b.title, ...b.bullets]),
        ...rules.deces.flatMap((b) => [b.title, ...b.bullets]),
      ];

      for (const text of texts) {
        for (const pattern of PP_FORBIDDEN_PM_PATTERNS) {
          expect(
            pattern.test(text),
            `Pattern PM interdit ${pattern} trouvé en PP pour ${productId}: "${text}"`,
          ).toBe(false);
        }
      }
    }
  });

  it('garde-fou sources officielles — claims sensibles exigent une source officielle ou reformulation prudente', () => {
    const SENSITIVE_PATTERNS: RegExp[] = [
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

    const OFFICIAL_DOMAINS = [
      'legifrance.gouv.fr',
      'bofip.impots.gouv.fr',
      'boss.gouv.fr',
      'impots.gouv.fr',
      'service-public.fr',
      'urssaf.fr',
    ];

    function hasSensitiveClaim(texts: string[]): boolean {
      return texts.some((t) => SENSITIVE_PATTERNS.some((p) => p.test(t)));
    }

    function hasOfficialSource(block: RuleBlock): boolean {
      if (!block.sources || block.sources.length === 0) return false;
      return block.sources.some((src) =>
        OFFICIAL_DOMAINS.some((domain) => src.url.includes(domain)),
      );
    }

    function isPrudentlyReformulated(block: RuleBlock): boolean {
      return block.bullets.some((b) => b.includes('À confirmer'));
    }

    for (const product of CATALOG) {
      const blocks = allBlocks(product.id);
      for (const block of blocks) {
        const texts = [block.title, ...block.bullets];
        if (hasSensitiveClaim(texts)) {
          const ok = hasOfficialSource(block) || isPrudentlyReformulated(block);
          expect(
            ok,
            `Bloc "${block.title}" (${product.id}) contient un claim sensible (taux/montant/article) sans source officielle ni reformulation prudente "À confirmer"`,
          ).toBe(true);
        }
      }
    }
  });

  it('orthographe exacte — "Article 154 bis-0 A"', () => {
    const auds: Array<'pp' | 'pm'> = ['pp', 'pm'];
    const texts: string[] = [];

    for (const audience of auds) {
      const rules = getRules('madelin_retraite_ancien', audience);
      texts.push(
        ...rules.constitution.flatMap((b) => [b.title, ...b.bullets]),
        ...rules.sortie.flatMap((b) => [b.title, ...b.bullets]),
        ...rules.deces.flatMap((b) => [b.title, ...b.bullets]),
      );
    }

    expect(
      texts.some((t) => t.includes('Article 154 bis-0 A')),
      'La mention exacte "Article 154 bis-0 A" est absente des règles concernées',
    ).toBe(true);

    for (const text of texts) {
      expect(
        /154 bis OA/i.test(text),
        `Orthographe interdite détectée: "${text}"`,
      ).toBe(false);
    }
  });
});
