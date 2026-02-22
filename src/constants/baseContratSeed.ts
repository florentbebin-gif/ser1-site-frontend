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
 *   import { SEED_PRODUCTS, mergeSeedIntoProducts } from '@/constants/baseContratSeed';
 *
 * Règle non-destructive :
 *   - "Initialiser" : utiliser SEED_PRODUCTS directement si products.length === 0
 *   - "Compléter"   : utiliser mergeSeedIntoProducts(existingProducts) pour ajouter
 *                     uniquement les produits absents (filtre par id)
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
    'Assurance': 'Assurance',
    'Crypto-actifs': 'Autres',
    'Créances / Droits': 'Créances/Droits',
    'Dispositifs fiscaux immobiliers': 'Dispositifs fiscaux immo',
    'Épargne bancaire': 'Épargne bancaire',
    'Fonds / OPC': 'Fonds/OPC',
    'Immobilier direct': 'Immobilier direct',
    'Immobilier indirect (pierre-papier & foncier)': 'Immobilier indirect',
    'Métaux précieux': 'Autres',
    'Non coté / Private Equity': 'Non coté/PE',
    'Retraite & épargne salariale': 'Retraite & épargne salariale',
    'Titres vifs': 'Titres vifs',
    'Autres': 'Autres',
  };
  return map[family] ?? 'Non coté/PE';
}

/** Mapping grandeFamille → family legacy (pour baseContratAdapter.ts) */
function grandeFamilleToFamilyLegacy(gf: GrandeFamille): BaseContratProduct['family'] {
  const map: Record<GrandeFamille, BaseContratProduct['family']> = {
    'Assurance': 'Assurance',
    'Épargne bancaire': 'Bancaire',
    'Titres vifs': 'Titres',
    'Fonds/OPC': 'Titres',
    'Immobilier direct': 'Immobilier',
    'Immobilier indirect': 'Immobilier',
    'Non coté/PE': 'Autres',
    'Créances/Droits': 'Autres',
    'Dispositifs fiscaux immo': 'Défiscalisation',
    'Retraite & épargne salariale': 'Assurance',
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
  if (pm === 'exception') return 'parException';
  if (pm === 'oui') return 'oui';
  return 'non';
}

/** Dérive holders legacy depuis detensiblePP + eligiblePM */
function toHolders(pp: boolean, pm: EligiblePM): BaseContratProduct['holders'] {
  if (pp && (pm === 'oui' || pm === 'parException')) return 'PP+PM';
  if (!pp && (pm === 'oui' || pm === 'parException')) return 'PM';
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
    grandeFamille === 'Assurance' &&
    /pr[ée]voyance|emprunteur|homme[- ]cl[ée]/i.test(raw.label)
  ) {
    catalogKind = 'protection';
  }
  const eligiblePM = toEligiblePM(raw.pmEligibility);
  const souscriptionOuverte = (raw.open2026 as SouscriptionOuverte) ?? 'oui';

  const directHoldable = raw.ppDirectHoldable;
  const corporateHoldable = eligiblePM === 'oui' || eligiblePM === 'parException';

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
    eligiblePMPrecision: eligiblePM === 'parException' ? (raw.pmEligibilityNote ?? null) : null,
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

/** Liste complète des produits du seed, prêts à être insérés dans base_contrat_settings. */
export const SEED_PRODUCTS: BaseContratProduct[] = catalogue.products.map(toProduct);

/**
 * Fusionne le seed avec les produits existants.
 * N'écrase jamais un produit existant.
 * Retourne un nouveau tableau avec les produits manquants ajoutés à la fin.
 */
export function mergeSeedIntoProducts(
  existing: BaseContratProduct[],
): BaseContratProduct[] {
  const existingIds = new Set(existing.map((p) => p.id));
  const maxSort = existing.reduce((m, p) => Math.max(m, p.sortOrder), 0);
  const missing = SEED_PRODUCTS
    .filter((p) => !existingIds.has(p.id))
    .map((p, i) => ({ ...p, sortOrder: maxSort + i + 1 }));
  return [...existing, ...missing];
}

/** Nombre de produits dans le seed (utile pour l'UI). */
export const SEED_PRODUCT_COUNT = SEED_PRODUCTS.length;
