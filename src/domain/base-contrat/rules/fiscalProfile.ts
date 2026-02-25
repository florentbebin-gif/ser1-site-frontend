/**
 * domain/base-contrat/rules/fiscalProfile.ts
 *
 * PR8 — Interface FiscalProfile et mapping engine-envelope → catalog ID.
 *
 * FiscalProfile est un sous-ensemble de ProductRules enrichi du contexte
 * (enveloppe moteur + audience PP/PM). Il sert de point d'entrée unique
 * pour afficher le profil fiscal d'un produit dans les simulateurs.
 *
 * Mapping envelopes moteur → catalog :
 *   AV   → assurance_vie (PP) | contrat_capitalisation_pm (PM)
 *   PER  → perin_assurance | perin_bancaire  (même ID PP/PM : pas de split)
 *   PEA  → pea  (PP uniquement — null pour PM)
 *   CTO  → cto_pp | cto_pm
 *   SCPI → parts_scpi_pp | parts_scpi_pm
 */

import type { Audience, ProductRules } from './types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type EnvelopeCode = 'AV' | 'PER' | 'PEA' | 'CTO' | 'SCPI';

export interface FiscalProfile {
  /** ID produit catalogue utilisé pour la requête de règles. */
  catalogId: string;
  /** Audience ciblée. */
  audience: Audience;
  /** Règles fiscales structurées en 3 phases. */
  rules: ProductRules;
  /** false si aucun bloc de règles n'a été trouvé. */
  hasRules: boolean;
}

// ── Mapping envelope → catalog IDs ───────────────────────────────────────────

const EMPTY_RULES: ProductRules = { constitution: [], sortie: [], deces: [] };

type CatalogIdPair = { pp: string; pm: string | null };

const ENVELOPE_CATALOG_MAP: Record<EnvelopeCode, CatalogIdPair> = {
  AV:   { pp: 'assurance_vie',          pm: 'contrat_capitalisation_pm' },
  // PER géré séparément via le flag perBancaire
  PER:  { pp: 'perin_assurance',        pm: 'perin_assurance' },
  PEA:  { pp: 'pea',                    pm: null },
  CTO:  { pp: 'cto_pp',                 pm: 'cto_pm' },
  SCPI: { pp: 'parts_scpi_pp',          pm: 'parts_scpi_pm' },
};

/**
 * Retourne l'ID catalogue correspondant à une enveloppe moteur, une audience
 * et (pour PER) le flag perBancaire.
 * Retourne null si la combinaison n'est pas supportée (ex. PEA + PM).
 */
export function getEnvelopeCatalogId(
  envelope: string,
  audience: Audience,
  perBancaire = false,
): string | null {
  if (envelope === 'PER') {
    // perin_assurance / perin_bancaire : pas de split PP/PM dans le catalogue
    return perBancaire ? 'perin_bancaire' : 'perin_assurance';
  }
  const entry = ENVELOPE_CATALOG_MAP[envelope as EnvelopeCode];
  if (!entry) return null;
  return audience === 'pm' ? entry.pm : entry.pp;
}

// ── Builder FiscalProfile ─────────────────────────────────────────────────────

/**
 * Construit un FiscalProfile à partir de règles déjà résolues.
 * Utilisé par les hooks features pour éviter de dupliquer la logique.
 */
export function buildFiscalProfile(
  catalogId: string,
  audience: Audience,
  rules: ProductRules,
): FiscalProfile {
  const hasRules =
    rules.constitution.length > 0 ||
    rules.sortie.length > 0 ||
    rules.deces.length > 0;
  return { catalogId, audience, rules, hasRules };
}

/**
 * Profil vide (produit sans règles connues ou combinaison non supportée).
 */
export function emptyFiscalProfile(
  catalogId: string,
  audience: Audience,
): FiscalProfile {
  return { catalogId, audience, rules: EMPTY_RULES, hasRules: false };
}
