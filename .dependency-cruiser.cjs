/**
 * dependency-cruiser — garde-fous d'architecture SER1
 *
 * Règles enforced :
 *   1. engine/ et domain/ : pas de React, pas de features/, pas de pages/
 *   2. features/ : pas de pages/
 *   3. pages/ : features importées via index.ts uniquement (pas d'internals)
 *   4. Pas de cross-feature internal imports (chaque feature A ne peut importer
 *      que le index.ts des autres features, pas leurs internals)
 *   5. settings/admin : services only (adminClient, invokeAdmin, logoUpload)
 *      — pas d'import de composants UI depuis l'extérieur
 *
 * Résolution @/ : src/ (tsconfig paths + vite alias)
 *
 * Usage :
 *   npx depcruise src --config .dependency-cruiser.cjs
 */

/* eslint-disable */
'use strict';

const path = require('path');

const FEATURES = ['audit', 'credit', 'ir', 'per', 'placement', 'strategy', 'succession'];

/**
 * Génère les règles cross-feature pour une feature donnée.
 * FROM: internals de la feature, TO: internals d'une AUTRE feature (pas son index.ts).
 */
function crossFeatureRule(feature) {
  const others = FEATURES.filter((f) => f !== feature).join('|');
  return {
    name: `no-cross-feature-internals-from-${feature}`,
    severity: 'error',
    comment: `src/features/${feature}/ ne peut importer des autres features que via leur index.ts`,
    from: { path: `^src/features/${feature}/` },
    to: {
      path: `^src/features/(${others})/`,
      pathNot: `^src/features/(${others})/index\\.ts$`,
    },
  };
}

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // ── 1. engine/ et domain/ : aucune dépendance vers React, features/, pages/ ──────────
    {
      name: 'engine-domain-no-react',
      severity: 'error',
      comment: 'engine/ et domain/ doivent être du TypeScript pur — pas de React',
      from: { path: '^src/(engine|domain)/' },
      to: { path: '^react(-dom)?$' },
    },
    {
      name: 'engine-domain-no-features',
      severity: 'error',
      comment: 'engine/ et domain/ ne doivent pas importer src/features/ ou src/pages/',
      from: { path: '^src/(engine|domain)/' },
      to: { path: '^src/(features|pages)/' },
    },

    // ── 2. features/ : pas d'import de pages/ ────────────────────────────────────────────
    {
      name: 'features-no-pages',
      severity: 'error',
      comment: 'src/features/ ne doit pas importer src/pages/',
      from: { path: '^src/features/' },
      to: { path: '^src/pages/' },
    },

    // ── 3. pages/ : features importées via index.ts uniquement ───────────────────────────
    {
      name: 'pages-no-feature-internals',
      severity: 'error',
      comment: 'src/pages/ doit importer src/features/ uniquement via leur index.ts',
      from: { path: '^src/pages/' },
      to: {
        path: `^src/features/(${FEATURES.join('|')})/`,
        pathNot: `^src/features/(${FEATURES.join('|')})/index\\.ts$`,
      },
    },

    // ── 4. Cross-feature internals (un règle par feature) ────────────────────────────────
    ...FEATURES.map(crossFeatureRule),
  ],

  options: {
    /* Résolution TypeScript avec alias @/ → src/ */
    tsConfig: {
      fileName: path.join(__dirname, 'tsconfig.json'),
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },

    /* Inclure uniquement src/, exclure tests, node_modules, dist */
    includeOnly: '^src/',
    exclude: {
      path: [
        '__tests__',
        '\\.test\\.',
        '\\.spec\\.',
        'node_modules',
        'dist',
      ],
    },

    moduleSystems: ['es6', 'cjs'],
    combinedDependencies: false,

    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
};
