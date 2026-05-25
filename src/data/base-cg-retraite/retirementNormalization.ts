import type { BaseCgPhaseEpargne } from './types';

const MISSING_VALUE_PATTERN =
  /^(?:-|n\/a|na|nc|n\.c\.|non communiqué|non communique|non renseigné|non renseigne|à compléter|a compléter)$/i;
const PERCENT_PATTERN = /(\d+(?:[,.]\d+)?)\s*%/g;

type BaseCgRetraiteValue = string | number | null;

interface GestionFeesSplit {
  fraisGestionFondsEuro: BaseCgRetraiteValue;
  fraisGestionUc: BaseCgRetraiteValue;
  /** Segments de texte des taux orphelins (sans marker € ni UC). Ex : "1,20% SCPI/pilotée/horizon". */
  extras: string[];
  /** Vrai si FG€ et FG UC ont été assignés depuis le MÊME match (cas "1% UC et €" → taux commun). */
  bothAssignedFromSameMatch: boolean;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function parsePercent(rawPercent: string): number | null {
  const cleaned = rawPercent.replace(/\s/g, '').replace(',', '.');
  if (!cleaned) return null;

  const percentValue = /^0\d{2,}$/.test(cleaned)
    ? Number(`0.${cleaned.slice(1)}`)
    : Number(cleaned);
  return Number.isFinite(percentValue) ? percentValue / 100 : null;
}

function hasEuroMarker(value: string): boolean {
  return /(?:€|euros?|fonds?\s*(?:€|euros?)?|\(€\))/.test(value);
}

function hasUcMarker(value: string): boolean {
  return /\buc\b|unites?\s+de\s+compte|\(uc\)/.test(value);
}

function classifyGestionFee(
  text: string,
  start: number,
  end: number,
): { euro: boolean; uc: boolean } {
  const normalized = normalizeSearchText(text);
  const segmentStart =
    Math.max(
      normalized.lastIndexOf('\n', start - 1),
      normalized.lastIndexOf(';', start - 1),
      normalized.lastIndexOf('/', start - 1),
      normalized.lastIndexOf(' - ', start - 1),
      normalized.lastIndexOf(' – ', start - 1),
    ) + 1;
  const segmentEndCandidates = [
    normalized.indexOf('\n', end),
    normalized.indexOf(';', end),
    normalized.indexOf('/', end),
    normalized.indexOf(' - ', end),
    normalized.indexOf(' – ', end),
  ].filter((index) => index >= 0);
  const segmentEnd =
    segmentEndCandidates.length > 0 ? Math.min(...segmentEndCandidates) : normalized.length;
  const segment = normalized.slice(segmentStart, segmentEnd);
  // Tronquer la fenêtre after au prochain `%` pour ne pas capturer le marqueur du taux suivant
  // (ex : pour "0,65%€0,96%UC", éviter que le 1er taux récupère le "uc" du second).
  const nextPercentIndex = normalized.indexOf('%', end);
  const afterEnd =
    nextPercentIndex >= 0
      ? Math.min(segmentEnd, end + 28, nextPercentIndex)
      : Math.min(segmentEnd, end + 28);
  const after = normalized.slice(end, afterEnd);

  // On classifie uniquement avec ce qui SUIT le taux (le marqueur euro/UC est toujours après).
  // Fallback segment seulement si le `after` immédiat n'a pas de marqueur exploitable.
  const afterHasEuro = hasEuroMarker(after);
  const afterHasUc = hasUcMarker(after);
  const euro = afterHasEuro || (!afterHasUc && hasEuroMarker(segment));
  const uc = afterHasUc || (!afterHasEuro && hasUcMarker(segment));
  // Détecte un cas "uc et €" / "€ et UC" dans la même fenêtre after → taux commun aux deux.
  const both =
    /^\s*[([]?\s*uc\b[^\n;/]*(?:€|euro|fonds)/.test(after) ||
    /^\s*[([]?\s*(?:€|euro|fonds)[^\n;/]*\buc\b/.test(after);

  return {
    euro: euro || both,
    uc: uc || both,
  };
}

function splitGestionFeesFromText(value: string): GestionFeesSplit | null {
  const text = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  let fraisGestionFondsEuro: BaseCgRetraiteValue | undefined;
  let fraisGestionUc: BaseCgRetraiteValue | undefined;
  let bothAssignedFromSameMatch = false;
  const extras: string[] = [];
  let hasPercent = false;

  for (const match of text.matchAll(PERCENT_PATTERN)) {
    hasPercent = true;
    const rate = parsePercent(match[1] ?? '');
    if (rate === null) continue;
    const start = match.index ?? 0;
    const end = start + match[0].length;
    const target = classifyGestionFee(text, start, end);

    const eurNewlyAssigned = target.euro && fraisGestionFondsEuro === undefined;
    const ucNewlyAssigned = target.uc && fraisGestionUc === undefined;
    if (eurNewlyAssigned && ucNewlyAssigned) bothAssignedFromSameMatch = true;
    if (eurNewlyAssigned) fraisGestionFondsEuro = rate;
    if (ucNewlyAssigned) fraisGestionUc = rate;

    // Taux orphelin sans marker connu → garder le segment ligne pour enrichir FG UC en texte.
    if (!target.euro && !target.uc) {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const lineBreakAfter = text.indexOf('\n', end);
      const lineEnd = lineBreakAfter >= 0 ? lineBreakAfter : text.length;
      const segment = text.slice(lineStart, lineEnd).trim();
      if (segment) extras.push(segment);
    }
  }

  if (fraisGestionFondsEuro !== undefined || fraisGestionUc !== undefined || extras.length > 0) {
    return {
      fraisGestionFondsEuro: fraisGestionFondsEuro ?? null,
      fraisGestionUc: fraisGestionUc ?? null,
      extras,
      bothAssignedFromSameMatch,
    };
  }

  if (!hasPercent) {
    const normalized = normalizeSearchText(text);
    const onlyUc = hasUcMarker(normalized) && !hasEuroMarker(normalized);
    const onlyEuro = hasEuroMarker(normalized) && !hasUcMarker(normalized);
    if (onlyUc)
      return {
        fraisGestionFondsEuro: null,
        fraisGestionUc: value,
        extras: [],
        bothAssignedFromSameMatch: false,
      };
    if (onlyEuro)
      return {
        fraisGestionFondsEuro: value,
        fraisGestionUc: null,
        extras: [],
        bothAssignedFromSameMatch: false,
      };
  }

  return null;
}

function parseFundCount(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : null;
  const match = String(value).match(/\d+/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

function formatRateForConcat(value: BaseCgRetraiteValue): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(value * 100)} %`;
  }
  return String(value);
}

function parseNumericRateText(value: string): number | null {
  const text = normalizeText(value);
  if (!/^[+-]?\d+(?:[,.]\d+)?$/.test(text)) return null;
  const numericValue = Number(text.replace(',', '.'));
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function hasBaseCgRetraiteValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return Number.isFinite(value);
  const text = normalizeText(String(value));
  if (!text) return false;
  return !MISSING_VALUE_PATTERN.test(text);
}

export function formatBaseCgRetraiteRateField(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') {
    return `${new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 3,
    }).format(value * 100)} %`;
  }
  const numericRateText = parseNumericRateText(value);
  if (numericRateText !== null) {
    const percentValue = Math.abs(numericRateText) <= 1 ? numericRateText * 100 : numericRateText;
    return `${new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 3,
    }).format(percentValue)} %`;
  }
  return String(value);
}

export function formatBaseCgRetraiteValue(value: string | number | null | undefined): string {
  if (!hasBaseCgRetraiteValue(value)) return '';
  if (typeof value === 'number') {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(value);
  }
  return String(value);
}

export function normalizeBaseCgRetraiteGestionFees(
  phaseEpargne: Pick<
    BaseCgPhaseEpargne,
    'fraisGestion' | 'fraisGestionFondsEuro' | 'fraisGestionUc'
  > &
    Partial<Pick<BaseCgPhaseEpargne, 'nombreFonds'>>,
): Pick<BaseCgPhaseEpargne, 'fraisGestionFondsEuro' | 'fraisGestionUc'> {
  const fallback = phaseEpargne.fraisGestion;
  const splitFallback = typeof fallback === 'string' ? splitGestionFeesFromText(fallback) : null;
  const fundCount = parseFundCount(phaseEpargne.nombreFonds);
  const isMonosupport = fundCount === 1;

  const hasExplicitEuro = hasBaseCgRetraiteValue(phaseEpargne.fraisGestionFondsEuro);
  const hasExplicitUc = hasBaseCgRetraiteValue(phaseEpargne.fraisGestionUc);

  // FG€ : explicit > résultat du split (peut être null) > fallback brut (number)
  let fraisGestionFondsEuro: BaseCgRetraiteValue;
  if (hasExplicitEuro) {
    fraisGestionFondsEuro = phaseEpargne.fraisGestionFondsEuro ?? null;
  } else if (splitFallback) {
    fraisGestionFondsEuro = splitFallback.fraisGestionFondsEuro;
  } else {
    fraisGestionFondsEuro = fallback ?? null;
  }

  // FG UC :
  // - explicit > résultat du split (préserve "Variable en fonction des UC" ou null si only-euro)
  // - puis si pas de split : (monosupport → null) > fallback brut (taux commun multisupport)
  let fraisGestionUc: BaseCgRetraiteValue;
  if (hasExplicitUc) {
    fraisGestionUc = phaseEpargne.fraisGestionUc ?? null;
  } else if (splitFallback) {
    fraisGestionUc = splitFallback.fraisGestionUc;
  } else if (isMonosupport) {
    // Contrat monosupport (1 seul fonds €) : pas de frais de gestion UC.
    fraisGestionUc = null;
  } else {
    // Multisupport sans ventilation (ex : 568 fonds + 1 seul taux) : même taux pour les deux.
    fraisGestionUc = fallback ?? null;
  }

  // Enrichissement texte : si le split a remonté des taux orphelins (SCPI, pilotée, horizon, etc.)
  // et que FG€/FG UC viennent de matches DISTINCTS (donc pas un "1% UC et €" commun),
  // on concatène les segments à FG UC pour conserver l'information CGP.
  if (
    splitFallback &&
    splitFallback.extras.length > 0 &&
    !splitFallback.bothAssignedFromSameMatch &&
    !hasExplicitUc &&
    !isMonosupport
  ) {
    const baseLabel = formatRateForConcat(fraisGestionUc);
    const extrasJoined = splitFallback.extras.join(' / ');
    fraisGestionUc = baseLabel ? `${baseLabel} (UC) / ${extrasJoined}` : extrasJoined;
  }

  return { fraisGestionFondsEuro, fraisGestionUc };
}
