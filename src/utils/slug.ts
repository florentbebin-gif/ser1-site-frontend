/**
 * Slug utilities for base_contrat product IDs.
 *
 * Rules:
 *  - camelCase only (a-z, A-Z, 0-9)
 *  - starts with a lowercase letter
 *  - length 3..40
 *  - no spaces, dashes, underscores, accents, punctuation
 *  - unique (case-insensitive) within the catalogue
 *  - not in the reserved list
 */

// ---------------------------------------------------------------------------
// Reserved slugs (system identifiers that must never be used as product IDs)
// ---------------------------------------------------------------------------

export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  'admin',
  'settings',
  'baseContrat',
  'baseContratSettings',
  'fiscalites',
  'fiscalitySettings',
  'taxSettings',
  'psSettings',
  'products',
  'rulesets',
  'templates',
  'test',
  'null',
  'undefined',
  'default',
  'system',
  'api',
  'auth',
  'login',
  'logout',
]);

// ---------------------------------------------------------------------------
// Regex: camelCase — starts with lowercase letter, then letters/digits only
// ---------------------------------------------------------------------------

const SLUG_REGEX = /^[a-z][a-zA-Z0-9]*$/;

const SLUG_MIN = 3;
const SLUG_MAX = 40;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface SlugValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * Validate a product slug against all rules.
 *
 * @param slug        - The slug to validate
 * @param existingIds - Array of existing product IDs in the catalogue
 */
export function validateProductSlug(
  slug: string,
  existingIds: string[] = [],
): SlugValidationResult {
  const errors: string[] = [];

  if (!slug) {
    return { ok: false, errors: ['Le slug est requis.'] };
  }

  // Length
  if (slug.length < SLUG_MIN) {
    errors.push(`Minimum ${SLUG_MIN} caractères (actuel : ${slug.length}).`);
  }
  if (slug.length > SLUG_MAX) {
    errors.push(`Maximum ${SLUG_MAX} caractères (actuel : ${slug.length}).`);
  }

  // Regex (camelCase, starts with lowercase letter)
  if (!SLUG_REGEX.test(slug)) {
    if (/^[A-Z]/.test(slug)) {
      errors.push('Doit commencer par une lettre minuscule (camelCase).');
    } else if (/^[0-9]/.test(slug)) {
      errors.push('Doit commencer par une lettre, pas un chiffre.');
    } else if (/[_\-\s]/.test(slug)) {
      errors.push('Pas d\u2019espace, tiret ni underscore (camelCase uniquement).');
    } else if (/[àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]/.test(slug)) {
      errors.push('Pas de caractères accentués.');
    } else {
      errors.push('Format camelCase requis : lettres (a-z, A-Z) et chiffres uniquement.');
    }
  }

  // Reserved
  if (RESERVED_SLUGS.has(slug)) {
    errors.push(`"${slug}" est un identifiant réservé du système.`);
  }

  // Uniqueness (case-insensitive)
  const lowerSlug = slug.toLowerCase();
  const duplicate = existingIds.find((id) => id.toLowerCase() === lowerSlug);
  if (duplicate) {
    errors.push(`Un produit avec l\u2019identifiant "${duplicate}" existe déjà.`);
  }

  return { ok: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Slugify: convert a French label to camelCase slug
// ---------------------------------------------------------------------------

/**
 * Convert a product label to a camelCase slug suggestion.
 *
 * Examples:
 *   "Assurance-vie"          → "assuranceVie"
 *   "PER individuel"         → "perIndividuel"
 *   "Compte-titres ordinaire" → "compteTitresOrdinaire"
 *   "Plan d'épargne"         → "planDEpargne"
 */
export function slugifyLabelToCamelCase(label: string): string {
  if (!label) return '';

  // Normalize: trim, collapse whitespace
  let s = label.trim().replace(/\s+/g, ' ');

  // Remove accents
  s = removeAccents(s);

  // Split on non-alpha-numeric boundaries (space, dash, apostrophe, etc.)
  const words = s
    .split(/[^a-zA-Z0-9]+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) return '';

  // First word: all lowercase. Remaining: capitalize first letter.
  return words
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join('');
}

/**
 * Suggest an alternative slug if the given one is taken.
 * Appends a numeric suffix (2, 3, 4...).
 */
export function suggestAlternativeSlug(
  baseSlug: string,
  existingIds: string[],
): string {
  const lowerIds = new Set(existingIds.map((id) => id.toLowerCase()));
  for (let i = 2; i <= 99; i++) {
    const candidate = `${baseSlug}${i}`;
    if (!lowerIds.has(candidate.toLowerCase())) return candidate;
  }
  return `${baseSlug}X`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalize a product label (trim + collapse spaces).
 */
export function normalizeLabel(label: string): string {
  return label.trim().replace(/\s{2,}/g, ' ');
}
