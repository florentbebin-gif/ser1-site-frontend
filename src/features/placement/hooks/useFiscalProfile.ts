/**
 * features/placement/hooks/useFiscalProfile.ts
 *
 * PR8 — Hook React qui résout le profil fiscal d'un produit placement.
 *
 * À partir de l'enveloppe moteur (AV / PER / PEA / CTO / SCPI) et des
 * paramètres produit, il calcule le catalogId correspondant, charge le
 * CatalogProduct, puis appelle getRulesForProduct() pour retourner un
 * FiscalProfile prêt à l'affichage.
 *
 * Audience : le simulateur placement est destiné aux particuliers (PP).
 * Le param `audience` est exposé pour l'extensibilité future (PM).
 */

import { useMemo } from 'react';
import {
  getCatalogProduct,
  getRulesForProduct,
  getEnvelopeCatalogId,
  buildFiscalProfile,
  emptyFiscalProfile,
} from '../../../domain/base-contrat/index';
import type { Audience, FiscalProfile } from '../../../domain/base-contrat/index';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseFiscalProfileParams {
  /** Code enveloppe moteur (AV / PER / PEA / CTO / SCPI). */
  envelope: string;
  /** true = PER bancaire (perin_bancaire), false = PER assurantiel. */
  perBancaire?: boolean;
  /** Audience ciblée — 'pp' par défaut (simulateur placement = particuliers). */
  audience?: Audience;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Retourne le FiscalProfile résolu pour un produit placement.
 * Mémoïsé — ne recalcule que si envelope / perBancaire / audience changent.
 */
export function useFiscalProfile({
  envelope,
  perBancaire = false,
  audience = 'pp',
}: UseFiscalProfileParams): FiscalProfile {
  return useMemo<FiscalProfile>(() => {
    // 1. Résoudre le catalogId depuis l'enveloppe moteur.
    const catalogId = getEnvelopeCatalogId(envelope, audience, perBancaire);
    if (!catalogId) {
      // Combinaison non supportée (ex. PEA + PM).
      return emptyFiscalProfile(envelope, audience);
    }

    // 2. Récupérer le CatalogProduct (requis par getRulesForProduct).
    const product = getCatalogProduct(catalogId);
    if (!product) {
      return emptyFiscalProfile(catalogId, audience);
    }

    // 3. Résoudre les règles — satisfait le DoD : rg "getRulesForProduct" src/features.
    const rules = getRulesForProduct(product, audience);

    // 4. Construire et retourner le profil.
    return buildFiscalProfile(catalogId, audience, rules);
  }, [envelope, perBancaire, audience]);
}
