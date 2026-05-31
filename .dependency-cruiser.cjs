/**
 * dependency-cruiser — garde-fous d'architecture SER1
 *
 * Règles enforced :
 *   1. engine/ et domain/ : pas de React, pas de features/, pas de pages/
 *   2. features/ : pas de pages/
 *   3. pages/ : features importées via index.ts uniquement (pas d'internals)
 *   4. routes/ : features importées via index.ts uniquement (pas d'internals)
 *   5. Pas de cross-feature internal imports (chaque feature A ne peut importer
 *      que le index.ts des autres features, pas leurs internals)
 *   6. Supabase : pas d'import client direct depuis features/, engine/ ou components/
 *   7. settings/admin : services only (adminClient, invokeAdmin, logoUpload)
 *      — pas d'import de composants UI depuis l'extérieur
 *   8. UI : pas d'import direct de exportStudyDeck (passer par hooks/wrappers)
 *   9. PPTX : pas d'import depuis features/ (types/helpers partagés dans domain/reporting)
 *   10. Placement : pas d'import runtime direct de useFiscalContext
 *   11. Reporting : pas d'import depuis features/ (migrations et snapshots restent purs)
 *   12. Trésorerie : features/ ne doit pas importer les types historiques V1-V5
 *
 * Résolution @/ : src/ (tsconfig paths + vite alias)
 *
 * Usage :
 *   npx depcruise src --config .dependency-cruiser.cjs
 */

'use strict';

const path = require('path');

const FEATURES = [
  'audit',
  'credit',
  'ir',
  'per',
  'placement',
  'prevoyance',
  'strategy',
  'succession',
  'tresorerie-societe',
];

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

    // ── 4. routes/ : features importées via index.ts uniquement ──────────────────────────
    {
      name: 'routes-no-feature-internals',
      severity: 'error',
      comment: 'src/routes/ doit importer src/features/ uniquement via leur index.ts',
      from: { path: '^src/routes/' },
      to: {
        path: `^src/features/(${FEATURES.join('|')})/`,
        pathNot: `^src/features/(${FEATURES.join('|')})/index\\.ts$`,
      },
    },

    // ── 5. Cross-feature internals (un règle par feature) ────────────────────────────────
    ...FEATURES.map(crossFeatureRule),

    // ── 6. features/, engine/ et components/ : pas d'import direct de supabaseClient ──
    {
      name: 'no-supabase-from-runtime-domains',
      severity: 'error',
      comment:
        'src/features/, src/engine/ et src/components/ ne doivent pas importer supabaseClient directement — utiliser hooks/, cache/ ou pages autorisées (AGENTS.md §3)',
      from: { path: '^src/(features|engine|components)/' },
      to: { path: 'supabaseClient' },
    },

    // ── 7. UI : pas d'appel direct aux fonctions admin bas niveau ─────────────────────
    {
      name: 'no-direct-invoke-admin-from-ui',
      severity: 'error',
      comment:
        'src/pages/, src/features/ et src/components/ ne doivent pas importer settings/admin/invokeAdmin directement — passer par un service settings/admin dédié',
      from: { path: '^src/(pages|features|components)/' },
      to: { path: '^src/settings/admin/invokeAdmin(\\.ts)?$' },
    },

    // ── 8. UI : pas d'import direct de exportStudyDeck ───────────────────────
    {
      name: 'no-export-study-deck-from-ui',
      severity: 'error',
      comment:
        'src/components/, src/pages/, src/routes/ et src/features/*/components/ ne doivent pas importer directement src/pptx/export/exportStudyDeck — passer par un hook ou wrapper feature-owned (cf. GOUVERNANCE_EXPORTS.md §Règle de périmètre)',
      from: { path: '^src/(components|pages|routes)/|^src/features/[^/]+/components/' },
      to: { path: '^src/pptx/export/exportStudyDeck(\\.ts)?$' },
    },

    // ── 9. PPTX : pas de dépendance vers les features ────────────────────────────────
    {
      name: 'pptx-no-features',
      severity: 'error',
      comment:
        'src/pptx/ doit consommer des types/helpers de domain/, engine/ ou reporting/, jamais src/features/ (cf. GOUVERNANCE_EXPORTS.md §Règle de périmètre)',
      from: { path: '^src/pptx/' },
      to: { path: '^src/features/' },
    },

    // ── 10. Placement : useFiscalContext reste centralisé dans usePlacementSettings ────
    {
      name: 'placement-no-direct-use-fiscal-context',
      severity: 'error',
      comment:
        'src/features/placement/ ne doit pas importer directement useFiscalContext en runtime — passer par usePlacementSettings pour conserver une seule entrée fiscale Placement',
      from: { path: '^src/features/placement/' },
      to: { path: '^src/hooks/useFiscalContext(\\.ts)?$' },
    },

    // ── 11. Reporting : snapshots et migrations ne dépendent pas des features ──────────
    {
      name: 'reporting-no-features',
      severity: 'error',
      comment:
        'src/reporting/ doit rester indépendant de src/features/ — déplacer les migrations pures dans engine/ ou reporting/',
      from: { path: '^src/reporting/' },
      to: { path: '^src/features/' },
    },

    // ── 12. Trésorerie : compatTypes V1-V5 reste confiné aux migrations moteur ───────
    {
      name: 'tresorerie-legacy-restricted',
      severity: 'error',
      comment:
        'src/features/tresorerie-societe/ manipule TresoInputsV6 ou unknown migré, jamais les types historiques compatTypes.ts',
      from: { path: '^src/features/tresorerie-societe/' },
      to: { path: '^src/engine/tresorerie/migrations/compatTypes\\.ts$' },
    },
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
      path: ['__tests__', '\\.test\\.', '\\.spec\\.', 'node_modules', 'dist'],
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
