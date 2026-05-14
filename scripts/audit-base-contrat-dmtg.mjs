#!/usr/bin/env node
/**
 * Audit Base-Contrat / DMTG Succession.
 *
 * Objectif :
 * - produire des métriques reproductibles sur le référentiel Base-Contrat ;
 * - inventorier les consommateurs réels de CATALOG/getRules/FiscalProfile ;
 * - distinguer les valeurs de calcul, fallbacks, hypothèses d'export et textes éditoriaux.
 *
 * Le script transpile temporairement le domaine Base-Contrat dans .tmp/ pour
 * interroger les API existantes sans réimplémenter getRules().
 */

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DOMAIN_DIR = path.join(ROOT, 'src', 'domain', 'base-contrat');
const RUNTIME_DIR = path.join(ROOT, '.tmp', 'audit-base-contrat-runtime');
const RUNTIME_CONSTANTS_DIR = path.join(RUNTIME_DIR, 'constants');

const PHASES = ['constitution', 'sortie', 'deces'];
const CONSUMER_PATTERNS = [
  { key: 'getRules', regex: /\bgetRules\s*\(/ },
  { key: 'CATALOG', regex: /\bCATALOG\b/ },
  { key: 'getCatalogProduct', regex: /\bgetCatalogProduct\b/ },
  { key: 'FiscalProfile', regex: /\b(FiscalProfile|getEnvelopeCatalogId|buildFiscalProfile|emptyFiscalProfile)\b/ },
  { key: 'route base-contrat', regex: /href="\/settings\/base-contrat"|path:\s*'base-contrat'|urlPath:\s*'\/settings\/base-contrat'|startsWith\('\/settings\/base-contrat'\)/ },
  { key: 'base_contrat_overrides', regex: /base_contrat_overrides|baseContratOverridesCache/ },
];

function cleanupRuntime() {
  const resolvedRuntime = path.resolve(RUNTIME_DIR);
  const resolvedConstants = path.resolve(RUNTIME_CONSTANTS_DIR);
  const resolvedTmp = path.resolve(ROOT, '.tmp');
  if (resolvedRuntime.startsWith(resolvedTmp + path.sep)) {
    fs.rmSync(resolvedRuntime, { recursive: true, force: true });
  }
  if (resolvedConstants.startsWith(resolvedTmp + path.sep)) {
    fs.rmSync(resolvedConstants, { recursive: true, force: true });
  }
}

process.once('exit', cleanupRuntime);
process.once('SIGINT', () => {
  cleanupRuntime();
  process.exit(130);
});

function toPosix(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

function walk(dir, predicate = () => true, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
      walk(full, predicate, out);
    } else if (predicate(full)) {
      out.push(full);
    }
  }
  return out;
}

function lineNumberFor(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function compileDomainRuntime() {
  const resolvedRuntime = path.resolve(RUNTIME_DIR);
  const resolvedTmp = path.resolve(ROOT, '.tmp');
  if (!resolvedRuntime.startsWith(resolvedTmp + path.sep)) {
    throw new Error(`Chemin runtime inattendu: ${resolvedRuntime}`);
  }

  fs.rmSync(resolvedRuntime, { recursive: true, force: true });
  fs.rmSync(RUNTIME_CONSTANTS_DIR, { recursive: true, force: true });
  fs.mkdirSync(resolvedRuntime, { recursive: true });
  fs.mkdirSync(RUNTIME_CONSTANTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(resolvedRuntime, 'package.json'),
    JSON.stringify({ type: 'commonjs' }, null, 2),
  );

  const files = walk(DOMAIN_DIR, (file) =>
    file.endsWith('.ts') && !file.includes(`${path.sep}__tests__${path.sep}`),
  );

  for (const file of files) {
    const rel = path.relative(DOMAIN_DIR, file);
    const outFile = path.join(resolvedRuntime, rel).replace(/\.ts$/, '.js');
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    const source = fs.readFileSync(file, 'utf8');
    const compiled = ts.transpileModule(source, {
      fileName: file,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
        importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
      },
    });
    const outputText = compiled.outputText.replace(
      /require\(["']\.\.\/\.\.\/\.\.\/constants\/settingsDefaults["']\)/g,
      "require('../constants/settingsDefaults')",
    );
    fs.writeFileSync(outFile, outputText);
  }

  const settingsDefaultsSource = path.join(ROOT, 'src', 'constants', 'settingsDefaults.ts');
  const settingsDefaultsCompiled = ts.transpileModule(
    fs.readFileSync(settingsDefaultsSource, 'utf8'),
    {
      fileName: settingsDefaultsSource,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
        importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
      },
    },
  );
  fs.writeFileSync(
    path.join(RUNTIME_CONSTANTS_DIR, 'settingsDefaults.js'),
    settingsDefaultsCompiled.outputText,
  );

  return resolvedRuntime;
}

function loadDomainApis() {
  const runtime = compileDomainRuntime();
  const requireRuntime = createRequire(path.join(runtime, 'index.js'));
  const catalog = requireRuntime(path.join(runtime, 'catalog.js'));
  const rules = requireRuntime(path.join(runtime, 'rules', 'index.js'));
  return {
    CATALOG: catalog.CATALOG,
    getRules: rules.getRules,
  };
}

function getEligibleAudiences(product) {
  const audiences = [];
  if (product.ppEligible) audiences.push('pp');
  if (product.pmEligible) audiences.push('pm');
  return audiences;
}

function flattenRules(rules) {
  const blocks = [];
  for (const phase of PHASES) {
    for (const block of rules[phase] ?? []) {
      blocks.push({ phase, ...block });
    }
  }
  return blocks;
}

function scoreEditorial(profile) {
  let score = 5;
  if (profile.sourceRatio < 0.5) score -= 1;
  if (profile.mediumLowRatio > 0.35) score -= 1;
  if (profile.emptyPhaseCount > 0) score -= 1;
  if (!profile.hasOfficialSource) score -= 1;
  return Math.max(1, score);
}

function scoreEngine(profile, options) {
  let score = 5;
  if (profile.sourceRatio < 1) score -= 1;
  if (profile.sourceRatio < 0.75) score -= 1;
  if (profile.mediumLowCount > 0) score -= 1;
  if (profile.emptyPhaseCount > 0) score -= 1;
  if (!profile.hasOfficialSource) score -= 1;
  if (!options.hasEngineConsumer) score = Math.min(score, 2);
  return Math.max(1, score);
}

function verdict(profile, options) {
  if (
    options.hasEngineConsumer
    && profile.engineScore >= 4
    && profile.sourceRatio === 1
    && profile.mediumLowCount === 0
    && profile.emptyPhaseCount === 0
  ) {
    return 'source_moteur_candidate';
  }
  if (profile.editorialScore >= 3 && profile.emptyPhaseCount === 0) return 'referentiel_editorial';
  return 'non_pret';
}

function buildRuntimeMetrics(CATALOG, getRules, options) {
  const byFamily = new Map();
  const byProductAudience = [];
  let exposedBlockCount = 0;
  let exposedSourceCount = 0;
  let exposedMediumLowCount = 0;
  let exposedMediumLowCompliant = 0;
  let emptyPhaseCount = 0;

  for (const product of CATALOG) {
    for (const audience of getEligibleAudiences(product)) {
      const rules = getRules(product.id, audience);
      const blocks = flattenRules(rules);
      const total = blocks.length;
      const withSources = blocks.filter((block) => Array.isArray(block.sources) && block.sources.length > 0).length;
      const mediumLowBlocks = blocks.filter((block) => block.confidence === 'moyenne' || block.confidence === 'faible');
      const mediumLowCompliant = mediumLowBlocks.filter((block) =>
        Array.isArray(block.dependencies)
        && block.dependencies.length > 0
        && block.bullets.some((bullet) => bullet.includes('À confirmer')),
      ).length;
      const emptyPhases = PHASES.filter((phase) => (rules[phase] ?? []).length === 0);
      const hasOfficialSource = blocks.some((block) =>
        (block.sources ?? []).some((src) => /legifrance|bofip|impots\.gouv|service-public|urssaf/i.test(src.url)),
      );

      const profile = {
        productId: product.id,
        label: product.label,
        famille: product.grandeFamille,
        catalogKind: product.catalogKind,
        audience,
        phases: Object.fromEntries(PHASES.map((phase) => [phase, (rules[phase] ?? []).length])),
        totalBlocks: total,
        withSources,
        sourceRatio: total === 0 ? 0 : withSources / total,
        mediumLowCount: mediumLowBlocks.length,
        mediumLowRatio: total === 0 ? 0 : mediumLowBlocks.length / total,
        mediumLowCompliant,
        emptyPhases,
        emptyPhaseCount: emptyPhases.length,
        hasOfficialSource,
      };
      profile.editorialScore = scoreEditorial(profile);
      profile.engineScore = scoreEngine(profile, options);
      profile.verdict = verdict(profile, options);

      byProductAudience.push(profile);
      exposedBlockCount += total;
      exposedSourceCount += withSources;
      exposedMediumLowCount += mediumLowBlocks.length;
      exposedMediumLowCompliant += mediumLowCompliant;
      emptyPhaseCount += emptyPhases.length;

      const family = byFamily.get(product.grandeFamille) ?? {
        famille: product.grandeFamille,
        productAudiences: 0,
        blocks: 0,
        sources: 0,
        mediumLow: 0,
        emptyPhases: 0,
      };
      family.productAudiences += 1;
      family.blocks += total;
      family.sources += withSources;
      family.mediumLow += mediumLowBlocks.length;
      family.emptyPhases += emptyPhases.length;
      byFamily.set(product.grandeFamille, family);
    }
  }

  return {
    catalogProducts: CATALOG.length,
    productAudiences: byProductAudience.length,
    exposedBlockCount,
    exposedSourceCount,
    exposedSourceRatio: exposedBlockCount === 0 ? 0 : exposedSourceCount / exposedBlockCount,
    exposedMediumLowCount,
    exposedMediumLowCompliant,
    exposedMediumLowComplianceRatio: exposedMediumLowCount === 0 ? 1 : exposedMediumLowCompliant / exposedMediumLowCount,
    emptyPhaseCount,
    byFamily: [...byFamily.values()].sort((a, b) => a.famille.localeCompare(b.famille, 'fr')),
    byProductAudience,
  };
}

function buildLibraryMetrics() {
  const libraryDir = path.join(DOMAIN_DIR, 'rules', 'library');
  const rows = fs.readdirSync(libraryDir)
    .filter((name) => name.endsWith('.ts'))
    .sort((a, b) => a.localeCompare(b, 'fr'))
    .map((name) => {
      const file = path.join(libraryDir, name);
      const content = fs.readFileSync(file, 'utf8');
      return {
        file: `src/domain/base-contrat/rules/library/${name}`,
        blocks: [...content.matchAll(/confidence\s*:/g)].length,
        sources: [...content.matchAll(/sources\s*:/g)].length,
        mediumLow: [...content.matchAll(/confidence\s*:\s*'(moyenne|faible)'/g)].length,
        dependencies: [...content.matchAll(/dependencies\s*:/g)].length,
        visibleAmountsOrRates: [...content.matchAll(/\b\d[\d\s_]*(?:[,.]\d+)?\s*(?:%|€|EUR|k€|M€)\b/g)].length,
      };
    });

  const total = rows.reduce((sum, row) => ({
    file: 'TOTAL',
    blocks: sum.blocks + row.blocks,
    sources: sum.sources + row.sources,
    mediumLow: sum.mediumLow + row.mediumLow,
    dependencies: sum.dependencies + row.dependencies,
    visibleAmountsOrRates: sum.visibleAmountsOrRates + row.visibleAmountsOrRates,
  }), { file: 'TOTAL', blocks: 0, sources: 0, mediumLow: 0, dependencies: 0, visibleAmountsOrRates: 0 });

  return { rows, total };
}

function scanConsumers() {
  const sourceFiles = walk(path.join(ROOT, 'src'), (file) => /\.(ts|tsx|js|jsx)$/.test(file));
  const matches = [];
  for (const file of sourceFiles) {
    const rel = toPosix(file);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const pattern of CONSUMER_PATTERNS) {
        if (pattern.regex.test(line)) {
          matches.push({
            file: rel,
            line: index + 1,
            key: pattern.key,
            text: line.trim(),
            zone: rel.startsWith('src/domain/base-contrat/')
              ? 'domain'
              : rel.startsWith('src/engine/')
                ? 'engine'
                : rel.startsWith('src/features/')
                  ? 'features'
                  : rel.startsWith('src/pages/')
                    ? 'pages'
                    : 'other',
          });
        }
      }
    });
  }
  return matches;
}

function classifyKnownValues() {
  return [
    {
      file: 'src/constants/settingsDefaults.ts',
      line: 142,
      class: 'source_de_verite_fallback',
      detail: 'DMTG et AV décès vivent dans les defaults et le JSONB Supabase.',
    },
    {
      file: 'src/features/succession/export/successionXlsx.ts',
      line: 216,
      class: 'hypothese_export_snapshot',
      detail: 'Texte pédagogique alimenté par le snapshot fiscal DMTG, avec fallback defaults si aucun snapshot n’est fourni.',
    },
    {
      file: 'src/features/placement/utils/normalizers.ts',
      line: 106,
      class: 'fallback_ui_degrade',
      detail: 'DEFAULT_DMTG_RATE = 0.20 utilisé si aucun barème DMTG n’est disponible.',
    },
    {
      file: 'src/domain/base-contrat/rules/library/*.ts',
      line: null,
      class: 'texte_editorial_brut',
      detail: 'Montants/taux présents dans les bibliothèques, sanitizés à l’affichage par getRules().',
    },
  ];
}

function scanPolicyEvidence() {
  const files = [
    'supabase/migrations/20260502222622_p2_rls_optimizations.sql',
    'supabase/migrations/20260223000100_create_base_contrat_overrides.sql',
    'supabase/migrations/20260226000100_rls_overrides_admin_only.sql',
  ];
  const patterns = [
    /tax_settings_(select|insert|update|delete)_/,
    /fiscality_settings_(select|insert|update|delete)_/,
    /overrides_(select|insert|update|delete|write)_/,
    /public\.is_admin\(\)/,
  ];
  const evidence = [];
  for (const rel of files) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      if (patterns.some((pattern) => pattern.test(line))) {
        evidence.push({ file: rel, line: index + 1, text: line.trim() });
      }
    });
  }
  return evidence;
}

function formatPct(value) {
  return `${(value * 100).toFixed(1).replace('.', ',')} %`;
}

function formatAudience(audience) {
  return audience === 'pp' ? 'PP' : 'PM';
}

function formatPhase(phase) {
  if (phase === 'constitution') return 'Constitution';
  if (phase === 'sortie') return 'Sortie / rachat';
  return 'Décès / transmission';
}

function formatVerdict(value) {
  if (value === 'source_moteur_candidate') return 'source moteur';
  if (value === 'referentiel_editorial') return 'éditorial';
  return 'non prêt';
}

function escapeMarkdownCell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

function formatSources(sources) {
  if (!Array.isArray(sources) || sources.length === 0) return 'À sourcer';
  return sources
    .map((source) => `[${escapeMarkdownCell(source.label)}](${source.url})`)
    .join('<br>');
}

function toVeilleMarkdown(CATALOG, getRules) {
  const rows = [];
  for (const product of CATALOG) {
    for (const audience of getEligibleAudiences(product)) {
      const rules = getRules(product.id, audience);
      for (const phase of PHASES) {
        for (const block of rules[phase] ?? []) {
          rows.push({
            famille: product.grandeFamille,
            product: product.label,
            audience,
            phase,
            title: block.title,
            sources: block.sources,
          });
        }
      }
    }
  }

  rows.sort((a, b) =>
    a.famille.localeCompare(b.famille, 'fr')
    || a.product.localeCompare(b.product, 'fr')
    || a.audience.localeCompare(b.audience, 'fr')
    || PHASES.indexOf(a.phase) - PHASES.indexOf(b.phase)
    || a.title.localeCompare(b.title, 'fr'),
  );

  const tableRows = rows
    .map((row) => [
      escapeMarkdownCell(row.famille),
      escapeMarkdownCell(row.product),
      formatAudience(row.audience),
      formatPhase(row.phase),
      escapeMarkdownCell(row.title),
      formatSources(row.sources),
      'Non chargé',
      '—',
    ].join(' | '))
    .map((row) => `| ${row} |`)
    .join('\n');

  return [
    '# Veille Base-Contrat',
    '',
    '> Artefact généré, non versionné. Régénération : `npm run audit:base-contrat-dmtg -- --out-veille docs/veille-base-contrat.md`.',
    '',
    'Ce document sert de checklist hors UI pour la revue juridique annuelle. Les colonnes `Statut revue` et `Prochaine revue` sont prévues pour être rapprochées de `base_contrat_overrides.review_status` et `base_contrat_overrides.next_review_at` lorsque les données d’overrides sont disponibles.',
    '',
    '| Famille | Produit | Audience | Phase | Bloc | Sources | Statut revue | Prochaine revue |',
    '|---|---|---:|---|---|---|---|---|',
    tableRows,
    '',
  ].join('\n');
}

function toMarkdown(metrics) {
  const libraryRows = metrics.library.rows
    .map((row) => `| ${row.file.replace('src/domain/base-contrat/rules/library/', '')} | ${row.blocks} | ${row.sources} | ${row.mediumLow} | ${row.dependencies} | ${row.visibleAmountsOrRates} |`)
    .join('\n');
  const familyRows = metrics.runtime.byFamily
    .map((row) => `| ${row.famille} | ${row.productAudiences} | ${row.blocks} | ${row.sources} | ${row.mediumLow} | ${row.emptyPhases} |`)
    .join('\n');
  const consumerRows = metrics.consumers
    .filter((match) => match.zone !== 'domain')
    .map((match) => `| ${match.zone} | ${match.file}:${match.line} | ${match.key} | ${match.text.replace(/\|/g, '\\|')} |`)
    .join('\n');
  const productRows = metrics.runtime.byProductAudience
    .map((row) => `| ${row.label.replace(/\|/g, '\\|')} | ${row.famille.replace(/\|/g, '\\|')} | ${formatAudience(row.audience)} | ${row.totalBlocks} | ${row.withSources}/${row.totalBlocks} | ${row.mediumLowCount} | ${row.editorialScore}/5 | ${row.engineScore}/5 | ${formatVerdict(row.verdict)} |`)
    .join('\n');
  const verdictCounts = metrics.runtime.byProductAudience.reduce((acc, row) => {
    acc[row.verdict] = (acc[row.verdict] ?? 0) + 1;
    return acc;
  }, {});

  return [
    '# Audit Base-Contrat / DMTG Succession — métriques brutes',
    '',
    '> Artefact généré, non versionné. Régénération : `npm run audit:base-contrat-dmtg -- --out <chemin>`.',
    '',
    '## Synthèse',
    `- Produits catalogue : ${metrics.runtime.catalogProducts}`,
    `- Couples produit/audience exposés : ${metrics.runtime.productAudiences}`,
    `- Blocs déclarés dans les bibliothèques : ${metrics.library.total.blocks}`,
    `- Blocs déclarés avec sources : ${metrics.library.total.sources} (${formatPct(metrics.library.total.sources / metrics.library.total.blocks)})`,
    `- Blocs déclarés moyenne/faible : ${metrics.library.total.mediumLow}`,
    `- Blocs exposés par produit/audience : ${metrics.runtime.exposedBlockCount}`,
    `- Blocs exposés sourcés : ${metrics.runtime.exposedSourceCount} (${formatPct(metrics.runtime.exposedSourceRatio)})`,
    `- Conformité moyenne/faible exposée : ${metrics.runtime.exposedMediumLowCompliant}/${metrics.runtime.exposedMediumLowCount} (${formatPct(metrics.runtime.exposedMediumLowComplianceRatio)})`,
    `- Phases vides exposées : ${metrics.runtime.emptyPhaseCount}`,
    `- Consommateurs engine hors domaine : ${metrics.consumers.filter((match) => match.zone === 'engine').length}`,
    `- Verdicts produit/audience : ${verdictCounts.source_moteur_candidate ?? 0} source moteur, ${verdictCounts.referentiel_editorial ?? 0} éditorial, ${verdictCounts.non_pret ?? 0} non prêt`,
    '',
    '## Bibliothèques',
    '| Fichier | Blocs | Sources | Moyenne/faible | Dependencies | Montants/taux bruts |',
    '|---|---:|---:|---:|---:|---:|',
    libraryRows,
    '',
    '## Familles exposées',
    '| Famille | Couples produit/audience | Blocs | Sources | Moyenne/faible | Phases vides |',
    '|---|---:|---:|---:|---:|---:|',
    familyRows,
    '',
    '## Consommateurs hors domaine',
    '| Zone | Preuve | Type | Ligne |',
    '|---|---|---|---|',
    consumerRows || '| - | Aucun consommateur hors domaine | - | - |',
    '',
    '## Produits / régimes exposés',
    '| Produit | Famille | Audience | Blocs | Sources | Moyenne/faible | Score patrimonial | Score dev senior | Verdict |',
    '|---|---|---:|---:|---:|---:|---:|---:|---|',
    productRows,
    '',
  ].join('\n');
}

function main() {
  const { CATALOG, getRules } = loadDomainApis();
  const consumers = scanConsumers();
  const hasEngineConsumer = consumers.some((match) => match.zone === 'engine');
  const metrics = {
    generatedAt: new Date().toISOString(),
    library: buildLibraryMetrics(),
    runtime: buildRuntimeMetrics(CATALOG, getRules, { hasEngineConsumer }),
    consumers,
    valueClassification: classifyKnownValues(),
    policyEvidence: scanPolicyEvidence(),
  };

  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const outIndex = args.indexOf('--out');
  const veilleOutIndex = args.indexOf('--out-veille');
  const outFile = outIndex >= 0 ? args[outIndex + 1] : null;
  const veilleOutFile = veilleOutIndex >= 0 ? args[veilleOutIndex + 1] : null;

  if (veilleOutFile) {
    const resolved = path.resolve(ROOT, veilleOutFile);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, `${toVeilleMarkdown(CATALOG, getRules)}\n`);
    process.stdout.write(`Veille écrite dans ${toPosix(resolved)}\n`);
    return;
  }

  const output = asJson ? JSON.stringify(metrics, null, 2) : toMarkdown(metrics);

  if (outFile) {
    const resolved = path.resolve(ROOT, outFile);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, `${output}\n`);
    process.stdout.write(`Audit écrit dans ${toPosix(resolved)}\n`);
    return;
  }

  process.stdout.write(`${output}\n`);
}

main();
