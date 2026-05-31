import type { XlsxCell } from '@/utils/export/xlsxBuilder';

export const h = (t: string): XlsxCell => ({ v: t, style: 'sHeader' });
export const sec = (t: string): XlsxCell => ({ v: t, style: 'sSection' });
export const txt = (t: string): XlsxCell => ({ v: t, style: 'sText' });
export const ctr = (t: string | number): XlsxCell => ({ v: t, style: 'sCenter' });
export const money = (v: number): XlsxCell => ({ v: Math.round(v), style: 'sMoney' });

export function sourceLabel(source: string): string {
  if (source === 'remuneration') return 'Rémunération';
  if (source === 'cca') return 'Remboursement CCA';
  if (source === 'cca_interets') return 'Intérêts CCA';
  if (source === 'dividendes') return 'Dividendes';
  if (source === 'charges_sociales_tns') return 'Charges sociales TNS';
  if (source === 'fiscalite') return 'Fiscalité';
  return source;
}
