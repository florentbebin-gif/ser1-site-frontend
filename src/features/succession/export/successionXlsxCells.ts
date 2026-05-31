import type { LienParente } from '@/engine/succession';
import type { XlsxCell } from '@/utils/export/xlsxBuilder';

export const LIEN_LABELS: Record<LienParente, string> = {
  conjoint: 'Conjoint survivant',
  enfant: 'Enfant',
  petit_enfant: 'Petit-enfant',
  parent: 'Parent',
  frere_soeur: 'Frere / Soeur',
  neveu_niece: 'Neveu / Niece',
  autre: 'Autre',
};

export function h(text: string): XlsxCell {
  return { v: text, style: 'sHeader' };
}

export function sec(text: string): XlsxCell {
  return { v: text, style: 'sSection' };
}

export function money(v: number): XlsxCell {
  return { v, style: 'sMoney' };
}

export function pct(v: number): XlsxCell {
  return { v: v / 100, style: 'sPercent' };
}

export const formatMoney = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
