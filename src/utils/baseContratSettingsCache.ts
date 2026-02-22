/**
 * Cache dédié pour base_contrat_settings.
 *
 * SÉPARÉ de fiscalSettingsCache.js pour éviter de forcer un fetch
 * supplémentaire sur les pages qui ne consomment pas le référentiel contrats.
 *
 * Pattern identique : singleton mémoire + localStorage anti-flash + TTL 24h.
 */

import { supabase } from '../supabaseClient';
import type { BaseContratSettings, BaseContratProduct } from '../types/baseContratSettings';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 h
const LS_KEY = 'ser1:baseContratSettingsCache';
const SUPABASE_TIMEOUT = 8_000; // ms
const EVENT_NAME = 'ser1:base-contrat-updated';

const EMPTY_DATA: BaseContratSettings = { schemaVersion: 5, products: [] };

const LATEST_SCHEMA_VERSION: BaseContratSettings['schemaVersion'] = 5;

const STRUCTURED_TERMS_RE = new RegExp(['autocall', 'emtn', 'certificat', 'turbo', 'warrant'].join('|'), 'i');

// Matches: "note structur(ée)" / "produit(s) structur(é)" after accent normalization.
// Accepts common separators: space, underscore, dash.
// Intentionally avoids generic "structure" matches (too broad).
const STRUCTURED_STRUCTUR_PHRASE_RE = /(note|produit)s?[\s_-]+structur/i;

// Catch explicit "structuré/structurée/structurés/structurées" (accented) without
// matching generic "structure".
const STRUCTURED_WORD_RAW_RE = /structur(é|ée|és|ées)\b/i;

const DETAILED_PRECIOUS_METALS_IDS = new Set(['argent_physique', 'or_physique', 'platine_palladium']);

const DETAILED_CRYPTO_IDS = new Set(['bitcoin_btc', 'ether_eth', 'nft', 'stablecoins', 'tokens_autres']);

const LEGACY_GRANDE_FAMILLES_TO_AUTRES = new Set(['Crypto-actifs', 'Métaux précieux']);

// V5: Legacy IDs to remap (Point 3)
const LEGACY_ID_REMAP: Record<string, string> = {
  'immobilier_appartement_maison': 'residence_principale',
  'per_perin': 'perin_assurance',
};

// V5: OPC legacy IDs to purge (underlying assets, not directly subscribable)
const OPC_ASSIMILATION_IDS = new Set(['etf', 'fcp', 'opcvm', 'sicav']);

// V5: Groupement foncier — split by succession regime
const GF_AGRI_VITI_IDS = new Set(['gfa', 'gfv']);
const GF_FORESTIER_LEGACY_ID = 'groupement_forestier';

// V5: Products to purge (obsolete or non-directly-subscribable)
const PRODUCTS_TO_PURGE = new Set(['opc_opcvm', 'fcpe', 'groupement_foncier']);

// ---------------------------------------------------------------------------
// Migration lazy V1 → V2
// Pattern identique à migrateV1toV2 dans fiscalSettingsCache.js
// ---------------------------------------------------------------------------

function familyToGrandeFamille(family: string): BaseContratProduct['grandeFamille'] {
  const map: Record<string, BaseContratProduct['grandeFamille']> = {
    'Assurance': 'Assurance',
    'Bancaire': 'Épargne bancaire',
    'Titres': 'Titres vifs',
    'Immobilier': 'Immobilier direct',
    'Défiscalisation': 'Dispositifs fiscaux immo',
    'Crypto-actifs': 'Autres',
    'Métaux précieux': 'Autres',
    'Autres': 'Autres',
  };
  return map[family] ?? 'Non coté/PE';
}

function normalizeForMatch(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isStructuredLikeProduct(p: BaseContratProduct): boolean {
  const raw = `${p.id ?? ''} ${p.label ?? ''}`;
  const hay = normalizeForMatch(raw);
  return (
    STRUCTURED_TERMS_RE.test(hay) ||
    STRUCTURED_STRUCTUR_PHRASE_RE.test(hay) ||
    STRUCTURED_WORD_RAW_RE.test(raw)
  );
}

function buildMergedPreciousMetalsProduct(base: BaseContratProduct): BaseContratProduct {
  return {
    ...base,
    id: 'metaux_precieux',
    label: 'Métaux précieux',
    envelopeType: 'metaux_precieux',
    // On garde les métadonnées cohérentes avec un actif détenable.
    grandeFamille: 'Autres',
    catalogKind: 'asset',
    // Legacy (V1/V2) : classer en "Autres" côté family.
    family: 'Autres',
    // Optionnel : commentaire neutre (pas de fiscalité différenciée à ce stade).
    commentaireQualification:
      base.commentaireQualification ??
      'Métaux précieux détenus en direct (or/argent/platine…). Fiscalité à qualifier selon modalité de détention et régime choisi.',
  };
}

function buildMergedCryptoProduct(base: BaseContratProduct): BaseContratProduct {
  return {
    ...base,
    id: 'crypto_actifs',
    label: 'Crypto-actifs',
    envelopeType: 'crypto_actifs',
    grandeFamille: 'Autres',
    catalogKind: 'asset',
    family: 'Autres',
    templateKey: base.templateKey ?? 'crypto_asset',
    commentaireQualification:
      base.commentaireQualification ??
      'Actifs numériques (crypto-actifs) — fiscalité spécifique art. 150 VH bis. Assimilation : pas de sous-catégories si règles identiques.',
  };
}

function normalizeGrandeFamille(p: BaseContratProduct): BaseContratProduct {
  // Le type GrandeFamille n'inclut plus ces valeurs legacy, mais elles peuvent exister en DB.
  const gf = p.grandeFamille as unknown as string;
  if (LEGACY_GRANDE_FAMILLES_TO_AUTRES.has(gf)) return { ...p, grandeFamille: 'Autres' };
  return p;
}

function buildSplitPrevoyanceProduct(
  base: BaseContratProduct,
  nextId: string,
  nextLabel: string,
): BaseContratProduct {
  return {
    ...base,
    id: nextId,
    label: nextLabel,
    envelopeType: nextId,
    grandeFamille: 'Assurance',
    catalogKind: 'protection',
  };
}

function migrateBaseContratV3toV4(data: BaseContratSettings): BaseContratSettings {
  if (data.schemaVersion === 4 || (data.schemaVersion as number) === 5) return data;

  // Assure V3 en amont (V1/V2 → V3)
  const v3 = migrateBaseContratV2toV3(data);

  // 1) Supprimer les produits structurés résiduels (DB historique)
  const withoutStructured = v3.products
    .filter((p) => !isStructuredLikeProduct(p))
    .map(normalizeGrandeFamille);

  // 2) Métaux précieux : collapse des sous-produits en un seul produit
  const detailedMetals = withoutStructured.filter((p) => DETAILED_PRECIOUS_METALS_IDS.has(p.id));
  let products = withoutStructured.filter((p) => !DETAILED_PRECIOUS_METALS_IDS.has(p.id));

  const hasMergedMetals = products.some((p) => p.id === 'metaux_precieux');
  if (!hasMergedMetals && detailedMetals.length > 0) {
    const base = [...detailedMetals].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];
    const merged = buildMergedPreciousMetalsProduct(base);
    products = [...products, merged].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  // 2b) Crypto-actifs : collapse des sous-produits en un seul produit
  const detailedCrypto = products.filter((p) => DETAILED_CRYPTO_IDS.has(p.id));
  products = products.filter((p) => !DETAILED_CRYPTO_IDS.has(p.id));

  const hasMergedCrypto = products.some((p) => p.id === 'crypto_actifs');
  if (!hasMergedCrypto && detailedCrypto.length > 0) {
    const base = [...detailedCrypto].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];
    const merged = buildMergedCryptoProduct(base);
    products = [...products, merged].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  // 3) Prévoyance : split obligatoire (décès vs ITT/invalidité)
  const prev = products.find((p) => p.id === 'prevoyance_individuelle');
  if (prev) {
    products = products.filter((p) => p.id !== 'prevoyance_individuelle');

    const hasA = products.some((p) => p.id === 'prevoyance_individuelle_deces');
    const hasB = products.some((p) => p.id === 'prevoyance_individuelle_itt_invalidite');

    const prevSort = typeof prev.sortOrder === 'number' ? prev.sortOrder : null;

    const toAdd: BaseContratProduct[] = [];
    if (!hasA) {
      const splitA = buildSplitPrevoyanceProduct(prev, 'prevoyance_individuelle_deces', 'Prévoyance individuelle décès');
      if (prevSort !== null) splitA.sortOrder = prevSort;
      toAdd.push(splitA);
    }
    if (!hasB) {
      const splitB = buildSplitPrevoyanceProduct(
        prev,
        'prevoyance_individuelle_itt_invalidite',
        'Prévoyance individuelle arrêt de travail / invalidité',
      );
      if (prevSort !== null) splitB.sortOrder = prevSort + 1;
      toAdd.push(splitB);
    }

    // Si on remplace 1 produit legacy par 2 nouveaux, on décale les suivants pour
    // garder des sortOrder entiers et éviter les collisions.
    if (!hasA && !hasB && prevSort !== null) {
      products = products.map((p) => {
        if (typeof p.sortOrder !== 'number') return p;
        if (p.sortOrder > prevSort) return { ...p, sortOrder: p.sortOrder + 1 };
        return p;
      });
    }

    if (toAdd.length > 0) {
      products = [...products, ...toAdd].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
  }

  // 4) Dedupe (sécurité) — on conserve l'ordre existant (sortOrder) :
  // migration minimale, sans réordonner arbitrairement le catalogue admin.
  products = [...products]
    .sort((a, b) => {
      const sa = typeof a.sortOrder === 'number' ? a.sortOrder : Number.POSITIVE_INFINITY;
      const sb = typeof b.sortOrder === 'number' ? b.sortOrder : Number.POSITIVE_INFINITY;
      return sa - sb;
    })
    .filter((p, idx, arr) => arr.findIndex((x) => x.id === p.id) === idx);

  return {
    ...v3,
    schemaVersion: 4 as BaseContratSettings['schemaVersion'],
    products,
  };
}

// ---------------------------------------------------------------------------
// Migration lazy V4 → V5 (Rules: no exception, assimilation, PP/PM split)
// ---------------------------------------------------------------------------

function removeExceptions(p: BaseContratProduct): BaseContratProduct {
  const epm = p.eligiblePM as string;
  if (epm === 'parException') {
    return {
      ...p,
      eligiblePM: 'non',
      corporateHoldable: false,
      holders: p.directHoldable ? 'PP' : 'PP',
      eligiblePMPrecision: null,
    };
  }
  return p;
}

function remapLegacyId(p: BaseContratProduct): BaseContratProduct {
  const newId = LEGACY_ID_REMAP[p.id];
  if (newId) return { ...p, id: newId, envelopeType: newId };
  return p;
}

function buildMergedGFAgriVitiProduct(base: BaseContratProduct): BaseContratProduct {
  return {
    ...base,
    id: 'groupement_foncier_agri_viti',
    label: 'Groupement foncier agricole / viticole (GFA / GFV)',
    envelopeType: 'groupement_foncier_agri_viti',
    grandeFamille: 'Immobilier indirect',
    catalogKind: 'asset',
    family: 'Immobilier',
    templateKey: base.templateKey ?? 'real_estate_indirect',
    commentaireQualification:
      'Parts de GFA/GFV. Revenus fonciers, PV immobilières, exonération partielle DMTG art. 793 bis CGI (75 %/50 %, bail long terme ≥ 18 ans).',
  };
}

function renameGFForestier(p: BaseContratProduct): BaseContratProduct {
  return {
    ...p,
    id: 'groupement_foncier_forestier',
    label: 'Groupement forestier (GFF / GF)',
    envelopeType: 'groupement_foncier_forestier',
    grandeFamille: 'Immobilier indirect',
    catalogKind: 'asset',
    family: 'Immobilier',
    templateKey: p.templateKey ?? 'real_estate_indirect',
    commentaireQualification:
      'Parts de groupements forestiers. Revenus forestiers, PV immobilières, exonération DMTG art. 793 1° 3° CGI (75 %, gestion durable).',
  };
}

function splitProductPPPM(p: BaseContratProduct): BaseContratProduct[] {
  if (!p.directHoldable || !p.corporateHoldable) return [p];
  return [
    {
      ...p,
      id: `${p.id}_pp`,
      label: `${p.label} (PP)`,
      envelopeType: `${p.id}_pp`,
      directHoldable: true,
      corporateHoldable: false,
      eligiblePM: 'non' as const,
      holders: 'PP' as const,
      eligiblePMPrecision: null,
    },
    {
      ...p,
      id: `${p.id}_pm`,
      label: `${p.label} (Entreprise)`,
      envelopeType: `${p.id}_pm`,
      directHoldable: false,
      corporateHoldable: true,
      eligiblePM: 'oui' as const,
      holders: 'PM' as const,
    },
  ];
}

function migrateBaseContratV4toV5(data: BaseContratSettings): BaseContratSettings {
  if ((data.schemaVersion as number) === 5) return data;

  const v4 = migrateBaseContratV3toV4(data);

  // 1) Remove parException
  let products = v4.products.map(removeExceptions);

  // 2) Remap legacy IDs
  products = products.map(remapLegacyId);

  // 3) Crypto assimilation (legacy DB may have individual crypto products)
  const cryptoDetails = products.filter((p) => DETAILED_CRYPTO_IDS.has(p.id));
  products = products.filter((p) => !DETAILED_CRYPTO_IDS.has(p.id));
  if (!products.some((p) => p.id === 'crypto_actifs') && cryptoDetails.length > 0) {
    products.push(buildMergedCryptoProduct(cryptoDetails[0]));
  }

  // 4) OPC purge (underlying assets, not directly subscribable by PP/PM)
  products = products.filter((p) => !OPC_ASSIMILATION_IDS.has(p.id));

  // 5a) GF agri/viti assimilation → groupement_foncier_agri_viti
  const gfAgriDetails = products.filter((p) => GF_AGRI_VITI_IDS.has(p.id));
  products = products.filter((p) => !GF_AGRI_VITI_IDS.has(p.id));
  if (!products.some((p) => p.id === 'groupement_foncier_agri_viti') && gfAgriDetails.length > 0) {
    products.push(buildMergedGFAgriVitiProduct(gfAgriDetails[0]));
  }

  // 5b) GF forestier rename
  products = products.map((p) =>
    p.id === GF_FORESTIER_LEGACY_ID ? renameGFForestier(p) : p
  );

  // 5c) Purge known obsolete products
  products = products.filter((p) => !PRODUCTS_TO_PURGE.has(p.id));

  // 6) PP/PM split
  products = products.flatMap(splitProductPPPM);

  // 7) Dedupe + re-sort
  products = products
    .filter((p, idx, arr) => arr.findIndex((x) => x.id === p.id) === idx)
    .map((p, i) => ({ ...p, sortOrder: i + 1 }));

  return { ...v4, schemaVersion: LATEST_SCHEMA_VERSION, products };
}

/** Exportée pour tests unitaires (pure function). */
export function migrateBaseContratSettingsToLatest(data: BaseContratSettings): BaseContratSettings {
  return migrateBaseContratV4toV5(data);
}

function migrateBaseContratV1toV2(data: BaseContratSettings): BaseContratSettings {
  if (data.schemaVersion === 2 || data.schemaVersion === 3 || data.schemaVersion === 4 || (data.schemaVersion as number) === 5) return data;
  return {
    ...data,
    schemaVersion: 2,
    products: data.products.map((p) => ({
      ...p,
      grandeFamille: p.grandeFamille ?? familyToGrandeFamille(p.family ?? 'Autres'),
      nature: p.nature ?? 'Contrat / compte / enveloppe',
      detensiblePP: p.detensiblePP ?? (p.holders === 'PP' || p.holders === 'PP+PM'),
      eligiblePM: p.eligiblePM ?? (p.holders === 'PM' || p.holders === 'PP+PM' ? 'oui' : 'non'),
      eligiblePMPrecision: p.eligiblePMPrecision ?? null,
      souscriptionOuverte: p.souscriptionOuverte ?? (p.open2026 ? 'oui' : 'non'),
      commentaireQualification: p.commentaireQualification ?? null,
    })),
  };
}

// ---------------------------------------------------------------------------
// Migration lazy V2 → V3 (Taxonomie relationnelle)
// ---------------------------------------------------------------------------

function migrateBaseContratV2toV3(data: BaseContratSettings): BaseContratSettings {
  if (data.schemaVersion === 3 || data.schemaVersion === 4 || (data.schemaVersion as number) === 5) return data;
  
  // Si on vient de V1, on passe d'abord par V2
  const v2Data = data.schemaVersion === 1 ? migrateBaseContratV1toV2(data) : data;
  
  return {
    ...v2Data,
    schemaVersion: 3,
    products: v2Data.products.map((p) => {
      // 1. Mapping nature -> catalogKind
      let catalogKind: BaseContratProduct['catalogKind'] = 'wrapper';
      if (p.nature === 'Dispositif fiscal immobilier') {
        catalogKind = 'tax_overlay';
      } else if (p.nature === 'Actif / instrument') {
        catalogKind = 'asset';
      }
      
      // Cas particulier : protections (qui étaient souvent en 'Contrat')
      if (p.grandeFamille === 'Assurance' && (p.label.toLowerCase().includes('prévoyance') || p.label.toLowerCase().includes('emprunteur'))) {
        catalogKind = 'protection';
      }
      
      // 2. Mapping detensiblePP/eligiblePM -> directHoldable/corporateHoldable
      const directHoldable = p.detensiblePP ?? true;
      const corporateHoldable = p.eligiblePM === 'oui' || (p.eligiblePM as string) === 'parException';
      
      // 3. Initialisation allowedWrappers
      // Si c'est un asset détenable en direct, il peut être 'direct'.
      // Les relations exactes (ex: SCPI -> AV) seront affinées par l'admin.
      const allowedWrappers: string[] = [];
      
      return {
        ...p,
        catalogKind,
        directHoldable,
        corporateHoldable,
        allowedWrappers,
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let cache: { data: BaseContratSettings | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};

// ---------------------------------------------------------------------------
// localStorage helpers (safe — never throws)
// ---------------------------------------------------------------------------

function persistCache(): void {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ data: cache.data, timestamp: cache.timestamp }),
    );
  } catch {
    /* quota exceeded or private browsing — ignore */
  }
}

function restoreCache(): void {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.data && typeof parsed.timestamp === 'number') {
      const migrated = migrateBaseContratV4toV5(parsed.data as BaseContratSettings);
      cache = { data: migrated, timestamp: parsed.timestamp };
      // Ré-écrit en localStorage pour éviter l'anti-flash avec anciennes données.
      persistCache();
    }
  } catch {
    /* corrupted data — ignore */
  }
}

// Restore on module load (anti-flash)
restoreCache();

// ---------------------------------------------------------------------------
// Fetch from Supabase
// ---------------------------------------------------------------------------

async function fetchFromSupabase(): Promise<BaseContratSettings> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT);

  try {
    const { data: rows, error } = await supabase
      .from('base_contrat_settings')
      .select('data')
      .eq('id', 1)
      .abortSignal(controller.signal);

    if (error) {
      // Table may not exist yet (migration not applied) — return empty
      if (error.code === '42P01' || error.code === 'PGRST204') {
        return EMPTY_DATA;
      }
      console.warn('[baseContratCache] fetch error:', error.message);
      return cache.data ?? EMPTY_DATA;
    }

    const raw = rows?.[0]?.data;
    if (!raw || typeof raw !== 'object') return EMPTY_DATA;

    const migrated = migrateBaseContratV4toV5(raw as BaseContratSettings);
    cache = { data: migrated, timestamp: Date.now() };
    persistCache();
    return migrated;
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      console.warn('[baseContratCache] fetch timeout');
    }
    return cache.data ?? EMPTY_DATA;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getBaseContratSettings(
  opts?: { force?: boolean },
): Promise<BaseContratSettings> {
  const force = opts?.force ?? false;

  // Valid in-memory cache
  if (!force && cache.data && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  return fetchFromSupabase();
}

export async function isBaseContratSettingsSourceAvailable(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT);

  try {
    const { error } = await supabase
      .from('base_contrat_settings')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);

    if (error) {
      return false;
    }

    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function saveBaseContratSettings(
  data: BaseContratSettings,
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('base_contrat_settings')
      .upsert({ id: 1, data }, { onConflict: 'id' });

    if (error) {
      console.error('[baseContratCache] save error:', error.message);
      return { error: error.message };
    }

    // Update local cache
    cache = { data, timestamp: Date.now() };
    persistCache();
    broadcastInvalidation();
    return { error: null };
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Unknown error';
    console.error('[baseContratCache] save exception:', msg);
    return { error: msg };
  }
}

export function invalidateBaseContrat(): void {
  cache = { data: null, timestamp: 0 };
  persistCache();
}

export function broadcastInvalidation(): void {
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* SSR or test env — ignore */
  }
}

export function addBaseContratListener(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
