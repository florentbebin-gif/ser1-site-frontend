/**
 * fieldLabels.fr.ts — Labels métier FR pour les champs de phase Base-Contrat.
 *
 * DoD : 0 camelCase visible dans l'UI en mode normal.
 *
 * Conventions :
 *  - FIELD_LABELS_FR : mapping exhaustif camelCase → libellé FR
 *  - humanizeFieldKey() : fallback automatique pour les clés non mappées
 *  - formatRefLabel() : $ref:... → libellé lisible + source
 *  - REF_LABELS : mapping $ref → { label, source, settingsPath }
 */

// ---------------------------------------------------------------------------
// Mapping exhaustif camelCase → libellé FR
// ---------------------------------------------------------------------------

export const FIELD_LABELS_FR: Record<string, string> = {
  // ── Taux IR / PFU ──────────────────────────────────────────────────────
  irRatePercent: 'Taux IR (PFU)',
  irRateUnderThresholdPercent: 'Taux IR sous le seuil',
  irRateOverThresholdPercent: 'Taux IR au-dessus du seuil',
  moins4AnsIrRatePercent: 'Taux IR — moins de 4 ans',
  de4a8AnsIrRatePercent: 'Taux IR — 4 à 8 ans',
  plus8AnsIrRatePercent: 'Taux IR — plus de 8 ans',
  allowBaremeIR: 'Option barème IR autorisée',
  versementDeductibleIR: 'Versements déductibles de l\'IR',

  // ── Prélèvements sociaux ────────────────────────────────────────────────
  psRatePercent: 'Taux PS (prélèvements sociaux)',
  psSurInteretsFondsEuro: 'PS sur intérêts (fonds €)',

  // ── Abattements ────────────────────────────────────────────────────────
  abattementAnnuelSingle: 'Abattement annuel (célibataire)',
  abattementAnnuelCouple: 'Abattement annuel (couple)',
  abattementParBeneficiaire: 'Abattement par bénéficiaire',
  abattementGlobal: 'Abattement global',
  abattementBaremePercent: 'Abattement barème (%)',
  plus8AnsAbattementSingle: 'Abattement +8 ans (célibataire)',
  plus8AnsAbattementCouple: 'Abattement +8 ans (couple)',

  // ── Seuils ─────────────────────────────────────────────────────────────
  seuilPrimesNettes: 'Seuil primes nettes',

  // ── Barème / tranches ──────────────────────────────────────────────────
  brackets: 'Barème par tranches',
  taxationMode: 'Mode de taxation',

  // ── Ancienneté / durée ─────────────────────────────────────────────────
  ancienneteMinAns: 'Ancienneté minimale (ans)',
  exonerationIRApresAnciennete: 'Exonération IR après ancienneté',

  // ── Fractions imposables (rente) ───────────────────────────────────────
  fractionImposableMoins50: 'Fraction imposable — moins de 50 ans',
  fractionImposable50a59: 'Fraction imposable — 50 à 59 ans',
  fractionImposable60a69: 'Fraction imposable — 60 à 69 ans',
  fractionImposable70etPlus: 'Fraction imposable — 70 ans et plus',

  // ── Plafonds PER / 163 quatervicies ────────────────────────────────────
  plafond163QuaterviciesRatePercent: 'Plafond déductibilité (% revenus)',
  plafond163QuaterviciesMinPassMultiple: 'Plafond min (× PASS)',
  plafond163QuaterviciesMaxPassMultiple: 'Plafond max (× PASS)',

  // ── Prévoyance (protections calculables) ────────────────────────────────
  capitalDeces: 'Capital décès',
  nombreBeneficiaires: 'Nombre de bénéficiaires',
  prestationMensuelle: 'Prestation mensuelle',
  franchiseJours: 'Franchise',
  dureeMaxMois: 'Durée maximale d’indemnisation',
};

// ---------------------------------------------------------------------------
// Acronymes à préserver en majuscules dans le fallback
// ---------------------------------------------------------------------------

const ACRONYMS = new Set(['ir', 'pfu', 'ps', 'dmtg', 'uc', 'per', 'pea', 'av', 'cto', 'pass', 'rvto', 'pp', 'pm']);

/**
 * Convertit un camelCase en libellé lisible.
 * Ex : "irRatePercent" → "IR rate percent"
 *      "unknownIRField" → "Unknown IR field"
 * Utilisé comme fallback quand FIELD_LABELS_FR ne couvre pas la clé.
 *
 * Algorithme :
 *  1. Insère un espace avant chaque séquence de majuscules suivie d'une minuscule
 *     (ex: IRField → IR Field) et avant chaque majuscule isolée (camelCase normal).
 *  2. Regroupe les séquences tout-majuscules comme acronymes.
 */
export function humanizeFieldKey(key: string): string {
  if (FIELD_LABELS_FR[key]) return FIELD_LABELS_FR[key];

  // Sépare les transitions camelCase en préservant les séquences de majuscules
  // "irRatePercent" → "ir Rate Percent"
  // "unknownIRField" → "unknown IR Field"
  const spaced = key
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')   // minuscule→Majuscule
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2'); // séquence MAJ → MAJ+min

  const words = spaced.trim().split(/\s+/);

  const humanized = words
    .map((w, i) => {
      const upper = w.toUpperCase();
      const lower = w.toLowerCase();
      // Si le mot entier est un acronyme connu → majuscules
      if (ACRONYMS.has(lower) || ACRONYMS.has(upper.toLowerCase())) return upper;
      // Si le mot est déjà tout en majuscules (longueur > 1) → conserver
      if (w === upper && w.length > 1) return upper;
      return i === 0 ? capitalize(lower) : lower;
    })
    .join(' ');

  return humanized;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Références externes ($ref) → libellé lisible
// ---------------------------------------------------------------------------

export interface RefMeta {
  /** Libellé court affiché en mode normal */
  label: string;
  /** Source affichée (ex: "Paramètres Impôts") */
  source: string;
  /** Chemin de navigation vers la page de paramètres */
  settingsRoute?: string;
}

export const REF_LABELS: Record<string, RefMeta> = {
  '$ref:tax_settings.pfu.current.rateIR': {
    label: 'Taux IR — PFU (flat tax)',
    source: 'Paramètres Impôts',
    settingsRoute: '/settings/impots',
  },
  '$ref:tax_settings.pfu.current.rateSocial': {
    label: 'Taux PS — PFU',
    source: 'Paramètres Impôts',
    settingsRoute: '/settings/impots',
  },
  '$ref:ps_settings.patrimony.current.totalRate': {
    label: 'Taux PS — Patrimoine (taux global)',
    source: 'Paramètres Prélèvements sociaux',
    settingsRoute: '/settings/prelevements',
  },
};

/**
 * Formate une valeur $ref en libellé lisible.
 * Ex : "$ref:tax_settings.pfu.current.rateIR"
 *   → { label: "Taux IR — PFU (flat tax)", source: "Paramètres Impôts", settingsRoute: "/settings/impots" }
 *
 * Fallback : parse le chemin pour produire un libellé générique.
 */
export function formatRefLabel(ref: string): RefMeta {
  if (REF_LABELS[ref]) return REF_LABELS[ref];

  // Fallback : parse "$ref:a.b.c.d"
  const path = ref.replace(/^\$ref:/, '');
  const parts = path.split('.');
  const isImpots = parts[0]?.includes('tax');
  const isPS = parts[0]?.includes('ps');

  const source = isImpots
    ? 'Paramètres Impôts'
    : isPS
    ? 'Paramètres Prélèvements sociaux'
    : 'Paramètres';

  const settingsRoute = isImpots
    ? '/settings/impots'
    : isPS
    ? '/settings/prelevements'
    : undefined;

  // Humanise le dernier segment
  const lastKey = parts[parts.length - 1] ?? path;
  const label = `Valeur automatique — ${humanizeFieldKey(lastKey)}`;

  return { label, source, settingsRoute };
}
