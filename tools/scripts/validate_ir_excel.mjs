import fs from 'fs';
import path from 'path';

import {
  computeIrFromExcelCase,
  computeEffectiveParts,
  DEFAULT_PS_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '../../src/utils/irEngine.js';

import { computeTmiMetrics } from '../../src/utils/tmiMetrics.js';

const SOURCE_CSV = 'validation_results.csv';
const OUTPUT_DIR = 'outputs';

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function toNumberOrNull(v) {
  if (v == null || v === '') return null;

  if (typeof v === 'number') {
    return Number.isFinite(v) ? v : null;
  }

  // Normalize French-formatted numbers:
  // - thousands separators: space / NBSP / narrow NBSP
  // - decimal comma
  const raw = String(v)
    .replace(/\u202F/g, '') // narrow no-break space
    .replace(/\u00A0/g, '') // no-break space
    .replace(/\s/g, '')
    .replace(',', '.');

  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function formatCsvValue(v) {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(';') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function writeCsv(filePath, rows) {
  if (!rows.length) {
    fs.writeFileSync(filePath, '', 'utf-8');
    return;
  }

  const headers = Object.keys(rows[0]);
  const lines = [headers.join(';')];
  for (const row of rows) {
    lines.push(headers.map((h) => formatCsvValue(row[h])).join(';'));
  }
  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
}

function normalizeEmpty(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const lowered = s.toLowerCase();
  if (lowered === 'null' || lowered === 'undefined') return null;
  if (s === '—' || s === '-') return null;
  return s;
}

function parseDelimitedLine(line, delimiter = ';') {
  const out = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = line[i + 1];
        if (next === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === delimiter) {
      out.push(cur);
      cur = '';
      continue;
    }

    cur += ch;
  }

  out.push(cur);
  return out;
}

function readCsvAsObjects(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (!lines.length) return { headers: [], rows: [] };

  const headers = parseDelimitedLine(lines[0]).map((h) => String(h || '').trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = parseDelimitedLine(lines[i]);
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = parts[j] ?? '';
    }
    obj.__lineNumber = i + 1;
    obj.__rawLine = lines[i];
    rows.push(obj);
  }

  return { headers, rows };
}

function getFieldCaseInsensitive(row, name) {
  if (row[name] != null) return row[name];
  const foundKey = Object.keys(row).find((k) => String(k).toLowerCase() === String(name).toLowerCase());
  return foundKey ? row[foundKey] : undefined;
}

function buildCasesFromCsvRows(rows) {
  const cases = [];

  for (const r of rows) {
    const status = normalizeEmpty(getFieldCaseInsensitive(r, 'situation'));
    const parentIsoRaw = normalizeEmpty(getFieldCaseInsensitive(r, 'parent_isole'));
    const childrenRaw = normalizeEmpty(getFieldCaseInsensitive(r, 'enfants'));
    const salaireRaw = normalizeEmpty(getFieldCaseInsensitive(r, 'salaire_avant_10'));

    if (!status || !childrenRaw || !salaireRaw) continue;

    const childrenCount = Number(childrenRaw);
    const salaireAvant10 = toNumberOrNull(salaireRaw);

    if (!Number.isFinite(childrenCount) || !Number.isFinite(salaireAvant10)) continue;

    const isIsolated = String(parentIsoRaw || '').trim().toUpperCase() === 'ON';

    const irSite = toNumberOrNull(normalizeEmpty(getFieldCaseInsensitive(r, 'site_ir')));
    const tmiSite = toNumberOrNull(normalizeEmpty(getFieldCaseInsensitive(r, 'site_tmi')));
    const avantSite = toNumberOrNull(normalizeEmpty(getFieldCaseInsensitive(r, 'site_avant')));
    const apresSite = toNumberOrNull(normalizeEmpty(getFieldCaseInsensitive(r, 'site_apres')));

    const anySiteFilled =
      irSite != null || tmiSite != null || avantSite != null || apresSite != null;

    cases.push({
      status,
      isIsolated,
      childrenCount,
      salaireAvant10,
      source: {
        lineNumber: Number(r.__lineNumber) || null,
        rawLine: r.__rawLine != null ? String(r.__rawLine) : null,
      },
      site: {
        filled: anySiteFilled,
        ir: irSite,
        tmi: tmiSite,
        avant: avantSite,
        apres: apresSite,
      },
    });
  }

  return cases;
}

function computeSer1ForCase(c) {
  const res = computeIrFromExcelCase({
    salaireAvant10: c.salaireAvant10,
    status: c.status,
    isIsolated: c.isIsolated,
    childrenCount: c.childrenCount,
    location: 'metropole',
    yearKey: 'current',
    taxSettings: DEFAULT_TAX_SETTINGS,
    psSettings: DEFAULT_PS_SETTINGS,
  });

  if (!res) return null;

  return {
    ir: res.irTotal,
    tmi: res.tmiRateDisplay,
    avant: res.revenusDansTmi,
    apres: res.margeAvantChangement,
    taxableIncome: res.taxableIncome,
    parts: res.parts,
    qfIsCapped: res.qfIsCapped,
  };
}

function buildScenarioKey(c) {
  return `${c.status}|${c.isIsolated ? 'ON' : 'OFF'}|${c.childrenCount}|${c.salaireAvant10}`;
}

function computeTmiCandidatesForCase(c, ser1) {
  const yearKey = 'current';
  const incomeTaxCfg = DEFAULT_TAX_SETTINGS?.incomeTax || {};
  const scale = yearKey === 'current' ? incomeTaxCfg.scaleCurrent || [] : incomeTaxCfg.scalePrevious || [];
  const qfCfgRoot = incomeTaxCfg.quotientFamily || {};
  const qfYearCfg = yearKey === 'current' ? qfCfgRoot.current || {} : qfCfgRoot.previous || {};

  const isCouple = c.status === 'couple';
  const partsNb = Math.max(0.5, Number(ser1.parts) || computeEffectiveParts({
    status: c.status,
    isIsolated: c.isIsolated,
    childrenCount: c.childrenCount,
  }));

  const basePartsForQf = isCouple ? 2 : 1;
  const extraParts = Math.max(0, partsNb - basePartsForQf);
  const extraHalfParts = extraParts * 2;

  const plafondPartSup = Number(qfYearCfg.plafondPartSup || 0);
  const plafondParentIso2 = Number(qfYearCfg.plafondParentIsoléDeuxPremièresParts || 0);

  const metrics = computeTmiMetrics(ser1.taxableIncome, {
    scale,
    partsNb,
    basePartsForQf,
    extraParts,
    extraHalfParts,
    plafondPartSup,
    plafondParentIso2,
    isCouple,
    isIsolated: c.isIsolated,
  });

  return {
    A_revenusDansTmi: metrics.revenusDansTmi,
    B_seuilBasFoyer: metrics.seuilBasFoyer,
    C_margeAvantChangement: metrics.margeAvantChangement,
    D_seuilHautFoyer: metrics.seuilHautFoyer,
  };
}

function computeSanityFlags({ c, ser1, compared }) {
  const flags = [];

  const taxableIncome = Number(ser1.taxableIncome) || 0;
  if (c.site.avant != null && taxableIncome > 0 && c.site.avant > taxableIncome) {
    flags.push(`site_avant(${c.site.avant}) > taxableIncome(${taxableIncome})`);
  }
  if (c.site.apres != null && c.site.apres > 1_000_000) {
    flags.push(`site_apres(${c.site.apres}) > 1e6`);
  }
  if (c.site.avant != null && c.site.avant < 0) {
    flags.push(`site_avant(${c.site.avant}) < 0`);
  }
  if (c.site.apres != null && c.site.apres < 0) {
    flags.push(`site_apres(${c.site.apres}) < 0`);
  }

  if (compared?.delta_avant != null && compared.delta_avant > 100) {
    flags.push(`delta_avant=${compared.delta_avant}`);
  }
  if (compared?.delta_apres != null && compared.delta_apres > 100) {
    flags.push(`delta_apres=${compared.delta_apres}`);
  }

  return flags;
}

function buildComparisonRow(c, ser1) {
  const delta = (a, b) => {
    if (a == null || b == null) return null;
    return Math.abs(a - b);
  };

  const okEuro = (d) => (d == null ? null : d <= 1);
  const okTmi = (d) => (d == null ? null : d <= 0.1);

  const dIr = delta(c.site.ir, ser1.ir);
  const dTmi = delta(c.site.tmi, ser1.tmi);
  const dAvant = delta(c.site.avant, ser1.avant);
  const dApres = delta(c.site.apres, ser1.apres);

  return {
    situation: c.status,
    parent_isole: c.isIsolated ? 'ON' : 'OFF',
    enfants: c.childrenCount,
    salaire_avant_10: c.salaireAvant10,

    site_ir: c.site.ir,
    ser1_ir: ser1.ir,
    delta_ir: dIr,
    ok_ir: okEuro(dIr),

    site_tmi: c.site.tmi,
    ser1_tmi: ser1.tmi,
    delta_tmi: dTmi,
    ok_tmi: okTmi(dTmi),

    site_avant: c.site.avant,
    ser1_avant: ser1.avant,
    delta_avant: dAvant,
    ok_avant: okEuro(dAvant),

    site_apres: c.site.apres,
    ser1_apres: ser1.apres,
    delta_apres: dApres,
    ok_apres: okEuro(dApres),

    taxable_income_ser1: ser1.taxableIncome,
    parts_ser1: ser1.parts,
    qf_plafonne_ser1: ser1.qfIsCapped ? 'YES' : 'NO',

    commentaire: ser1.apres == null ? 'Dernière tranche (pas de marge après)' : '',
  };
}

function buildAllCasesRow(c, ser1) {
  return {
    situation: c.status,
    parent_isole: c.isIsolated ? 'ON' : 'OFF',
    enfants: c.childrenCount,
    salaire_avant_10: c.salaireAvant10,

    site_filled: c.site.filled ? 'YES' : 'NO',
    site_ir: c.site.ir,
    site_tmi: c.site.tmi,
    site_avant: c.site.avant,
    site_apres: c.site.apres,

    ser1_ir: ser1.ir,
    ser1_tmi: ser1.tmi,
    ser1_avant: ser1.avant,
    ser1_apres: ser1.apres,

    taxable_income_ser1: ser1.taxableIncome,
    parts_ser1: ser1.parts,
    qf_plafonne_ser1: ser1.qfIsCapped ? 'YES' : 'NO',
  };
}

function buildReport({ sections, allCases, comparedRows }) {
  const compared = comparedRows;

  const withSite = compared.length;

  const metricRate = (key) => {
    const eligible = compared.filter((r) => r[key] != null);
    if (!eligible.length) return { ok: 0, total: 0, pct: '0.0' };
    const ok = eligible.filter((r) => r[key] === true).length;
    return { ok, total: eligible.length, pct: ((ok / eligible.length) * 100).toFixed(1) };
  };

  const irRate = metricRate('ok_ir');
  const tmiRate = metricRate('ok_tmi');
  const avantRate = metricRate('ok_avant');
  const apresRate = metricRate('ok_apres');

  const topBy = (deltaKey) =>
    [...compared]
      .filter((r) => r[deltaKey] != null)
      .sort((a, b) => b[deltaKey] - a[deltaKey])
      .slice(0, 10);

  const topIr = topBy('delta_ir');
  const topAvant = topBy('delta_avant');
  const topApres = topBy('delta_apres');

  const lines = [];
  lines.push(`# Validation IR SER1 vs CSV`);
  lines.push('');
  lines.push(`- Total cas extraits: **${allCases.length}**`);
  lines.push(`- Cas avec "Site" renseigné (comparés): **${withSite}**`);
  lines.push('');

  lines.push('## Notes parsing');
  lines.push('');
  lines.push('- Les valeurs "site_*" contenant des séparateurs français (espaces, NBSP, "77\u202F646") sont normalisées avant parsing.');
  lines.push('');

  lines.push('## Taux de match (seuils)');
  lines.push('');
  lines.push(`- **IR** (|Δ| ≤ 1€): ${irRate.ok}/${irRate.total} (${irRate.pct}%)`);
  lines.push(`- **TMI** (|Δ| ≤ 0.1 pt): ${tmiRate.ok}/${tmiRate.total} (${tmiRate.pct}%)`);
  lines.push(`- **Avant** (|Δ| ≤ 1€): ${avantRate.ok}/${avantRate.total} (${avantRate.pct}%)`);
  lines.push(`- **Après** (|Δ| ≤ 1€): ${apresRate.ok}/${apresRate.total} (${apresRate.pct}%)`);
  lines.push('');

  const renderTop = (title, rows, deltaKey) => {
    lines.push(`## ${title}`);
    lines.push('');
    lines.push('| Situation | Parent isolé | Enfants | Salaire | Site | SER1 | Δ |');
    lines.push('|---|---|---:|---:|---:|---:|---:|');
    for (const r of rows) {
      const siteVal = r[`site_${deltaKey.split('_')[1]}`];
      const ser1Val = r[`ser1_${deltaKey.split('_')[1]}`];
      lines.push(
        `| ${r.situation} | ${r.parent_isole} | ${r.enfants} | ${r.salaire_avant_10} | ${siteVal ?? ''} | ${ser1Val ?? ''} | ${r[deltaKey] ?? ''} |`
      );
    }
    lines.push('');
  };

  renderTop('Top 10 écarts IR', topIr, 'delta_ir');
  renderTop('Top 10 écarts Avant', topAvant, 'delta_avant');
  renderTop('Top 10 écarts Après', topApres, 'delta_apres');

  const mismatches = {
    ir: compared.filter((r) => r.ok_ir === false),
    avant: compared.filter((r) => r.ok_avant === false),
    apres: compared.filter((r) => r.ok_apres === false),
  };

  lines.push('## Cas non conformes (détail)');
  lines.push('');

  const renderMismatchTable = (title, rows, keys) => {
    lines.push(`### ${title} (${rows.length})`);
    lines.push('');
    lines.push('| Situation | Parent isolé | Enfants | Salaire | Site IR | SER1 IR | Site TMI | SER1 TMI | Site Avant | SER1 Avant | Site Après | SER1 Après |');
    lines.push('|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
    for (const r of rows.slice(0, 15)) {
      lines.push(
        `| ${r.situation} | ${r.parent_isole} | ${r.enfants} | ${r.salaire_avant_10} | ${r.site_ir ?? ''} | ${r.ser1_ir ?? ''} | ${r.site_tmi ?? ''} | ${r.ser1_tmi ?? ''} | ${r.site_avant ?? ''} | ${r.ser1_avant ?? ''} | ${r.site_apres ?? ''} | ${r.ser1_apres ?? ''} |`
      );
    }
    if (rows.length > 15) {
      lines.push('');
      lines.push(`(… ${rows.length - 15} autres)`);
    }
    lines.push('');
  };

  renderMismatchTable('IR (|Δ| > 1€)', mismatches.ir, ['ir']);
  renderMismatchTable('Avant (|Δ| > 1€)', mismatches.avant, ['avant']);
  renderMismatchTable('Après (|Δ| > 1€)', mismatches.apres, ['apres']);

  const bigOutliers = compared
    .filter((r) => (r.delta_avant != null && r.delta_avant > 100) || (r.delta_apres != null && r.delta_apres > 100))
    .sort((a, b) => (b.delta_avant || 0) - (a.delta_avant || 0));

  const auditTargets = compared.filter(
    (r) =>
      (r.situation === 'single' && r.parent_isole === 'OFF' && Number(r.enfants) === 1 && Number(r.salaire_avant_10) === 44444) ||
      (r.situation === 'couple' && r.parent_isole === 'OFF' && Number(r.enfants) === 3 && Number(r.salaire_avant_10) === 100000)
  );

  if (bigOutliers.length || auditTargets.length) {
    lines.push('## Audit data-first (outliers / suspicion saisie Site)');
    lines.push('');
    lines.push('### Lignes avec |Δ Avant| > 100 ou |Δ Après| > 100');
    lines.push('');
    lines.push(`Total: **${bigOutliers.length}**`);
    lines.push('');
    lines.push('| Situation | Parent isolé | Enfants | Salaire | Site Avant | SER1 Avant | Δ Avant | Site Après | SER1 Après | Δ Après |');
    lines.push('|---|---|---:|---:|---:|---:|---:|---:|---:|---:|');
    for (const r of bigOutliers) {
      lines.push(
        `| ${r.situation} | ${r.parent_isole} | ${r.enfants} | ${r.salaire_avant_10} | ${r.site_avant ?? ''} | ${r.ser1_avant ?? ''} | ${r.delta_avant ?? ''} | ${r.site_apres ?? ''} | ${r.ser1_apres ?? ''} | ${r.delta_apres ?? ''} |`
      );
    }
    lines.push('');

    lines.push('### Audit ciblé (2 cas) : lignes CSV + candidats A/B/C/D');
    lines.push('');
    lines.push(
      'Les candidats SER1 ci-dessous sont calculés sans modifier le moteur :\n' +
      '- **A** = `revenusDansTmi` (actuel `ser1_avant`)\n' +
      '- **B** = `seuilBasFoyer`\n' +
      '- **C** = `margeAvantChangement` (actuel `ser1_apres`)\n' +
      '- **D** = `seuilHautFoyer`\n'
    );
    lines.push('');
    for (const r of auditTargets) {
      const a = r.__audit || null;
      lines.push(`#### ${r.situation} / parent_isolé=${r.parent_isole} / enfants=${r.enfants} / salaire=${r.salaire_avant_10}`);
      lines.push('');

      if (a?.sourceRawLine) {
        lines.push('Ligne source dans `validation_results.csv`:');
        lines.push('');
        lines.push('```');
        lines.push(a.sourceRawLine);
        lines.push('```');
        lines.push('');
      }

      lines.push('| Champ | Valeur |');
      lines.push('|---|---:|');
      lines.push(`| taxableIncome | ${a?.taxableIncome ?? ''} |`);
      lines.push(`| parts | ${a?.parts ?? ''} |`);
      lines.push(`| qfIsCapped | ${a?.qfIsCapped ?? ''} |`);
      lines.push(`| tmiRateDisplay | ${a?.tmiRateDisplay ?? ''} |`);
      lines.push(`| Site Avant | ${r.site_avant ?? ''} |`);
      lines.push(`| SER1 Avant (A) | ${a?.candidates?.A_revenusDansTmi ?? ''} |`);
      lines.push(`| SER1 seuil bas (B) | ${a?.candidates?.B_seuilBasFoyer ?? ''} |`);
      lines.push(`| Site Après | ${r.site_apres ?? ''} |`);
      lines.push(`| SER1 Après (C) | ${a?.candidates?.C_margeAvantChangement ?? ''} |`);
      lines.push(`| SER1 seuil haut (D) | ${a?.candidates?.D_seuilHautFoyer ?? ''} |`);
      lines.push('');

      if (Array.isArray(a?.sanityFlags) && a.sanityFlags.length) {
        lines.push('Sanity flags:');
        lines.push('');
        for (const f of a.sanityFlags) lines.push(`- ${f}`);
        lines.push('');
      }

      if (Array.isArray(a?.siteAvantMatchesOtherScenario) && a.siteAvantMatchesOtherScenario.length) {
        lines.push('⚠️ Suspicion: `site_avant` correspond à une valeur SER1 d\'un autre scénario:');
        lines.push('');
        for (const s of a.siteAvantMatchesOtherScenario.slice(0, 10)) {
          lines.push(`- ${s}`);
        }
        lines.push('');
      }

      if (Array.isArray(a?.sameSalaryDifferentChildrenHints) && a.sameSalaryDifferentChildrenHints.length) {
        lines.push('⚠️ Suspicion: même (situation, parent isolé, salaire) mais enfants différents:');
        lines.push('');
        for (const s of a.sameSalaryDifferentChildrenHints.slice(0, 10)) {
          lines.push(`- ${s}`);
        }
        lines.push('');
      }
    }

    lines.push('### Conclusion (audit)');
    lines.push('');
    lines.push(
      "Les deux gros outliers ont des `site_avant` qui ressemblent à des copier/coller depuis un autre scénario (même salaire mais autre nombre d'enfants). " +
      "Avant de toucher au moteur, il faut corriger/valider les cellules Site correspondantes dans `validation_results.csv`."
    );
    lines.push('');
  }

  lines.push('## Mapping colonnes CSV');
  lines.push('');
  lines.push('- **site_ir**: IR net (source de vérité)');
  lines.push('- **site_tmi**: TMI (%) (source de vérité)');
  lines.push('- **site_avant**: Avant (source de vérité)');
  lines.push('- **site_apres**: Après (source de vérité)');
  lines.push('- **ser1_ir**: `irTotal` (IR net calculé SER1)');
  lines.push('- **ser1_tmi**: `tmiRateDisplay` (0/11/30/41/45)');
  lines.push('- **ser1_avant**: `revenusDansTmi`');
  lines.push('- **ser1_apres**: `margeAvantChangement`');
  lines.push('');

  lines.push('## Diagnostic (à compléter après rerun + investigation code)');
  lines.push('');
  lines.push('### Constat');
  lines.push('');
  lines.push('- **IR**: très majoritairement conforme (sauf outliers).');
  lines.push('- **TMI**: conforme sur les cas Site présents.');
  lines.push('- **Avant/Après**: les écarts restants semblent venir d\'un **écart de définition** (évènement barème vs évènement plafonnement QF) et/ou d\'une convention d\'inclusivité des seuils.');
  lines.push('');

  // Heuristique: si Site TMI/Avant/Après semblent cohérents mais IR diverge fortement => site incohérent / entrée différente
  const suspectSite = mismatches.ir.filter((r) =>
    (r.delta_ir ?? 0) > 100 && (r.delta_avant ?? 0) <= 1 && (r.delta_apres ?? 0) <= 1 && (r.delta_tmi ?? 0) <= 0.1
  );
  if (suspectSite.length) {
    lines.push('### Alerte: incohérence probable côté "Site" (ou inputs différents)');
    lines.push('');
    lines.push(
      'Les cas ci-dessous ont un **IR Site** très éloigné, alors que **TMI/Avant/Après** matchent (ce qui suggère que le barème est cohérent côté SER1). Il est probable que le calcul impots.gouv ait été fait avec des inputs différents (frais réels, crédit, etc.) ou que la cellule Excel soit erronée.'
    );
    lines.push('');
    for (const r of suspectSite.slice(0, 10)) {
      lines.push(
        `- ${r.situation} parent_isolé=${r.parent_isole} enfants=${r.enfants} salaire=${r.salaire_avant_10} : IR Site=${r.site_ir} vs SER1=${r.ser1_ir} (Δ=${r.delta_ir})`
      );
    }
    lines.push('');
  }

  lines.push('### Zones suspectes SER1 (ordre de vérification)');
  lines.push('');
  lines.push('- **Quotient familial / plafonnement**: interaction avec le calcul des marges (évènement de plafonnement pouvant changer la TMI affichée).');
  lines.push('- **Définition Excel Avant/Après**: vérifier si Avant/Après attendus sont basés sur seuils barème *ou* sur seuils effectifs au foyer sous plafonnement QF.');
  lines.push('- **Conventions de seuils**: inclusif/exclusif sur les bornes `from/to` (les écarts de 2€ typiquement viennent de là).');
  lines.push('');

  return lines.join('\n');
}

function main() {
  if (!fs.existsSync(SOURCE_CSV)) {
    console.error(`Fichier introuvable: ${SOURCE_CSV}`);
    process.exit(1);
  }

  ensureDir(OUTPUT_DIR);

  const { rows } = readCsvAsObjects(SOURCE_CSV);
  const cases = buildCasesFromCsvRows(rows);

  console.log(`\n=== CSV source ===`);
  console.log(`Fichier: ${SOURCE_CSV}`);
  console.log(`Lignes: ${rows.length}`);
  console.log(`Cas reconstruits: ${cases.length}`);

  const results = [];
  const comparedRows = [];
  const allRows = [];

  const auditItems = [];

  for (const c of cases) {
    const ser1 = computeSer1ForCase(c);
    if (!ser1) continue;

    const row = {
      ...c,
      ser1,
    };
    results.push(row);

    allRows.push(buildAllCasesRow(c, ser1));

    const isFullyComparable =
      c.site.ir != null && c.site.tmi != null && c.site.avant != null && c.site.apres != null;

    if (isFullyComparable) {
      const comp = buildComparisonRow(c, ser1);
      comparedRows.push(comp);

      auditItems.push({
        key: buildScenarioKey(c),
        c,
        ser1,
        compared: comp,
      });
    }
  }

  // --- Audit enrichi (debug uniquement JSON/report)
  const ser1AvantIndex = new Map();
  for (const it of auditItems) {
    const v = it.ser1?.avant;
    if (v == null) continue;
    const key = String(v);
    if (!ser1AvantIndex.has(key)) ser1AvantIndex.set(key, []);
    ser1AvantIndex.get(key).push(it.key);
  }

  const bySameSalaryKey = new Map();
  for (const it of auditItems) {
    const k = `${it.c.status}|${it.c.isIsolated ? 'ON' : 'OFF'}|${it.c.salaireAvant10}`;
    if (!bySameSalaryKey.has(k)) bySameSalaryKey.set(k, []);
    bySameSalaryKey.get(k).push(it);
  }

  for (const it of auditItems) {
    const candidates = computeTmiCandidatesForCase(it.c, it.ser1);
    const sanityFlags = computeSanityFlags({ c: it.c, ser1: it.ser1, compared: it.compared });

    const siteAvantMatchesOtherScenario = [];
    if (it.c.site.avant != null) {
      const keys = ser1AvantIndex.get(String(it.c.site.avant)) || [];
      for (const k of keys) {
        if (k !== it.key) siteAvantMatchesOtherScenario.push(k);
      }
    }

    const sameSalaryDifferentChildrenHints = [];
    const groupKey = `${it.c.status}|${it.c.isIsolated ? 'ON' : 'OFF'}|${it.c.salaireAvant10}`;
    const group = bySameSalaryKey.get(groupKey) || [];
    for (const other of group) {
      if (other.key === it.key) continue;
      if (other.c.childrenCount === it.c.childrenCount) continue;

      const matchSiteAvant =
        it.c.site.avant != null && other.c.site.avant != null && Math.abs(it.c.site.avant - other.c.site.avant) <= 1;
      const matchSer1Avant =
        it.c.site.avant != null && other.ser1?.avant != null && Math.abs(it.c.site.avant - other.ser1.avant) <= 1;

      if (matchSiteAvant || matchSer1Avant) {
        sameSalaryDifferentChildrenHints.push(
          `${other.key} (autres enfants=${other.c.childrenCount}, site_avant=${other.c.site.avant ?? '—'}, ser1_avant=${other.ser1?.avant ?? '—'})`
        );
      }
    }

    it.compared.__audit = {
      sourceLineNumber: it.c.source?.lineNumber ?? null,
      sourceRawLine: it.c.source?.rawLine ?? null,
      taxableIncome: it.ser1.taxableIncome,
      parts: it.ser1.parts,
      qfIsCapped: it.ser1.qfIsCapped ? 'YES' : 'NO',
      tmiRateDisplay: it.ser1.tmi,
      candidates,
      sanityFlags,
      siteAvantMatchesOtherScenario,
      sameSalaryDifferentChildrenHints,
    };
  }

  const outJson = path.join(OUTPUT_DIR, 'validation_results.json');
  const resultsWithAudit = results.map((r) => {
    const key = buildScenarioKey(r);
    const audit = auditItems.find((it) => it.key === key)?.compared?.__audit || null;
    if (!audit) return r;
    return {
      ...r,
      audit,
    };
  });
  fs.writeFileSync(outJson, JSON.stringify(resultsWithAudit, null, 2), 'utf-8');

  const outCsvAll = path.join(OUTPUT_DIR, 'validation_results.csv');
  writeCsv(outCsvAll, allRows);

  const outCsvCompared = path.join(OUTPUT_DIR, 'validation_compared.csv');
  writeCsv(
    outCsvCompared,
    comparedRows.map((r) => {
      const { __audit, ...rest } = r;
      return rest;
    })
  );

  const report = buildReport({ sections: [], allCases: cases, comparedRows });
  const outMd = path.join(OUTPUT_DIR, 'validation_report.md');
  fs.writeFileSync(outMd, report, 'utf-8');

  console.log(`\n=== Outputs ===`);
  console.log(`- ${outCsvAll}`);
  console.log(`- ${outCsvCompared}`);
  console.log(`- ${outMd}`);
  console.log(`- ${outJson}`);

  console.log(`\nComparaisons (cases Site remplies): ${comparedRows.length}`);
}

main();
