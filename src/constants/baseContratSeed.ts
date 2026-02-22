/**
 * baseContratSeed.ts
 *
 * Transformateur du catalogue de référence (catalogue.seed.v1.json)
 * vers le format BaseContratProduct V2.
 *
 * Format source JSON (schemaVersion 1) :
 *   family, kind, ppDirectHoldable, pmEligibility, pmEligibilityNote,
 *   open2026 (string "oui"/"non"/"na"), qualificationComment, references (string[])
 *
 * Usage :
 *   import { SEED_PRODUCTS, syncProductsWithSeed } from '@/constants/baseContratSeed';
 *
 * Règle :
 *   - "Initialiser" : utiliser SEED_PRODUCTS directement si products.length === 0
 *   - "Synchroniser" : utiliser syncProductsWithSeed(existingProducts) pour remplacer
 *                      la liste complète en préservant les rulesets utilisateur
 *
 * ⚠️  Ne jamais importer ce fichier dans un composant non-admin.
 */

import type {
  BaseContratProduct,
  CatalogKind,
  GrandeFamille,
  ProductNature,
  EligiblePM,
  SouscriptionOuverte,
  ConfidenceLevel,
} from '@/types/baseContratSettings';
import { EMPTY_RULESET } from '@/types/baseContratSettings';
import rawCatalogue from './base-contrat/catalogue.seed.v1.json';

// ---------------------------------------------------------------------------
// Type intermédiaire (format JSON source du seed — schemaVersion 1)
// ---------------------------------------------------------------------------

interface RawSeedProduct {
  id: string;
  label: string;
  /** Famille source (ex: "Assurance", "Crypto-actifs", "Fonds / OPC"…) */
  family: string;
  /** Nature source : "actif_instrument" | "contrat_compte_enveloppe" | "dispositif_fiscal_immobilier" */
  kind: string;
  ppDirectHoldable: boolean;
  /** "oui" | "non" | "exception" */
  pmEligibility: string;
  pmEligibilityNote?: string | null;
  /** "oui" | "non" | "na" */
  open2026: string;
  qualificationComment?: string | null;
  /** Références sous forme de strings simples */
  references?: string[];
  templateKey?: string | null;
}

interface RawCatalogue {
  schemaVersion: number;
  generatedAt: string;
  products: RawSeedProduct[];
}

// ---------------------------------------------------------------------------
// Mappings source → V2
// ---------------------------------------------------------------------------

/** Mapping family source → grandeFamille V2 */
function familyToGrandeFamille(family: string): GrandeFamille {
  const map: Record<string, GrandeFamille> = {
    'Épargne Assurance': 'Épargne Assurance',
    'Assurance prévoyance': 'Assurance prévoyance',
    'Crypto-actifs': 'Autres',
    'Créances / Droits': 'Créances/Droits',
    'Dispositifs fiscaux immobilier': 'Dispositifs fiscaux immobilier',
    'Épargne bancaire': 'Épargne bancaire',
    'Valeurs mobilières': 'Valeurs mobilières',
    'Immobilier direct': 'Immobilier direct',
    'Immobilier indirect (pierre-papier & foncier)': 'Immobilier indirect',
    'Métaux précieux': 'Autres',
    'Non coté / Private Equity': 'Non coté/PE',
    'Retraite & épargne salariale': 'Retraite & épargne salariale',
    'Autres': 'Autres',
  };
  return map[family] ?? 'Non coté/PE';
}

/** Mapping grandeFamille → family legacy (pour baseContratAdapter.ts) */
function grandeFamilleToFamilyLegacy(gf: GrandeFamille): BaseContratProduct['family'] {
  const map: Record<GrandeFamille, BaseContratProduct['family']> = {
    'Épargne Assurance': 'Assurance',
    'Assurance prévoyance': 'Assurance',
    'Épargne bancaire': 'Bancaire',
    'Valeurs mobilières': 'Titres',
    'Immobilier direct': 'Immobilier',
    'Immobilier indirect': 'Immobilier',
    'Non coté/PE': 'Autres',
    'Créances/Droits': 'Autres',
    'Dispositifs fiscaux immobilier': 'Défiscalisation',
    'Retraite & épargne salariale': 'Autres',
    'Autres': 'Autres',
  };
  return map[gf] ?? 'Autres';
}

/** Mapping kind source → nature V2 */
function kindToNature(kind: string): ProductNature {
  const map: Record<string, ProductNature> = {
    'actif_instrument': 'Actif / instrument',
    'contrat_compte_enveloppe': 'Contrat / compte / enveloppe',
    'dispositif_fiscal_immobilier': 'Dispositif fiscal immobilier',
  };
  return map[kind] ?? 'Contrat / compte / enveloppe';
}

/** Mapping kind source → catalogKind V3 */
function kindToCatalogKind(kind: string): CatalogKind {
  const map: Record<string, CatalogKind> = {
    'actif_instrument': 'asset',
    'contrat_compte_enveloppe': 'wrapper',
    'dispositif_fiscal_immobilier': 'tax_overlay',
  };
  return map[kind] ?? 'wrapper';
}

/** Mapping pmEligibility source → eligiblePM V2 */
function toEligiblePM(pm: string): EligiblePM {
  if (pm === 'oui') return 'oui';
  return 'non';
}

/** Dérive holders legacy depuis detensiblePP + eligiblePM */
function toHolders(pp: boolean, pm: EligiblePM): BaseContratProduct['holders'] {
  if (pp && pm === 'oui') return 'PP+PM';
  if (!pp && pm === 'oui') return 'PM';
  return 'PP';
}

// ---------------------------------------------------------------------------
// Transformation seed → BaseContratProduct V2
// ---------------------------------------------------------------------------

function toProduct(raw: RawSeedProduct, index: number): BaseContratProduct {
  const today = new Date().toISOString().slice(0, 10);
  const grandeFamille = familyToGrandeFamille(raw.family);
  const nature = kindToNature(raw.kind);
  let catalogKind = kindToCatalogKind(raw.kind);
  // Alignement avec la taxonomie V3 : certaines assurances sont des "protections" calculables.
  if (
    grandeFamille === 'Assurance prévoyance' &&
    /pr[ée]voyance|emprunteur|homme[- ]cl[ée]|d[ée]pendance|obs[èe]ques/i.test(raw.label)
  ) {
    catalogKind = 'protection';
  }
  const eligiblePM = toEligiblePM(raw.pmEligibility);
  const souscriptionOuverte = (raw.open2026 as SouscriptionOuverte) ?? 'oui';

  const directHoldable = raw.ppDirectHoldable;
  const corporateHoldable = eligiblePM === 'oui';

  return {
    id: raw.id,
    label: raw.label,

    // V3 (champs requis)
    catalogKind,
    directHoldable,
    corporateHoldable,
    allowedWrappers: [],

    // V2 (conservé pour compat + migration)
    grandeFamille,
    nature,
    detensiblePP: raw.ppDirectHoldable,
    eligiblePM,
    eligiblePMPrecision: raw.pmEligibilityNote ?? null,
    souscriptionOuverte,
    commentaireQualification: raw.qualificationComment ?? null,
    templateKey: raw.templateKey ?? null,
    confidenceLevel: 'toVerify' as ConfidenceLevel,
    references: (raw.references ?? []).map((ref) => ({
      label: ref,
      url: null,
      note: null,
    })),
    todoToConfirm: [],
    sortOrder: index + 1,
    isActive: true,
    closedDate: null,
    // Champs legacy conservés pour compatibilité baseContratAdapter.ts
    family: grandeFamilleToFamilyLegacy(grandeFamille),
    holders: toHolders(raw.ppDirectHoldable, eligiblePM),
    envelopeType: raw.id,
    open2026: souscriptionOuverte === 'oui',
    rulesets: [{ ...EMPTY_RULESET, effectiveDate: today }],
  };
}

// ---------------------------------------------------------------------------
// Export principal
// ---------------------------------------------------------------------------

const catalogue = rawCatalogue as unknown as RawCatalogue;

// ---------------------------------------------------------------------------
// Point 5 — Split PP/PM : si directHoldable && corporateHoldable, créer 2 produits
// ---------------------------------------------------------------------------

function splitPPPM(products: BaseContratProduct[]): BaseContratProduct[] {
  const result: BaseContratProduct[] = [];
  for (const p of products) {
    if (p.directHoldable && p.corporateHoldable) {
      // PP variant
      result.push({
        ...p,
        id: `${p.id}_pp`,
        label: `${p.label} (PP)`,
        envelopeType: `${p.id}_pp`,
        directHoldable: true,
        corporateHoldable: false,
        eligiblePM: 'non',
        holders: 'PP',
        eligiblePMPrecision: null,
      });
      // PM variant
      result.push({
        ...p,
        id: `${p.id}_pm`,
        label: `${p.label} (PM)`,
        envelopeType: `${p.id}_pm`,
        directHoldable: false,
        corporateHoldable: true,
        eligiblePM: 'oui',
        holders: 'PM',
      });
    } else {
      result.push(p);
    }
  }
  // Re-assign sortOrder
  return result.map((p, i) => ({ ...p, sortOrder: i + 1 }));
}

/** Liste complète des produits du seed, prêts à être insérés dans base_contrat_settings. */
export const SEED_PRODUCTS: BaseContratProduct[] = splitPPPM(catalogue.products.map(toProduct));

/**
 * Synchronise le catalogue avec le seed canonique.
 * Remplace la liste complète des produits par le seed,
 * en préservant les rulesets configurés par l'utilisateur
 * (match par ID).
 *
 * Effets : ajoute les nouveaux produits, supprime les obsolètes,
 * met à jour les métadonnées (label, famille, holdability, etc.).
 */
export function syncProductsWithSeed(
  existing: BaseContratProduct[],
): BaseContratProduct[] {
  const existingRulesets = new Map<string, BaseContratProduct['rulesets']>();
  for (const p of existing) {
    if (p.rulesets && p.rulesets.length > 0) {
      existingRulesets.set(p.id, p.rulesets);
    }
  }
  return SEED_PRODUCTS.map((seedProduct) => {
    const rulesets = existingRulesets.get(seedProduct.id) ?? seedProduct.rulesets;
    return { ...seedProduct, rulesets };
  });
}

/** Nombre de produits dans le seed (utile pour l'UI). */
export const SEED_PRODUCT_COUNT = SEED_PRODUCTS.length;
